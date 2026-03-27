import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import CollectorTask from '@/models/CollectorTask';
import WasteListing from '@/models/WasteListing';
import User from '@/models/User';

interface CreateTaskRequest {
  collectorId: string;
  wasteListingId: string;
}

// POST /api/collector/tasks — create a new collector task with route calculation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and collectors can create tasks
    if (session.user.role !== 'admin' && session.user.role !== 'collector') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: CreateTaskRequest = await req.json();
    const { collectorId, wasteListingId } = body;

    // Validate required fields
    if (!collectorId || !wasteListingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Verify collector exists and has collector role
    const collector = await User.findById(collectorId);
    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 });
    }
    if (collector.role !== 'collector') {
      return NextResponse.json({ error: 'User is not a collector' }, { status: 400 });
    }

    // Verify waste listing exists
    const wasteListing = await WasteListing.findById(wasteListingId);
    if (!wasteListing) {
      return NextResponse.json({ error: 'Waste listing not found' }, { status: 404 });
    }

    // Check if task already exists for this listing
    const existingTask = await CollectorTask.findOne({ wasteListingId });
    if (existingTask) {
      return NextResponse.json({ error: 'Task already exists for this listing' }, { status: 409 });
    }

    // Get collector's current location
    const collectorLocation = collector.location?.coordinates;
    const pickupLocation = wasteListing.pickupLocation.coordinates;

    let routeData = null;

    // Calculate route if both locations are available
    if (collectorLocation && pickupLocation) {
      try {
        const apiKey = process.env.GOOGLE_MAP_API_KEY;
        if (!apiKey) {
          console.warn('GOOGLE_MAP_API_KEY not configured, skipping route calculation');
        } else {
          const [collectorLng, collectorLat] = collectorLocation;
          const [pickupLng, pickupLat] = pickupLocation;

          const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
          directionsUrl.searchParams.append('origin', `${collectorLat},${collectorLng}`);
          directionsUrl.searchParams.append('destination', `${pickupLat},${pickupLng}`);
          directionsUrl.searchParams.append('mode', 'driving');
          directionsUrl.searchParams.append('key', apiKey);

          const response = await fetch(directionsUrl.toString());
          const data = await response.json();

          if (data.status === 'OK' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];

            // Extract distance in kilometers
            const distanceMeters = leg.distance.value;
            const distance = Math.round((distanceMeters / 1000) * 100) / 100;

            // Extract duration in minutes
            const durationSeconds = leg.duration.value;
            const duration = Math.round(durationSeconds / 60);

            // Extract encoded polyline
            const polyline = route.overview_polyline.points;

            routeData = {
              distance,
              duration,
              polyline,
            };
          } else {
            console.warn('Route calculation failed:', data.status);
          }
        }
      } catch (routeError) {
        console.error('Route calculation error:', routeError);
        // Continue without route data
      }
    }

    // Create collector task
    const task = await CollectorTask.create({
      collectorId,
      wasteListingId,
      status: 'assigned',
      ...(routeData && { route: routeData }),
      currentLocation: collectorLocation,
    });

    // Update waste listing status
    await WasteListing.findByIdAndUpdate(wasteListingId, {
      status: 'collector_assigned',
      collectorId,
    });

    return NextResponse.json({
      success: true,
      task: {
        ...task.toObject(),
        _id: task._id.toString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create collector task error:', error);
    return NextResponse.json({ error: 'Failed to create collector task' }, { status: 500 });
  }
}

// GET /api/collector/tasks — get tasks for the authenticated collector
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const collectorId = searchParams.get('collectorId') || session.user.id;

    // Only allow collectors to view their own tasks, unless admin
    if (session.user.role !== 'admin' && collectorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const filter: Record<string, unknown> = { collectorId };
    if (status) {
      filter.status = status;
    }

    const tasks = await CollectorTask.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      tasks: tasks.map((t) => ({ ...t, _id: t._id.toString() })),
    });
  } catch (error: any) {
    console.error('Get collector tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch collector tasks' }, { status: 500 });
  }
}

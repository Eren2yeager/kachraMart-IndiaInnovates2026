import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import CollectorTask from '@/models/CollectorTask';
import User from '@/models/User';

interface LocationUpdateRequest {
  coordinates: [number, number]; // [lng, lat]
  taskId?: string; // Optional: specific task to update
}

// POST /api/collector/location — update collector's current location
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only collectors can update their location
    if (session.user.role !== 'collector') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: LocationUpdateRequest = await req.json();
    const { coordinates, taskId } = body;

    // Validate coordinates
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return NextResponse.json({ error: 'Invalid coordinates format' }, { status: 400 });
    }

    const [lng, lat] = coordinates;

    // Validate coordinate ranges
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return NextResponse.json({ error: 'Coordinates out of valid range' }, { status: 400 });
    }

    await connectDB();

    // Update collector's location in User model
    await User.findByIdAndUpdate(session.user.id, {
      'location.type': 'Point',
      'location.coordinates': coordinates,
    });

    // If taskId is provided, update that specific task
    if (taskId) {
      const task = await CollectorTask.findById(taskId);
      
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      // Verify the task belongs to this collector
      if (task.collectorId !== session.user.id) {
        return NextResponse.json({ error: 'Task does not belong to this collector' }, { status: 403 });
      }

      // Update task location and add to history
      await CollectorTask.findByIdAndUpdate(taskId, {
        currentLocation: coordinates,
        $push: {
          locationHistory: {
            coordinates,
            timestamp: new Date(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Location updated for task',
        taskId,
      });
    }

    // Otherwise, update all active tasks for this collector
    const activeTasks = await CollectorTask.find({
      collectorId: session.user.id,
      status: { $in: ['accepted', 'on_the_way'] },
    });

    if (activeTasks.length > 0) {
      // Update all active tasks with new location
      await CollectorTask.updateMany(
        {
          collectorId: session.user.id,
          status: { $in: ['accepted', 'on_the_way'] },
        },
        {
          currentLocation: coordinates,
          $push: {
            locationHistory: {
              coordinates,
              timestamp: new Date(),
            },
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Location updated for all active tasks',
        tasksUpdated: activeTasks.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Collector location updated',
    });
  } catch (error: any) {
    console.error('Collector location error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// GET /api/collector/location — get collector's current location
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const collectorId = searchParams.get('collectorId') || session.user.id;

    await connectDB();

    const collector = await User.findById(collectorId).select('location');
    
    if (!collector) {
      return NextResponse.json({ error: 'Collector not found' }, { status: 404 });
    }

    return NextResponse.json({
      location: collector.location,
    });
  } catch (error: any) {
    console.error('Get collector location error:', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}

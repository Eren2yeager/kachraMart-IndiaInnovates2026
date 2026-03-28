import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import User from '@/models/User';
import { WASTE_PRICES } from '@/config/constants';
import { WasteType, WasteStatus } from '@/types';

// POST /api/listings — create a new waste listing and auto-assign nearest collector
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { imageUrl, wasteType, quantity, pickupLocation, aiConfidence, description } = body;

        // Validate required fields
        if (!imageUrl || !wasteType || !quantity || !pickupLocation) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (quantity <= 0) {
            return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 });
        }
        if (!pickupLocation.coordinates || pickupLocation.coordinates.length !== 2) {
            return NextResponse.json({ error: 'Invalid pickup location coordinates' }, { status: 400 });
        }
        if (!pickupLocation.address) {
            return NextResponse.json({ error: 'Pickup address is required' }, { status: 400 });
        }

        await connectDB();

        // Compute estimated value
        const estimatedValue = quantity * (WASTE_PRICES[wasteType as WasteType] ?? 0);

        // Create listing with pending status (NO auto-assignment)
        const listing = await WasteListing.create({
            userId: session.user.id,
            imageUrl,
            wasteType,
            quantity,
            pickupLocation: {
                type: 'Point',
                coordinates: pickupLocation.coordinates,
                address: pickupLocation.address,
            },
            status: 'pending', // Stays pending until collector accepts
            aiConfidence,
            description,
            estimatedValue,
        });

        return NextResponse.json({
            success: true,
            listing: {
                ...listing.toObject(),
                _id: listing._id.toString(),
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Create listing error:', error);
        return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
    }
}

// GET /api/listings — return paginated listings for the authenticated citizen
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const statusParam = searchParams.get('status');
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
        const skip = (page - 1) * limit;

        await connectDB();

        const filter: Record<string, unknown> = { userId: session.user.id };
        
        // Handle multiple statuses separated by comma
        if (statusParam) {
            const statuses = statusParam.split(',').map(s => s.trim());
            if (statuses.length === 1) {
                filter.status = statuses[0];
            } else {
                filter.status = { $in: statuses };
            }
        }

        const [listings, total] = await Promise.all([
            WasteListing.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WasteListing.countDocuments(filter),
        ]);

        // Populate collector details for assigned pickups
        const collectorIds = [...new Set(listings.filter(l => l.collectorId).map(l => l.collectorId))].filter((id): id is string => id !== undefined);
        const collectors = await User.find({ _id: { $in: collectorIds } })
            .select('_id name email phone image')
            .lean();
        
        const collectorMap = new Map(collectors.map(c => [c._id.toString(), c]));

        const enrichedListings = listings.map((l) => ({
            ...l,
            _id: l._id.toString(),
            collector: l.collectorId ? collectorMap.get(l.collectorId) || null : null,
        }));

        return NextResponse.json({
            listings: enrichedListings,
            total,
            page,
            limit,
        });
    } catch (error: any) {
        console.error('Get listings error:', error);
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }
}

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

        // Create listing with pending status
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
            status: 'pending',
            aiConfidence,
            description,
            estimatedValue,
        });

        // Auto-assign nearest collector within 50km
        let assignedCollector = null;
        try {
            const nearestCollector = await User.findOne({
                role: 'collector',
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: pickupLocation.coordinates,
                        },
                        $maxDistance: 50000, // 50km in meters
                    },
                },
            }).select('_id name phone location');

            if (nearestCollector) {
                await WasteListing.findByIdAndUpdate(listing._id, {
                    status: 'collector_assigned',
                    collectorId: nearestCollector._id.toString(),
                });
                listing.status = 'collector_assigned';
                listing.collectorId = nearestCollector._id.toString();
                assignedCollector = {
                    _id: nearestCollector._id.toString(),
                    name: nearestCollector.name,
                    phone: nearestCollector.phone,
                };
            }
        } catch (geoError) {
            // Geospatial query failed (e.g. no 2dsphere index on collectors yet) — listing stays pending
            console.warn('Collector geo-assignment failed:', geoError);
        }

        return NextResponse.json({
            success: true,
            listing: {
                ...listing.toObject(),
                _id: listing._id.toString(),
            },
            collector: assignedCollector,
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
        const status = searchParams.get('status') as WasteStatus | null;
        const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
        const skip = (page - 1) * limit;

        await connectDB();

        const filter: Record<string, unknown> = { userId: session.user.id };
        if (status) filter.status = status;

        const [listings, total] = await Promise.all([
            WasteListing.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            WasteListing.countDocuments(filter),
        ]);

        return NextResponse.json({
            listings: listings.map((l) => ({ ...l, _id: l._id.toString() })),
            total,
            page,
            limit,
        });
    } catch (error: any) {
        console.error('Get listings error:', error);
        return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
    }
}

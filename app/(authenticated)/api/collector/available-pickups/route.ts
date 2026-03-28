import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import Hub from '@/models/Hub';
import User from '@/models/User';

// GET /api/collector/available-pickups — get pending pickups near collector
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get collector's location
        const collector = await User.findById(session.user.id).select('location');
        if (!collector?.location?.coordinates) {
            return NextResponse.json({ 
                pickups: [],
                message: 'Set your location in profile to see available pickups' 
            });
        }

        const { searchParams } = new URL(req.url);
        const maxDistance = parseInt(searchParams.get('maxDistance') || '50000'); // 50km default

        // Find pending pickups near collector
        const pickups = await WasteListing.find({
            status: 'pending',
            pickupLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: collector.location.coordinates,
                    },
                    $maxDistance: maxDistance,
                },
            },
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // For each pickup, find nearest hub
        const pickupsWithHubs = await Promise.all(
            pickups.map(async (pickup) => {
                try {
                    const nearestHub = await Hub.findOne({
                        location: {
                            $near: {
                                $geometry: {
                                    type: 'Point',
                                    coordinates: pickup.pickupLocation.coordinates,
                                },
                            },
                        },
                    })
                        .select('_id name location capacity currentLoad')
                        .lean();

                    return {
                        ...pickup,
                        _id: pickup._id.toString(),
                        nearestHub: nearestHub ? {
                            ...nearestHub,
                            _id: nearestHub._id.toString(),
                        } : null,
                    };
                } catch (err) {
                    return {
                        ...pickup,
                        _id: pickup._id.toString(),
                        nearestHub: null,
                    };
                }
            })
        );

        return NextResponse.json({
            pickups: pickupsWithHubs,
            collectorLocation: collector.location.coordinates,
        });
    } catch (error: any) {
        console.error('Get available pickups error:', error);
        return NextResponse.json({ error: 'Failed to fetch pickups' }, { status: 500 });
    }
}

// POST /api/collector/available-pickups — accept a pickup request
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'collector') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { pickupId, hubId } = body;

        if (!pickupId) {
            return NextResponse.json({ error: 'Pickup ID is required' }, { status: 400 });
        }

        await connectDB();

        // Check if collector has a phone number
        const collector = await User.findById(session.user.id).select('phone');
        if (!collector?.phone) {
            return NextResponse.json({ 
                error: 'Phone number required',
                message: 'Please add your phone number in your profile before accepting pickups. Citizens need to contact you for coordination.'
            }, { status: 400 });
        }

        // Find the pickup
        const pickup = await WasteListing.findById(pickupId);
        if (!pickup) {
            return NextResponse.json({ error: 'Pickup not found' }, { status: 404 });
        }

        if (pickup.status !== 'pending') {
            return NextResponse.json({ 
                error: 'Pickup is no longer available' 
            }, { status: 400 });
        }

        // Verify hub exists and has capacity if provided
        if (hubId) {
            const hub = await Hub.findById(hubId);
            if (!hub) {
                return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
            }

            if (hub.currentLoad + pickup.quantity > hub.capacity) {
                return NextResponse.json({ 
                    error: 'Hub does not have enough capacity' 
                }, { status: 400 });
            }
        }

        // Assign to collector
        pickup.status = 'collector_assigned';
        pickup.collectorId = session.user.id;
        if (hubId) {
            pickup.assignedHubId = hubId;
        }
        await pickup.save();

        return NextResponse.json({
            success: true,
            pickup: {
                ...pickup.toObject(),
                _id: pickup._id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Accept pickup error:', error);
        return NextResponse.json({ error: 'Failed to accept pickup' }, { status: 500 });
    }
}

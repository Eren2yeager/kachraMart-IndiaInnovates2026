import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Hub from '@/models/Hub';
import WasteInventory from '@/models/WasteInventory';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const hubs = await Hub.find().sort({ currentLoad: -1 }).lean();

        const hubsWithSummary = await Promise.all(
            hubs.map(async (hub) => {
                const inventories = await WasteInventory.find({ hubId: hub._id.toString() }).lean();
                const inventorySummary = inventories.map((inv) => ({
                    _id: inv._id.toString(),
                    wasteType: inv.wasteType,
                    quantity: inv.quantity,
                    verified: inv.verified,
                }));
                const utilizationPct =
                    hub.capacity > 0
                        ? Math.min(100, Math.round((hub.currentLoad / hub.capacity) * 1000) / 10)
                        : 0;
                return {
                    ...hub,
                    _id: hub._id.toString(),
                    inventorySummary,
                    utilizationPct,
                };
            })
        );

        return NextResponse.json({ hubs: hubsWithSummary });
    } catch (error: any) {
        console.error('GET /api/hubs error:', error);
        return NextResponse.json({ error: 'Failed to fetch hubs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, location, capacity, managerId } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Hub name is required' }, { status: 400 });
        }
        if (!location?.coordinates || !location?.address) {
            return NextResponse.json({ error: 'Hub location with coordinates and address is required' }, { status: 400 });
        }
        if (!capacity || capacity <= 0) {
            return NextResponse.json({ error: 'Hub capacity must be greater than 0' }, { status: 400 });
        }

        await connectDB();

        const hub = await Hub.create({
            name: name.trim(),
            location: {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address.trim(),
            },
            capacity,
            currentLoad: 0,
            managerId: managerId || undefined,
        });

        return NextResponse.json({ hub: { ...hub.toObject(), _id: hub._id.toString() } }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/hubs error:', error);
        return NextResponse.json({ error: 'Failed to create hub' }, { status: 500 });
    }
}

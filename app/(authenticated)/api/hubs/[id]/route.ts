import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Hub from '@/models/Hub';
import WasteInventory from '@/models/WasteInventory';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const hub = await Hub.findById(id).lean();
        if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 });

        const inventory = await WasteInventory.find({ hubId: id }).lean();
        const utilizationPct =
            hub.capacity > 0
                ? Math.min(100, Math.round((hub.currentLoad / hub.capacity) * 1000) / 10)
                : 0;

        return NextResponse.json({
            hub: {
                ...hub,
                _id: hub._id.toString(),
                utilizationPct,
            },
            inventory: inventory.map((inv) => ({ ...inv, _id: inv._id.toString() })),
        });
    } catch (error: any) {
        console.error('GET /api/hubs/[id] error:', error);
        return NextResponse.json({ error: 'Failed to fetch hub' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, capacity, managerId } = body;

        await connectDB();

        const update: Record<string, any> = {};
        if (name?.trim()) update.name = name.trim();
        if (capacity !== undefined && capacity > 0) update.capacity = capacity;
        if (managerId !== undefined) update.managerId = managerId;

        const hub = await Hub.findByIdAndUpdate(id, update, { new: true });
        if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 });

        return NextResponse.json({ hub: { ...hub.toObject(), _id: hub._id.toString() } });
    } catch (error: any) {
        console.error('PATCH /api/hubs/[id] error:', error);
        return NextResponse.json({ error: 'Failed to update hub' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const hub = await Hub.findById(id);
        if (!hub) return NextResponse.json({ error: 'Hub not found' }, { status: 404 });

        if (hub.currentLoad > 0) {
            return NextResponse.json(
                { error: 'Cannot delete hub with active inventory' },
                { status: 409 }
            );
        }

        await Hub.findByIdAndDelete(id);
        await WasteInventory.deleteMany({ hubId: id });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/hubs/[id] error:', error);
        return NextResponse.json({ error: 'Failed to delete hub' }, { status: 500 });
    }
}

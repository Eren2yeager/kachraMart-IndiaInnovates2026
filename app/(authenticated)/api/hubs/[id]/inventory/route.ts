import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteInventory from '@/models/WasteInventory';
import Hub from '@/models/Hub';
import { WasteType } from '@/types';

// POST /api/hubs/[id]/inventory — add inventory to hub
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: hubId } = await params;
        const body = await req.json();
        const { wasteType, quantity, verified = true } = body;

        if (!wasteType || !quantity || quantity <= 0) {
            return NextResponse.json(
                { error: 'Valid waste type and quantity are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check hub exists and has capacity
        const hub = await Hub.findById(hubId);
        if (!hub) {
            return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
        }

        if (hub.currentLoad + quantity > hub.capacity) {
            return NextResponse.json(
                { error: 'Hub capacity exceeded' },
                { status: 400 }
            );
        }

        // Create or update inventory
        const inventory = await WasteInventory.findOneAndUpdate(
            { hubId, wasteType },
            {
                $inc: { quantity },
                $set: { verified },
            },
            { upsert: true, new: true }
        );

        // Update hub load
        await Hub.findByIdAndUpdate(hubId, {
            $inc: { currentLoad: quantity },
        });

        return NextResponse.json({
            success: true,
            inventory: {
                ...inventory.toObject(),
                _id: inventory._id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Add inventory error:', error);
        return NextResponse.json(
            { error: 'Failed to add inventory' },
            { status: 500 }
        );
    }
}

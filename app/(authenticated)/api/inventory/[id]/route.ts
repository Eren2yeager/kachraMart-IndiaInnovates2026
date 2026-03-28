import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteInventory from '@/models/WasteInventory';
import Hub from '@/models/Hub';

// PATCH /api/inventory/[id] — update inventory quantity
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
        const { quantity } = body;

        if (quantity === undefined || quantity < 0) {
            return NextResponse.json(
                { error: 'Valid quantity is required' },
                { status: 400 }
            );
        }

        await connectDB();

        const inventory = await WasteInventory.findById(id);
        if (!inventory) {
            return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
        }

        const oldQuantity = inventory.quantity;
        const diff = quantity - oldQuantity;

        // Check hub capacity if increasing
        if (diff > 0) {
            const hub = await Hub.findById(inventory.hubId);
            if (!hub) {
                return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
            }

            if (hub.currentLoad + diff > hub.capacity) {
                return NextResponse.json(
                    { error: 'Hub capacity exceeded' },
                    { status: 400 }
                );
            }
        }

        // Update inventory
        inventory.quantity = quantity;
        await inventory.save();

        // Update hub load
        await Hub.findByIdAndUpdate(inventory.hubId, {
            $inc: { currentLoad: diff },
        });

        return NextResponse.json({
            success: true,
            inventory: {
                ...inventory.toObject(),
                _id: inventory._id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Update inventory error:', error);
        return NextResponse.json(
            { error: 'Failed to update inventory' },
            { status: 500 }
        );
    }
}

// DELETE /api/inventory/[id] — delete inventory record
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

        const inventory = await WasteInventory.findById(id);
        if (!inventory) {
            return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
        }

        // Check if inventory is reserved (part of an order)
        if (inventory.reserved) {
            return NextResponse.json(
                { error: 'Cannot delete reserved inventory' },
                { status: 400 }
            );
        }

        const quantity = inventory.quantity;
        const hubId = inventory.hubId;

        // Delete inventory
        await WasteInventory.findByIdAndDelete(id);

        // Update hub load
        await Hub.findByIdAndUpdate(hubId, {
            $inc: { currentLoad: -quantity },
        });

        return NextResponse.json({
            success: true,
            message: 'Inventory deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete inventory error:', error);
        return NextResponse.json(
            { error: 'Failed to delete inventory' },
            { status: 500 }
        );
    }
}

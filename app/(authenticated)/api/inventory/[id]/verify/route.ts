import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteInventory from '@/models/WasteInventory';

// PATCH /api/inventory/[id]/verify — toggle inventory verification status
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

        await connectDB();

        const inventory = await WasteInventory.findById(id);
        if (!inventory) {
            return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
        }

        // Toggle verification status
        inventory.verified = !inventory.verified;
        await inventory.save();

        return NextResponse.json({
            success: true,
            inventory: {
                ...inventory.toObject(),
                _id: inventory._id.toString(),
            },
        });
    } catch (error: any) {
        console.error('Verify inventory error:', error);
        return NextResponse.json(
            { error: 'Failed to verify inventory' },
            { status: 500 }
        );
    }
}

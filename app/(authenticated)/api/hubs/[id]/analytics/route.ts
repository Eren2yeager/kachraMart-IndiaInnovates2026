import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Hub from '@/models/Hub';
import WasteInventory from '@/models/WasteInventory';
import { WasteType } from '@/types';

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

        const inventories = await WasteInventory.find({ hubId: id }).lean();

        const wasteByType: Record<string, number> = {};
        let totalVerified = 0;
        let totalUnverified = 0;

        for (const inv of inventories) {
            wasteByType[inv.wasteType] = inv.quantity;
            if (inv.verified) {
                totalVerified += inv.quantity;
            } else {
                totalUnverified += inv.quantity;
            }
        }

        return NextResponse.json({ wasteByType, totalVerified, totalUnverified });
    } catch (error: any) {
        console.error('GET /api/hubs/[id]/analytics error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}

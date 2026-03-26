import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import { WasteStatus } from '@/types';

// GET /api/collector/pickups — return listings assigned to the authenticated collector
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') as WasteStatus | null;

        await connectDB();

        const filter: Record<string, unknown> = { collectorId: session.user.id };
        if (status) {
            filter.status = status;
        } else {
            // Default: show active pickups (not completed or cancelled)
            filter.status = { $in: ['collector_assigned', 'picked_up'] };
        }

        const pickups = await WasteListing.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({
            pickups: pickups.map((p) => ({ ...p, _id: p._id.toString() })),
        });
    } catch (error: any) {
        console.error('Get collector pickups error:', error);
        return NextResponse.json({ error: 'Failed to fetch pickups' }, { status: 500 });
    }
}

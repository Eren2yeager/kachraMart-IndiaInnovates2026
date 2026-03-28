import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import User from '@/models/User';
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
        
        // Check if we should exclude certain statuses
        const excludeParam = searchParams.get('exclude');
        
        if (status) {
            filter.status = status;
        } else if (excludeParam) {
            // Exclude specific statuses (e.g., sold_to_dealer)
            const excludeStatuses = excludeParam.split(',').map(s => s.trim());
            filter.status = { 
                $in: ['collector_assigned', 'picked_up', 'stored_in_hub'],
                $nin: excludeStatuses 
            };
        } else {
            // Default: show all pickups except sold_to_dealer
            filter.status = { $in: ['collector_assigned', 'picked_up', 'stored_in_hub'] };
        }

        const pickups = await WasteListing.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        // Populate citizen details
        const userIds = [...new Set(pickups.map(p => p.userId))];
        const citizens = await User.find({ _id: { $in: userIds } })
            .select('_id name email phone image')
            .lean();
        
        const citizenMap = new Map(citizens.map(c => [c._id.toString(), c]));

        const enrichedPickups = pickups.map((p) => ({
            ...p,
            _id: p._id.toString(),
            user: citizenMap.get(p.userId) || null,
        }));

        return NextResponse.json({
            pickups: enrichedPickups,
        });
    } catch (error: any) {
        console.error('Get collector pickups error:', error);
        return NextResponse.json({ error: 'Failed to fetch pickups' }, { status: 500 });
    }
}

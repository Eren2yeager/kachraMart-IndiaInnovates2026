import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import { REWARD_POINTS } from '@/config/constants';
import { WasteType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'citizen') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const userId = session.user.id;

    // Get all pickups for this citizen
    const allPickups = await WasteListing.find({ userId }).lean();

    // Count by status
    const totalPickups = allPickups.length;
    const pendingPickups = allPickups.filter(p => p.status === 'pending').length;
    const assignedPickups = allPickups.filter(p => p.status === 'collector_assigned').length;
    const completedPickups = allPickups.filter(p => 
      ['picked_up', 'stored_in_hub', 'sold_to_dealer'].includes(p.status)
    ).length;

    // Calculate total rewards from completed pickups
    let totalRewards = 0;
    let totalWasteCollected = 0;

    allPickups
      .filter(p => ['picked_up', 'stored_in_hub', 'sold_to_dealer'].includes(p.status))
      .forEach(pickup => {
        const quantity = pickup.quantity || 0;
        const pointsPerKg = REWARD_POINTS[pickup.wasteType as WasteType] || 5;
        totalRewards += quantity * pointsPerKg;
        totalWasteCollected += quantity;
      });

    return NextResponse.json({
      totalPickups,
      pendingPickups,
      assignedPickups,
      completedPickups,
      totalRewards,
      totalWasteCollected,
    });
  } catch (error) {
    console.error('Citizen analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

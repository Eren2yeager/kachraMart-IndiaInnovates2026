import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'collector') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const collectorId = session.user.id;

    // Get all pickups assigned to this collector
    const allPickups = await WasteListing.find({ collectorId }).lean();

    // Count by status
    const assignedPickups = allPickups.filter(p => p.status === 'collector_assigned').length;
    const pickedUpPickups = allPickups.filter(p => 
      ['picked_up', 'stored_in_hub', 'sold_to_dealer'].includes(p.status)
    ).length;

    // Get today's completed pickups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = allPickups.filter(p => {
      if (!['picked_up', 'stored_in_hub', 'sold_to_dealer'].includes(p.status)) return false;
      const updatedAt = new Date(p.updatedAt);
      return updatedAt >= today;
    }).length;

    // Calculate total waste collected
    let totalWasteCollected = 0;
    allPickups
      .filter(p => ['picked_up', 'stored_in_hub', 'sold_to_dealer'].includes(p.status))
      .forEach(pickup => {
        totalWasteCollected += pickup.quantity || 0;
      });

    return NextResponse.json({
      assignedPickups,
      completedToday,
      totalCompleted: pickedUpPickups,
      pendingPickups: assignedPickups, // Assigned but not yet picked up
      totalWasteCollected,
    });
  } catch (error) {
    console.error('Collector analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

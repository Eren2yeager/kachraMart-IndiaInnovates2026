import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteInventory from '@/models/WasteInventory';
import Hub from '@/models/Hub';
import { calculateQualityScore } from '@/lib/qualityScorer';
import { WASTE_PRICES } from '@/config/constants';
import { WasteType } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wasteType = searchParams.get('wasteType');
    const hubId = searchParams.get('hubId');
    const minQuantity = searchParams.get('minQuantity');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);

    await connectDB();

    // Build filter for verified, non-reserved, quantity > 0 inventory
    const filter: any = {
      verified: true,
      reserved: false,
      quantity: { $gt: 0 },
    };

    if (wasteType) filter.wasteType = wasteType;
    if (hubId) filter.hubId = hubId;
    if (minQuantity) {
      const minQty = parseFloat(minQuantity);
      if (!isNaN(minQty) && minQty > 0) {
        filter.quantity = { $gte: minQty };
      }
    }

    const skip = (page - 1) * limit;

    const [inventory, total] = await Promise.all([
      WasteInventory.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WasteInventory.countDocuments(filter),
    ]);

    // Populate hub data
    const hubIds = [...new Set(inventory.map((i) => i.hubId))];
    const hubs = await Hub.find({ _id: { $in: hubIds } }).lean();
    const hubMap = new Map(hubs.map((h) => [h._id.toString(), h]));

    // Calculate quality scores and add pricing
    const enrichedInventory = inventory.map((inv) => ({
      ...inv,
      _id: inv._id.toString(),
      hub: hubMap.get(inv.hubId),
      qualityScore: calculateQualityScore(inv as any),
      pricePerKg: WASTE_PRICES[inv.wasteType as WasteType] || 0,
    }));

    return NextResponse.json({
      inventory: enrichedInventory,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Marketplace error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

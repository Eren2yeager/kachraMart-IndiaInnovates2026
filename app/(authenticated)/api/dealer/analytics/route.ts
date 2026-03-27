import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import Order from '@/models/Order';
import { TrendAnalyzer } from '@/lib/analytics/TrendAnalyzer';
import { validatePeriod, getDateFilter } from '@/lib/analytics/dateUtils';
import { DealerAnalyticsData, WasteType } from '@/types';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (session.user.role !== 'dealer') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    
    // Parse and validate period parameter
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'all';
    
    if (!validatePeriod(period)) {
      return NextResponse.json({ error: 'Invalid period parameter' }, { status: 400 });
    }
    
    // Connect to database
    await connectDB();
    
    const dealerId = session.user.id;
    const dateFilter = getDateFilter(period);
    
    // Aggregate total purchases
    const totalPurchasesResult = await Order.aggregate([
      {
        $match: {
          dealerId,
          status: 'completed',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 }
        }
      }
    ]);
    
    const totalPurchases = totalPurchasesResult.length > 0 ? {
      totalQuantity: totalPurchasesResult[0].totalQuantity,
      totalSpent: totalPurchasesResult[0].totalSpent,
      orderCount: totalPurchasesResult[0].orderCount
    } : {
      totalQuantity: 0,
      totalSpent: 0,
      orderCount: 0
    };
    
    // Aggregate purchases by type
    const purchasesByTypeResult = await Order.aggregate([
      {
        $match: {
          dealerId,
          status: 'completed',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$wasteType',
          quantity: { $sum: '$quantity' },
          spent: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    const purchasesByType: Record<WasteType, { quantity: number; spent: number }> = {
      biodegradable: { quantity: 0, spent: 0 },
      recyclable: { quantity: 0, spent: 0 },
      hazardous: { quantity: 0, spent: 0 },
      ewaste: { quantity: 0, spent: 0 },
      construction: { quantity: 0, spent: 0 }
    };
    
    purchasesByTypeResult.forEach(result => {
      purchasesByType[result._id as WasteType] = {
        quantity: result.quantity,
        spent: result.spent
      };
    });
    
    // Calculate average price by type
    const avgPriceResult = await Order.aggregate([
      {
        $match: {
          dealerId,
          status: 'completed',
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$wasteType',
          avgPrice: { $avg: '$pricePerKg' }
        }
      }
    ]);
    
    const averagePriceByType: Record<WasteType, number> = {
      biodegradable: 0,
      recyclable: 0,
      hazardous: 0,
      ewaste: 0,
      construction: 0
    };
    
    avgPriceResult.forEach(result => {
      averagePriceByType[result._id as WasteType] = Math.round(result.avgPrice * 100) / 100;
    });
    
    // Get spending trend
    const trendAnalyzer = new TrendAnalyzer();
    const spendingTrend = await trendAnalyzer.getDealerSpendingTrend(dealerId);
    
    // Build response
    const analytics: DealerAnalyticsData = {
      totalPurchases,
      purchasesByType,
      spendingTrend,
      averagePriceByType,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Dealer analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

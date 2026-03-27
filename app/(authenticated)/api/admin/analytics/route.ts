import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { WasteAggregator } from '@/lib/analytics/WasteAggregator';
import { EnvironmentalCalculator } from '@/lib/analytics/EnvironmentalCalculator';
import { TrendAnalyzer } from '@/lib/analytics/TrendAnalyzer';
import { HubPerformanceAnalyzer } from '@/lib/analytics/HubPerformanceAnalyzer';
import { OrderStatisticsEngine } from '@/lib/analytics/OrderStatisticsEngine';
import { DealerRankingSystem } from '@/lib/analytics/DealerRankingSystem';
import { validatePeriod } from '@/lib/analytics/dateUtils';
import { AdminAnalyticsData } from '@/types';
import connectDB from '@/lib/db/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Authenticate and authorize
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin') {
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
    
    // Initialize services
    const wasteAggregator = new WasteAggregator();
    const envCalculator = new EnvironmentalCalculator();
    const trendAnalyzer = new TrendAnalyzer();
    const hubAnalyzer = new HubPerformanceAnalyzer();
    const orderEngine = new OrderStatisticsEngine();
    const dealerRanking = new DealerRankingSystem();
    
    // Fetch all analytics data
    const [
      totalWasteCollected,
      wasteByType,
      wasteByStatus,
      monthlyTrend,
      hubPerformance,
      orderStats,
      topDealers
    ] = await Promise.all([
      wasteAggregator.getTotalWasteCollected(period),
      wasteAggregator.aggregateByType(period),
      wasteAggregator.aggregateByStatus(period),
      trendAnalyzer.getMonthlyTrend(),
      hubAnalyzer.getHubPerformance(),
      orderEngine.getOrderStats(period),
      dealerRanking.getTopDealers()
    ]);
    
    // Calculate environmental impact
    const co2Saved = envCalculator.calculateCO2Savings(wasteByType);
    const { diverted: landfillDiverted, percentage: diversionPercentage } = 
      envCalculator.calculateLandfillDiversion(wasteByType);
    
    // Get weekly trend if period is weekly
    let weeklyTrend;
    if (period === 'weekly') {
      weeklyTrend = await trendAnalyzer.getWeeklyTrend();
    }
    
    // Build response
    const analytics: AdminAnalyticsData = {
      totalWasteCollected,
      co2Saved,
      landfillDiverted,
      diversionPercentage,
      wasteByType,
      wasteByStatus,
      monthlyTrend,
      weeklyTrend,
      hubPerformance,
      orderStats,
      topDealers,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

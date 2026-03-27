import WasteListing from '@/models/WasteListing';
import Order from '@/models/Order';
import { MonthlyDataPoint, WeeklyDataPoint, MonthlySpendingPoint } from '@/types';
import { fillMissingMonths } from './dateUtils';

export class TrendAnalyzer {
  /**
   * Get monthly waste collection trend for the last 12 months
   * @returns Array of monthly data points
   */
  async getMonthlyTrend(): Promise<MonthlyDataPoint[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const results = await WasteListing.aggregate([
      {
        $match: {
          status: { $in: ['stored_in_hub', 'sold_to_dealer'] },
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          quantity: { $sum: '$quantity' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $arrayElemAt: [
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                { $subtract: ['$_id.month', 1] }
              ]},
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          quantity: 1
        }
      }
    ]);
    
    return fillMissingMonths(results, 12);
  }

  /**
   * Get weekly waste collection trend for the last 8 weeks
   * @returns Array of weekly data points
   */
  async getWeeklyTrend(): Promise<WeeklyDataPoint[]> {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const results = await WasteListing.aggregate([
      {
        $match: {
          status: { $in: ['stored_in_hub', 'sold_to_dealer'] },
          createdAt: { $gte: eightWeeksAgo }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          quantity: { $sum: '$quantity' },
          startDate: { $min: '$createdAt' }
        }
      },
      {
        $sort: { startDate: 1 }
      },
      {
        $project: {
          week: {
            $concat: [
              'Week of ',
              { $dateToString: { format: '%b %d', date: '$startDate' } }
            ]
          },
          quantity: 1
        }
      }
    ]);
    
    return results;
  }

  /**
   * Get dealer spending trend for the last 12 months
   * @param dealerId - Dealer user ID
   * @returns Array of monthly spending points
   */
  async getDealerSpendingTrend(dealerId: string): Promise<MonthlySpendingPoint[]> {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const results = await Order.aggregate([
      {
        $match: {
          dealerId,
          status: 'completed',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          spent: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $arrayElemAt: [
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                { $subtract: ['$_id.month', 1] }
              ]},
              ' ',
              { $toString: '$_id.year' }
            ]
          },
          spent: 1
        }
      }
    ]);
    
    return fillMissingMonths(results, 12);
  }
}

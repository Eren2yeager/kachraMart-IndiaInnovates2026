import Order from '@/models/Order';
import { OrderStatistics } from '@/types';
import { getDateFilter } from './dateUtils';

export class OrderStatisticsEngine {
  /**
   * Get order statistics for a given period
   * @param period - Time period: 'all', 'monthly', or 'weekly'
   * @returns Order statistics object
   */
  async getOrderStats(period: string): Promise<OrderStatistics> {
    const dateFilter = getDateFilter(period);
    
    const results = await Order.aggregate([
      {
        $match: {
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPrice' }
        }
      }
    ]);
    
    const stats: OrderStatistics = {
      totalOrders: 0,
      pendingOrders: 0,
      approvedOrders: 0,
      rejectedOrders: 0,
      completedOrders: 0,
      approvalRate: 0,
      averageOrderValue: 0
    };
    
    let totalValue = 0;
    
    results.forEach(result => {
      stats.totalOrders += result.count;
      totalValue += result.totalValue;
      
      switch (result._id) {
        case 'pending':
          stats.pendingOrders = result.count;
          break;
        case 'approved':
          stats.approvedOrders = result.count;
          break;
        case 'rejected':
          stats.rejectedOrders = result.count;
          break;
        case 'completed':
          stats.completedOrders = result.count;
          break;
      }
    });
    
    // Calculate approval rate (approved + completed) / (total - pending)
    const decidedOrders = stats.totalOrders - stats.pendingOrders;
    if (decidedOrders > 0) {
      stats.approvalRate = ((stats.approvedOrders + stats.completedOrders) / decidedOrders) * 100;
      stats.approvalRate = Math.round(stats.approvalRate * 100) / 100;
    }
    
    // Calculate average order value
    if (stats.totalOrders > 0) {
      stats.averageOrderValue = totalValue / stats.totalOrders;
      stats.averageOrderValue = Math.round(stats.averageOrderValue * 100) / 100;
    }
    
    return stats;
  }
}

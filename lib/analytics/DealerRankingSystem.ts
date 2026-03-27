import Order from '@/models/Order';
import User from '@/models/User';
import { TopDealer } from '@/types';

export class DealerRankingSystem {
  /**
   * Get top dealers by purchase volume
   * @returns Array of top 10 dealers sorted by quantity
   */
  async getTopDealers(): Promise<TopDealer[]> {
    const results = await Order.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$dealerId',
          totalQuantity: { $sum: '$quantity' },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Fetch dealer names
    const dealerIds = results.map(r => r._id);
    const dealers = await User.find({ _id: { $in: dealerIds } }).lean();
    const dealerMap = new Map(dealers.map(d => [d._id.toString(), d.name]));
    
    return results.map(result => ({
      dealerId: result._id,
      dealerName: dealerMap.get(result._id) || 'Unknown Dealer',
      totalQuantity: result.totalQuantity,
      totalSpent: result.totalSpent
    }));
  }
}

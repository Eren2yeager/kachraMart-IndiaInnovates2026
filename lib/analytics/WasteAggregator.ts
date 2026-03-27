import WasteListing from '@/models/WasteListing';
import { WasteType, WasteStatus } from '@/types';
import { getDateFilter } from './dateUtils';

export class WasteAggregator {
  /**
   * Aggregate waste by type for a given period
   * @param period - Time period: 'all', 'monthly', or 'weekly'
   * @returns Object with waste quantities by type
   */
  async aggregateByType(period: string): Promise<Record<WasteType, number>> {
    const dateFilter = getDateFilter(period);
    
    const results = await WasteListing.aggregate([
      {
        $match: {
          status: { $in: ['stored_in_hub', 'sold_to_dealer'] },
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$wasteType',
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    // Initialize all waste types with 0
    const wasteByType: Record<WasteType, number> = {
      biodegradable: 0,
      recyclable: 0,
      hazardous: 0,
      ewaste: 0,
      construction: 0
    };
    
    // Populate with actual values
    results.forEach(result => {
      wasteByType[result._id as WasteType] = result.totalQuantity;
    });
    
    return wasteByType;
  }

  /**
   * Aggregate waste by status for a given period
   * @param period - Time period: 'all', 'monthly', or 'weekly'
   * @returns Object with count and quantity by status
   */
  async aggregateByStatus(period: string): Promise<Record<WasteStatus, { count: number; quantity: number }>> {
    const dateFilter = getDateFilter(period);
    
    const results = await WasteListing.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' },
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          quantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    const wasteByStatus: any = {};
    results.forEach(result => {
      wasteByStatus[result._id] = {
        count: result.count,
        quantity: result.quantity
      };
    });
    
    return wasteByStatus;
  }

  /**
   * Get total waste collected for a given period
   * @param period - Time period: 'all', 'monthly', or 'weekly'
   * @returns Total quantity in kilograms
   */
  async getTotalWasteCollected(period: string): Promise<number> {
    const dateFilter = getDateFilter(period);
    
    const result = await WasteListing.aggregate([
      {
        $match: {
          status: { $in: ['stored_in_hub', 'sold_to_dealer'] },
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].totalQuantity : 0;
  }
}

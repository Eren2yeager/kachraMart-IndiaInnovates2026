import Hub from '@/models/Hub';
import { HubPerformanceMetric } from '@/types';

export class HubPerformanceAnalyzer {
  /**
   * Get hub performance metrics with capacity utilization
   * @returns Array of hub performance metrics sorted by utilization
   */
  async getHubPerformance(): Promise<HubPerformanceMetric[]> {
    const hubs = await Hub.find({}).lean();
    
    const performance: HubPerformanceMetric[] = hubs.map(hub => {
      const utilizationPercentage = (hub.currentLoad / hub.capacity) * 100;
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (utilizationPercentage >= 90) {
        status = 'critical';
      } else if (utilizationPercentage >= 70) {
        status = 'warning';
      }
      
      return {
        hubId: hub._id.toString(),
        name: hub.name,
        capacity: hub.capacity,
        currentLoad: hub.currentLoad,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        status
      };
    });
    
    // Sort by utilization percentage descending
    performance.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
    
    return performance;
  }
}

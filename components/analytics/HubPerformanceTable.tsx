'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HubPerformanceMetric } from '@/types';

interface HubPerformanceTableProps {
  data: HubPerformanceMetric[];
}

export function HubPerformanceTable({ data }: HubPerformanceTableProps) {
  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Hub Performance</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Hub Name</th>
              <th className="text-right py-3 px-4">Capacity</th>
              <th className="text-right py-3 px-4">Current Load</th>
              <th className="text-right py-3 px-4">Utilization</th>
            </tr>
          </thead>
          <tbody>
            {data.map(hub => (
              <tr key={hub.hubId} className="border-b">
                <td className="py-3 px-4">{hub.name}</td>
                <td className="text-right py-3 px-4">{hub.capacity.toLocaleString()} kg</td>
                <td className="text-right py-3 px-4">{hub.currentLoad.toLocaleString()} kg</td>
                <td className="text-right py-3 px-4">
                  <div className="flex items-center gap-2 justify-end">
                    <span className={`font-semibold ${getUtilizationColor(hub.utilizationPercentage)}`}>
                      {hub.utilizationPercentage.toFixed(1)}%
                    </span>
                    <div className="w-24">
                      <Progress value={hub.utilizationPercentage} className="h-2" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

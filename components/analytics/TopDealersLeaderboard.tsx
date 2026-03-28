'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TopDealer } from '@/types';
import { Trophy } from 'lucide-react';

interface TopDealersLeaderboardProps {
  data: TopDealer[];
}

export function TopDealersLeaderboard({ data }: TopDealersLeaderboardProps) {
  const getBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-orange-600 text-white';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Top Dealers</h3>
      </div>
      <div className="space-y-3">
        {data.map((dealer, index) => (
          <div key={dealer.dealerId} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-black/10">
            <Badge className={getBadgeColor(index + 1)}>
              #{index + 1}
            </Badge>
            <div className="flex-1">
              <p className="font-semibold">{dealer.dealerName}</p>
              <p className="text-sm text-gray-600">
                {dealer.totalQuantity.toLocaleString()} kg • ₹{dealer.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

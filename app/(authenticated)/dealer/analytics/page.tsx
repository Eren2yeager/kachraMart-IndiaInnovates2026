'use client';

import { useState } from 'react';
import { useDealerAnalytics } from '@/hooks/useDealerAnalytics';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ChartContainer } from '@/components/analytics/ChartContainer';
import { TimePeriodSelector } from '@/components/analytics/TimePeriodSelector';
import { LoadingSkeleton } from '@/components/analytics/LoadingSkeleton';
import { ErrorDisplay } from '@/components/analytics/ErrorDisplay';
import { EmptyState } from '@/components/analytics/EmptyState';
import { PurchasesByTypeChart } from '@/components/analytics/charts/PurchasesByTypeChart';
import { SpendingTrendChart } from '@/components/analytics/charts/SpendingTrendChart';
import { AveragePriceChart } from '@/components/analytics/charts/AveragePriceChart';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package, DollarSign, ShoppingCart } from 'lucide-react';

export default function DealerAnalyticsPage() {
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');
  const { data, loading, error, refetch } = useDealerAnalytics(period);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Analytics</h1>
          <p className="text-gray-600">Your purchase history and spending insights</p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Check if dealer has no purchases
  if (data.totalPurchases.orderCount === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Purchases Yet"
          message="You haven't made any purchases yet. Start by browsing the marketplace to find available waste inventory."
          action={{
            label: "Browse Marketplace",
            href: "/dealer/marketplace"
          }}
        />
      </div>
    );
  }

  const lastUpdated = new Date(data.lastUpdated).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Analytics</h1>
          <p className="text-gray-600">Your purchase history and spending insights</p>
          <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-3">
          <TimePeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Quantity Purchased"
          value={data.totalPurchases.totalQuantity}
          unit="kg"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="Total Spent"
          value={`₹${data.totalPurchases.totalSpent.toLocaleString()}`}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Number of Orders"
          value={data.totalPurchases.orderCount}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="My Purchases by Waste Type">
          <PurchasesByTypeChart data={data.purchasesByType} />
        </ChartContainer>

        <ChartContainer title="Spending Over Time">
          <SpendingTrendChart data={data.spendingTrend} />
        </ChartContainer>

        <ChartContainer title="Average Price per Kg by Type">
          <AveragePriceChart data={data.averagePriceByType} />
        </ChartContainer>
      </div>
    </div>
  );
}

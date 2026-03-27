'use client';

import { useState } from 'react';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ChartContainer } from '@/components/analytics/ChartContainer';
import { TimePeriodSelector } from '@/components/analytics/TimePeriodSelector';
import { LoadingSkeleton } from '@/components/analytics/LoadingSkeleton';
import { ErrorDisplay } from '@/components/analytics/ErrorDisplay';
import { WasteByTypeChart } from '@/components/analytics/charts/WasteByTypeChart';
import { MonthlyTrendChart } from '@/components/analytics/charts/MonthlyTrendChart';
import { WasteByStatusChart } from '@/components/analytics/charts/WasteByStatusChart';
import { HubPerformanceTable } from '@/components/analytics/HubPerformanceTable';
import { TopDealersLeaderboard } from '@/components/analytics/TopDealersLeaderboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Leaf, Recycle, Package, ShoppingCart, Map as MapIcon } from 'lucide-react';
import { GoogleMapProvider } from '@/components/maps/GoogleMapProvider';
import { AdminOverviewMap } from '@/components/maps/AdminOverviewMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all');
  const { data, loading, error, refetch } = useAdminAnalytics(period);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState<{
    hubs: any[];
    pickups: any[];
    collectors: any[];
  } | null>(null);
  const [loadingMapData, setLoadingMapData] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">System-wide metrics and insights</p>
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

  const lastUpdated = new Date(data.lastUpdated).toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Fetch map data when map is shown
  const fetchMapData = async () => {
    setLoadingMapData(true);
    try {
      const [hubsRes, pickupsRes, collectorsRes] = await Promise.all([
        fetch('/api/hubs'),
        fetch('/api/listings'),
        fetch('/api/user/me'), // We'll need to create an endpoint to get all collectors
      ]);

      const hubsData = hubsRes.ok ? await hubsRes.json() : { hubs: [] };
      const pickupsData = pickupsRes.ok ? await pickupsRes.json() : { listings: [] };
      
      // For now, we'll just use empty collectors array since we don't have a collectors endpoint
      // In a real implementation, you'd fetch all users with role='collector'
      const collectorsData = { collectors: [] };

      setMapData({
        hubs: hubsData.hubs || [],
        pickups: (pickupsData.listings || []).filter((p: any) => 
          p.status === 'pending' || p.status === 'collector_assigned' || p.status === 'picked_up'
        ),
        collectors: collectorsData.collectors || [],
      });
    } catch (err) {
      console.error('Failed to fetch map data:', err);
      setMapData({ hubs: [], pickups: [], collectors: [] });
    } finally {
      setLoadingMapData(false);
    }
  };

  const handleToggleMap = () => {
    if (!showMap && !mapData) {
      fetchMapData();
    }
    setShowMap(!showMap);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">System-wide metrics and insights</p>
          <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            onClick={handleToggleMap}
          >
            <MapIcon className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          <TimePeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Waste Collected"
          value={data.totalWasteCollected}
          unit="kg"
          icon={Package}
          color="blue"
        />
        <MetricCard
          title="CO₂ Saved"
          value={data.co2Saved}
          unit="kg CO₂"
          icon={Leaf}
          color="green"
        />
        <MetricCard
          title="Landfill Diverted"
          value={data.landfillDiverted}
          unit="kg"
          icon={Recycle}
          color="green"
        />
        <MetricCard
          title="Total Orders"
          value={data.orderStats.totalOrders}
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Diversion Badge */}
      <div className="flex items-center gap-2">
        <Badge className="bg-green-100 text-green-700 text-sm px-3 py-1">
          {data.diversionPercentage.toFixed(1)}% diverted from landfills
        </Badge>
      </div>

      {/* Overview Map */}
      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              System Overview Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMapData ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-gray-600">Loading map data...</p>
                </div>
              </div>
            ) : mapData ? (
              <GoogleMapProvider>
                <AdminOverviewMap
                  hubs={mapData.hubs}
                  pickups={mapData.pickups}
                  collectors={mapData.collectors}
                />
              </GoogleMapProvider>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer title="Waste Collection by Type">
          <WasteByTypeChart data={data.wasteByType} />
        </ChartContainer>

        <ChartContainer title="Waste Collection Trend">
          <MonthlyTrendChart data={data.monthlyTrend} />
        </ChartContainer>

        <ChartContainer title="Waste by Status">
          <WasteByStatusChart data={data.wasteByStatus} />
        </ChartContainer>

        <ChartContainer title="Order Statistics">
          <div className="space-y-4 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Orders</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {data.orderStats.pendingOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved Orders</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {data.orderStats.approvedOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed Orders</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {data.orderStats.completedOrders}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rejected Orders</span>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                {data.orderStats.rejectedOrders}
              </Badge>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Approval Rate</span>
                <span className={`text-lg font-bold ${
                  data.orderStats.approvalRate > 80 ? 'text-green-600' :
                  data.orderStats.approvalRate > 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {data.orderStats.approvalRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-semibold">Avg Order Value</span>
                <span className="text-lg font-bold">₹{data.orderStats.averageOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </ChartContainer>
      </div>

      {/* Hub Performance and Top Dealers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HubPerformanceTable data={data.hubPerformance} />
        <TopDealersLeaderboard data={data.topDealers} />
      </div>
    </div>
  );
}

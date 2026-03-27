'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Loader2, AlertCircle, Package, RefreshCw,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IWasteOrder } from '@/types';
import { WASTE_TYPES } from '@/config/constants';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { animations } from '@/lib/theme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending':
      return 'secondary'; // Yellow
    case 'approved':
      return 'default'; // Blue
    case 'rejected':
      return 'destructive'; // Red
    case 'completed':
      return 'outline'; // Green
    default:
      return 'default';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#f59e0b'; // Yellow
    case 'approved':
      return '#3b82f6'; // Blue
    case 'rejected':
      return '#ef4444'; // Red
    case 'completed':
      return '#22c55e'; // Green
    default:
      return '#6b7280';
  }
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// ─── Order Card ──────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: IWasteOrder }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div
          className="h-1 w-full"
          style={{ backgroundColor: WASTE_TYPES[order.wasteType]?.color }}
        />
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${WASTE_TYPES[order.wasteType]?.color}20`,
                    color: WASTE_TYPES[order.wasteType]?.color,
                  }}
                >
                  {WASTE_TYPES[order.wasteType]?.label}
                </span>
                <Badge
                  variant={getStatusBadgeVariant(order.status)}
                  className="text-xs"
                  style={{
                    backgroundColor: order.status === 'completed' ? '#22c55e20' : undefined,
                    color: order.status === 'completed' ? '#22c55e' : undefined,
                    borderColor: order.status === 'completed' ? '#22c55e' : undefined,
                  }}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantity:</span>
              <span className="font-semibold">{formatWeight(order.quantity)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price/kg:</span>
              <span className="font-semibold">{formatCurrency(order.pricePerKg)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground font-medium">Total Price:</span>
              <span className="font-bold text-primary">{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function DealerOrdersContent() {
  const [orders, setOrders] = useState<IWasteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/dealer/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        {...animations.fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-7 w-7 text-primary" />
            My Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your waste purchase orders and their status
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Error */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No orders yet</p>
              <p className="text-sm text-muted-foreground">
                Visit the marketplace to browse and purchase waste inventory
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/dealer/marketplace'}>
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Orders grid */}
      {!loading && orders.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DealerOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['dealer']}>
      <DealerOrdersContent />
    </ProtectedRoute>
  );
}


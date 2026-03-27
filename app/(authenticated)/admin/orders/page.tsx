'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Loader2, AlertCircle, RefreshCw, Search,
  CheckCircle, XCircle, Package, Filter,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IWasteOrder, OrderStatus } from '@/types';
import { WASTE_TYPES } from '@/config/constants';
import { formatWeight, formatCurrency, formatDateTime } from '@/lib/utils';
import { animations } from '@/lib/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderWithDealer extends Omit<IWasteOrder, 'dealer'> {
  dealer?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface OrderMetadata {
  pendingCount: number;
  approvedCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBadgeVariant(status: OrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
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

function getStatusColor(status: OrderStatus): string {
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

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardContent className="pt-4 pb-3 flex items-center gap-3">
        <div className="rounded-full p-2.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-6 w-16 mb-1" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Order Row ───────────────────────────────────────────────────────────────

function OrderRow({
  order,
  onStatusUpdate,
  updatingOrderId,
}: {
  order: OrderWithDealer;
  onStatusUpdate: (orderId: string, action: 'approve' | 'reject' | 'complete') => Promise<void>;
  updatingOrderId: string | null;
}) {
  const isUpdating = updatingOrderId === order._id;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {order.dealer?.name || 'Unknown Dealer'}
        <div className="text-xs text-muted-foreground">{order.dealer?.email}</div>
      </TableCell>
      <TableCell>
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${WASTE_TYPES[order.wasteType]?.color}20`,
            color: WASTE_TYPES[order.wasteType]?.color,
          }}
        >
          {WASTE_TYPES[order.wasteType]?.label}
        </span>
      </TableCell>
      <TableCell className="text-right">{formatWeight(order.quantity)}</TableCell>
      <TableCell className="text-right">{formatCurrency(order.totalPrice)}</TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDateTime(order.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex gap-2 justify-end">
          {order.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                onClick={() => onStatusUpdate(order._id, 'approve')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                    Approve
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => onStatusUpdate(order._id, 'reject')}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Reject
                  </>
                )}
              </Button>
            </>
          )}
          {order.status === 'approved' && (
            <Button
              size="sm"
              variant="outline"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
              onClick={() => onStatusUpdate(order._id, 'complete')}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Package className="mr-1.5 h-3.5 w-3.5" />
                  Complete
                </>
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminOrdersContent() {
  const [orders, setOrders] = useState<OrderWithDealer[]>([]);
  const [metadata, setMetadata] = useState<OrderMetadata>({ pendingCount: 0, approvedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setError(null);
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch orders');

      const data = await res.json();
      setOrders(data.orders ?? []);
      setMetadata(data.metadata ?? { pendingCount: 0, approvedCount: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  const handleStatusUpdate = async (orderId: string, action: 'approve' | 'reject' | 'complete') => {
    setUpdatingOrderId(orderId);
    setError(null);

    try {
      let endpoint = '';
      let body: any = {};

      if (action === 'approve' || action === 'reject') {
        endpoint = '/api/orders/approve';
        body = { orderId, action };
      } else if (action === 'complete') {
        endpoint = '/api/orders/complete';
        body = { orderId };
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update order status');
      }

      // Refresh order list after status change
      await fetchOrders();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        {...animations.fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" />
            Order Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage all dealer orders across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Overview stats */}
      <motion.div {...animations.slideUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={loading ? '—' : orders.length}
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Approval"
          value={loading ? '—' : metadata.pendingCount}
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          label="Approved"
          value={loading ? '—' : metadata.approvedCount}
          color="#22c55e"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Completed"
          value={loading ? '—' : orders.filter((o) => o.status === 'completed').length}
          color="#8b5cf6"
          loading={loading}
        />
      </motion.div>

      {/* Filters */}
      <motion.div {...animations.slideUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Status Filter</label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Search by Dealer Name or Order ID
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
        <Card>
          <CardContent className="pt-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query'
                  : 'Orders will appear here once dealers start purchasing from the marketplace'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Orders table */}
      {!loading && orders.length > 0 && (
        <motion.div {...animations.slideUp}>
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dealer Name</TableHead>
                      <TableHead>Waste Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Total Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Creation Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <OrderRow
                        key={order._id}
                        order={order}
                        onStatusUpdate={handleStatusUpdate}
                        updatingOrderId={updatingOrderId}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminOrdersContent />
    </ProtectedRoute>
  );
}

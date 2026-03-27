'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Filter, RefreshCw, Loader2, AlertCircle, Package,
  MapPin, ShoppingCart, TrendingUp, Search, X,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { IWasteInventory, IHub, WasteType } from '@/types';
import { WASTE_TYPES, WASTE_PRICES } from '@/config/constants';
import { formatWeight, formatCurrency } from '@/lib/utils';
import { animations } from '@/lib/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MarketplaceInventory extends IWasteInventory {
  hub: IHub;
  qualityScore: number;
  pricePerKg: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function qualityBadgeVariant(score: number): 'success' | 'warning' | 'default' {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'default';
}

// ─── Inventory Card ──────────────────────────────────────────────────────────

function InventoryCard({
  inventory,
  onCreateOrder,
}: {
  inventory: MarketplaceInventory;
  onCreateOrder: (inv: MarketplaceInventory) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-lg transition-shadow">
        <div
          className="h-1 w-full"
          style={{ backgroundColor: WASTE_TYPES[inventory.wasteType]?.color }}
        />
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${WASTE_TYPES[inventory.wasteType]?.color}20`,
                    color: WASTE_TYPES[inventory.wasteType]?.color,
                  }}
                >
                  {WASTE_TYPES[inventory.wasteType]?.label}
                </span>
                <Badge variant={qualityBadgeVariant(inventory.qualityScore)} className="text-xs">
                  {inventory.qualityScore}/100
                </Badge>
              </div>
              <CardDescription className="text-xs flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{inventory.hub.location.address}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-semibold">{formatWeight(inventory.quantity)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price/kg:</span>
              <span className="font-semibold">{formatCurrency(inventory.pricePerKg)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hub:</span>
              <span className="font-semibold truncate ml-2">{inventory.hub.name}</span>
            </div>
          </div>

          <Button
            size="sm"
            className="w-full"
            onClick={() => onCreateOrder(inventory)}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Order Dialog ────────────────────────────────────────────────────────────

function CreateOrderDialog({
  inventory,
  open,
  onOpenChange,
  onSuccess,
}: {
  inventory: MarketplaceInventory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}) {
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPrice = inventory && quantity
    ? parseFloat(quantity) * inventory.pricePerKg
    : 0;

  const handleSubmit = async () => {
    if (!inventory) return;

    setError(null);
    const qty = parseFloat(quantity);

    if (!qty || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (qty > inventory.quantity) {
      setError(`Quantity cannot exceed available inventory (${formatWeight(inventory.quantity)})`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId: inventory._id,
          quantity: qty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      onSuccess();
      onOpenChange(false);
      setQuantity('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setQuantity('');
      setError(null);
    }
  }, [open]);

  if (!inventory) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Create Order
          </DialogTitle>
          <DialogDescription>
            Place an order for {WASTE_TYPES[inventory.wasteType]?.label} waste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Inventory details */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Waste Type:</span>
              <span
                className="font-medium"
                style={{ color: WASTE_TYPES[inventory.wasteType]?.color }}
              >
                {WASTE_TYPES[inventory.wasteType]?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available:</span>
              <span className="font-medium">{formatWeight(inventory.quantity)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price/kg:</span>
              <span className="font-medium">{formatCurrency(inventory.pricePerKg)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hub:</span>
              <span className="font-medium truncate ml-2">{inventory.hub.name}</span>
            </div>
          </div>

          {/* Quantity input */}
          <div className="space-y-2">
            <Label htmlFor="order-quantity">Quantity (kg)</Label>
            <Input
              id="order-quantity"
              type="number"
              min="0.01"
              max={inventory.quantity}
              step="0.01"
              placeholder="Enter quantity in kg"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Total price */}
          {quantity && parseFloat(quantity) > 0 && (
            <div className="rounded-lg bg-primary/10 p-3 flex justify-between items-center">
              <span className="text-sm font-medium">Total Price:</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function DealerMarketplaceContent() {
  const [inventory, setInventory] = useState<MarketplaceInventory[]>([]);
  const [hubs, setHubs] = useState<IHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInventory, setSelectedInventory] = useState<MarketplaceInventory | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // Filters
  const [wasteTypeFilter, setWasteTypeFilter] = useState<string>('all');
  const [hubFilter, setHubFilter] = useState<string>('all');
  const [minQuantity, setMinQuantity] = useState('');

  const fetchInventory = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (wasteTypeFilter !== 'all') params.append('wasteType', wasteTypeFilter);
      if (hubFilter !== 'all') params.append('hubId', hubFilter);
      if (minQuantity && parseFloat(minQuantity) > 0) {
        params.append('minQuantity', minQuantity);
      }

      const res = await fetch(`/api/marketplace?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch marketplace inventory');

      const data = await res.json();
      setInventory(data.inventory ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wasteTypeFilter, hubFilter, minQuantity]);

  const fetchHubs = useCallback(async () => {
    try {
      const res = await fetch('/api/hubs');
      if (res.ok) {
        const data = await res.json();
        setHubs(data.hubs ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch hubs:', err);
    }
  }, []);

  useEffect(() => {
    fetchHubs();
  }, [fetchHubs]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleCreateOrder = (inv: MarketplaceInventory) => {
    setSelectedInventory(inv);
    setOrderDialogOpen(true);
  };

  const handleOrderSuccess = () => {
    fetchInventory(); // Refresh inventory after order creation
  };

  const handleClearFilters = () => {
    setWasteTypeFilter('all');
    setHubFilter('all');
    setMinQuantity('');
  };

  const hasActiveFilters = wasteTypeFilter !== 'all' || hubFilter !== 'all' || minQuantity !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        {...animations.fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Store className="h-7 w-7 text-primary" />
            Waste Marketplace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and purchase verified waste inventory from hubs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInventory} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div {...animations.slideUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Waste Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="waste-type-filter">Waste Type</Label>
                <Select value={wasteTypeFilter} onValueChange={setWasteTypeFilter}>
                  <SelectTrigger id="waste-type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(WASTE_TYPES).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.color }}
                          />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hub Filter */}
              <div className="space-y-2">
                <Label htmlFor="hub-filter">Hub Location</Label>
                <Select value={hubFilter} onValueChange={setHubFilter}>
                  <SelectTrigger id="hub-filter">
                    <SelectValue placeholder="All hubs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hubs</SelectItem>
                    {hubs.map((hub) => (
                      <SelectItem key={hub._id} value={hub._id}>
                        {hub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Quantity Filter */}
              <div className="space-y-2">
                <Label htmlFor="min-quantity-filter">Minimum Quantity (kg)</Label>
                <Input
                  id="min-quantity-filter"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            )}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && inventory.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No inventory available</p>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results'
                  : 'Check back later for new waste inventory'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Inventory grid */}
      {!loading && inventory.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {inventory.map((inv) => (
              <InventoryCard
                key={inv._id}
                inventory={inv}
                onCreateOrder={handleCreateOrder}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Order Dialog */}
      <CreateOrderDialog
        inventory={selectedInventory}
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSuccess={handleOrderSuccess}
      />
    </div>
  );
}

export default function DealerMarketplacePage() {
  return (
    <ProtectedRoute allowedRoles={['dealer']}>
      <DealerMarketplaceContent />
    </ProtectedRoute>
  );
}

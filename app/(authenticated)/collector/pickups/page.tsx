'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Package,
  IndianRupee,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Navigation,
  Sparkles,
  Archive,
  Building2,
  X,
  Phone,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PickupStatusTimeline } from '@/components/shared/PickupStatusTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IWasteListing, IHub, WasteType } from '@/types';
import { WASTE_TYPES, REWARD_POINTS } from '@/config/constants';
import { formatCurrency, formatWeight, calculateDistance } from '@/lib/utils';
import { animations } from '@/lib/theme';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function PickupCard({
  pickup,
  collectorCoords,
  hubs,
  onConfirm,
  onRemove,
}: {
  pickup: IWasteListing;
  collectorCoords: [number, number] | null;
  hubs: IHub[];
  onConfirm: (id: string, action: 'picked_up' | 'stored_in_hub', hubId?: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [selectedHubId, setSelectedHubId] = useState<string>('');
  const wasteConfig = WASTE_TYPES[pickup.wasteType as WasteType];
  const rewardPoints = (REWARD_POINTS[pickup.wasteType as WasteType] ?? 0) * Math.ceil(pickup.quantity);

  const distance =
    collectorCoords && pickup.pickupLocation?.coordinates
      ? calculateDistance(
        collectorCoords[1],
        collectorCoords[0],
        pickup.pickupLocation.coordinates[1],
        pickup.pickupLocation.coordinates[0]
      ).toFixed(1)
      : null;

  const handleAction = async (action: 'picked_up' | 'stored_in_hub') => {
    setConfirming(true);
    try {
      await onConfirm(pickup._id, action, action === 'stored_in_hub' ? selectedHubId || undefined : undefined);
    } finally {
      setConfirming(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(pickup._id);
    } finally {
      setRemoving(false);
    }
  };

  const isCompleted = pickup.status === 'stored_in_hub';
  const showRemoveButton = isCompleted;
  const showNavigateButton = !isCompleted && pickup.pickupLocation?.coordinates;

  return (
    <motion.div layout {...animations.slideUp}>
      <Card className={isCompleted ? 'opacity-60 overflow-hidden' : 'overflow-hidden'}>
        <div className="h-1 w-full" style={{ backgroundColor: wasteConfig.color }} />

        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="rounded-full p-2 shrink-0"
                style={{ backgroundColor: `${wasteConfig.color}20` }}
              >
                <Package className="h-4 w-4" style={{ color: wasteConfig.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{wasteConfig.label}</p>
                <p className="text-xs text-muted-foreground">{formatWeight(pickup.quantity)}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {pickup.estimatedValue !== undefined && (
                <Badge variant="outline" className="text-xs gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatCurrency(pickup.estimatedValue)}
                </Badge>
              )}
              {distance && (
                <span className="text-xs text-muted-foreground">{distance} km away</span>
              )}
              {showRemoveButton && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRemove}
                  disabled={removing}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove from list"
                >
                  {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <PickupStatusTimeline status={pickup.status} variant="collector" />

          <Separator />

          <div className="space-y-2 text-xs text-muted-foreground">
            {/* Citizen Info */}
            {pickup.user && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={pickup.user.image} alt={pickup.user.name} />
                    <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                      {pickup.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-blue-900 dark:text-blue-100 text-xs truncate">
                      {pickup.user.name}
                    </p>
                    {pickup.user.phone && (
                      <a
                        href={`tel:${pickup.user.phone}`}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{pickup.user.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{pickup.pickupLocation?.address ?? 'No address'}</span>
            </div>
            
            {pickup.assignedHubId && (
              <div className="flex items-start gap-1.5 text-green-600 dark:text-green-400">
                <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  Deliver to: {hubs.find(h => h._id === pickup.assignedHubId)?.name || 'Assigned Hub'}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">
                Citizen earns +{rewardPoints} pts on pickup
              </span>
            </div>
          </div>

          {/* Hub selector for stored_in_hub action - only if no hub assigned */}
          {pickup.status === 'picked_up' && !pickup.assignedHubId && hubs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Select destination hub
              </p>
              <Select value={selectedHubId} onValueChange={setSelectedHubId}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Choose a hub..." />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub._id} value={hub._id} className="text-xs">
                      {hub.name} — {hub.location.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {showNavigateButton && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`/map?pickupId=${pickup._id}&mode=navigate`}>
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  Navigate
                </a>
              </Button>
            )}

            {pickup.status === 'collector_assigned' && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAction('picked_up')}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Confirm Pickup
              </Button>
            )}

            {pickup.status === 'picked_up' && (
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => handleAction('stored_in_hub')}
                disabled={confirming}
              >
                {confirming ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                )}
                Mark as Stored
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CollectorPickupsContent() {
  const [pickups, setPickups] = useState<IWasteListing[]>([]);
  const [hubs, setHubs] = useState<IHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectorCoords, setCollectorCoords] = useState<[number, number] | null>(null);

  const fetchPickups = useCallback(async () => {
    setError(null);
    try {
      // Fetch all pickups including stored_in_hub
      const res = await fetch('/api/collector/pickups');
      if (!res.ok) throw new Error('Failed to fetch pickups');
      const data = await res.json();
      setPickups(data.pickups ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHubs = useCallback(async () => {
    try {
      const res = await fetch('/api/hubs');
      if (res.ok) {
        const data = await res.json();
        setHubs(data.hubs ?? []);
      }
    } catch {
      // Hubs are optional — graceful degradation
    }
  }, []);

  useEffect(() => {
    fetchPickups();
    fetchHubs();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCollectorCoords([pos.coords.longitude, pos.coords.latitude]);
      });
    }
  }, [fetchPickups, fetchHubs]);

  const handleConfirm = async (id: string, action: 'picked_up' | 'stored_in_hub', hubId?: string) => {
    const res = await fetch(`/api/listings/${id}/confirm`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...(hubId ? { hubId } : {}) }),
    });
    if (res.ok) {
      const data = await res.json();
      setPickups((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: data.listing.status } : p))
      );
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this completed pickup from your list?')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPickups((prev) => prev.filter((p) => p._id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove pickup');
      }
    } catch (err) {
      alert('Failed to remove pickup');
    }
  };

  const assigned = pickups.filter((p) => p.status === 'collector_assigned');
  const pickedUp = pickups.filter((p) => p.status === 'picked_up');
  const stored = pickups.filter((p) => p.status === 'stored_in_hub');

  return (
    <div className="space-y-6">
      <motion.div {...animations.fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            My Pickups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your accepted pickup tasks. Confirm collection and deliver to hubs.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPickups} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {pickups.length > 0 && (
        <motion.div {...animations.slideUp} className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{assigned.length}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">To Collect</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pickedUp.length}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Collected</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/60 dark:bg-green-950/30 border-green-100 dark:border-green-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stored.length}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Stored</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && !error && pickups.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No pickups assigned yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see pickup requests here once citizens submit them and you're the nearest collector.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && assigned.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            To Collect ({assigned.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {assigned.map((p) => (
                <PickupCard
                  key={p._id}
                  pickup={p}
                  collectorCoords={collectorCoords}
                  hubs={hubs}
                  onConfirm={handleConfirm}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!loading && pickedUp.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Collected — Deliver to Hub ({pickedUp.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {pickedUp.map((p) => (
                <PickupCard
                  key={p._id}
                  pickup={p}
                  collectorCoords={collectorCoords}
                  hubs={hubs}
                  onConfirm={handleConfirm}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {!loading && stored.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Completed — Stored in Hub ({stored.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {stored.map((p) => (
                <PickupCard
                  key={p._id}
                  pickup={p}
                  collectorCoords={collectorCoords}
                  hubs={hubs}
                  onConfirm={handleConfirm}
                  onRemove={handleRemove}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CollectorPickupsPage() {
  return (
    <ProtectedRoute allowedRoles={['collector']}>
      <CollectorPickupsContent />
    </ProtectedRoute>
  );
}

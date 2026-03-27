'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Calendar,
  Package,
  IndianRupee,
  RefreshCw,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Map as MapIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PickupStatusTimeline } from '@/components/shared/PickupStatusTimeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { IWasteListing, WasteType } from '@/types';
import { WASTE_TYPES, STATUS_LABELS, REWARD_POINTS } from '@/config/constants';
import { formatCurrency, formatWeight, formatDateTime } from '@/lib/utils';
import { animations } from '@/lib/theme';
import { GoogleMapProvider } from '@/components/maps/GoogleMapProvider';
import { CitizenTrackingMap } from '@/components/maps/CitizenTrackingMap';

const POLL_INTERVAL = 30_000; // 30 seconds

function ListingCard({
  listing,
  onCancel,
}: {
  listing: IWasteListing;
  onCancel: (id: string) => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const wasteConfig = WASTE_TYPES[listing.wasteType as WasteType];
  const rewardPoints = (REWARD_POINTS[listing.wasteType as WasteType] ?? 0) * Math.ceil(listing.quantity);

  const handleCancel = async () => {
    if (!confirm('Cancel this pickup request?')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/listings/${listing._id}`, { method: 'DELETE' });
      if (res.ok) onCancel(listing._id);
    } catch {
      // silent
    } finally {
      setCancelling(false);
    }
  };

  const isCancelled = listing.status === 'cancelled';

  return (
    <motion.div layout {...animations.slideUp}>
      <Card className={isCancelled ? 'opacity-60' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="rounded-full p-2 shrink-0"
                style={{ backgroundColor: `${wasteConfig.color}20` }}
              >
                <Package className="h-4 w-4" style={{ color: wasteConfig.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{wasteConfig.label}</p>
                <p className="text-xs text-muted-foreground">{formatWeight(listing.quantity)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {listing.estimatedValue !== undefined && (
                <Badge variant="outline" className="text-xs gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatCurrency(listing.estimatedValue)}
                </Badge>
              )}
              {listing.status === 'pending' && !isCancelled && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Cancel listing"
                >
                  {cancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Timeline */}
          <PickupStatusTimeline status={listing.status} />

          <Separator />

          {/* Details */}
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{listing.pickupLocation?.address ?? 'No address'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDateTime(listing.createdAt)}</span>
            </div>
            {listing.status === 'pending' && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Waiting for collector assignment</span>
              </div>
            )}
            {listing.status === 'collector_assigned' && (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Truck className="h-3.5 w-3.5 shrink-0" />
                <span>Collector is on the way</span>
              </div>
            )}
            {listing.status === 'picked_up' && (
              <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>+{rewardPoints} reward points earned</span>
              </div>
            )}
          </div>

          {listing.description && (
            <p className="text-xs text-muted-foreground italic border-t pt-2">
              {listing.description}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CitizenPickupsContent() {
  const [listings, setListings] = useState<IWasteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showMap, setShowMap] = useState(false);
  const [collectorLocation, setCollectorLocation] = useState<[number, number] | null>(null);

  const fetchListings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/listings');
      if (!res.ok) throw new Error('Failed to fetch listings');
      const data = await res.json();
      setListings(data.listings ?? []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
    const interval = setInterval(() => fetchListings(true), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchListings]);

  // Poll for collector location if there's an active pickup with collector assigned
  useEffect(() => {
    const activePickup = listings.find(
      (l) => l.status === 'collector_assigned' && l.collectorId
    );

    if (!activePickup?.collectorId) {
      setCollectorLocation(null);
      return;
    }

    const fetchCollectorLocation = async () => {
      try {
        const res = await fetch(`/api/collector/location?collectorId=${activePickup.collectorId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.location?.coordinates) {
            setCollectorLocation(data.location.coordinates);
          }
        }
      } catch (err) {
        console.error('Failed to fetch collector location:', err);
      }
    };

    fetchCollectorLocation();
    const locationInterval = setInterval(fetchCollectorLocation, 10000); // Poll every 10 seconds

    return () => clearInterval(locationInterval);
  }, [listings]);

  const handleCancel = (id: string) => {
    setListings((prev) =>
      prev.map((l) => (l._id === id ? { ...l, status: 'cancelled' } : l))
    );
  };

  const activeListings = listings.filter((l) => l.status !== 'cancelled');
  const cancelledListings = listings.filter((l) => l.status === 'cancelled');

  // Get active pickup with collector assigned for map display
  const trackingPickup = activeListings.find((l) => l.status === 'collector_assigned');

  // Stats
  const totalPickedUp = listings.filter((l) => l.status === 'picked_up' || l.status === 'stored_in_hub' || l.status === 'sold_to_dealer').length;
  const totalPending = listings.filter((l) => l.status === 'pending' || l.status === 'collector_assigned').length;
  const totalPoints = listings
    .filter((l) => l.status === 'picked_up' || l.status === 'stored_in_hub' || l.status === 'sold_to_dealer')
    .reduce((sum, l) => sum + (REWARD_POINTS[l.wasteType as WasteType] ?? 0) * Math.ceil(l.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...animations.fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Truck className="h-7 w-7 text-primary" />
            My Pickup Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your waste pickup requests from creation to completion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {trackingPickup && trackingPickup.pickupLocation?.coordinates && (
            <Button
              variant={showMap ? "default" : "outline"}
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              <MapIcon className="mr-2 h-4 w-4" />
              {showMap ? 'Hide Map' : 'Track Collector'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchListings()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link href="/citizen/classify">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      {listings.length > 0 && (
        <motion.div {...animations.slideUp} className="grid grid-cols-3 gap-3">
          <Card className="bg-blue-50/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalPending}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Active</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50/60 dark:bg-green-950/30 border-green-100 dark:border-green-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalPickedUp}</p>
              <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{totalPoints}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Points Earned</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tracking Map */}
      {showMap && trackingPickup && trackingPickup.pickupLocation?.coordinates && (
        <motion.div {...animations.slideUp}>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                Track Your Pickup
              </h2>
            </CardHeader>
            <CardContent>
              <GoogleMapProvider>
                <CitizenTrackingMap
                  pickupId={trackingPickup._id}
                  pickupLocation={trackingPickup.pickupLocation.coordinates}
                  collectorLocation={collectorLocation || undefined}
                />
              </GoogleMapProvider>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-10 w-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && listings.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">No pickup requests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Classify your waste with AI and request a pickup to get started.
                </p>
              </div>
              <Button asChild>
                <Link href="/citizen/classify">
                  <Plus className="mr-2 h-4 w-4" />
                  Classify Waste & Request Pickup
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Active Listings */}
      {!loading && activeListings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active Requests ({activeListings.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {activeListings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} onCancel={handleCancel} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Cancelled Listings */}
      {!loading && cancelledListings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Cancelled ({cancelledListings.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cancelledListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} onCancel={handleCancel} />
            ))}
          </div>
        </div>
      )}

      {/* Last refreshed */}
      {!loading && listings.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Auto-refreshes every 30s · Last updated {lastRefreshed.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default function CitizenPickupsPage() {
  return (
    <ProtectedRoute allowedRoles={['citizen']}>
      <CitizenPickupsContent />
    </ProtectedRoute>
  );
}

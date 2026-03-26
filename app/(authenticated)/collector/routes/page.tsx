'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Package,
  Loader2,
  AlertCircle,
  Route,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { IWasteListing, WasteType } from '@/types';
import { WASTE_TYPES } from '@/config/constants';
import { formatWeight, calculateDistance } from '@/lib/utils';
import { animations } from '@/lib/theme';

interface PickupWithDistance extends IWasteListing {
  distanceKm: number | null;
  routeOrder: number;
}

/**
 * Greedy nearest-neighbor route sort.
 * Starting from the collector's current position, always pick the closest unvisited pickup.
 */
function sortByRoute(
  pickups: IWasteListing[],
  startLng: number,
  startLat: number
): PickupWithDistance[] {
  const remaining = pickups.map((p) => ({
    ...p,
    distanceKm: p.pickupLocation?.coordinates
      ? calculateDistance(startLat, startLng, p.pickupLocation.coordinates[1], p.pickupLocation.coordinates[0])
      : null,
  }));

  const sorted: PickupWithDistance[] = [];
  let curLat = startLat;
  let curLng = startLng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((p, i) => {
      if (p.pickupLocation?.coordinates) {
        const d = calculateDistance(curLat, curLng, p.pickupLocation.coordinates[1], p.pickupLocation.coordinates[0]);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
    });

    const next = remaining.splice(nearestIdx, 1)[0];
    if (next.pickupLocation?.coordinates) {
      curLat = next.pickupLocation.coordinates[1];
      curLng = next.pickupLocation.coordinates[0];
    }
    sorted.push({ ...next, routeOrder: sorted.length + 1 });
  }

  return sorted;
}

function RouteStopCard({ stop }: { stop: PickupWithDistance }) {
  const wasteConfig = WASTE_TYPES[stop.wasteType as WasteType];
  const mapsUrl = stop.pickupLocation?.coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${stop.pickupLocation.coordinates[1]},${stop.pickupLocation.coordinates[0]}`
    : null;

  return (
    <motion.div layout {...animations.slideUp}>
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Route order indicator */}
          <div
            className="flex items-center justify-center w-12 shrink-0 text-white font-bold text-lg"
            style={{ backgroundColor: wasteConfig.color }}
          >
            {stop.routeOrder}
          </div>

          <div className="flex-1 min-w-0">
            <CardHeader className="pb-2 pt-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-4 w-4 shrink-0" style={{ color: wasteConfig.color }} />
                  <span className="font-semibold text-sm">{wasteConfig.label}</span>
                  <span className="text-xs text-muted-foreground">{formatWeight(stop.quantity)}</span>
                </div>
                {stop.distanceKm !== null && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {stop.distanceKm.toFixed(1)} km
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-4 pb-3 space-y-3">
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{stop.pickupLocation?.address ?? 'No address'}</span>
              </div>

              {mapsUrl && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    Open in Google Maps
                  </a>
                </Button>
              )}
            </CardContent>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function CollectorRoutesContent() {
  const [pickups, setPickups] = useState<IWasteListing[]>([]);
  const [sortedRoute, setSortedRoute] = useState<PickupWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [collectorCoords, setCollectorCoords] = useState<[number, number] | null>(null);

  const fetchPickups = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/collector/pickups?status=collector_assigned');
      if (!res.ok) throw new Error('Failed to fetch pickups');
      const data = await res.json();
      return data.pickups as IWasteListing[];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const getLocation = useCallback((): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocationError('Geolocation not supported');
        resolve(null);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setCollectorCoords(coords);
          setLocating(false);
          resolve(coords);
        },
        () => {
          setLocationError('Could not get your location. Showing unsorted list.');
          setLocating(false);
          resolve(null);
        },
        { timeout: 8000 }
      );
    });
  }, []);

  const loadRoute = useCallback(async () => {
    setLoading(true);
    const [fetchedPickups, coords] = await Promise.all([fetchPickups(), getLocation()]);
    setPickups(fetchedPickups);

    if (coords && fetchedPickups.length > 0) {
      setSortedRoute(sortByRoute(fetchedPickups, coords[0], coords[1]));
    } else {
      // No location — show with null distance
      setSortedRoute(fetchedPickups.map((p, i) => ({ ...p, distanceKm: null, routeOrder: i + 1 })));
    }
    setLoading(false);
  }, [fetchPickups, getLocation]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const totalDistance = sortedRoute.reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...animations.fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Route className="h-7 w-7 text-primary" />
            Optimized Route
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pickups sorted by nearest-first to minimize your travel distance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRoute} disabled={loading || locating}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Recalculate
        </Button>
      </motion.div>

      {/* Route summary */}
      {!loading && sortedRoute.length > 0 && collectorCoords && (
        <motion.div {...animations.slideUp}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{sortedRoute.length}</p>
                    <p className="text-xs text-muted-foreground">Stops</p>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{totalDistance.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Total km</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs gap-1">
                  <Navigation className="h-3 w-3" />
                  GPS optimized
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Location error */}
      {locationError && (
        <div className="flex items-center gap-2 p-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {locationError}
        </div>
      )}

      {/* Fetch error */}
      {error && !loading && (
        <div className="flex items-center gap-2 p-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex">
                <Skeleton className="w-12 h-24 rounded-none" />
                <div className="flex-1 p-4 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedRoute.length === 0 && !error && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Route className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No active pickups to route</p>
              <p className="text-sm text-muted-foreground">
                Check your assigned pickups page for tasks awaiting collection.
              </p>
              <Button variant="outline" asChild>
                <a href="/collector/pickups">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Assigned Pickups
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Route stops */}
      {!loading && sortedRoute.length > 0 && (
        <div className="space-y-3">
          {sortedRoute.map((stop) => (
            <RouteStopCard key={stop._id} stop={stop} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CollectorRoutesPage() {
  return (
    <ProtectedRoute allowedRoles={['collector']}>
      <CollectorRoutesContent />
    </ProtectedRoute>
  );
}

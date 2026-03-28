'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  MapPin,
  Package,
  Navigation as NavigationIcon,
  Loader2,
  AlertCircle,
  User as UserIcon,
  Phone,
  Building2,
} from 'lucide-react';
import { GoogleMapProvider } from '@/components/maps/GoogleMapProvider';
import { GoogleMap } from '@/components/maps';
import { IWasteListing, WasteType } from '@/types';
import { WASTE_TYPES } from '@/config/constants';
import { formatWeight, calculateDistance } from '@/lib/utils';
import { animations } from '@/lib/theme';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pickupId = searchParams.get('pickupId');
  const mode = searchParams.get('mode'); // 'navigate' for collector, 'track' for citizen

  const [pickup, setPickup] = useState<IWasteListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [collectorLocation, setCollectorLocation] = useState<[number, number] | null>(null);

  const fetchPickup = useCallback(async () => {
    if (!pickupId) {
      setError('No pickup ID provided');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/listings/${pickupId}`);
      if (!res.ok) throw new Error('Failed to fetch pickup details');
      const data = await res.json();
      setPickup(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pickupId]);

  const fetchCollectorLocation = useCallback(async () => {
    if (!pickup?.collectorId || mode !== 'track') return;

    try {
      const res = await fetch(`/api/collector/location?collectorId=${pickup.collectorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.location?.coordinates && Array.isArray(data.location.coordinates)) {
          setCollectorLocation(data.location.coordinates);
        }
      }
    } catch (err) {
      console.error('Failed to fetch collector location:', err);
    }
  }, [pickup?.collectorId, mode]);

  const updateCollectorLocation = useCallback(async (coordinates: [number, number]) => {
    try {
      await fetch('/api/collector/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates }),
      });
    } catch (err) {
      console.error('Failed to update collector location:', err);
    }
  }, []);

  useEffect(() => {
    fetchPickup();
  }, [fetchPickup]);

  useEffect(() => {
    if (pickup && mode === 'track') {
      fetchCollectorLocation();
      const interval = setInterval(fetchCollectorLocation, 10000); // Update every 10s
      return () => clearInterval(interval);
    }
  }, [pickup, mode, fetchCollectorLocation]);

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          
          // If in navigate mode (collector), update their location in the database
          if (mode === 'navigate') {
            updateCollectorLocation(coords);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
      
      // Watch position for continuous updates in navigate mode
      if (mode === 'navigate') {
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
            setUserLocation(coords);
            updateCollectorLocation(coords);
          },
          (err) => {
            console.error('Geolocation watch error:', err);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000,
          }
        );
        
        return () => navigator.geolocation.clearWatch(watchId);
      }
    }
  }, [mode]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !pickup) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Pickup not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const wasteConfig = WASTE_TYPES[pickup.wasteType as WasteType];
  const pickupCoords = pickup.pickupLocation?.coordinates;
  
  const distance =
    userLocation && pickupCoords
      ? calculateDistance(
          userLocation[1],
          userLocation[0],
          pickupCoords[1],
          pickupCoords[0]
        ).toFixed(1)
      : null;

  const collectorDistance =
    collectorLocation && pickupCoords
      ? calculateDistance(
          collectorLocation[1],
          collectorLocation[0],
          pickupCoords[1],
          pickupCoords[0]
        ).toFixed(1)
      : null;

  // Prepare markers for the map
  const markers: any[] = [];
  
  // Pickup location marker
  if (pickupCoords && Array.isArray(pickupCoords) && 
      typeof pickupCoords[0] === 'number' && typeof pickupCoords[1] === 'number') {
    markers.push({
      id: 'pickup',
      coordinates: pickupCoords,
      type: 'pickup',
      title: 'Pickup Location',
    });
  }

  // User location marker (collector or citizen)
  if (userLocation && Array.isArray(userLocation) && 
      typeof userLocation[0] === 'number' && typeof userLocation[1] === 'number' && 
      mode === 'navigate') {
    markers.push({
      id: 'user',
      coordinates: userLocation,
      type: 'collector',
      title: 'Your Location',
    });
  }

  // Collector location marker (for tracking)
  if (collectorLocation && Array.isArray(collectorLocation) && 
      typeof collectorLocation[0] === 'number' && typeof collectorLocation[1] === 'number' && 
      mode === 'track') {
    markers.push({
      id: 'collector',
      coordinates: collectorLocation,
      type: 'collector',
      title: 'Collector Location',
    });
  }

  // Calculate center to fit all markers
  const allCoords = markers.map(m => m.coordinates);
  const center = allCoords.length > 0
    ? allCoords[0]
    : pickupCoords || [-122.4194, 37.7749]; // Default center or pickup location

  return (
    <div className="space-y-6">
      <motion.div {...animations.fadeIn} className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-xl md:text-2xl font-bold">
          {mode === 'navigate' ? 'Navigate to Pickup' : 'Track Collector'}
        </h1>
        <div className="w-20" /> {/* Spacer for centering */}
      </motion.div>

      {/* Pickup Details Card */}
      <motion.div {...animations.slideUp}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: `${wasteConfig.color}20` }}
                >
                  <Package className="h-4 w-4" style={{ color: wasteConfig.color }} />
                </div>
                <div>
                  <CardTitle className="text-base">{wasteConfig.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">{formatWeight(pickup.quantity)}</p>
                </div>
              </div>
              {distance && mode === 'navigate' && (
                <Badge variant="outline" className="text-xs">
                  {distance} km away
                </Badge>
              )}
              {collectorDistance && mode === 'track' && (
                <Badge variant="outline" className="text-xs">
                  Collector: {collectorDistance} km away
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Contact Info */}
            {mode === 'navigate' && pickup.user && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800 p-2.5">
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
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{pickup.user.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {mode === 'track' && pickup.collector && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800 p-2.5">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={pickup.collector.image} alt={pickup.collector.name} />
                    <AvatarFallback className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                      {pickup.collector.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-900 dark:text-green-100 text-xs truncate">
                      {pickup.collector.name}
                    </p>
                    {pickup.collector.phone && (
                      <a
                        href={`tel:${pickup.collector.phone}`}
                        className="flex items-center gap-1 text-green-600 dark:text-green-400 hover:underline text-xs"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{pickup.collector.phone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{pickup.pickupLocation?.address ?? 'No address'}</span>
            </div>

            {pickup.assignedHubId && (
              <div className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span className="line-clamp-2">Deliver to assigned hub</span>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Map */}
      <motion.div {...animations.slideUp}>
        <Card>
          <CardContent className="p-0">
            {mode === 'track' && !collectorLocation && (
              <Alert className="m-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  Collector location not available yet. The map will update when the collector shares their location.
                </AlertDescription>
              </Alert>
            )}
            <GoogleMapProvider>
              <GoogleMap
                center={center}
                zoom={13}
                markers={markers}
                className="h-[500px] md:h-[600px] w-full rounded-lg"
                showGeolocationButton
                fitBounds={markers.length > 1}
              />
            </GoogleMapProvider>
          </CardContent>
        </Card>
      </motion.div>

      {/* Open in Google Maps */}
      {pickupCoords && (
        <motion.div {...animations.fadeIn}>
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pickupCoords[1]},${pickupCoords[0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NavigationIcon className="mr-2 h-4 w-4" />
              Open in Google Maps
            </a>
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <ProtectedRoute allowedRoles={['collector', 'citizen']}>
      <MapPageContent />
    </ProtectedRoute>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { GoogleMap } from './GoogleMap';
import { calculateRoute, RouteResponse } from '@/lib/services/RouteCalculator';

export interface CitizenTrackingMapProps {
  pickupId: string;
  pickupLocation: [number, number]; // [lng, lat]
  collectorLocation?: [number, number]; // [lng, lat]
  estimatedArrival?: string; // ISO date string
}

/**
 * CitizenTrackingMap - Allows citizens to track collector's real-time location
 * 
 * Features:
 * - Shows citizen's pickup location
 * - Displays collector's current location (if assigned)
 * - Shows route and estimated arrival time
 * - Auto-centers on collector location
 * 
 * Validates: Requirements 5.1, 5.2, 5.4
 */
export function CitizenTrackingMap({
  pickupId,
  pickupLocation,
  collectorLocation,
  estimatedArrival,
}: CitizenTrackingMapProps) {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  // Calculate route when collector location is available
  useEffect(() => {
    if (!collectorLocation) {
      setRoute(null);
      return;
    }

    const fetchRoute = async () => {
      setIsLoadingRoute(true);

      try {
        const routeData = await calculateRoute({
          origin: collectorLocation,
          destination: pickupLocation,
          mode: 'driving',
        });
        setRoute(routeData);
      } catch (error) {
        console.error('Failed to calculate route:', error);
        setRoute(null);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [collectorLocation, pickupLocation]);

  // Format estimated arrival time
  const formatArrivalTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins < 0) {
      return 'Arriving soon';
    } else if (diffMins < 60) {
      return `${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Prepare markers
  const markers: Array<{
    id: string;
    coordinates: [number, number];
    type: 'pickup' | 'collector';
    title: string;
    metadata: Record<string, any>;
  }> = [
    {
      id: `pickup-${pickupId}`,
      coordinates: pickupLocation,
      type: 'pickup' as const,
      title: 'Your Pickup Location',
      metadata: {
        pickupId,
        status: collectorLocation ? 'Collector assigned' : 'Waiting for collector',
      },
    },
  ];

  // Add collector marker if location is available
  if (collectorLocation) {
    markers.push({
      id: 'collector',
      coordinates: collectorLocation,
      type: 'collector' as const,
      title: 'Collector',
      metadata: {
        status: 'On the way',
        distance: route ? `${route.distance.toFixed(1)} km away` : 'Calculating...',
      },
    });
  }

  // Prepare routes
  const routes = route
    ? [
        {
          id: `route-${pickupId}`,
          polyline: route.polyline,
          color: '#3b82f6', // blue
          strokeWeight: 4,
        },
      ]
    : [];

  // Center on collector if available, otherwise on pickup
  const mapCenter = collectorLocation || pickupLocation;

  return (
    <div className="relative">
      <GoogleMap
        center={mapCenter}
        zoom={14}
        markers={markers}
        routes={routes}
        fitBounds={collectorLocation ? true : false}
        showUserLocation={false}
        className="w-full h-[500px] rounded-lg"
      />

      {/* Status Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="font-semibold text-lg mb-2">Pickup Status</h3>

        {!collectorLocation && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-pulse rounded-full h-3 w-3 bg-amber-500"></div>
            <span className="text-sm">Waiting for collector assignment</span>
          </div>
        )}

        {collectorLocation && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <div className="rounded-full h-3 w-3 bg-green-500"></div>
              <span className="text-sm font-medium">Collector on the way</span>
            </div>

            {isLoadingRoute && (
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">Calculating arrival...</span>
              </div>
            )}

            {route && (
              <div className="space-y-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Distance</span>
                  <span className="font-semibold">{route.distance.toFixed(1)} km</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Estimated Time</span>
                  <span className="font-semibold">{Math.ceil(route.duration)} min</span>
                </div>
              </div>
            )}

            {estimatedArrival && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-blue-600 font-medium mb-1">Estimated Arrival</p>
                <p className="text-lg font-bold text-blue-900">{formatArrivalTime(estimatedArrival)}</p>
              </div>
            )}
          </div>
        )}

        {/* Helpful tip */}
        <div className="mt-4 pt-3 border-t text-xs text-gray-500">
          <p>The map updates automatically as the collector moves.</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap } from './GoogleMap';
import { calculateRoute, RouteResponse } from '@/lib/services/RouteCalculator';
import { calculateDistance } from '@/lib/services/MapService';

export interface CollectorNavigationMapProps {
  pickupId: string;
  collectorLocation: [number, number]; // [lng, lat]
  pickupLocation: [number, number]; // [lng, lat]
  onStartNavigation?: () => void;
}

/**
 * CollectorNavigationMap - Specialized map for collectors showing route to pickup location
 * 
 * Features:
 * - Displays route from collector to pickup
 * - Shows distance and estimated time
 * - Provides "Start Navigation" button to open Google Maps
 * - Updates collector location in real-time
 * 
 * Validates: Requirements 3.1, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5
 */
export function CollectorNavigationMap({
  pickupId,
  collectorLocation,
  pickupLocation,
  onStartNavigation,
}: CollectorNavigationMapProps) {
  const [route, setRoute] = useState<RouteResponse | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [straightLineDistance, setStraightLineDistance] = useState<number>(0);

  // Calculate route when locations change
  useEffect(() => {
    const fetchRoute = async () => {
      setIsLoadingRoute(true);
      setRouteError(null);

      try {
        const routeData = await calculateRoute({
          origin: collectorLocation,
          destination: pickupLocation,
          mode: 'driving',
        });
        setRoute(routeData);
      } catch (error) {
        console.error('Failed to calculate route:', error);
        setRouteError(error instanceof Error ? error.message : 'Failed to calculate route');
        
        // Fallback to straight-line distance
        const distance = calculateDistance(collectorLocation, pickupLocation);
        setStraightLineDistance(distance);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [collectorLocation, pickupLocation]);

  // Open Google Maps navigation
  const handleStartNavigation = useCallback(() => {
    const [destLng, destLat] = pickupLocation;
    const [originLng, originLat] = collectorLocation;

    // Construct Google Maps URL with origin and destination
    const url = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=driving`;

    // Open in new tab (desktop) or Google Maps app (mobile)
    window.open(url, '_blank');

    // Call optional callback
    if (onStartNavigation) {
      onStartNavigation();
    }
  }, [collectorLocation, pickupLocation, onStartNavigation]);

  // Prepare markers
  const markers = [
    {
      id: 'collector',
      coordinates: collectorLocation,
      type: 'collector' as const,
      title: 'Your Location',
      metadata: {
        status: 'Active',
      },
    },
    {
      id: `pickup-${pickupId}`,
      coordinates: pickupLocation,
      type: 'pickup' as const,
      title: 'Pickup Location',
      metadata: {
        pickupId,
      },
    },
  ];

  // Prepare routes
  const routes = route
    ? [
        {
          id: `route-${pickupId}`,
          polyline: route.polyline,
          color: '#10b981', // green
          strokeWeight: 5,
        },
      ]
    : [];

  return (
    <div className="relative">
      <GoogleMap
        center={collectorLocation}
        zoom={13}
        markers={markers}
        routes={routes}
        fitBounds={true}
        showUserLocation={false}
        className="w-full h-[500px] rounded-lg"
      />

      {/* Route Information Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-10">
        <h3 className="font-semibold text-lg mb-2">Route to Pickup</h3>

        {isLoadingRoute && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Calculating route...</span>
          </div>
        )}

        {routeError && !route && (
          <div className="text-sm text-amber-600 mb-2">
            <p className="font-medium">Route unavailable</p>
            <p className="text-xs mt-1">Showing straight-line distance</p>
          </div>
        )}

        {route && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-semibold">{route.distance.toFixed(1)} km</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="font-semibold">{Math.ceil(route.duration)} min</p>
              </div>
            </div>
          </div>
        )}

        {!route && straightLineDistance > 0 && (
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <div>
              <p className="text-sm text-gray-600">Straight-line Distance</p>
              <p className="font-semibold">{straightLineDistance.toFixed(1)} km</p>
            </div>
          </div>
        )}

        {/* Start Navigation Button */}
        <button
          onClick={handleStartNavigation}
          disabled={isLoadingRoute}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Start Navigation
        </button>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { GoogleMap } from './GoogleMap';

export interface Hub {
  _id: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  capacity?: number;
  currentLoad?: number;
}

export interface Pickup {
  _id: string;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    address?: string;
  };
  status: string;
  wasteType?: string;
  quantity?: number;
}

export interface Collector {
  _id: string;
  name: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  status?: string;
}

export interface AdminOverviewMapProps {
  hubs: Hub[];
  pickups: Pickup[];
  collectors: Collector[];
  filters?: {
    showHubs: boolean;
    showPickups: boolean;
    showCollectors: boolean;
  };
}

/**
 * AdminOverviewMap - Displays all hubs, active pickups, and collectors on a single map
 * 
 * Features:
 * - Displays multiple markers of different types simultaneously
 * - Implements marker filtering by type
 * - Adds marker clustering for performance
 * - Shows info windows with details on click
 * 
 * Validates: Requirements 7.1, 7.2, 7.4, 7.5
 */
export function AdminOverviewMap({
  hubs,
  pickups,
  collectors,
  filters = { showHubs: true, showPickups: true, showCollectors: true },
}: AdminOverviewMapProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [selectedMarkerType, setSelectedMarkerType] = useState<string | null>(null);

  // Toggle filter
  const toggleFilter = (filterKey: keyof typeof localFilters) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterKey]: !prev[filterKey],
    }));
  };

  // Prepare markers based on filters
  const markers = useMemo(() => {
    const allMarkers: Array<{
      id: string;
      coordinates: [number, number];
      type: 'hub' | 'pickup' | 'collector';
      title: string;
      metadata: Record<string, any>;
    }> = [];

    // Add hub markers
    if (localFilters.showHubs) {
      hubs.forEach((hub) => {
        allMarkers.push({
          id: `hub-${hub._id}`,
          coordinates: hub.location.coordinates,
          type: 'hub' as const,
          title: hub.name,
          metadata: {
            capacity: hub.capacity ? `${hub.capacity} kg` : 'N/A',
            currentLoad: hub.currentLoad ? `${hub.currentLoad} kg` : 'N/A',
            utilization: hub.capacity && hub.currentLoad 
              ? `${Math.round((hub.currentLoad / hub.capacity) * 100)}%`
              : 'N/A',
          },
        });
      });
    }

    // Add pickup markers
    if (localFilters.showPickups) {
      pickups.forEach((pickup) => {
        allMarkers.push({
          id: `pickup-${pickup._id}`,
          coordinates: pickup.pickupLocation.coordinates,
          type: 'pickup' as const,
          title: pickup.pickupLocation.address || 'Pickup Location',
          metadata: {
            status: pickup.status,
            wasteType: pickup.wasteType || 'N/A',
            quantity: pickup.quantity ? `${pickup.quantity} kg` : 'N/A',
          },
        });
      });
    }

    // Add collector markers
    if (localFilters.showCollectors) {
      collectors
        .filter((collector) => collector.location) // Only collectors with location
        .forEach((collector) => {
          allMarkers.push({
            id: `collector-${collector._id}`,
            coordinates: collector.location!.coordinates,
            type: 'collector' as const,
            title: collector.name,
            metadata: {
              status: collector.status || 'Active',
            },
          });
        });
    }

    return allMarkers;
  }, [hubs, pickups, collectors, localFilters]);

  // Calculate center based on all markers
  const mapCenter = useMemo((): [number, number] => {
    if (markers.length === 0) {
      // Default center (can be configured)
      return [0, 0];
    }

    const avgLng = markers.reduce((sum, m) => sum + m.coordinates[0], 0) / markers.length;
    const avgLat = markers.reduce((sum, m) => sum + m.coordinates[1], 0) / markers.length;

    return [avgLng, avgLat];
  }, [markers]);

  // Count markers by type
  const markerCounts = useMemo(() => {
    return {
      hubs: hubs.length,
      pickups: pickups.length,
      collectors: collectors.filter((c) => c.location).length,
    };
  }, [hubs, pickups, collectors]);

  return (
    <div className="relative">
      <GoogleMap
        center={mapCenter}
        zoom={12}
        markers={markers}
        routes={[]}
        fitBounds={markers.length > 0}
        showUserLocation={false}
        enableClustering={true}
        clusteringThreshold={10}
        maxMarkers={500}
        className="w-full h-[600px] rounded-lg"
      />

      {/* Filter Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <h3 className="font-semibold text-lg mb-3">Map Filters</h3>

        <div className="space-y-2">
          {/* Hubs Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.showHubs}
              onChange={() => toggleFilter('showHubs')}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-sm font-medium">Hubs ({markerCounts.hubs})</span>
            </div>
          </label>

          {/* Pickups Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.showPickups}
              onChange={() => toggleFilter('showPickups')}
              className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-sm font-medium">Pickups ({markerCounts.pickups})</span>
            </div>
          </label>

          {/* Collectors Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters.showCollectors}
              onChange={() => toggleFilter('showCollectors')}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-sm font-medium">Collectors ({markerCounts.collectors})</span>
            </div>
          </label>
        </div>

        {/* Summary */}
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-600">
            Showing {markers.length} marker{markers.length !== 1 ? 's' : ''}
          </p>
          {markers.length > 10 && (
            <p className="text-xs text-gray-500 mt-1">
              Markers are clustered for better performance
            </p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Collector</span>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
        <h3 className="font-semibold text-lg mb-3">Overview</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Hubs</span>
            <span className="font-bold text-blue-600">{markerCounts.hubs}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Pickups</span>
            <span className="font-bold text-red-600">{markerCounts.pickups}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Collectors</span>
            <span className="font-bold text-green-600">{markerCounts.collectors}</span>
          </div>
        </div>

        {markers.length === 0 && (
          <div className="mt-4 pt-3 border-t text-sm text-gray-500">
            No markers to display. Adjust filters to show data.
          </div>
        )}
      </div>
    </div>
  );
}

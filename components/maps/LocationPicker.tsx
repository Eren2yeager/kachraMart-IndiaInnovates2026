'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap } from './GoogleMap';
import { MapMarker } from './GoogleMap';

interface LocationPickerProps {
  initialLocation?: [number, number]; // [lng, lat]
  onLocationSelect: (coordinates: [number, number], address: string) => void;
  searchEnabled?: boolean;
  className?: string;
  zoom?: number;
}

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  searchEnabled = true,
  className = 'w-full h-[500px]',
  zoom = 13,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Default center (if no initial location, use a default)
  const defaultCenter: [number, number] = initialLocation || [-122.4194, 37.7749]; // San Francisco

  // Reverse geocode to get address from coordinates
  const reverseGeocode = useCallback(async (coordinates: [number, number]) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch('/api/maps/reverse-geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates }),
      });

      if (!response.ok) {
        throw new Error('Failed to get address');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.result) {
        setAddress(data.result.formattedAddress || `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`);
      } else {
        setAddress(`${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Forward geocode to get coordinates from address
  const geocodeAddress = useCallback(async (addressQuery: string) => {
    if (!addressQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/maps/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressQuery }),
      });

      if (!response.ok) {
        throw new Error('Address not found');
      }

      const data = await response.json();
      
      if (data.status === 'error' || !data.results || data.results.length === 0) {
        throw new Error(data.message || 'Address not found');
      }

      // Use the first result
      const firstResult = data.results[0];
      setSelectedLocation(firstResult.coordinates);
      setAddress(firstResult.formattedAddress);
    } catch (error) {
      console.error('Geocoding error:', error);
      setSearchError('Address not found. Please try a different search.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle map click to place marker
  const handleMapClick = useCallback(
    (coordinates: [number, number]) => {
      setSelectedLocation(coordinates);
      reverseGeocode(coordinates);
    },
    [reverseGeocode]
  );

  // Handle search form submission
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      geocodeAddress(searchQuery);
    },
    [searchQuery, geocodeAddress]
  );

  // Handle confirm button click
  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation, address);
    }
  }, [selectedLocation, address, onLocationSelect]);

  // Reverse geocode initial location
  useEffect(() => {
    if (initialLocation) {
      reverseGeocode(initialLocation);
    }
  }, [initialLocation, reverseGeocode]);

  // Create marker for selected location
  const markers: MapMarker[] = selectedLocation
    ? [
        {
          id: 'selected-location',
          coordinates: selectedLocation,
          type: 'pickup',
          title: 'Selected Location',
          metadata: { address },
        },
      ]
    : [];

  return (
    <div className="space-y-4">
      {/* Search box */}
      {searchEnabled && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for an address..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      )}

      {/* Search error */}
      {searchError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg">
          <p className="text-sm">{searchError}</p>
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <GoogleMap
          center={selectedLocation || defaultCenter}
          zoom={zoom}
          markers={markers}
          onMapClick={handleMapClick}
          className={className}
          interactive={true}
          showGeolocationButton={true}
          showResetButton={true}
        />

        {/* Instructions overlay */}
        <div className="absolute top-3 left-3 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          <p className="text-sm text-gray-700">
            {selectedLocation ? 'Click to change location' : 'Click on the map to select a location'}
          </p>
        </div>
      </div>

      {/* Selected location info */}
      {selectedLocation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-sm mb-2">Selected Location</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Coordinates:</span>{' '}
              {selectedLocation[1].toFixed(6)}, {selectedLocation[0].toFixed(6)}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Address:</span>{' '}
              {isLoadingAddress ? (
                <span className="text-gray-500">Loading address...</span>
              ) : (
                address
              )}
            </p>
          </div>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selectedLocation || isLoadingAddress}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        Confirm Location
      </button>
    </div>
  );
}

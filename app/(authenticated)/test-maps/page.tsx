'use client';

import { useState } from 'react';
import { GoogleMap, LocationPicker } from '@/components/maps';
import { GoogleMapProvider } from '@/components/maps';

export default function TestMapsPage() {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  const handleLocationSelect = (coordinates: [number, number], address: string) => {
    setSelectedLocation(coordinates);
    setSelectedAddress(address);
    console.log('Location selected:', coordinates, address);
  };

  // Test markers
  const testMarkers = [
    {
      id: '1',
      coordinates: [-122.4194, 37.7749] as [number, number],
      type: 'pickup' as const,
      title: 'Test Pickup',
      metadata: { status: 'pending' },
    },
    {
      id: '2',
      coordinates: [-122.4094, 37.7849] as [number, number],
      type: 'hub' as const,
      title: 'Test Hub',
      metadata: { capacity: 100 },
    },
  ];

  return (
    <GoogleMapProvider>
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold">Map Components Test Page</h1>

        {/* Test GoogleMap with geolocation */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">GoogleMap with Geolocation</h2>
          <GoogleMap
            center={[-122.4194, 37.7749]}
            zoom={13}
            markers={testMarkers}
            showUserLocation={true}
            showGeolocationButton={true}
            showResetButton={true}
            interactive={true}
            className="w-full h-[500px] rounded-lg border"
          />
        </section>

        {/* Test LocationPicker */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">LocationPicker Component</h2>
          <LocationPicker
            initialLocation={[-122.4194, 37.7749]}
            onLocationSelect={handleLocationSelect}
            searchEnabled={true}
            className="w-full h-[500px] rounded-lg border"
          />
          {selectedLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Selected Location:</h3>
              <p>Coordinates: {selectedLocation[1].toFixed(6)}, {selectedLocation[0].toFixed(6)}</p>
              <p>Address: {selectedAddress}</p>
            </div>
          )}
        </section>

        {/* Test non-interactive map */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Non-Interactive Map</h2>
          <GoogleMap
            center={[-122.4194, 37.7749]}
            zoom={13}
            markers={testMarkers}
            interactive={false}
            className="w-full h-[400px] rounded-lg border"
          />
        </section>
      </div>
    </GoogleMapProvider>
  );
}

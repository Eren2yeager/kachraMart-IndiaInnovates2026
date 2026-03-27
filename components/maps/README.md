# Google Maps Components

Core map components for the Google Maps integration feature.

## Components

### GoogleMapProvider
Context provider that loads the Google Maps API and provides loading state to child components.

**Usage:**
```tsx
import { GoogleMapProvider } from '@/components/maps';

function App() {
  return (
    <GoogleMapProvider>
      {/* Your map components here */}
    </GoogleMapProvider>
  );
}
```

### GoogleMap
Core map component that renders a Google Maps instance with markers and routes.

**Props:**
- `center: [number, number]` - Map center in [lng, lat] format
- `zoom?: number` - Initial zoom level (default: 13)
- `markers?: MapMarker[]` - Array of markers to display
- `routes?: MapRoute[]` - Array of routes to display
- `onMarkerClick?: (marker: MapMarker) => void` - Marker click handler
- `onMapClick?: (coordinates: [number, number]) => void` - Map click handler
- `className?: string` - CSS class for the map container
- `interactive?: boolean` - Enable/disable map interactions (default: true)
- `fitBounds?: boolean` - Auto-fit bounds to show all markers/routes (default: false)

**Usage:**
```tsx
import { GoogleMapProvider, GoogleMap } from '@/components/maps';

function MapView() {
  const markers = [
    {
      id: '1',
      coordinates: [77.5946, 12.9716], // [lng, lat]
      type: 'pickup',
      title: 'Pickup Location',
      metadata: { weight: '5kg' }
    }
  ];

  return (
    <GoogleMapProvider>
      <GoogleMap
        center={[77.5946, 12.9716]}
        zoom={13}
        markers={markers}
        fitBounds
      />
    </GoogleMapProvider>
  );
}
```

### MapMarker
Individual marker component with info window support.

**Props:**
- `id: string` - Unique marker ID
- `coordinates: [number, number]` - Marker position in [lng, lat] format
- `type: 'pickup' | 'hub' | 'collector' | 'user'` - Marker type (affects styling)
- `title: string` - Marker title
- `metadata?: Record<string, any>` - Additional data to display in info window
- `onClick?: () => void` - Click handler

**Marker Types:**
- `pickup` - Red marker for waste pickup locations
- `hub` - Blue marker for waste hubs
- `collector` - Green marker for collectors
- `user` - Purple marker for user locations

### MapRoute
Polyline component for displaying routes.

**Props:**
- `id: string` - Unique route ID
- `polyline: string` - Encoded polyline string
- `color?: string` - Route color (default: auto-assigned)
- `strokeWeight?: number` - Line thickness (default: 4)
- `opacity?: number` - Line opacity (default: 0.8)

**Usage:**
```tsx
import { GoogleMapProvider, GoogleMap } from '@/components/maps';

function RouteView() {
  const routes = [
    {
      id: 'route-1',
      polyline: 'encoded_polyline_string_here',
      color: '#3b82f6',
      strokeWeight: 5
    }
  ];

  return (
    <GoogleMapProvider>
      <GoogleMap
        center={[77.5946, 12.9716]}
        routes={routes}
        fitBounds
      />
    </GoogleMapProvider>
  );
}
```

## Coordinate Format

All coordinates throughout the system use **[longitude, latitude]** format to match the existing database models.

Example: `[77.5946, 12.9716]` represents Bangalore, India.

## Error Handling

The components include comprehensive error handling:

- **API Load Failure**: Displays fallback UI with coordinates and retry button
- **Invalid API Key**: Shows developer-friendly error message
- **Network Errors**: Provides retry functionality
- **Invalid Coordinates**: Validates coordinate ranges

## Environment Variables

Required environment variable:
```
NEXT_PUBLIC_GOOGLE_MAP_API_KEY=your_api_key_here
```

## Features

- ✅ Reusable map component with customizable props
- ✅ Multiple marker types with distinct visual styles
- ✅ Info windows on marker click
- ✅ Polyline route rendering from encoded strings
- ✅ Multiple routes displayed simultaneously
- ✅ Auto-fit bounds to show all markers/routes
- ✅ Interactive and static map modes
- ✅ Graceful error handling with fallback UI
- ✅ Loading states
- ✅ TypeScript support with full type safety

## Next Steps

These core components form the foundation for:
- CollectorNavigationMap (navigation with turn-by-turn)
- CitizenTrackingMap (real-time collector tracking)
- AdminOverviewMap (system-wide overview with clustering)
- LocationPicker (interactive location selection)

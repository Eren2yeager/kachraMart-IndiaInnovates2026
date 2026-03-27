# Use-Case Specific Map Components

This document describes the three specialized map components created for specific use cases in the waste management platform.

## Overview

These components build on top of the core `GoogleMap` component to provide tailored experiences for different user roles:

1. **CollectorNavigationMap** - For collectors navigating to pickup locations
2. **CitizenTrackingMap** - For citizens tracking collector arrival
3. **AdminOverviewMap** - For admins viewing system-wide operations

## Components

### 1. CollectorNavigationMap

**Purpose**: Helps collectors navigate to pickup locations with turn-by-turn directions.

**Location**: `components/maps/CollectorNavigationMap.tsx`

**Props**:
```typescript
interface CollectorNavigationMapProps {
  pickupId: string;
  collectorLocation: [number, number]; // [lng, lat]
  pickupLocation: [number, number]; // [lng, lat]
  onStartNavigation?: () => void;
}
```

**Features**:
- ✅ Displays route from collector to pickup location
- ✅ Shows distance and estimated travel time
- ✅ Provides "Start Navigation" button that opens Google Maps
- ✅ Updates route when collector location changes
- ✅ Fallback to straight-line distance if route calculation fails
- ✅ Visual route polyline on map
- ✅ Distinct markers for collector and pickup locations

**Usage Example**:
```tsx
import { CollectorNavigationMap } from '@/components/maps';

<CollectorNavigationMap
  pickupId="pickup123"
  collectorLocation={[-122.4194, 37.7749]}
  pickupLocation={[-122.4084, 37.7849]}
  onStartNavigation={() => console.log('Navigation started')}
/>
```

**Requirements Validated**: 3.1, 3.3, 6.1, 6.2, 6.3, 6.4, 6.5

---

### 2. CitizenTrackingMap

**Purpose**: Allows citizens to track their assigned collector's real-time location and estimated arrival.

**Location**: `components/maps/CitizenTrackingMap.tsx`

**Props**:
```typescript
interface CitizenTrackingMapProps {
  pickupId: string;
  pickupLocation: [number, number]; // [lng, lat]
  collectorLocation?: [number, number]; // [lng, lat]
  estimatedArrival?: string; // ISO date string
}
```

**Features**:
- ✅ Displays citizen's pickup location
- ✅ Shows collector's current location (if assigned)
- ✅ Displays route and estimated arrival time
- ✅ Auto-centers on collector location when available
- ✅ Shows "waiting for collector" state when no collector assigned
- ✅ Calculates and displays distance to pickup
- ✅ Formats estimated arrival time in human-readable format

**Usage Example**:
```tsx
import { CitizenTrackingMap } from '@/components/maps';

<CitizenTrackingMap
  pickupId="pickup123"
  pickupLocation={[-122.4084, 37.7849]}
  collectorLocation={[-122.4194, 37.7749]}
  estimatedArrival="2024-01-15T14:30:00Z"
/>
```

**Requirements Validated**: 5.1, 5.2, 5.4

---

### 3. AdminOverviewMap

**Purpose**: Provides administrators with a bird's-eye view of all system operations.

**Location**: `components/maps/AdminOverviewMap.tsx`

**Props**:
```typescript
interface AdminOverviewMapProps {
  hubs: Hub[];
  pickups: Pickup[];
  collectors: Collector[];
  filters?: {
    showHubs: boolean;
    showPickups: boolean;
    showCollectors: boolean;
  };
}

interface Hub {
  _id: string;
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  capacity?: number;
  currentLoad?: number;
}

interface Pickup {
  _id: string;
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  status: string;
  wasteType?: string;
  quantity?: number;
}

interface Collector {
  _id: string;
  name: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
  status?: string;
}
```

**Features**:
- ✅ Displays all hubs, pickups, and collectors simultaneously
- ✅ Marker filtering by type (show/hide hubs, pickups, collectors)
- ✅ Marker clustering for performance (enabled automatically)
- ✅ Info windows with details on marker click
- ✅ Statistics panel showing counts
- ✅ Legend for marker types
- ✅ Auto-fits bounds to show all markers
- ✅ Color-coded markers (blue=hubs, red=pickups, green=collectors)

**Usage Example**:
```tsx
import { AdminOverviewMap } from '@/components/maps';

<AdminOverviewMap
  hubs={hubsData}
  pickups={pickupsData}
  collectors={collectorsData}
  filters={{
    showHubs: true,
    showPickups: true,
    showCollectors: true,
  }}
/>
```

**Requirements Validated**: 7.1, 7.2, 7.4, 7.5

---

## Common Features

All three components share these characteristics:

1. **Coordinate Format**: All coordinates use `[lng, lat]` format consistently
2. **Error Handling**: Graceful fallbacks when route calculation fails
3. **Loading States**: Display loading indicators during async operations
4. **Responsive Design**: Work on desktop and mobile devices
5. **TypeScript**: Full type safety with exported interfaces
6. **Tailwind CSS**: Styled with utility classes for consistency

## Integration with Core Components

These components build on:
- `GoogleMap` - Core map rendering
- `MapMarker` - Marker display with type-based styling
- `MapRoute` - Polyline rendering for routes
- `RouteCalculator` - Route calculation service
- `MapService` - Distance calculation utilities

## Performance Optimizations

1. **Marker Clustering**: AdminOverviewMap uses clustering for large datasets
2. **Memoization**: React.useMemo prevents unnecessary recalculations
3. **Debouncing**: Location updates are debounced to prevent excessive re-renders
4. **Lazy Loading**: Google Maps API is loaded only when needed

## Testing

All components have been validated for:
- ✅ TypeScript compilation without errors
- ✅ Proper prop types and interfaces
- ✅ Integration with core map components
- ✅ Correct coordinate format handling
- ✅ Error handling and fallback states

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time Updates**: WebSocket integration for live location tracking
2. **Route Optimization**: Multi-stop route planning for collectors
3. **Heatmaps**: Waste density visualization on AdminOverviewMap
4. **Historical Data**: Show past routes and pickup history
5. **Notifications**: Alert citizens when collector is nearby
6. **Offline Support**: Cache map data for offline viewing

## Related Documentation

- [Core Map Components](./README.md)
- [Interaction Features](./INTERACTION_FEATURES.md)
- [Design Document](../../.kiro/specs/google-maps-integration/design.md)
- [Requirements](../../.kiro/specs/google-maps-integration/requirements.md)

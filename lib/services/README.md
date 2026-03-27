# Service Layer Utilities

This directory contains service layer utilities for the Google Maps integration feature.

## MapService

Provides core map-related operations:

### Functions

#### `validateCoordinates(coordinates: [number, number]): boolean`
Validates that coordinates are within valid ranges (lng: -180 to 180, lat: -90 to 90).

**Example:**
```typescript
import { validateCoordinates } from '@/lib/services';

const isValid = validateCoordinates([77.5946, 12.9716]); // true
const isInvalid = validateCoordinates([181, 0]); // false
```

#### `calculateDistance(origin: [number, number], destination: [number, number]): number`
Calculates straight-line distance between two coordinates using the Haversine formula. Returns distance in kilometers with two decimal precision. Accurate within 0.1% of true geodesic distance.

**Example:**
```typescript
import { calculateDistance } from '@/lib/services';

const bangalore: [number, number] = [77.5946, 12.9716];
const mumbai: [number, number] = [72.8777, 19.076];
const distance = calculateDistance(bangalore, mumbai); // 845.32 km
```

#### `latLngToLngLat(latLng: [number, number]): [number, number]`
Converts coordinates from [lat, lng] format to [lng, lat] format.

#### `lngLatToLatLng(lngLat: [number, number]): [number, number]`
Converts coordinates from [lng, lat] format to [lat, lng] format.

#### `formatCoordinates(coordinates: [number, number]): string`
Formats coordinates as a human-readable string (e.g., "12.9716°N, 77.5946°E").

#### `parseCoordinates(coordString: string): [number, number] | null`
Parses a coordinate string into [lng, lat] format. Supports various formats.

## RouteCalculator

Provides route calculation and polyline operations:

### Functions

#### `calculateRoute(request: RouteRequest): Promise<RouteResponse>`
Calculates a route between two coordinates using the API endpoint.

**Example:**
```typescript
import { calculateRoute } from '@/lib/services';

const route = await calculateRoute({
  origin: [77.5946, 12.9716],
  destination: [72.8777, 19.076],
  mode: 'driving'
});

console.log(route.distance); // Distance in km
console.log(route.duration); // Duration in minutes
console.log(route.polyline); // Encoded polyline string
```

#### `decodePolyline(encoded: string): [number, number][]`
Decodes a Google Maps encoded polyline string into an array of coordinates in [lng, lat] format.

**Example:**
```typescript
import { decodePolyline } from '@/lib/services';

const polyline = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const coordinates = decodePolyline(polyline);
// Returns: [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]
```

#### `encodePolyline(coordinates: [number, number][]): string`
Encodes an array of coordinates into a Google Maps polyline string.

**Example:**
```typescript
import { encodePolyline } from '@/lib/services';

const coordinates: [number, number][] = [
  [77.5946, 12.9716],
  [77.6, 13.0],
  [77.65, 13.05]
];
const encoded = encodePolyline(coordinates);
// Returns: 'oodnAgerxMopDw`@owHowH'
```

#### `calculatePolylineLength(polyline: string): number`
Calculates the total length of a polyline path in kilometers.

#### `getPolylineBounds(polyline: string): { minLng, maxLng, minLat, maxLat } | null`
Gets the bounding box for a polyline.

#### `simplifyPolyline(coordinates: [number, number][], tolerance?: number): [number, number][]`
Simplifies a polyline by removing points that are very close together using the Ramer-Douglas-Peucker algorithm.

## Coordinate Format

**IMPORTANT:** All coordinates in this system use the **[lng, lat]** format (longitude first, latitude second).

This matches the GeoJSON standard and MongoDB's geospatial format.

### Examples:
- Bangalore: `[77.5946, 12.9716]` (lng, lat)
- Mumbai: `[72.8777, 19.076]` (lng, lat)

### Conversion:
If you have coordinates in [lat, lng] format (common in some APIs), use the conversion functions:
```typescript
import { latLngToLngLat } from '@/lib/services';

const latLng: [number, number] = [12.9716, 77.5946];
const lngLat = latLngToLngLat(latLng); // [77.5946, 12.9716]
```

## Requirements Mapping

These utilities implement the following requirements from the Google Maps integration spec:

- **Requirement 9.1**: Calculate straight-line distance using Haversine formula
- **Requirement 9.2**: Return distance in kilometers with two decimal precision
- **Requirement 9.4**: Validate coordinates are within valid ranges
- **Requirement 4.1**: Calculate route using Google Maps Directions API
- **Requirement 3.2**: Decode polyline strings

## Testing

Run the validation script to verify all implementations:

```bash
npx tsx lib/services/validate-services.ts
```

## Error Handling

All functions include comprehensive error handling:

- `validateCoordinates`: Returns `false` for invalid input
- `calculateDistance`: Throws error for invalid coordinates
- `calculateRoute`: Throws error for API failures or invalid coordinates
- `decodePolyline`: Returns empty array for invalid input
- `encodePolyline`: Returns empty string for invalid input

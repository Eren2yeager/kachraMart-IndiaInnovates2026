# Map Error Handling Guide

This document describes the comprehensive error handling and fallback strategies implemented for the Google Maps integration.

## Overview

The map components implement multiple layers of error handling to ensure a robust user experience:

1. **Error Boundaries** - Catch React rendering errors
2. **API Error Handling** - Comprehensive error responses from map API routes
3. **Network Retry Logic** - Exponential backoff for transient failures
4. **Offline Support** - Cache last known state and display offline indicators
5. **Fallback UI** - Display coordinates when map fails to load

## Components

### MapErrorBoundary

React error boundary that catches map rendering errors and prevents application crashes.

**Usage:**

```tsx
import { MapErrorBoundary, GoogleMap } from '@/components/maps';

function MyPage() {
  return (
    <MapErrorBoundary 
      fallbackCoordinates={[lng, lat]}
      onError={(error, errorInfo) => {
        // Optional: Log to error tracking service
        console.error('Map error:', error);
      }}
    >
      <GoogleMap center={[lng, lat]} zoom={13} />
    </MapErrorBoundary>
  );
}
```

**Features:**
- Displays fallback UI with coordinates when map fails
- Provides retry button for transient failures
- Shows detailed error information in development mode
- Logs errors to console for debugging

**Validates:** Requirements 15.1, 15.3, 15.5

### NetworkStatusIndicator

Displays an offline indicator when network connectivity is lost.

**Usage:**

```tsx
import { NetworkStatusIndicator } from '@/components/maps';

function Layout({ children }) {
  return (
    <>
      <NetworkStatusIndicator />
      {children}
    </>
  );
}
```

**Features:**
- Automatically detects online/offline status
- Shows warning when offline
- Displays "Back online" message when connection restored
- Auto-hides after 3 seconds when back online

**Validates:** Requirement 15.3

### useNetworkStatus Hook

React hook for checking network status in components.

**Usage:**

```tsx
import { useNetworkStatus } from '@/components/maps';

function MyComponent() {
  const { isOnline, isOffline } = useNetworkStatus();

  if (isOffline) {
    return <div>You are offline. Some features may be unavailable.</div>;
  }

  return <div>Content...</div>;
}
```

## API Error Handling

All map API routes (`/api/maps/*`) implement comprehensive error handling:

### Route Calculation API (`/api/maps/route`)

**Error Scenarios:**
- Invalid coordinates → 400 with descriptive message
- Coordinates out of range → 400 with range information
- Missing API key → 500 with configuration error
- Network error → 502 with retry suggestion
- No route found → 404 with user-friendly message
- Rate limit exceeded → 429 with retry-after suggestion

**Example Error Response:**

```json
{
  "error": "No route found between the specified locations. One or both locations may be inaccessible.",
  "details": "ZERO_RESULTS"
}
```

### Geocoding API (`/api/maps/geocode`)

**Error Scenarios:**
- Empty address → 400 with validation message
- Address not found → 404 with suggestion to try different search
- Invalid format → 400 with format guidance
- API quota exceeded → 429 with retry suggestion
- Configuration error → 500 with developer message

### Reverse Geocoding API (`/api/maps/reverse-geocode`)

**Error Scenarios:**
- Invalid coordinates → 400 with format specification
- Coordinates out of range → 400 with valid ranges
- No address found → Returns coordinates as fallback (200)
- Network error → Returns coordinates as fallback (200)
- API error → Returns coordinates as fallback (200)

**Fallback Strategy:**
When reverse geocoding fails, the API returns coordinates in a readable format instead of an error:

```json
{
  "status": "success",
  "result": {
    "formattedAddress": "37.774929, -122.419418",
    "addressComponents": {}
  },
  "message": "No address found for these coordinates"
}
```

**Validates:** Requirements 15.2, 15.4

## Network Retry Utilities

### retryWithBackoff

Utility function for retrying operations with exponential backoff.

**Usage:**

```typescript
import { retryWithBackoff } from '@/lib/utils/networkRetry';

const data = await retryWithBackoff(
  async () => {
    const response = await fetch('/api/maps/route', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    });
    return response.json();
  },
  {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
  }
);
```

**Features:**
- Exponential backoff (1s, 2s, 4s, 8s, ...)
- Configurable max retries and delays
- Custom retry conditions
- Retry callbacks for logging

### fetchWithRetry

Convenience wrapper for fetch with automatic retry.

**Usage:**

```typescript
import { fetchWithRetry } from '@/lib/utils/networkRetry';

const response = await fetchWithRetry('/api/maps/geocode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '123 Main St' }),
});

const data = await response.json();
```

**Validates:** Requirement 15.3

## Caching Utilities

### useMapCache Hook

React hook for caching map data in localStorage.

**Usage:**

```typescript
import { useMapCache } from '@/lib/hooks/useMapCache';

function MyMapComponent() {
  const { cachedData, isCached, saveToCache, clearCache } = useMapCache({
    cacheKey: 'my_map_data',
    ttl: 3600000, // 1 hour
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchMapData();
        saveToCache(data);
      } catch (error) {
        // Use cached data if available
        if (cachedData) {
          console.log('Using cached data due to error');
        }
      }
    }
    loadData();
  }, []);

  return <div>{/* Render with data or cachedData */}</div>;
}
```

**Specialized Hooks:**
- `useMarkerCache(mapId)` - Cache markers (30 min TTL)
- `useRouteCache(routeId)` - Cache routes (1 hour TTL)
- `useLocationCache(locationId)` - Cache locations (10 min TTL)

**Validates:** Requirement 15.3

## Error Logging

All errors are logged to the console with structured information:

```typescript
console.error('Route calculation error:', {
  message: error.message,
  stack: error.stack,
  name: error.name,
  context: { origin, destination, mode }
});
```

**In Production:**
- Error details are hidden from users
- Full error information logged to console
- Consider integrating with error tracking service (Sentry, etc.)

**In Development:**
- Detailed error messages shown to developers
- Stack traces visible in error boundaries
- Additional debugging information included

**Validates:** Requirement 15.4

## Best Practices

### 1. Always Wrap Maps in Error Boundaries

```tsx
// ✅ Good
<MapErrorBoundary fallbackCoordinates={coords}>
  <GoogleMap center={coords} />
</MapErrorBoundary>

// ❌ Bad
<GoogleMap center={coords} />
```

### 2. Handle API Errors Gracefully

```tsx
// ✅ Good
try {
  const route = await calculateRoute(origin, destination);
  setRoute(route);
} catch (error) {
  console.error('Route calculation failed:', error);
  setError('Unable to calculate route. Please try again.');
  // Use cached route if available
  if (cachedRoute) {
    setRoute(cachedRoute);
  }
}

// ❌ Bad
const route = await calculateRoute(origin, destination);
setRoute(route); // Crashes if API fails
```

### 3. Provide Fallback UI

```tsx
// ✅ Good
if (loadError) {
  return (
    <div>
      <p>Unable to load map</p>
      <p>Location: {lat}, {lng}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
}

// ❌ Bad
if (loadError) {
  return null; // User sees nothing
}
```

### 4. Cache Important Data

```tsx
// ✅ Good
const { saveToCache, cachedData } = useRouteCache(routeId);

useEffect(() => {
  async function loadRoute() {
    try {
      const route = await fetchRoute();
      saveToCache(route); // Cache for offline use
      setRoute(route);
    } catch (error) {
      if (cachedData) {
        setRoute(cachedData); // Use cache as fallback
      }
    }
  }
  loadRoute();
}, []);
```

### 5. Use Retry Logic for Transient Failures

```tsx
// ✅ Good
const data = await retryWithBackoff(
  () => fetchMapData(),
  { maxRetries: 3 }
);

// ❌ Bad
const data = await fetchMapData(); // Fails on transient network issues
```

## Testing Error Scenarios

### Simulate Network Errors

```typescript
// In browser DevTools:
// 1. Open Network tab
// 2. Select "Offline" from throttling dropdown
// 3. Verify offline indicator appears
// 4. Verify cached data is used
```

### Simulate API Errors

```typescript
// Temporarily modify API route to return error:
return NextResponse.json(
  { error: 'Test error' },
  { status: 500 }
);
```

### Test Error Boundary

```typescript
// Throw error in component to trigger boundary:
if (testError) {
  throw new Error('Test error boundary');
}
```

## Requirements Validation

This error handling implementation validates the following requirements:

- **15.1**: Display fallback message with coordinates when Google Maps API fails to load ✅
- **15.2**: Display descriptive error messages for API failures and invalid API keys ✅
- **15.3**: Display retry button for network connectivity issues ✅
- **15.4**: Log errors to console for debugging ✅
- **15.5**: Map component shall not crash the application when errors occur ✅

## Future Enhancements

Consider these improvements for production:

1. **Error Tracking Integration**: Send errors to Sentry or similar service
2. **User Feedback**: Allow users to report map issues
3. **Automatic Retry**: Retry failed requests when connection restored
4. **Progressive Enhancement**: Degrade gracefully to static maps
5. **Analytics**: Track error rates and types for monitoring

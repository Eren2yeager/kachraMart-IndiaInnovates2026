# Map Interaction Features

This document describes the interactive features added to the Google Maps integration in Task 6.

## Features Implemented

### 1. Geolocation Support (Sub-task 6.1)

The `GoogleMap` component now supports browser geolocation to show the user's current location.

**Props:**
- `showUserLocation?: boolean` - Enable geolocation tracking
- `showGeolocationButton?: boolean` - Show button to center on user location
- `onUserLocationChange?: (coordinates: [number, number]) => void` - Callback when user location updates

**Features:**
- Requests browser geolocation permission
- Displays user location marker with distinct blue styling
- Continuously watches position for real-time updates
- Handles permission denial gracefully with error messages
- Provides button to center map on user location

**Usage:**
```tsx
<GoogleMap
  center={[-122.4194, 37.7749]}
  zoom={13}
  showUserLocation={true}
  showGeolocationButton={true}
  onUserLocationChange={(coords) => console.log('User at:', coords)}
/>
```

**Error Handling:**
- Permission denied: Shows message to enable location in browser settings
- Position unavailable: Shows error message
- Timeout: Shows timeout error message
- Displays error banner at top of map with dismiss button

### 2. Map Controls and Interaction (Sub-task 6.3)

Enhanced map controls for better user interaction.

**Props:**
- `interactive?: boolean` - Enable/disable all map interactions (default: true)
- `showResetButton?: boolean` - Show button to reset to initial view

**Features:**
- Pan and zoom controls (native Google Maps controls)
- Reset view button to return to initial center and zoom
- Touch gesture support for mobile (pinch to zoom, drag to pan)
- Interactive mode toggle - when `interactive={false}`:
  - Disables dragging
  - Disables zoom controls
  - Disables scroll wheel zoom
  - Disables double-click zoom
  - Sets gesture handling to 'none'

**Usage:**
```tsx
{/* Interactive map with reset button */}
<GoogleMap
  center={[-122.4194, 37.7749]}
  zoom={13}
  interactive={true}
  showResetButton={true}
/>

{/* Static, non-interactive map */}
<GoogleMap
  center={[-122.4194, 37.7749]}
  zoom={13}
  interactive={false}
/>
```

### 3. LocationPicker Component (Sub-task 6.5)

A new component for selecting locations on the map with address search and reverse geocoding.

**Props:**
```typescript
interface LocationPickerProps {
  initialLocation?: [number, number]; // [lng, lat]
  onLocationSelect: (coordinates: [number, number], address: string) => void;
  searchEnabled?: boolean;
  className?: string;
  zoom?: number;
}
```

**Features:**
- Click-to-place marker functionality
- Draggable marker for position adjustment (via map click)
- Reverse geocoding to show address for selected location
- Address search box with forward geocoding
- Displays selected coordinates and address
- Confirm button to finalize selection
- Integrates geolocation button to find user's location
- Reset button to return to initial view

**Usage:**
```tsx
<LocationPicker
  initialLocation={[-122.4194, 37.7749]}
  onLocationSelect={(coords, address) => {
    console.log('Selected:', coords, address);
    // Save to form or state
  }}
  searchEnabled={true}
  className="w-full h-[500px]"
/>
```

**User Flow:**
1. User sees map with optional initial location marker
2. User can:
   - Click on map to place/move marker
   - Search for address in search box
   - Use geolocation button to find their location
3. Address is automatically fetched via reverse geocoding
4. User clicks "Confirm Location" to finalize selection
5. `onLocationSelect` callback is triggered with coordinates and address

**API Dependencies:**
- `/api/maps/geocode` - Forward geocoding (address → coordinates)
- `/api/maps/reverse-geocode` - Reverse geocoding (coordinates → address)

## Testing

A test page has been created at `/test-maps` to verify all features:

1. **GoogleMap with Geolocation**: Tests user location tracking and centering
2. **LocationPicker**: Tests location selection and address search
3. **Non-Interactive Map**: Tests static map display

To test:
1. Navigate to `/test-maps` in the application
2. Grant location permissions when prompted
3. Test clicking on maps, searching addresses, and using control buttons

## Requirements Validated

### Sub-task 6.1 (Geolocation Support)
- ✅ Requirement 8.1: Display user's current location when permission granted
- ✅ Requirement 8.2: Request geolocation permission from browser
- ✅ Requirement 8.3: Display message when permission denied
- ✅ Requirement 8.4: Provide button to center on user location
- ✅ Requirement 8.5: Update user location marker when position changes

### Sub-task 6.3 (Map Controls)
- ✅ Requirement 10.1: Support pan (drag) interaction
- ✅ Requirement 10.2: Support zoom controls
- ✅ Requirement 10.3: Support touch gestures for mobile
- ✅ Requirement 10.4: Provide reset view button
- ✅ Requirement 10.5: Disable interactions when specified

### Sub-task 6.5 (LocationPicker)
- ✅ Requirement 11.1: Allow clicking to place marker
- ✅ Requirement 11.2: Emit coordinates in [lng, lat] format
- ✅ Requirement 11.3: Display address using reverse geocoding
- ✅ Requirement 11.4: Allow moving marker by clicking new position
- ✅ Requirement 11.5: Provide search box to find locations by address

## Notes

- All coordinates are in `[lng, lat]` format to match existing data models
- Geolocation uses browser's native API with high accuracy enabled
- Error handling is comprehensive with user-friendly messages
- Components are fully typed with TypeScript
- Mobile touch gestures are handled by Google Maps API automatically

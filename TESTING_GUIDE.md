# Google Maps Integration - Testing Guide

This guide will help you test all the Google Maps features that have been integrated into the application.

## Prerequisites

1. **Environment Setup**: Ensure `GOOGLE_MAP_API_KEY` is set in `.env.local`
   ```bash
   # Check if the key exists
   cat .env.local | grep GOOGLE_MAP_API_KEY
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Login**: You'll need to be authenticated to access the map features

## Testing Scenarios

### 1. Test Page - Quick Component Testing

**URL**: `http://localhost:3000/test-maps`

This page tests the core map components in isolation.

**What to Test**:
- ✓ Map loads without errors
- ✓ Markers appear at correct locations (pickup in red, hub in blue)
- ✓ Click markers to see info windows
- ✓ Geolocation button requests your location
- ✓ Reset button returns to initial view
- ✓ LocationPicker allows clicking to select a location
- ✓ Search box finds addresses
- ✓ Non-interactive map doesn't respond to pan/zoom

**Expected Behavior**:
- Map should load within 2-3 seconds
- Markers should be visually distinct by type
- Info windows should show marker details
- Geolocation should show your current position (if permission granted)

---

### 2. Collector Navigation - Route Display

**URL**: `http://localhost:3000/collector/pickups`

**Prerequisites**: 
- Login as a collector user
- Have assigned pickups

**What to Test**:
- ✓ Map shows route from collector location to pickup
- ✓ Distance and duration are displayed
- ✓ "Start Navigation" button opens Google Maps
- ✓ Route polyline is visible on the map
- ✓ Map auto-fits to show entire route

**Expected Behavior**:
- Route should be drawn as a blue line
- Distance should be in kilometers
- Duration should be in minutes
- Clicking "Start Navigation" opens Google Maps app/website

**Test Data**: If you don't have real data, you can create a test pickup:
```bash
# Use the citizen classify page to create a pickup
# Then assign it to a collector via admin panel
```

---

### 3. Citizen Tracking - Real-Time Location

**URL**: `http://localhost:3000/citizen/pickups`

**Prerequisites**:
- Login as a citizen user
- Have a pickup with assigned collector

**What to Test**:
- ✓ Map shows your pickup location
- ✓ Collector's current location is visible (green marker)
- ✓ Route from collector to pickup is displayed
- ✓ Estimated arrival time is shown
- ✓ Map centers on collector location

**Expected Behavior**:
- Pickup location: red marker
- Collector location: green marker
- Route: blue polyline
- Map should auto-center on collector

**Simulating Real-Time Updates**:
The collector location updates when the collector moves. To test:
1. Open collector pickups page in another browser/incognito
2. Accept a pickup
3. Watch the citizen tracking page update

---

### 4. Admin Overview - Multiple Locations

**URL**: `http://localhost:3000/admin/analytics`

**Prerequisites**:
- Login as an admin user
- Have multiple hubs, pickups, and collectors in the system

**What to Test**:
- ✓ All hubs appear as blue markers
- ✓ All pickups appear as red markers
- ✓ All collectors appear as green markers
- ✓ Markers cluster when zoomed out
- ✓ Clicking cluster zooms in
- ✓ Filter controls show/hide marker types
- ✓ Info windows show details on click

**Expected Behavior**:
- Map should fit bounds to show all markers initially
- Clustering should activate with 10+ nearby markers
- Filters should toggle marker visibility
- Performance should be smooth with 100+ markers

---

### 5. Location Picker - Waste Listing Creation

**URL**: `http://localhost:3000/citizen/classify`

**Prerequisites**:
- Login as a citizen user

**What to Test**:
- ✓ Map appears in the waste listing form
- ✓ Click map to select pickup location
- ✓ Marker appears at clicked location
- ✓ Address is displayed via reverse geocoding
- ✓ Drag marker to adjust location
- ✓ Search box finds addresses
- ✓ Selected location is saved with waste listing

**Expected Behavior**:
- Clicking map places a purple marker
- Address appears below the map
- Dragging marker updates the address
- Search box autocompletes addresses
- Form submission includes coordinates

**Test Flow**:
1. Fill out waste classification form
2. Click on map to select pickup location
3. Verify address appears
4. Submit form
5. Check that pickup appears on collector/admin maps

---

## API Endpoint Testing

You can test the API endpoints directly using curl or a tool like Postman.

### Route Calculation

```bash
curl -X POST http://localhost:3000/api/maps/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": [-122.4194, 37.7749],
    "destination": [-122.4094, 37.7849]
  }'
```

**Expected Response**:
```json
{
  "distance": 1.23,
  "duration": 5,
  "polyline": "encoded_polyline_string"
}
```

### Geocoding (Address to Coordinates)

```bash
curl -X POST http://localhost:3000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "address": "1600 Amphitheatre Parkway, Mountain View, CA"
  }'
```

**Expected Response**:
```json
{
  "coordinates": [-122.0842, 37.4220],
  "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
  "placeId": "ChIJ..."
}
```

### Reverse Geocoding (Coordinates to Address)

```bash
curl -X POST http://localhost:3000/api/maps/reverse-geocode \
  -H "Content-Type: application/json" \
  -d '{
    "coordinates": [-122.4194, 37.7749]
  }'
```

**Expected Response**:
```json
{
  "formattedAddress": "San Francisco, CA, USA",
  "addressComponents": {
    "city": "San Francisco",
    "state": "California",
    "country": "United States"
  }
}
```

---

## Error Handling Testing

### Test Invalid API Key

1. Temporarily change `GOOGLE_MAP_API_KEY` in `.env.local` to an invalid value
2. Restart dev server
3. Visit any map page
4. **Expected**: Error message displayed, fallback UI with coordinates

### Test Network Failure

1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try to load a map
4. **Expected**: "Connection lost" message, retry button appears

### Test Invalid Coordinates

```bash
curl -X POST http://localhost:3000/api/maps/route \
  -H "Content-Type: application/json" \
  -d '{
    "origin": [999, 999],
    "destination": [-122.4094, 37.7849]
  }'
```

**Expected**: Error response with validation message

### Test Geolocation Denial

1. Visit test-maps page
2. Click geolocation button
3. Deny permission in browser prompt
4. **Expected**: Message explaining limitation, no crash

---

## Performance Testing

### Test Marker Clustering

1. Go to admin analytics page
2. Ensure you have 50+ markers
3. Zoom out to see clustering
4. **Expected**: Markers cluster into numbered groups
5. Click cluster to zoom in
6. **Expected**: Smooth zoom, individual markers appear

### Test Large Marker Arrays

1. Create 100+ waste listings (or use seed data)
2. Visit admin analytics page
3. **Expected**: 
   - Page loads within 3 seconds
   - Smooth pan/zoom interactions
   - No browser lag

### Test Debouncing

1. Open collector pickups page
2. Rapidly pan the map
3. **Expected**: Smooth performance, no excessive re-renders

---

## Mobile Testing

### Responsive Design

1. Open any map page on mobile device or use DevTools device emulation
2. **Test**:
   - ✓ Map fills screen width
   - ✓ Touch gestures work (pinch to zoom, drag to pan)
   - ✓ Buttons are touch-friendly
   - ✓ Info windows are readable

### Mobile Navigation

1. Open collector pickups page on mobile
2. Click "Start Navigation"
3. **Expected**: Google Maps app opens (if installed) or browser version

---

## Browser Compatibility

Test on multiple browsers:
- ✓ Chrome/Edge (Chromium)
- ✓ Firefox
- ✓ Safari (if on Mac)

**What to Check**:
- Map loads correctly
- Markers render properly
- Controls work
- No console errors

---

## Common Issues & Solutions

### Issue: Map doesn't load

**Solution**:
1. Check `.env.local` has `GOOGLE_MAP_API_KEY`
2. Verify API key is valid in Google Cloud Console
3. Check browser console for errors
4. Ensure Google Maps JavaScript API is enabled

### Issue: Markers don't appear

**Solution**:
1. Check coordinates are in [lng, lat] format
2. Verify coordinates are within valid ranges
3. Check browser console for errors
4. Ensure markers array is not empty

### Issue: Route calculation fails

**Solution**:
1. Verify both origin and destination are valid
2. Check Google Maps Directions API is enabled
3. Ensure API key has proper permissions
4. Check network tab for API errors

### Issue: Geolocation doesn't work

**Solution**:
1. Ensure HTTPS (or localhost)
2. Check browser permissions
3. Try different browser
4. Check browser console for errors

---

## Next Steps

After manual testing, you can:

1. **Add Property-Based Tests**: Implement the optional test tasks in `tasks.md`
2. **Add E2E Tests**: Use Playwright or Cypress for automated testing
3. **Monitor in Production**: Set up error tracking (Sentry, etc.)
4. **Performance Monitoring**: Track map load times and API response times

---

## Quick Test Checklist

Use this checklist for a quick smoke test:

- [ ] Test page loads without errors
- [ ] Markers appear and are clickable
- [ ] Route calculation works
- [ ] Geocoding works (address search)
- [ ] Reverse geocoding works (click to get address)
- [ ] Geolocation works (if permission granted)
- [ ] Collector navigation shows route
- [ ] Citizen tracking shows collector location
- [ ] Admin overview shows all markers
- [ ] Location picker works in classify page
- [ ] Mobile responsive design works
- [ ] Error handling displays appropriate messages

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for failed API calls
3. Verify environment variables
4. Review the design document: `.kiro/specs/google-maps-integration/design.md`
5. Check requirements: `.kiro/specs/google-maps-integration/requirements.md`

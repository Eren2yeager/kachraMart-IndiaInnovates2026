import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface RouteRequest {
  origin: [number, number]; // [lng, lat]
  destination: [number, number]; // [lng, lat]
  mode?: 'driving' | 'walking' | 'bicycling';
}

interface RouteResponse {
  distance: number; // kilometers
  duration: number; // minutes
  polyline: string; // Encoded polyline
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Validates: Requirement 15.2 (Return descriptive error messages)
      console.error('Unauthorized route calculation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: RouteRequest = await req.json();
    const { origin, destination, mode = 'driving' } = body;

    // Validate coordinates
    // Validates: Requirement 15.2 (Return descriptive error messages)
    if (!origin || !Array.isArray(origin) || origin.length !== 2) {
      console.error('Invalid origin coordinates provided:', origin);
      return NextResponse.json({ 
        error: 'Invalid origin coordinates. Expected format: [longitude, latitude]' 
      }, { status: 400 });
    }
    if (!destination || !Array.isArray(destination) || destination.length !== 2) {
      console.error('Invalid destination coordinates provided:', destination);
      return NextResponse.json({ 
        error: 'Invalid destination coordinates. Expected format: [longitude, latitude]' 
      }, { status: 400 });
    }

    const [originLng, originLat] = origin;
    const [destLng, destLat] = destination;

    // Validate coordinate ranges
    if (originLng < -180 || originLng > 180 || originLat < -90 || originLat > 90) {
      console.error('Origin coordinates out of valid range:', { originLng, originLat });
      return NextResponse.json({ 
        error: 'Origin coordinates out of valid range. Longitude must be between -180 and 180, latitude between -90 and 90.' 
      }, { status: 400 });
    }
    if (destLng < -180 || destLng > 180 || destLat < -90 || destLat > 90) {
      console.error('Destination coordinates out of valid range:', { destLng, destLat });
      return NextResponse.json({ 
        error: 'Destination coordinates out of valid range. Longitude must be between -180 and 180, latitude between -90 and 90.' 
      }, { status: 400 });
    }

    // Call Google Maps Directions API
    const apiKey = process.env.GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      // Validates: Requirement 15.2 (Display error message to developer for invalid API key)
      // Validates: Requirement 15.4 (Log errors to console for debugging)
      console.error('GOOGLE_MAP_API_KEY is not configured in environment variables');
      return NextResponse.json({ 
        error: 'Map service not configured. Please check GOOGLE_MAP_API_KEY environment variable.' 
      }, { status: 500 });
    }

    const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
    directionsUrl.searchParams.append('origin', `${originLat},${originLng}`);
    directionsUrl.searchParams.append('destination', `${destLat},${destLng}`);
    directionsUrl.searchParams.append('mode', mode);
    directionsUrl.searchParams.append('key', apiKey);

    const response = await fetch(directionsUrl.toString());
    
    // Handle network errors
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (!response.ok) {
      console.error('Google Maps API HTTP error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Network error: Unable to reach Google Maps service (HTTP ${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Handle Google Maps API specific errors with descriptive messages
    // Validates: Requirement 15.2 (Return descriptive error messages)
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (data.status !== 'OK') {
      console.error('Google Directions API error:', {
        status: data.status,
        errorMessage: data.error_message,
        origin,
        destination,
        mode
      });

      // Provide user-friendly error messages based on API status
      let errorMessage = 'Route calculation failed';
      switch (data.status) {
        case 'NOT_FOUND':
          errorMessage = 'No route found between the specified locations. One or both locations may be inaccessible.';
          break;
        case 'ZERO_RESULTS':
          errorMessage = 'No route found between the specified locations.';
          break;
        case 'MAX_ROUTE_LENGTH_EXCEEDED':
          errorMessage = 'The requested route is too long. Please select closer locations.';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid route request. Please check the coordinates and try again.';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'Service temporarily unavailable due to high demand. Please try again in a moment.';
          break;
        case 'REQUEST_DENIED':
          errorMessage = 'Map service configuration error. Please contact support.';
          break;
        case 'UNKNOWN_ERROR':
          errorMessage = 'Temporary server error. Please try again.';
          break;
        default:
          errorMessage = `Route calculation failed: ${data.status}`;
      }

      return NextResponse.json(
        { error: errorMessage, details: data.error_message },
        { status: data.status === 'OVER_QUERY_LIMIT' ? 429 : 400 }
      );
    }

    if (!data.routes || data.routes.length === 0) {
      console.error('No routes returned from Google Maps API');
      return NextResponse.json({ 
        error: 'No route found between the specified locations.' 
      }, { status: 404 });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    // Validate response data
    if (!leg || !leg.distance || !leg.duration || !route.overview_polyline) {
      console.error('Incomplete route data from Google Maps API:', route);
      return NextResponse.json({ 
        error: 'Incomplete route data received. Please try again.' 
      }, { status: 500 });
    }

    // Extract distance in kilometers
    const distanceMeters = leg.distance.value;
    const distance = Math.round((distanceMeters / 1000) * 100) / 100;

    // Extract duration in minutes
    const durationSeconds = leg.duration.value;
    const duration = Math.round(durationSeconds / 60);

    // Extract encoded polyline
    const polyline = route.overview_polyline.points;

    const result: RouteResponse = {
      distance,
      duration,
      polyline,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    console.error('Route calculation error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Validates: Requirement 15.2 (Return descriptive error messages)
    return NextResponse.json({ 
      error: 'An unexpected error occurred while calculating the route. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

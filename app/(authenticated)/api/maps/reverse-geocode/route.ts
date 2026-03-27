import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/maps/reverse-geocode
 * 
 * Converts geographic coordinates to a human-readable address using Google Maps Geocoding API.
 * Implements caching mechanism to minimize API calls for repeated requests.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.5
 */

interface ReverseGeocodeRequestBody {
  coordinates: [number, number]; // [lng, lat]
}

interface ReverseGeocodeResult {
  formattedAddress: string;
  addressComponents: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

interface ReverseGeocodeResponse {
  result?: ReverseGeocodeResult;
  status: 'success' | 'error';
  message?: string;
  cached?: boolean;
}

// In-memory cache for reverse geocoding results
// Key: "lng,lat" (rounded to 6 decimal places for ~0.1m precision)
// Value: { result, timestamp }
const geocodeCache = new Map<string, { result: ReverseGeocodeResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Generate cache key from coordinates (rounded to 6 decimal places)
 */
function getCacheKey(coordinates: [number, number]): string {
  const [lng, lat] = coordinates;
  const roundedLng = Math.round(lng * 1000000) / 1000000;
  const roundedLat = Math.round(lat * 1000000) / 1000000;
  return `${roundedLng},${roundedLat}`;
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(coordinates: [number, number]): ReverseGeocodeResult | null {
  const key = getCacheKey(coordinates);
  const cached = geocodeCache.get(key);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache entry is expired
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    geocodeCache.delete(key);
    return null;
  }
  
  return cached.result;
}

/**
 * Store result in cache
 */
function setCachedResult(coordinates: [number, number], result: ReverseGeocodeResult): void {
  const key = getCacheKey(coordinates);
  geocodeCache.set(key, {
    result,
    timestamp: Date.now(),
  });
}

/**
 * Validate coordinate ranges
 */
function validateCoordinates(coordinates: [number, number]): boolean {
  const [lng, lat] = coordinates;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: ReverseGeocodeRequestBody = await request.json();
    const { coordinates } = body;

    // Validate input
    // Validates: Requirement 15.2 (Return descriptive error messages)
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      console.error('Invalid coordinates input:', coordinates);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Coordinates are required and must be in [lng, lat] format',
        } as ReverseGeocodeResponse,
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (!validateCoordinates(coordinates)) {
      console.error('Coordinates out of valid range:', coordinates);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90',
        } as ReverseGeocodeResponse,
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResult = getCachedResult(coordinates);
    if (cachedResult) {
      return NextResponse.json(
        {
          status: 'success',
          result: cachedResult,
          cached: true,
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_MAP_API_KEY;
    if (!apiKey) {
      // Validates: Requirement 15.2 (Display error message to developer for invalid API key)
      // Validates: Requirement 15.4 (Log errors to console for debugging)
      console.error('GOOGLE_MAP_API_KEY is not configured in environment variables');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Map service is not configured. Please check GOOGLE_MAP_API_KEY environment variable.',
        } as ReverseGeocodeResponse,
        { status: 500 }
      );
    }

    // Call Google Maps Geocoding API with latlng parameter
    const [lng, lat] = coordinates;
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.append('latlng', `${lat},${lng}`);
    geocodeUrl.searchParams.append('key', apiKey);

    const response = await fetch(geocodeUrl.toString());
    
    // Handle network errors
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (!response.ok) {
      console.error('Google Maps API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        coordinates
      });
      
      // Fallback to displaying coordinates
      // Validates: Requirement 13.4 (Return coordinates as fallback if reverse geocoding fails)
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: `Network error: Unable to reach geocoding service (HTTP ${response.status}). Showing coordinates.`,
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    const data = await response.json();

    // Handle Google Maps API errors with descriptive messages
    // Validates: Requirement 15.2 (Return descriptive error messages)
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (data.status === 'ZERO_RESULTS') {
      console.warn('No address found for coordinates:', coordinates);
      // Fallback to displaying coordinates
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: 'No address found for these coordinates',
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error('Invalid reverse geocoding request:', { coordinates, error: data.error_message });
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid coordinate format. Please check your input and try again.',
        } as ReverseGeocodeResponse,
        { status: 400 }
      );
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      // Fallback to displaying coordinates
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: 'Service temporarily unavailable. Showing coordinates.',
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API request denied:', data.error_message);
      // Fallback to displaying coordinates
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: 'Map service configuration error. Showing coordinates.',
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    if (data.status !== 'OK') {
      console.error('Google Maps Geocoding API error:', {
        status: data.status,
        errorMessage: data.error_message,
        coordinates
      });
      
      // Fallback to displaying coordinates
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: 'Failed to reverse geocode, showing coordinates',
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    // Validate response data
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      console.error('Invalid or empty response from Google Maps API');
      // Fallback to displaying coordinates
      const fallbackResult: ReverseGeocodeResult = {
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        addressComponents: {},
      };
      
      return NextResponse.json(
        {
          status: 'success',
          result: fallbackResult,
          message: 'No address data available. Showing coordinates.',
        } as ReverseGeocodeResponse,
        { status: 200 }
      );
    }

    // Extract the first (most specific) result
    const firstResult = data.results[0];
    
    // Parse address components
    const addressComponents: ReverseGeocodeResult['addressComponents'] = {};
    
    firstResult.address_components?.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number') || types.includes('route')) {
        addressComponents.street = addressComponents.street 
          ? `${component.long_name} ${addressComponents.street}`
          : component.long_name;
      }
      
      if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        addressComponents.city = component.long_name;
      }
      
      if (types.includes('administrative_area_level_1')) {
        addressComponents.state = component.long_name;
      }
      
      if (types.includes('country')) {
        addressComponents.country = component.long_name;
      }
      
      if (types.includes('postal_code')) {
        addressComponents.postalCode = component.long_name;
      }
    });

    const result: ReverseGeocodeResult = {
      formattedAddress: firstResult.formatted_address,
      addressComponents,
    };

    // Cache the result
    setCachedResult(coordinates, result);

    return NextResponse.json(
      {
        status: 'success',
        result,
        cached: false,
      } as ReverseGeocodeResponse,
      { status: 200 }
    );

  } catch (error) {
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    console.error('Reverse geocoding error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    // Validates: Requirement 15.2 (Return descriptive error messages)
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred while reverse geocoding. Please try again.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      } as ReverseGeocodeResponse,
      { status: 500 }
    );
  }
}

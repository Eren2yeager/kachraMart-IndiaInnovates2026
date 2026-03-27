import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/maps/geocode
 * 
 * Converts an address string to geographic coordinates using Google Maps Geocoding API.
 * Supports partial address matching and returns multiple suggestions.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.5
 */

interface GeocodeRequestBody {
  address: string;
}

interface GeocodeResult {
  coordinates: [number, number]; // [lng, lat]
  formattedAddress: string;
  placeId: string;
}

interface GeocodeResponse {
  results: GeocodeResult[];
  status: 'success' | 'error';
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequestBody = await request.json();
    const { address } = body;

    // Validate input
    // Validates: Requirement 15.2 (Return descriptive error messages)
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      console.error('Invalid address input:', address);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Address is required and must be a non-empty string',
          results: [],
        } as GeocodeResponse,
        { status: 400 }
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
          results: [],
        } as GeocodeResponse,
        { status: 500 }
      );
    }

    // Call Google Maps Geocoding API
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.append('address', address.trim());
    geocodeUrl.searchParams.append('key', apiKey);

    const response = await fetch(geocodeUrl.toString());
    
    // Handle network errors
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (!response.ok) {
      console.error('Google Maps API HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        address: address.trim()
      });
      return NextResponse.json(
        {
          status: 'error',
          message: `Network error: Unable to reach Google Maps service (HTTP ${response.status})`,
          results: [],
        } as GeocodeResponse,
        { status: 502 }
      );
    }

    const data = await response.json();

    // Handle Google Maps API errors with descriptive messages
    // Validates: Requirement 15.2 (Return descriptive error messages)
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    if (data.status === 'ZERO_RESULTS') {
      console.warn('Address not found:', address.trim());
      return NextResponse.json(
        {
          status: 'error',
          message: 'Address not found. Please try a different search or be more specific.',
          results: [],
        } as GeocodeResponse,
        { status: 404 }
      );
    }

    if (data.status === 'INVALID_REQUEST') {
      console.error('Invalid geocoding request:', { address: address.trim(), error: data.error_message });
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid address format. Please check your input and try again.',
          results: [],
        } as GeocodeResponse,
        { status: 400 }
      );
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Maps API quota exceeded');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Service temporarily unavailable due to high demand. Please try again in a moment.',
          results: [],
        } as GeocodeResponse,
        { status: 429 }
      );
    }

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Maps API request denied:', data.error_message);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Map service configuration error. Please contact support.',
          results: [],
        } as GeocodeResponse,
        { status: 500 }
      );
    }

    if (data.status !== 'OK') {
      console.error('Google Maps Geocoding API error:', {
        status: data.status,
        errorMessage: data.error_message,
        address: address.trim()
      });
      return NextResponse.json(
        {
          status: 'error',
          message: `Failed to geocode address: ${data.status}`,
          results: [],
        } as GeocodeResponse,
        { status: 500 }
      );
    }

    // Validate response data
    if (!data.results || !Array.isArray(data.results)) {
      console.error('Invalid response structure from Google Maps API');
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid response from geocoding service. Please try again.',
          results: [],
        } as GeocodeResponse,
        { status: 500 }
      );
    }

    // Transform results to our format [lng, lat]
    const results: GeocodeResult[] = data.results.map((result: any) => ({
      coordinates: [
        result.geometry.location.lng,
        result.geometry.location.lat,
      ] as [number, number],
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
    }));

    return NextResponse.json(
      {
        status: 'success',
        results,
      } as GeocodeResponse,
      { status: 200 }
    );

  } catch (error) {
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    console.error('Geocoding error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    // Validates: Requirement 15.2 (Return descriptive error messages)
    return NextResponse.json(
      {
        status: 'error',
        message: 'An unexpected error occurred while geocoding the address. Please try again.',
        results: [],
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      } as GeocodeResponse,
      { status: 500 }
    );
  }
}

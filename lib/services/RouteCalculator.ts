/**
 * RouteCalculator - Utility functions for route calculation and polyline operations
 * 
 * This service provides:
 * - Client-side route calculation wrapper
 * - Polyline encoding/decoding utilities
 * - Route data processing
 */

import { validateCoordinates } from './MapService';

/**
 * Route calculation request parameters
 */
export interface RouteRequest {
  origin: [number, number]; // [lng, lat]
  destination: [number, number]; // [lng, lat]
  mode?: 'driving' | 'walking' | 'bicycling';
}

/**
 * Route calculation response
 */
export interface RouteResponse {
  distance: number; // kilometers
  duration: number; // minutes
  polyline: string; // Encoded polyline
}

/**
 * Calculates a route between two coordinates using the API endpoint
 * 
 * @param request - Route calculation parameters
 * @returns Route response with distance, duration, and polyline
 * @throws Error if route calculation fails
 */
export async function calculateRoute(request: RouteRequest): Promise<RouteResponse> {
  const { origin, destination, mode = 'driving' } = request;

  // Validate coordinates
  if (!validateCoordinates(origin)) {
    throw new Error('Invalid origin coordinates');
  }

  if (!validateCoordinates(destination)) {
    throw new Error('Invalid destination coordinates');
  }

  // Call the API endpoint
  const response = await fetch('/api/maps/route', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin, destination, mode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to calculate route');
  }

  const data: RouteResponse = await response.json();
  return data;
}

/**
 * Decodes a Google Maps encoded polyline string into an array of coordinates
 * 
 * The polyline encoding algorithm is documented at:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 * 
 * @param encoded - Encoded polyline string
 * @returns Array of coordinates in [lng, lat] format
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }

  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    // Decode latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    // Decode longitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    // Convert to degrees and store in [lng, lat] format
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Encodes an array of coordinates into a Google Maps polyline string
 * 
 * @param coordinates - Array of coordinates in [lng, lat] format
 * @returns Encoded polyline string
 */
export function encodePolyline(coordinates: [number, number][]): string {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return '';
  }

  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const [lng, lat] of coordinates) {
    // Convert to integer representation (multiply by 1e5)
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);

    // Calculate deltas
    const dLat = latE5 - prevLat;
    const dLng = lngE5 - prevLng;

    // Encode latitude
    encoded += encodeValue(dLat);

    // Encode longitude
    encoded += encodeValue(dLng);

    prevLat = latE5;
    prevLng = lngE5;
  }

  return encoded;
}

/**
 * Encodes a single value for polyline encoding
 * 
 * @param value - Value to encode
 * @returns Encoded string
 */
function encodeValue(value: number): string {
  // Step 1: Take the signed value and shift left by 1
  let encoded = value < 0 ? ~(value << 1) : value << 1;

  let result = '';

  // Step 2: Break into 5-bit chunks
  while (encoded >= 0x20) {
    result += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63);
    encoded >>= 5;
  }

  result += String.fromCharCode(encoded + 63);

  return result;
}

/**
 * Calculates the total length of a polyline path
 * 
 * @param polyline - Encoded polyline string
 * @returns Total distance in kilometers
 */
export function calculatePolylineLength(polyline: string): number {
  const coordinates = decodePolyline(polyline);

  if (coordinates.length < 2) {
    return 0;
  }

  let totalDistance = 0;

  // Import calculateDistance from MapService
  const { calculateDistance } = require('./MapService');

  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
  }

  return Math.round(totalDistance * 100) / 100;
}

/**
 * Gets the bounds (bounding box) for a polyline
 * 
 * @param polyline - Encoded polyline string
 * @returns Bounds object with min/max lng/lat
 */
export function getPolylineBounds(polyline: string): {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
} | null {
  const coordinates = decodePolyline(polyline);

  if (coordinates.length === 0) {
    return null;
  }

  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return { minLng, maxLng, minLat, maxLat };
}

/**
 * Simplifies a polyline by removing points that are very close together
 * Uses the Ramer-Douglas-Peucker algorithm
 * 
 * @param coordinates - Array of coordinates in [lng, lat] format
 * @param tolerance - Tolerance in degrees (default: 0.0001)
 * @returns Simplified array of coordinates
 */
export function simplifyPolyline(
  coordinates: [number, number][],
  tolerance: number = 0.0001
): [number, number][] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  // Find the point with the maximum distance from the line segment
  let maxDistance = 0;
  let maxIndex = 0;

  const start = coordinates[0];
  const end = coordinates[coordinates.length - 1];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const distance = perpendicularDistance(coordinates[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPolyline(coordinates.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolyline(coordinates.slice(maxIndex), tolerance);

    // Concatenate results, removing duplicate point at maxIndex
    return [...left.slice(0, -1), ...right];
  } else {
    // If max distance is less than tolerance, return just the endpoints
    return [start, end];
  }
}

/**
 * Calculates the perpendicular distance from a point to a line segment
 * 
 * @param point - Point coordinates
 * @param lineStart - Line segment start coordinates
 * @param lineEnd - Line segment end coordinates
 * @returns Distance in degrees
 */
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  // If line segment is a point, return distance to that point
  if (dx === 0 && dy === 0) {
    return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
  }

  // Calculate perpendicular distance
  const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt(dx ** 2 + dy ** 2);

  return numerator / denominator;
}

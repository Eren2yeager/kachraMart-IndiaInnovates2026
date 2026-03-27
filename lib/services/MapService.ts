/**
 * MapService - Utility functions for map-related operations
 * 
 * This service provides core map functionality including:
 * - Distance calculation using Haversine formula
 * - Coordinate validation
 * - Coordinate format conversion
 */

/**
 * Validates that coordinates are within valid ranges
 * Longitude: -180 to 180
 * Latitude: -90 to 90
 * 
 * @param coordinates - Coordinates in [lng, lat] format
 * @returns true if coordinates are valid, false otherwise
 */
export function validateCoordinates(coordinates: [number, number]): boolean {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lng, lat] = coordinates;

  // Check if values are numbers
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return false;
  }

  // Check if values are finite (not NaN, Infinity, or -Infinity)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return false;
  }

  // Validate ranges
  if (lng < -180 || lng > 180) {
    return false;
  }

  if (lat < -90 || lat > 90) {
    return false;
  }

  return true;
}

/**
 * Calculates the straight-line distance between two coordinates using the Haversine formula
 * 
 * The Haversine formula calculates the great-circle distance between two points on a sphere
 * given their longitudes and latitudes. This is accurate within 0.1% of the true geodesic distance.
 * 
 * @param origin - Origin coordinates in [lng, lat] format
 * @param destination - Destination coordinates in [lng, lat] format
 * @returns Distance in kilometers with two decimal precision
 * @throws Error if coordinates are invalid
 */
export function calculateDistance(
  origin: [number, number],
  destination: [number, number]
): number {
  // Validate coordinates
  if (!validateCoordinates(origin)) {
    throw new Error('Invalid origin coordinates');
  }

  if (!validateCoordinates(destination)) {
    throw new Error('Invalid destination coordinates');
  }

  const [lon1, lat1] = origin;
  const [lon2, lat2] = destination;

  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Return with two decimal precision
  return Math.round(distance * 100) / 100;
}

/**
 * Converts coordinates from [lat, lng] format to [lng, lat] format
 * 
 * @param latLng - Coordinates in [lat, lng] format
 * @returns Coordinates in [lng, lat] format
 */
export function latLngToLngLat(latLng: [number, number]): [number, number] {
  return [latLng[1], latLng[0]];
}

/**
 * Converts coordinates from [lng, lat] format to [lat, lng] format
 * 
 * @param lngLat - Coordinates in [lng, lat] format
 * @returns Coordinates in [lat, lng] format
 */
export function lngLatToLatLng(lngLat: [number, number]): [number, number] {
  return [lngLat[1], lngLat[0]];
}

/**
 * Formats coordinates as a human-readable string
 * 
 * @param coordinates - Coordinates in [lng, lat] format
 * @returns Formatted string like "12.34°N, 56.78°E"
 */
export function formatCoordinates(coordinates: [number, number]): string {
  if (!validateCoordinates(coordinates)) {
    return 'Invalid coordinates';
  }

  const [lng, lat] = coordinates;

  const latDirection = lat >= 0 ? 'N' : 'S';
  const lngDirection = lng >= 0 ? 'E' : 'W';

  const latAbs = Math.abs(lat).toFixed(4);
  const lngAbs = Math.abs(lng).toFixed(4);

  return `${latAbs}°${latDirection}, ${lngAbs}°${lngDirection}`;
}

/**
 * Parses a coordinate string into [lng, lat] format
 * Supports formats like:
 * - "12.34, 56.78" (lat, lng)
 * - "12.34°N, 56.78°E"
 * - "56.78, 12.34" (lng, lat) - if second number is in lat range
 * 
 * @param coordString - String representation of coordinates
 * @returns Coordinates in [lng, lat] format or null if parsing fails
 */
export function parseCoordinates(coordString: string): [number, number] | null {
  if (!coordString || typeof coordString !== 'string') {
    return null;
  }

  // Remove degree symbols and direction letters
  const cleaned = coordString.replace(/[°NSEW]/gi, '').trim();

  // Split by comma
  const parts = cleaned.split(',').map((p) => p.trim());

  if (parts.length !== 2) {
    return null;
  }

  const num1 = parseFloat(parts[0]);
  const num2 = parseFloat(parts[1]);

  if (isNaN(num1) || isNaN(num2)) {
    return null;
  }

  // Determine if it's lat,lng or lng,lat based on ranges
  // If first number is in lat range (-90 to 90) and second is in lng range, assume lat,lng
  if (num1 >= -90 && num1 <= 90 && (num2 < -90 || num2 > 90 || Math.abs(num2) > Math.abs(num1))) {
    // Likely lat, lng format
    return [num2, num1];
  }

  // Otherwise assume lng, lat
  return [num1, num2];
}

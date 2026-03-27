'use client';

import React from 'react';
import { Polyline } from '@react-google-maps/api';

export interface MapRouteProps {
  id: string;
  polyline: string; // Encoded polyline string
  color?: string;
  strokeWeight?: number;
  opacity?: number;
}

// Decode polyline string to coordinates
function decodePolyline(encoded: string): google.maps.LatLng[] {
  if (!encoded) return [];
  
  const poly: google.maps.LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push(new google.maps.LatLng(lat / 1e5, lng / 1e5));
  }

  return poly;
}

// Default colors for multiple routes
const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

let colorIndex = 0;

export function MapRoute({
  id,
  polyline,
  color,
  strokeWeight = 4,
  opacity = 0.8,
}: MapRouteProps) {
  // Decode the polyline string to path coordinates
  const path = decodePolyline(polyline);

  // If no color provided, use a default color from the palette
  const routeColor = color || defaultColors[colorIndex++ % defaultColors.length];

  if (path.length === 0) {
    console.warn(`MapRoute ${id}: Empty or invalid polyline string`);
    return null;
  }

  return (
    <Polyline
      path={path}
      options={{
        strokeColor: routeColor,
        strokeWeight,
        strokeOpacity: opacity,
        geodesic: true, // Follow the curvature of the earth
      }}
    />
  );
}

// Component to render multiple routes simultaneously
interface MultipleRoutesProps {
  routes: MapRouteProps[];
}

export function MultipleRoutes({ routes }: MultipleRoutesProps) {
  return (
    <>
      {routes.map((route) => (
        <MapRoute key={route.id} {...route} />
      ))}
    </>
  );
}

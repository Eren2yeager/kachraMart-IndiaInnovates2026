'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { GoogleMap as GoogleMapComponent, Marker, Polyline } from '@react-google-maps/api';
import { MarkerClusterer, GridAlgorithm } from '@googlemaps/markerclusterer';
import { useGoogleMap , GoogleMapProvider } from './GoogleMapProvider';

export interface MapMarker {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'pickup' | 'hub' | 'collector' | 'user';
  title: string;
  metadata?: Record<string, any>;
}

export interface MapRoute {
  id: string;
  polyline: string; // Encoded polyline
  color?: string;
  strokeWeight?: number;
}

interface GoogleMapProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  routes?: MapRoute[];
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  className?: string;
  interactive?: boolean;
  showUserLocation?: boolean;
  fitBounds?: boolean;
  showGeolocationButton?: boolean;
  onUserLocationChange?: (coordinates: [number, number]) => void;
  showResetButton?: boolean;
  enableClustering?: boolean;
  clusteringThreshold?: number;
  maxMarkers?: number;
}

// Performance Optimization: Debounce utility function
// Used to throttle rapid location updates to prevent excessive re-renders
// Validates: Requirement 14.2
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const defaultMapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

// Marker icon configurations based on type
const getMarkerIcon = (type: MapMarker['type']): google.maps.Symbol => {
  const iconConfig = {
    pickup: { fillColor: '#ef4444', strokeColor: '#991b1b' }, // red
    hub: { fillColor: '#3b82f6', strokeColor: '#1e40af' }, // blue
    collector: { fillColor: '#10b981', strokeColor: '#047857' }, // green
    user: { fillColor: '#8b5cf6', strokeColor: '#5b21b6' }, // purple
  };

  const config = iconConfig[type];
  
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: config.fillColor,
    fillOpacity: 1,
    strokeColor: config.strokeColor,
    strokeWeight: 2,
    scale: 8,
  } as google.maps.Symbol;
};

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

// Performance Optimization: React.memo prevents unnecessary re-renders
// Validates: Requirement 14.3 (React memoization to prevent unnecessary component re-renders)
export const GoogleMap = React.memo(function GoogleMap({
  center,
  zoom = 13,
  markers = [],
  routes = [],
  onMarkerClick,
  onMapClick,
  className = 'w-full h-[500px]',
  interactive = true,
  fitBounds = false,
  showUserLocation = false,
  showGeolocationButton = false,
  onUserLocationChange,
  showResetButton = false,
  enableClustering = false,
  clusteringThreshold = 10,
  maxMarkers = 100,
}: GoogleMapProps) {
  const { isLoaded, loadError } = useGoogleMap();
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const initialCenter = useRef(center);
  const initialZoom = useRef(zoom);

  // Performance Optimization: Memoize map center to prevent unnecessary re-renders
  // Validates: Requirement 14.3 (React memoization)
  const mapCenter = useMemo(() => ({ lat: center[1], lng: center[0] }), [center]);

  // Performance Optimization: Limit markers to maxMarkers for performance
  // Validates: Requirement 14.4 (Marker display limit)
  const limitedMarkers = useMemo(() => {
    if (markers.length <= maxMarkers) {
      return markers;
    }
    return markers.slice(0, maxMarkers);
  }, [markers, maxMarkers]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    // Clean up clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }
    // Clean up markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    mapRef.current = null;
  }, []);

  // Performance Optimization: Debounce location updates to prevent excessive re-renders
  // Validates: Requirement 14.2 (Debouncing for location updates)
  // 500ms debounce = max 2 updates per second
  const debouncedLocationUpdate = useMemo(
    () => debounce((coords: [number, number]) => {
      if (onUserLocationChange) {
        onUserLocationChange(coords);
      }
    }, 500),
    [onUserLocationChange]
  );

  // Request user's geolocation
  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setGeolocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        setUserLocation(coords);
        setIsGettingLocation(false);
        
        debouncedLocationUpdate(coords);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeolocationError('Location access denied. Please enable location permissions in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeolocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setGeolocationError('Location request timed out.');
            break;
          default:
            setGeolocationError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [debouncedLocationUpdate]);

  // Center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo({ lat: userLocation[1], lng: userLocation[0] });
      mapRef.current.setZoom(15);
    }
  }, [userLocation]);

  // Reset map to initial view
  const resetMapView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.panTo({ lat: initialCenter.current[1], lng: initialCenter.current[0] });
      mapRef.current.setZoom(initialZoom.current);
    }
  }, []);

  // Request geolocation on mount if showUserLocation is true
  useEffect(() => {
    if (showUserLocation && !userLocation) {
      requestGeolocation();
    }
  }, [showUserLocation, userLocation, requestGeolocation]);

  // Watch user location for continuous updates
  useEffect(() => {
    if (!showUserLocation) return;

    let watchId: number | null = null;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          setUserLocation(coords);
          
          debouncedLocationUpdate(coords);
        },
        (error) => {
          console.error('Error watching position:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [showUserLocation, debouncedLocationUpdate]);

  const handleMarkerClick = useCallback(
    (marker: MapMarker) => {
      setSelectedMarker(marker);
      if (onMarkerClick) {
        onMarkerClick(marker);
      }
    },
    [onMarkerClick]
  );

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng && onMapClick) {
        const lng = e.latLng.lng();
        const lat = e.latLng.lat();
        onMapClick([lng, lat]);
      }
      setSelectedMarker(null);
    },
    [onMapClick]
  );

  // Performance Optimization: Setup marker clustering for large marker sets
  // Validates: Requirements 7.2, 7.3, 14.5 (Marker clustering)
  useEffect(() => {
    if (!mapRef.current || !enableClustering || limitedMarkers.length < clusteringThreshold) {
      // Clean up existing clusterer if clustering is disabled or below threshold
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
        clustererRef.current = null;
      }
      return;
    }

    // Create markers for clustering
    const googleMarkers = limitedMarkers.map((marker) => {
      const googleMarker = new google.maps.Marker({
        position: { lat: marker.coordinates[1], lng: marker.coordinates[0] },
        icon: getMarkerIcon(marker.type),
        title: marker.title,
      });

      googleMarker.addListener('click', () => {
        handleMarkerClick(marker);
      });

      return googleMarker;
    });

    // Clean up old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = googleMarkers;

    // Create or update clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current.addMarkers(googleMarkers);
    } else {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: googleMarkers,
        algorithm: new GridAlgorithm({ gridSize: 60 }),
      });
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
      googleMarkers.forEach(marker => marker.setMap(null));
    };
  }, [limitedMarkers, enableClustering, clusteringThreshold, handleMarkerClick]);

  // Fit bounds to show all markers and routes
  useEffect(() => {
    if (!mapRef.current || !fitBounds || (!limitedMarkers.length && !routes.length)) return;

    const bounds = new google.maps.LatLngBounds();

    // Add marker positions to bounds
    limitedMarkers.forEach((marker) => {
      bounds.extend({ lat: marker.coordinates[1], lng: marker.coordinates[0] });
    });

    // Add route points to bounds
    routes.forEach((route) => {
      const path = decodePolyline(route.polyline);
      path.forEach((point) => bounds.extend(point));
    });

    mapRef.current.fitBounds(bounds);
  }, [limitedMarkers, routes, fitBounds]);

  if (loadError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}>
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold mb-2">Unable to load map</p>
          <p className="text-sm text-gray-600">
            Location: {center[1].toFixed(6)}, {center[0].toFixed(6)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  const mapOptions: google.maps.MapOptions = {
    ...defaultMapOptions,
    draggable: interactive,
    zoomControl: interactive,
    scrollwheel: interactive,
    disableDoubleClickZoom: !interactive,
    gestureHandling: interactive ? 'auto' : 'none',
  };

  return (
    <div className="relative">
      <GoogleMapComponent
        mapContainerClassName={className}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={mapOptions}
      >
        {/* Render markers only when clustering is disabled or below threshold */}
        {(!enableClustering || limitedMarkers.length < clusteringThreshold) && limitedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={{ lat: marker.coordinates[1], lng: marker.coordinates[0] }}
            icon={getMarkerIcon(marker.type)}
            title={marker.title}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}

        {/* Render user location marker */}
        {userLocation && (
          <Marker
            position={{ lat: userLocation[1], lng: userLocation[0] }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 10,
            } as google.maps.Symbol}
            title="Your Location"
          />
        )}

        {/* Render routes */}
        {routes.map((route) => (
          <Polyline
            key={route.id}
            path={decodePolyline(route.polyline)}
            options={{
              strokeColor: route.color || '#3b82f6',
              strokeWeight: route.strokeWeight || 4,
              strokeOpacity: 0.8,
            }}
          />
        ))}

        {/* Info window for selected marker */}
        {selectedMarker && (
          <div
            style={{
              position: 'absolute',
              background: 'white',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 1000,
            }}
          >
            <h3 className="font-semibold text-sm mb-1">{selectedMarker.title}</h3>
            <p className="text-xs text-gray-600">
              {selectedMarker.coordinates[1].toFixed(6)}, {selectedMarker.coordinates[0].toFixed(6)}
            </p>
            {selectedMarker.metadata && (
              <div className="mt-2 text-xs">
                {Object.entries(selectedMarker.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </GoogleMapComponent>

      {/* Geolocation button */}
      {showGeolocationButton && (
        <button
          onClick={centerOnUserLocation}
          disabled={!userLocation || isGettingLocation}
          className="absolute bottom-24 right-3 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed z-10"
          title="Center on my location"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      )}

      {/* Reset view button */}
      {showResetButton && (
        <button
          onClick={resetMapView}
          className="absolute bottom-36 right-3 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 z-10"
          title="Reset to initial view"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      )}

      {/* Geolocation error message */}
      {geolocationError && (
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-lg z-10 max-w-md">
          <p className="text-sm">{geolocationError}</p>
          <button
            onClick={() => setGeolocationError(null)}
            className="absolute top-1 right-1 text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

'use client';

import React, { useState } from 'react';
import { Marker, InfoWindow } from '@react-google-maps/api';

export interface MapMarkerProps {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  type: 'pickup' | 'hub' | 'collector' | 'user';
  title: string;
  metadata?: Record<string, any>;
  onClick?: () => void;
}

// Marker icon configurations based on type
const getMarkerIcon = (type: MapMarkerProps['type']): google.maps.Symbol => {
  const iconConfig = {
    pickup: { fillColor: '#ef4444', strokeColor: '#991b1b', label: 'P' }, // red
    hub: { fillColor: '#3b82f6', strokeColor: '#1e40af', label: 'H' }, // blue
    collector: { fillColor: '#10b981', strokeColor: '#047857', label: 'C' }, // green
    user: { fillColor: '#8b5cf6', strokeColor: '#5b21b6', label: 'U' }, // purple
  };

  const config = iconConfig[type];
  
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: config.fillColor,
    fillOpacity: 1,
    strokeColor: config.strokeColor,
    strokeWeight: 2,
    scale: 10,
  } as google.maps.Symbol;
};

// Custom marker icons with distinct shapes for different types
const getCustomMarkerIcon = (type: MapMarkerProps['type']): google.maps.Symbol => {
  const baseConfig = {
    pickup: {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', // Pin shape
      fillColor: '#ef4444',
      strokeColor: '#991b1b',
      scale: 1.5,
    },
    hub: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#3b82f6',
      strokeColor: '#1e40af',
      scale: 12,
    },
    collector: {
      path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // Truck/delivery icon
      fillColor: '#10b981',
      strokeColor: '#047857',
      scale: 1.2,
    },
    user: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#8b5cf6',
      strokeColor: '#5b21b6',
      scale: 8,
    },
  };

  const config = baseConfig[type];
  
  return {
    path: config.path,
    fillColor: config.fillColor,
    fillOpacity: 1,
    strokeColor: config.strokeColor,
    strokeWeight: 2,
    scale: config.scale,
    anchor: new google.maps.Point(12, 24), // Anchor point for pin
  } as google.maps.Symbol;
};

export function MapMarker({
  id,
  coordinates,
  type,
  title,
  metadata,
  onClick,
}: MapMarkerProps) {
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  const position = { lat: coordinates[1], lng: coordinates[0] };

  const handleClick = () => {
    setShowInfoWindow(true);
    if (onClick) {
      onClick();
    }
  };

  const handleCloseInfoWindow = () => {
    setShowInfoWindow(false);
  };

  return (
    <>
      <Marker
        position={position}
        icon={getMarkerIcon(type)}
        title={title}
        onClick={handleClick}
      />

      {showInfoWindow && (
        <InfoWindow
          position={position}
          onCloseClick={handleCloseInfoWindow}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-sm mb-1 capitalize">{type}: {title}</h3>
            <p className="text-xs text-gray-600 mb-2">
              {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
            </p>
            {metadata && Object.keys(metadata).length > 0 && (
              <div className="mt-2 text-xs border-t pt-2">
                {Object.entries(metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}

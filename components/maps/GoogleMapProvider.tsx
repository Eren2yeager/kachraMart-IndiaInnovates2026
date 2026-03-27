'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLoadScript } from '@react-google-maps/api';

interface GoogleMapContextState {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapContext = createContext<GoogleMapContextState | undefined>(undefined);

interface GoogleMapProviderProps {
  children: ReactNode;
}

// Memoize libraries array to prevent re-initialization
const libraries: ('places' | 'geometry' | 'drawing')[] = ['places', 'geometry'];

export function GoogleMapProvider({ children }: GoogleMapProviderProps) {
  // Performance Optimization: Lazy load Google Maps API - only loads when provider is mounted
  // Validates: Requirement 14.1 (Lazy load the Google Maps API only when needed)
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY || '',
    libraries,
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ isLoaded, loadError }),
    [isLoaded, loadError]
  );

  return (
    <GoogleMapContext.Provider value={contextValue}>
      {children}
    </GoogleMapContext.Provider>
  );
}

export function useGoogleMap() {
  const context = useContext(GoogleMapContext);
  if (context === undefined) {
    throw new Error('useGoogleMap must be used within a GoogleMapProvider');
  }
  return context;
}

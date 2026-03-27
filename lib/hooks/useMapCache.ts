'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useMapCache Hook
 * 
 * Caches map data in localStorage to provide offline fallback.
 * Automatically restores cached data when network is unavailable.
 * 
 * Validates: Requirement 15.3 (Cache last known state)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseMapCacheOptions {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds (default: 1 hour)
}

export function useMapCache<T>(options: UseMapCacheOptions) {
  const { cacheKey, ttl = 3600000 } = options; // Default 1 hour
  const [cachedData, setCachedData] = useState<T | null>(null);
  const [isCached, setIsCached] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - entry.timestamp < ttl) {
          setCachedData(entry.data);
          setIsCached(true);
        } else {
          // Cache expired, remove it
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error loading cached map data:', error);
      // Clear corrupted cache
      localStorage.removeItem(cacheKey);
    }
  }, [cacheKey, ttl]);

  // Save data to cache
  const saveToCache = useCallback(
    (data: T) => {
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
        setCachedData(data);
        setIsCached(true);
      } catch (error) {
        console.error('Error saving map data to cache:', error);
        // Handle quota exceeded or other storage errors
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, clearing old cache');
          // Try to clear old cache and retry
          localStorage.removeItem(cacheKey);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
          } catch (retryError) {
            console.error('Failed to save to cache after clearing:', retryError);
          }
        }
      }
    },
    [cacheKey]
  );

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
      setCachedData(null);
      setIsCached(false);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [cacheKey]);

  // Get cached data or null
  const getCachedData = useCallback((): T | null => {
    return cachedData;
  }, [cachedData]);

  return {
    cachedData,
    isCached,
    saveToCache,
    clearCache,
    getCachedData,
  };
}

/**
 * Hook for caching map markers
 */
export function useMarkerCache(mapId: string) {
  return useMapCache<any[]>({
    cacheKey: `map_markers_${mapId}`,
    ttl: 1800000, // 30 minutes
  });
}

/**
 * Hook for caching map routes
 */
export function useRouteCache(routeId: string) {
  return useMapCache<any>({
    cacheKey: `map_route_${routeId}`,
    ttl: 3600000, // 1 hour
  });
}

/**
 * Hook for caching location data
 */
export function useLocationCache(locationId: string) {
  return useMapCache<[number, number]>({
    cacheKey: `map_location_${locationId}`,
    ttl: 600000, // 10 minutes
  });
}

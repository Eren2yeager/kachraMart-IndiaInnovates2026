'use client';

import React, { useEffect, useState } from 'react';

/**
 * NetworkStatusIndicator Component
 * 
 * Displays an offline indicator when network connectivity is lost.
 * Automatically hides when connection is restored.
 * 
 * Validates: Requirement 15.3 (Display offline indicator)
 */
export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Initialize with current online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Keep indicator visible for a moment to show "Back online" message
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show indicator when offline or briefly when coming back online
  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    }
  }, [isOnline]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-50 border border-green-200 text-green-800'
          : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {isOnline ? (
          <>
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 text-yellow-600 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium">No internet connection</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Some features may be unavailable
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Hook to check network status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}

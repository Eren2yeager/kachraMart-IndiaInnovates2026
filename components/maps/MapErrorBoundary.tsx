'use client';

import React, { Component, ReactNode } from 'react';

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallbackCoordinates?: [number, number]; // [lng, lat]
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * MapErrorBoundary Component
 * 
 * React error boundary that catches map rendering errors and displays fallback UI.
 * Prevents map errors from crashing the entire application.
 * 
 * Requirements: 15.1, 15.3, 15.5
 */
export class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MapErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    // Validates: Requirement 15.4 (Log errors to console for debugging)
    console.error('Map rendering error caught by error boundary:', error);
    console.error('Error details:', errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Increment retry count and reset error state
    // Validates: Requirement 15.3 (Display retry button for transient failures)
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const { fallbackCoordinates } = this.props;
      const { error, retryCount } = this.state;

      // Validates: Requirement 15.1 (Display fallback message with coordinates)
      // Validates: Requirement 15.5 (Map component shall not crash the application)
      return (
        <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg border border-gray-300">
          <div className="text-center p-6 max-w-md">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-red-500 mx-auto"
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
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Display Map
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              {error?.message || 'An error occurred while rendering the map.'}
            </p>

            {fallbackCoordinates && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Location Coordinates:</p>
                <p className="font-mono text-sm text-gray-900">
                  {fallbackCoordinates[1].toFixed(6)}, {fallbackCoordinates[0].toFixed(6)}
                </p>
                <p className="text-xs text-gray-500 mt-1">(Latitude, Longitude)</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {retryCount > 0 ? `Retry (${retryCount})` : 'Retry'}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reload Page
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

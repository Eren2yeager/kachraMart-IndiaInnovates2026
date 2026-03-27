import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapErrorBoundary } from '../MapErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('MapErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <MapErrorBoundary>
        <div>Map content</div>
      </MapErrorBoundary>
    );

    expect(screen.getByText('Map content')).toBeInTheDocument();
  });

  it('displays fallback UI when error occurs', () => {
    render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.getByText('Unable to Display Map')).toBeInTheDocument();
  });

  it('displays coordinates in fallback UI', () => {
    render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(screen.getByText(/37.774900, -122.419400/)).toBeInTheDocument();
  });

  it('shows retry button in fallback UI', () => {
    render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('resets error state when retry button is clicked', () => {
    const { rerender } = render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Error boundary should show fallback
    expect(screen.getByText('Unable to Display Map')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    // Rerender with no error
    rerender(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={false} />
      </MapErrorBoundary>
    );

    // Should show content again
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <MapErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it('shows reload page button', () => {
    render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /Reload Page/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it('increments retry count on multiple retries', () => {
    const { rerender } = render(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    // First retry
    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    rerender(
      <MapErrorBoundary fallbackCoordinates={[-122.4194, 37.7749]}>
        <ThrowError shouldThrow={true} />
      </MapErrorBoundary>
    );

    // Should show retry count
    expect(screen.getByRole('button', { name: /Retry \(1\)/i })).toBeInTheDocument();
  });
});

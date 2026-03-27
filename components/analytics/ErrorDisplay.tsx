'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry: () => void;
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-red-500 mb-4">
        <AlertCircle className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
      <p className="text-gray-600 mb-4">{error}</p>
      <Button onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

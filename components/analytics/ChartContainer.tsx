'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function ChartContainer({ title, children, loading, error, onRetry }: ChartContainerProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="h-80 flex flex-col items-center justify-center text-center">
          <p className="text-red-600 mb-4">{error}</p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

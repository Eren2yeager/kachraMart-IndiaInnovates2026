'use client';

import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-gray-400 mb-4">
        <BarChart3 className="w-24 h-24 mx-auto" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md">{message}</p>
      {action && (
        <Button asChild>
          <a href={action.href}>{action.label}</a>
        </Button>
      )}
    </div>
  );
}

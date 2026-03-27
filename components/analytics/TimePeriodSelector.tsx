'use client';

import { Button } from '@/components/ui/button';

interface TimePeriodSelectorProps {
  value: 'all' | 'monthly' | 'weekly';
  onChange: (period: 'all' | 'monthly' | 'weekly') => void;
}

export function TimePeriodSelector({ value, onChange }: TimePeriodSelectorProps) {
  const periods = [
    { value: 'all' as const, label: 'All Time' },
    { value: 'monthly' as const, label: 'Last 30 Days' },
    { value: 'weekly' as const, label: 'Last 7 Days' }
  ];

  return (
    <div className="flex gap-2">
      {periods.map(period => (
        <Button
          key={period.value}
          variant={value === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  );
}

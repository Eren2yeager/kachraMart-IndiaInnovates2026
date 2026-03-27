'use client';

import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'green' | 'blue' | 'orange' | 'red';
}

const colorClasses = {
  green: 'bg-green-50 text-green-700 border-green-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  red: 'bg-red-50 text-red-700 border-red-200'
};

export function MetricCard({ title, value, unit, icon: Icon, trend, color = 'blue' }: MetricCardProps) {
  return (
    <Card className={`p-6 ${colorClasses[color]} border-2`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {unit && <span className="text-sm font-medium opacity-70">{unit}</span>}
          </div>
          {trend && (
            <div className={`mt-2 flex items-center gap-1 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-lg bg-white/50 p-3">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

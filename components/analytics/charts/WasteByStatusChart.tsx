'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WasteStatus } from '@/types';

const STATUS_COLORS = {
  pending: '#fbbf24',
  collector_assigned: '#60a5fa',
  picked_up: '#a78bfa',
  stored_in_hub: '#34d399',
  sold_to_dealer: '#10b981'
} as const;

interface WasteByStatusChartProps {
  data: Record<WasteStatus, { count: number; quantity: number }>;
}

export function WasteByStatusChart({ data }: WasteByStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, values]) => values.quantity > 0)
    .map(([status, values]) => ({
      name: status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: values.quantity,
      count: values.count
    }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={Object.values(STATUS_COLORS)[index % Object.values(STATUS_COLORS).length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value} kg`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

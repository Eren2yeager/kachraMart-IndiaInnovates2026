'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WasteType } from '@/types';

const WASTE_TYPE_COLORS = {
  biodegradable: '#10b981',
  recyclable: '#3b82f6',
  hazardous: '#ef4444',
  ewaste: '#8b5cf6',
  construction: '#f97316'
} as const;

interface WasteByTypeChartProps {
  data: Record<WasteType, number>;
}

export function WasteByTypeChart({ data }: WasteByTypeChartProps) {
  const chartData = Object.entries(data).map(([type, quantity]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    quantity,
    fill: WASTE_TYPE_COLORS[type as WasteType]
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Quantity (kg)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `${value} kg`} />
        <Bar dataKey="quantity" />
      </BarChart>
    </ResponsiveContainer>
  );
}

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

interface PurchasesByTypeChartProps {
  data: Record<WasteType, { quantity: number; spent: number }>;
}

export function PurchasesByTypeChart({ data }: PurchasesByTypeChartProps) {
  const chartData = Object.entries(data).map(([type, values]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    quantity: values.quantity,
    spent: values.spent,
    fill: WASTE_TYPE_COLORS[type as WasteType]
  }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Quantity (kg)', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'quantity') return `${value} kg`;
            if (name === 'spent') return `₹${Number(value).toLocaleString()}`;
            return value;
          }}
        />
        <Bar dataKey="quantity" />
      </BarChart>
    </ResponsiveContainer>
  );
}

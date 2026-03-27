'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WasteType } from '@/types';

interface AveragePriceChartProps {
  data: Record<WasteType, number>;
}

export function AveragePriceChart({ data }: AveragePriceChartProps) {
  // Filter out waste types with no purchases (price = 0)
  const chartData = Object.entries(data)
    .filter(([_, price]) => price > 0)
    .map(([type, price]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      price
    }));
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis label={{ value: 'Price per Kg (INR)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `₹${Number(value).toFixed(2)}`} />
        <Bar dataKey="price" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}

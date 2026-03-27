'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlyDataPoint } from '@/types';

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis label={{ value: 'Quantity (kg)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `${value} kg`} />
        <Line 
          type="monotone" 
          dataKey="quantity" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

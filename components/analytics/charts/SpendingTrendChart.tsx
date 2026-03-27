'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlySpendingPoint } from '@/types';

interface SpendingTrendChartProps {
  data: MonthlySpendingPoint[];
}

export function SpendingTrendChart({ data }: SpendingTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis label={{ value: 'Spent (INR)', angle: -90, position: 'insideLeft' }} />
        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
        <Area 
          type="monotone" 
          dataKey="spent" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorSpent)"
          dot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

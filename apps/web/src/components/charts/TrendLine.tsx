'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface TrendPoint {
  period: string;
  overall: number;
  [key: string]: string | number;
}

interface TrendLineProps {
  data: TrendPoint[];
  dimensions?: string[];
  height?: number;
}

export const TrendLine = ({ data, dimensions = ['overall'], height = 300 }: TrendLineProps) => {
  const dimensionColors: Record<string, string> = {
    overall: '#2E865A',
    physical: '#4CAF7D',
    mental: '#8B5CF6',
    social: '#F59E0B',
    financial: '#10B981',
    work: '#6366F1'
  };

  if (!Array.isArray(data)) {
    return <div style={{ height }} className="w-full flex items-center justify-center text-gray-400 text-xs">Veri yüklenemedi.</div>;
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="period" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '20px' }}
          />
          {dimensions.map((dim) => (
            <Line
              key={dim}
              type="monotone"
              dataKey={dim}
              stroke={dimensionColors[dim] || '#cbd5e1'}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

'use client';

import React from 'react';
import { clsx } from 'clsx';

interface ProgressStepsProps {
  current: number;
  total: number;
  labels: string[];
}

export const ProgressSteps = ({ current, total, labels }: ProgressStepsProps) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center relative">
        {/* Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-100 z-0" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-10 transition-all duration-500 ease-out" 
          style={{ width: `${(current / (total - 1)) * 100}%` }}
        />

        {/* Steps */}
        {Array.from({ length: total }).map((_, i) => (
          <div 
            key={i} 
            className={clsx(
              'h-4 w-4 rounded-full border-2 transition-all duration-500 z-20',
              i <= current ? 'bg-primary border-primary scale-125' : 'bg-white border-gray-200'
            )}
          />
        ))}
      </div>
      
      <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
        <span className="text-primary font-black">
          {labels[current]} ({current + 1} / {total})
        </span>
        <span className="hidden sm:inline">TAMAMLANAN: %{Math.round((current / (total - 1)) * 100)}</span>
      </div>
    </div>
  );
};

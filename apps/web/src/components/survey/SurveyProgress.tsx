'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SurveyProgressProps {
  dimensions: string[];
  currentIndex: number;
  completedDimensions: number[];
  language: 'tr' | 'en';
}

export function SurveyProgress({ dimensions, currentIndex, completedDimensions }: SurveyProgressProps) {
  const { t } = useTranslation('survey');

  return (
    <div className="w-full py-4 px-2 sm:px-6 bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative mb-2">
          {/* Background Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          
          {dimensions.map((dim, idx) => {
            const isCompleted = completedDimensions.includes(idx);
            const isActive = currentIndex === idx;
            const label = t(`dimensions.${dim}.title`, dim);

            return (
              <div key={dim} className="relative z-10 flex flex-col items-center group">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                    isActive ? 'bg-white border-primary text-primary shadow-lg scale-110' : 
                    'bg-white border-gray-200 text-gray-400'}
                `}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <span className={`
                  absolute -bottom-6 text-[10px] sm:text-xs font-bold whitespace-nowrap transition-colors
                  ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                `}>
                  {label}
                </span>
                
                {/* Active Pulse Effect */}
                {isActive && (
                  <div className="absolute top-0 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

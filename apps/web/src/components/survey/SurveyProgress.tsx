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

  const activeLabel = t(`dimensions.${dimensions[currentIndex]}.title`, dimensions[currentIndex]);

  return (
    <div className="w-full pt-3 pb-2 px-2 sm:px-6 bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-3xl mx-auto">

        {/* Circles row */}
        <div className="flex items-center justify-between relative">
          {/* Background Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 z-0" />

          {dimensions.map((dim, idx) => {
            const isCompleted = completedDimensions.includes(idx);
            const isActive = currentIndex === idx;
            const label = t(`dimensions.${dim}.title`, dim);

            return (
              <div key={dim} className="relative z-10 flex flex-col items-center">
                {/* Circle */}
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                    ? 'bg-white border-primary text-primary shadow-lg scale-110'
                    : 'bg-white border-gray-200 text-gray-400'}
                `}>
                  {isCompleted
                    ? <Check size={16} strokeWidth={3} />
                    : <span className="text-xs font-bold">{idx + 1}</span>
                  }
                </div>

                {/* Active pulse */}
                {isActive && (
                  <div className="absolute top-0 w-8 h-8 rounded-full bg-primary/20 animate-ping" />
                )}

                {/* Labels: hidden on mobile, truncated on sm+ */}
                <span className={`
                  hidden sm:block mt-1.5 text-xs font-bold text-center max-w-[72px] truncate transition-colors
                  ${isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                `}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile-only: show only the active label below the circles */}
        <div className="sm:hidden mt-2 text-center">
          <span className="text-xs font-bold text-primary">
            {currentIndex + 1} / {dimensions.length} — {activeLabel}
          </span>
        </div>

      </div>
    </div>
  );
}

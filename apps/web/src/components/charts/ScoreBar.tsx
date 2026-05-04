'use client';
import React from 'react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface ScoreBarProps {
  score: number | null;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export const ScoreBar = ({ score, label, showValue = true, className }: ScoreBarProps) => {
  const { t } = useTranslation('common');
  const getProgressColor = (s: number | null) => {
    if (s === null) return 'bg-gray-200';
    if (s >= 70) return 'bg-primary';
    if (s >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className={clsx('space-y-1.5', className)}>
      <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
        <span>{label}</span>
        {showValue && <span>{score !== null ? `${Math.round(score)}%` : t('insufficient_data')}</span>}
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={clsx('h-full transition-all duration-1000 ease-out rounded-full', getProgressColor(score))}
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
    </div>
  );
};

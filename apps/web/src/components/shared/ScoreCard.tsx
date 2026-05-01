import React from 'react';

interface ScoreCardProps {
  score: number | null;
  label: string;
  change?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreCard = ({ score, label, change, size = 'md' }: ScoreCardProps) => {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-400';
    if (s >= 70) return 'text-primary';
    if (s >= 50) return 'text-warning';
    return 'text-danger';
  };

  const getBgColor = (s: number | null) => {
    if (s === null) return 'bg-gray-50';
    if (s >= 70) return 'bg-primary/10';
    if (s >= 50) return 'bg-warning/10';
    return 'bg-danger/10';
  };

  const scoreValue = score === null ? '--' : Math.round(score);

  return (
    <div className={`p-6 rounded-xl border border-gray-100 bg-white shadow-sm flex flex-col justify-between h-full`}>
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      
      <div className="flex items-baseline mt-4">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {scoreValue}
        </span>
        {score !== null && <span className="ml-1 text-sm text-gray-400">/100</span>}
      </div>

      <div className="mt-4 flex items-center">
        {change !== undefined && (
          <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-primary' : 'text-danger'}`}>
            {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
            <span className="ml-1 text-gray-400 font-normal">vs last period</span>
          </div>
        )}
        {score === null && <span className="text-xs text-gray-400">Yetersiz veri</span>}
      </div>
    </div>
  );
};

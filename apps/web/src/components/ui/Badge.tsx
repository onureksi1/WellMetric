import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'gray' | 'blue' | 'purple' | 'orange';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export const Badge = ({ variant = 'gray', size = 'sm', children, className }: BadgeProps) => {
  const variants = {
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={clsx(
      'inline-flex items-center font-bold rounded-md border',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
};

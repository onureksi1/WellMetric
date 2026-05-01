import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  variant?: 'default' | 'glass' | 'premium';
  onClick?: () => void;
}

export const Card = ({ title, subtitle, children, className, headerAction, variant = 'default', onClick }: CardProps) => {
  const variants = {
    default: 'bg-white border-slate-200/60 shadow-sm',
    glass: 'glass-card',
    premium: 'bg-white border-slate-200/60 shadow-[0_20px_50px_rgba(8,112,184,0.04)] hover:shadow-[0_20px_50px_rgba(8,112,184,0.08)] transition-all duration-500',
  };

  return (
    <div className={cn(
      'rounded-[32px] border overflow-hidden transition-all duration-300',
      variants[variant],
      className,
      onClick && 'cursor-pointer'
    )}
    onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-xl font-black text-navy tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm font-medium text-slate-400 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="px-8 py-7">{children}</div>
    </div>
  );
};

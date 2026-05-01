'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  isLoading?: boolean;
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading,
  isLoading,
  className,
  disabled,
  ...props 
}: ButtonProps) => {
  const effectiveLoading = loading || isLoading;
  const variants = {
    primary: 'premium-gradient text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95',
    secondary: 'bg-navy text-white shadow-lg shadow-navy/20 hover:bg-navy/90 active:scale-95',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-navy',
    danger: 'bg-danger text-white shadow-lg shadow-danger/20 hover:bg-danger/90 active:scale-95',
    outline: 'bg-transparent border-2 border-slate-200 text-slate-600 hover:border-primary hover:text-primary',
    glass: 'glass-card text-navy hover:bg-white/80 transition-all active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs font-bold',
    md: 'px-6 py-3 text-sm font-bold',
    lg: 'px-8 py-4 text-base font-black tracking-widest',
    xl: 'px-10 py-5 text-lg font-black tracking-widest uppercase',
  };

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || effectiveLoading}
      {...props}
    >
      {effectiveLoading ? (
        <Loader2 className="animate-spin mr-2" size={18} />
      ) : null}
      {children}
    </button>
  );
};

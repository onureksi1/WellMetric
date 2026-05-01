'use client';

import React, { useEffect, useState } from 'react';
import { useUIStore } from '@/lib/store/ui.store';
import { clsx } from 'clsx';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { language, setLanguage } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-100 bg-white/50 backdrop-blur-sm shadow-sm">
      <Globe size={14} className="text-gray-400" />
      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest">
        <button
          onClick={() => setLanguage('tr')}
          className={clsx(
            'transition-colors uppercase',
            language === 'tr' ? 'text-primary' : 'text-gray-400 hover:text-navy'
          )}
        >
          TR
        </button>
        <span className="text-gray-200">|</span>
        <button
          onClick={() => setLanguage('en')}
          className={clsx(
            'transition-colors uppercase',
            language === 'en' ? 'text-primary' : 'text-gray-400 hover:text-navy'
          )}
        >
          EN
        </button>
      </div>
    </div>
  );
};

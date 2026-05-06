'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NpsQuestionProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function NpsQuestion({ value, onChange, disabled }: NpsQuestionProps) {
  const { t } = useTranslation('survey');
  const items = Array.from({ length: 11 }, (_, i) => i);

  const getBtnStyles = (n: number) => {
    const isSelected = value === n;
    if (n <= 6) return isSelected ? 'bg-danger border-danger text-white' : 'bg-danger/5 text-danger/60 border-transparent hover:border-danger/20';
    if (n <= 8) return isSelected ? 'bg-warning border-warning text-white' : 'bg-warning/5 text-warning/60 border-transparent hover:border-warning/20';
    return isSelected ? 'bg-primary border-primary text-white' : 'bg-primary/5 text-primary/60 border-transparent hover:border-primary/20';
  };

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
        {items.map((num) => (
          <motion.button
            key={num}
            type="button"
            whileHover={{ scale: 1.1, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num)}
            disabled={disabled}
            className={`
              h-12 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all
              ${getBtnStyles(num)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {num}
          </motion.button>
        ))}
      </div>
      <div className="flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
        <span>0 = {t('survey.question.nps_low', 'Hiç önermem')}</span>
        <span>10 = {t('survey.question.nps_high', 'Kesinlikle öneririm')}</span>
      </div>
    </div>
  );
}

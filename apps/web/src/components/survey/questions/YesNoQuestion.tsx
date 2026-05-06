'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface YesNoQuestionProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function YesNoQuestion({ value, onChange, disabled }: YesNoQuestionProps) {
  const { t } = useTranslation('survey');

  return (
    <div className="flex gap-4 py-4">
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(1)}
        disabled={disabled}
        className={`
          flex-1 flex items-center justify-center gap-3 py-6 rounded-3xl border-4 transition-all
          ${value === 1 
            ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20' 
            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${value === 1 ? 'bg-white/20' : 'bg-gray-50'}`}>
          <Check size={20} strokeWidth={3} className={value === 1 ? 'text-white' : 'text-gray-300'} />
        </div>
        <span className="text-xl font-black">{t('survey.yes_no.yes', 'Evet')}</span>
      </motion.button>

      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onChange(0)}
        disabled={disabled}
        className={`
          flex-1 flex items-center justify-center gap-3 py-6 rounded-3xl border-4 transition-all
          ${value === 0 
            ? 'bg-danger border-danger text-white shadow-xl shadow-danger/20' 
            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${value === 0 ? 'bg-white/20' : 'bg-gray-50'}`}>
          <X size={20} strokeWidth={3} className={value === 0 ? 'text-white' : 'text-gray-300'} />
        </div>
        <span className="text-xl font-black">{t('survey.yes_no.no', 'Hayır')}</span>
      </motion.button>
    </div>
  );
}

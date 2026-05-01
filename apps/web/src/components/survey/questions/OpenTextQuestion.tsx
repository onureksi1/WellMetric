'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface OpenTextQuestionProps {
  value: string;
  onChange: (val: string) => void;
  language: 'tr' | 'en';
  disabled?: boolean;
}

export function OpenTextQuestion({ value = '', onChange, disabled }: OpenTextQuestionProps) {
  const { t } = useTranslation('survey');
  
  const getCounterColor = () => {
    if (value.length >= 500) return 'text-danger';
    if (value.length >= 400) return 'text-warning';
    return 'text-gray-400';
  };

  return (
    <div className="py-4 space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={500}
        rows={4}
        placeholder={t('question.open_text_placeholder', 'Düşüncelerinizi paylaşın...')}
        className="w-full bg-gray-50 border-4 border-transparent rounded-[2rem] p-6 text-navy font-medium outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all resize-none min-h-[160px]"
      />
      <div className="flex justify-end pr-4">
        <span className={`text-[10px] font-black uppercase tracking-widest ${getCounterColor()}`}>
          {t('question.characters_remaining', { count: value.length, max: 500 })}
        </span>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SurveyQuestion } from '@/types/survey.types';

interface SingleChoiceQuestionProps {
  question: SurveyQuestion;
  value: string;
  onChange: (val: string) => void;
  language: 'tr' | 'en';
  disabled?: boolean;
}

export function SingleChoiceQuestion({ question, value, onChange, language, disabled }: SingleChoiceQuestionProps) {
  const options = question.options || [];

  return (
    <div className="space-y-3 py-4">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        const label = language === 'tr' ? opt.label_tr : (opt.label_en || opt.label_tr);

        return (
          <motion.button
            key={opt.id}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onChange(opt.id)}
            disabled={disabled}
            className={`
              w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all
              ${isSelected 
                ? 'bg-primary/5 border-primary shadow-md' 
                : 'bg-white border-gray-100 hover:border-gray-200'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
              ${isSelected ? 'border-primary' : 'border-gray-300'}
            `}>
              <motion.div 
                initial={false}
                animate={{ scale: isSelected ? 1 : 0 }}
                className="w-3 h-3 rounded-full bg-primary"
              />
            </div>
            <span className={`text-base font-bold transition-colors ${isSelected ? 'text-navy' : 'text-gray-600'}`}>
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

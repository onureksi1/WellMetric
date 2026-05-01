'use client';

import React from 'react';
import { SurveyQuestion } from '@/types/survey.types';

interface NumberInputQuestionProps {
  question: SurveyQuestion;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function NumberInputQuestion({ question, value, onChange, disabled }: NumberInputQuestionProps) {
  const min = question.number_min ?? 0;
  const max = question.number_max ?? 100;
  const step = question.number_step ?? 1;

  return (
    <div className="space-y-8 py-6 max-w-sm mx-auto">
      <div className="text-center">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full text-5xl font-black text-navy text-center bg-transparent border-b-4 border-gray-100 focus:border-primary outline-none py-4 transition-colors"
          placeholder="0"
        />
      </div>
      
      <div className="space-y-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value ?? min}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter">
          <span>Min: {min}</span>
          <span>Max: {max}</span>
        </div>
      </div>
    </div>
  );
}

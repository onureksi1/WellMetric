'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface LikertQuestionProps {
  max: 5 | 10;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

const EMOJIS = ['😔', '😕', '😐', '🙂', '😊'];

export function LikertQuestion({ max, value, onChange, disabled }: LikertQuestionProps) {
  const items = Array.from({ length: max }, (_, i) => i + 1);

  if (max === 5) {
    return (
      <div className="flex justify-between items-center max-w-sm mx-auto py-4">
        {items.map((num) => {
          const isSelected = value === num;
          return (
            <motion.button
              key={num}
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange(num)}
              disabled={disabled}
              className={`
                w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all
                ${isSelected ? 'bg-primary/10 border-4 border-primary shadow-lg ring-4 ring-primary/10' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              aria-label={`Rating ${num}`}
            >
              {EMOJIS[num - 1]}
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 py-4">
      {items.map((num) => {
        const isSelected = value === num;
        // Gradient from red to green
        const getBgColor = (n: number) => {
          if (n <= 3) return isSelected ? 'bg-red-500' : 'bg-red-50';
          if (n <= 7) return isSelected ? 'bg-yellow-500' : 'bg-yellow-50';
          return isSelected ? 'bg-green-500' : 'bg-green-50';
        };

        return (
          <motion.button
            key={num}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(num)}
            disabled={disabled}
            className={`
              h-12 flex items-center justify-center rounded-xl font-black text-sm transition-all border-2
              ${isSelected ? 'text-white border-transparent shadow-md' : 'text-gray-400 border-transparent hover:border-gray-200'}
              ${getBgColor(num)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {num}
          </motion.button>
        );
      })}
    </div>
  );
}

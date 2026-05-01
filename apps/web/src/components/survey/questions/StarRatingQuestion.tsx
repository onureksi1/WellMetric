'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StarRatingQuestionProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function StarRatingQuestion({ value, onChange, disabled }: StarRatingQuestionProps) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex gap-2 justify-center py-4">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hover || value || 0) >= star;
        return (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.2, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => !disabled && setHover(star)}
            onMouseLeave={() => !disabled && setHover(null)}
            onClick={() => onChange(star)}
            disabled={disabled}
            className={`p-1 transition-colors ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Star
              size={44}
              className={`transition-all duration-300 ${
                isFilled ? 'fill-[#FFD700] text-[#FFD700]' : 'text-gray-200 fill-transparent'
              }`}
            />
          </motion.button>
        );
      })}
    </div>
  );
}

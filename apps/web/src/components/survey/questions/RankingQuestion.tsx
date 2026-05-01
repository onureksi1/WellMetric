'use client';

import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { SurveyQuestion } from '@/types/survey.types';

interface RankingQuestionProps {
  question: SurveyQuestion;
  value: string[];
  onChange: (val: string[]) => void;
  language: 'tr' | 'en';
  disabled?: boolean;
}

export function RankingQuestion({ question, value = [], onChange, language, disabled }: RankingQuestionProps) {
  const options = question.options || [];
  
  // Local state to manage order
  const [items, setItems] = useState(() => {
    if (value.length > 0) {
      return value.map(id => options.find(o => o.id === id)!).filter(Boolean);
    }
    return [...options].sort((a, b) => a.order_index - b.order_index);
  });

  const handleReorder = (newOrder: any[]) => {
    setItems(newOrder);
    onChange(newOrder.map(i => i.id));
  };

  const move = (idx: number, dir: number) => {
    const newItems = [...items];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    [newItems[idx], newItems[targetIdx]] = [newItems[targetIdx], newItems[idx]];
    handleReorder(newItems);
  };

  return (
    <div className="py-4">
      <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-3">
        {items.map((item, idx) => {
          const label = language === 'tr' ? item.label_tr : (item.label_en || item.label_tr);
          return (
            <Reorder.Item 
              key={item.id} 
              value={item}
              dragListener={!disabled}
              className={`
                flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl shadow-sm cursor-grab active:cursor-grabbing
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="text-gray-300 flex-shrink-0"><GripVertical size={20} /></div>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                {idx + 1}
              </div>
              <span className="flex-1 font-bold text-navy">{label}</span>
              
              <div className="flex flex-col gap-1 sm:hidden">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="p-1 text-gray-300"><ArrowUp size={16} /></button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-1 text-gray-300"><ArrowDown size={16} /></button>
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}

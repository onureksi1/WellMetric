'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { SurveyQuestion } from '@/types/survey.types';

interface MatrixQuestionProps {
  question: SurveyQuestion;
  value: Record<string, number>;
  onChange: (val: Record<string, number>) => void;
  language: 'tr' | 'en';
  disabled?: boolean;
}

export function MatrixQuestion({ question, value = {}, onChange, language, disabled }: MatrixQuestionProps) {
  const isTr = language === 'tr';
  const rows = question.rows || [];

  const handleRowVal = (rowId: string, val: number) => {
    onChange({ ...value, [rowId]: val });
  };

  return (
    <div className="py-4 space-y-8">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto rounded-3xl border border-gray-100">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="p-6 font-black text-xs text-gray-400 uppercase tracking-widest min-w-[200px]">
                {isTr ? question.matrix_label_tr : (question.matrix_label_en || question.matrix_label_tr)}
              </th>
              {[1, 2, 3, 4, 5].map(n => (
                <th key={n} className="p-6 text-center font-black text-navy">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/30 transition-colors">
                <td className="p-6 font-bold text-navy">{isTr ? row.label_tr : (row.label_en || row.label_tr)}</td>
                {[1, 2, 3, 4, 5].map(n => {
                  const isSelected = value[row.id] === n;
                  return (
                    <td key={n} className="p-6 text-center">
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleRowVal(row.id, n)}
                        disabled={disabled}
                        className={`
                          w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center
                          ${isSelected ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 border-transparent hover:border-gray-200'}
                        `}
                      >
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </motion.button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-6">
        {rows.map((row) => {
          const rowVal = value[row.id];
          return (
            <div key={row.id} className="space-y-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
              <p className="font-bold text-navy leading-tight">{isTr ? row.label_tr : (row.label_en || row.label_tr)}</p>
              <div className="flex justify-between items-center bg-gray-50 p-2 rounded-2xl">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleRowVal(row.id, n)}
                    disabled={disabled}
                    className={`
                      w-10 h-10 rounded-xl font-black text-sm transition-all
                      ${rowVal === n ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:bg-gray-100'}
                    `}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

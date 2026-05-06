'use client';
import React, { useState } from 'react';

import { Trash2, Eye, Plus, GripVertical, X } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { QuestionPreviewModal } from './QuestionPreviewModal';

const getQuestionTypes = (t: any) => [
  { value: 'likert5', label: t('surveys.new.question.types.likert5') },
  { value: 'likert10', label: t('surveys.new.question.types.likert10') },
  { value: 'star_rating', label: t('surveys.new.question.types.star_rating') },
  { value: 'yes_no', label: t('surveys.new.question.types.yes_no') },
  { value: 'nps', label: t('surveys.new.question.types.nps') },
  { value: 'number_input', label: t('surveys.new.question.types.number_input') },
  { value: 'single_choice', label: t('surveys.new.question.types.single_choice') },
  { value: 'multi_choice', label: t('surveys.new.question.types.multi_choice') },
  { value: 'ranking', label: t('surveys.new.question.types.ranking') },
  { value: 'matrix', label: t('surveys.new.question.types.matrix') },
  { value: 'open_text', label: t('surveys.new.question.types.open_text') },
];

const getDimensions = (tc: any) => [
  { value: 'overall', label: tc('dimensions.overall') },
  { value: 'physical', label: tc('dimensions.physical') },
  { value: 'mental', label: tc('dimensions.mental') },
  { value: 'social', label: tc('dimensions.social') },
  { value: 'financial', label: tc('dimensions.financial') },
  { value: 'work', label: tc('dimensions.work') },
];


export function QuestionBuilder({ index, remove, control }: any) {
  const { t, tc } = useT('consultant');
  const { register, watch } = useFormContext();
  const [previewOpen, setPreviewOpen] = useState(false);

  const QUESTION_TYPES = getQuestionTypes(t);
  const DIMENSIONS = getDimensions(tc);

  const qType = watch(`questions.${index}.question_type`);
  const currentQuestionData = watch(`questions.${index}`); // For preview modal


  const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `questions.${index}.options`
  });

  const { fields: rows, append: appendRow, remove: removeRow } = useFieldArray({
    control,
    name: `questions.${index}.rows`
  });

  const isScorable = ['likert5', 'likert10', 'star_rating', 'yes_no', 'nps', 'number_input', 'single_choice', 'matrix'].includes(qType);
  const hasOptions = ['single_choice', 'multi_choice', 'ranking'].includes(qType);
  const isMatrix = qType === 'matrix';
  const isNumber = qType === 'number_input';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative group overflow-hidden transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-100 group-hover:bg-primary transition-colors" />
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 pl-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
            {index + 1}
          </span>
          <select 
            {...register(`questions.${index}.question_type`)}
            className="flex-1 bg-gray-50 border-none font-bold text-navy py-2 px-3 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          >
            {QUESTION_TYPES.map(qt => (
              <option key={qt.value} value={qt.value}>{qt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button 
            type="button" 
            onClick={() => setPreviewOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Eye size={16} /> {t('surveys.new.question.preview')}
          </button>

          <button 
            type="button" 
            onClick={() => remove(index)}
            className="p-1.5 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-6 pl-4">
        {/* Main Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.question.tr_label')}</label>
            <textarea 
              {...register(`questions.${index}.question_text_tr`)}
              placeholder={t('surveys.new.question.tr_placeholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.question.en_label')}</label>
            <textarea 
              {...register(`questions.${index}.question_text_en`)}
              placeholder={t('surveys.new.question.en_placeholder')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              rows={2}
            />
          </div>
        </div>


        {/* Matrix Specific */}
        {isMatrix && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">{t('surveys.new.question.matrix_tr_label')}</label>
               <input {...register(`questions.${index}.matrix_label_tr`)} placeholder={t('surveys.new.question.matrix_tr_placeholder')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500">{t('surveys.new.question.matrix_en_label')}</label>
               <input {...register(`questions.${index}.matrix_label_en`)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        )}


        {/* Number Input Specific */}
        {isNumber && (
          <div className="flex flex-wrap gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
             <div className="space-y-1 flex-1 min-w-[100px]">
               <label className="text-xs font-bold text-blue-700">{t('surveys.new.question.min_val')}</label>
               <input type="number" {...register(`questions.${index}.number_min`, { valueAsNumber: true })} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
             </div>
             <div className="space-y-1 flex-1 min-w-[100px]">
               <label className="text-xs font-bold text-blue-700">{t('surveys.new.question.max_val')}</label>
               <input type="number" {...register(`questions.${index}.number_max`, { valueAsNumber: true })} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
             </div>
             <div className="space-y-1 flex-1 min-w-[100px]">
               <label className="text-xs font-bold text-blue-700">{t('surveys.new.question.step_val')}</label>
               <input type="number" {...register(`questions.${index}.number_step`, { valueAsNumber: true })} defaultValue={1} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
             </div>
          </div>
        )}


        {/* Dynamic Options Builder */}
        {hasOptions && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.question.options_label')}</label>
              <span className="text-[10px] text-gray-400 font-medium">
                {qType === 'single_choice' ? t('surveys.new.question.options_hint_scorable') : t('surveys.new.question.options_hint_not_scorable')}
              </span>
            </div>

            
            <div className="space-y-2">
              {options.map((opt, optIndex) => (
                <div key={opt.id} className="flex gap-2 items-center group/opt">
                  <div className="cursor-grab text-gray-300 hover:text-gray-500"><GripVertical size={16} /></div>
                  <input {...register(`questions.${index}.options.${optIndex}.label_tr`)} placeholder="TR Seçenek" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary" />
                  <input {...register(`questions.${index}.options.${optIndex}.label_en`)} placeholder="EN Option" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary" />
                  <input type="number" {...register(`questions.${index}.options.${optIndex}.value`, { valueAsNumber: true })} placeholder="Değer" className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary text-center font-bold" />
                  <button type="button" onClick={() => removeOption(optIndex)} className="text-gray-300 hover:text-danger p-1"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => appendOption({ label_tr: '', label_en: '', value: 0, order_index: options.length + 1 })}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80"
            >
              <Plus size={16} /> {t('surveys.new.question.add_option')}
            </button>

          </div>
        )}

        {/* Dynamic Rows Builder for Matrix */}
        {isMatrix && (
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.question.matrix_rows_label')}</label>
              <span className="text-[10px] text-gray-400 font-medium">{t('surveys.new.question.matrix_rows_hint')}</span>
            </div>

            
            <div className="space-y-2">
              {rows.map((row, rowIndex) => (
                <div key={row.id} className="flex flex-wrap gap-2 items-center group/row p-2 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div className="cursor-grab text-gray-300 hover:text-gray-500"><GripVertical size={16} /></div>
                  <input {...register(`questions.${index}.rows.${rowIndex}.label_tr`)} placeholder="TR İfade" className="flex-[2] min-w-[150px] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  <input {...register(`questions.${index}.rows.${rowIndex}.label_en`)} placeholder="EN Statement" className="flex-[2] min-w-[150px] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary" />
                  
                  <select {...register(`questions.${index}.rows.${rowIndex}.dimension`)} className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none">
                    {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label.split(' ')[0]}</option>)}
                  </select>
                  
                  <label className="flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 px-2 py-2 rounded-lg cursor-pointer">
                    <input type="checkbox" {...register(`questions.${index}.rows.${rowIndex}.is_reversed`)} className="rounded text-primary" /> Ters?
                  </label>
                  
                  <input type="number" step="0.1" {...register(`questions.${index}.rows.${rowIndex}.weight`, { valueAsNumber: true })} className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-2 text-xs outline-none text-center" title="Ağırlık" />
                  
                  <button type="button" onClick={() => removeRow(rowIndex)} className="text-gray-300 hover:text-danger p-1"><X size={16} /></button>
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={() => appendRow({ label_tr: '', label_en: '', dimension: 'overall', is_reversed: false, weight: 1.0, order_index: rows.length + 1 })}
              className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80"
            >
              <Plus size={16} /> {t('surveys.new.question.add_row')}
            </button>
          </div>
        )}


        {/* Global Question Settings Footer */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-gray-100">
           {!isMatrix && (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-gray-400 uppercase">{t('surveys.new.question.dimension')}:</span>
               <select {...register(`questions.${index}.dimension`)} className="bg-gray-50 border-none text-xs font-bold text-navy py-1.5 px-2 rounded-md outline-none cursor-pointer">
                 {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
               </select>
             </div>
           )}

           {isScorable && (
             <label className="flex items-center gap-2 cursor-pointer group/rev">
               <input type="checkbox" {...register(`questions.${index}.is_reversed`)} className="rounded text-primary focus:ring-primary h-4 w-4" />
               <span className="text-xs font-bold text-gray-500 group-hover/rev:text-navy transition-colors">{t('surveys.new.question.reversed_label')}</span>
             </label>
           )}


           <div className="flex items-center gap-2 ml-auto">
             <span className="text-xs font-bold text-gray-400 uppercase">{t('surveys.new.question.weight_label')}</span>
             <input type="number" step="0.1" {...register(`questions.${index}.weight`, { valueAsNumber: true })} className="w-16 bg-gray-50 border border-gray-200 rounded text-xs px-2 py-1 outline-none focus:border-primary text-center font-bold" />
           </div>


           <label className="flex items-center gap-2 cursor-pointer border-l border-gray-200 pl-4">
             <span className="text-xs font-bold text-gray-500">{t('surveys.new.question.required_label')}</span>
             <div className={`w-8 h-4 rounded-full relative ${watch(`questions.${index}.is_required`) ? 'bg-primary' : 'bg-gray-300'}`}>
               <input type="checkbox" {...register(`questions.${index}.is_required`)} className="hidden" />
               <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${watch(`questions.${index}.is_required`) ? 'left-4' : 'left-0.5'}`} />
             </div>
           </label>

        </div>
      </div>

      <QuestionPreviewModal 
        isOpen={previewOpen} 
        onClose={() => setPreviewOpen(false)} 
        question={currentQuestionData} 
      />
    </div>
  );
}


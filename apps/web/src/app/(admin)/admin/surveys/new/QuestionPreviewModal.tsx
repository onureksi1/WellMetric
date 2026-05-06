'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';


export function QuestionPreviewModal({ isOpen, onClose, question }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const [val, setVal] = useState<any>(null);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-navy">{t('admin.surveys.question.preview_modal.title', 'Soru Önizleme')}</h3>
            <p className="text-sm text-gray-500">{t('admin.surveys.question.preview_modal.subtitle', 'Çalışanın ekranında böyle görünecek.')}</p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-gray-50/50">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <h2 className="text-lg sm:text-xl font-bold text-navy text-center mb-8">
              {question.question_text_tr || t('admin.surveys.question.preview_modal.empty_text', 'Soru metni girilmedi...')}
            </h2>

            
            <QuestionRenderer 
              question={question} 
              value={val} 
              onChange={setVal} 
              language="tr" 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t('common.close', 'Kapat')}
          </button>

        </div>

      </div>
    </div>
  );
}

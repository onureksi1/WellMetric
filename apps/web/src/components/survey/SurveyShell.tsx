'use client';

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { ProgressSteps } from './ProgressSteps';
import { LikertQuestion } from './questions/LikertQuestion';
import { OpenTextQuestion } from './questions/OpenTextQuestion';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Check, Send, AlertTriangle, Zap, Clock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Question {
  id: string;
  dimension: string;
  text_tr: string;
  text_en: string;
  type: 'scale_5' | 'open_text';
  is_required: boolean;
}

interface SurveyShellProps {
  questions: Question[];
  onSubmit: (answers: any) => Promise<void>;
  onDraftSave?: (answers: any, dimension: number) => void;
  initialAnswers?: Record<string, number | string>;
  initialDimension?: number;
  language: 'tr' | 'en';
  isAnonymous: boolean;
  companyName: string;
  surveyTitle: string;
  fullName?: string;
}

const dimensions = [
  { id: 'physical', label: 'Fiziksel', icon: '💪', color: 'text-green-500' },
  { id: 'mental', label: 'Zihinsel', icon: '🧠', color: 'text-purple-500' },
  { id: 'social', label: 'Sosyal', icon: '🤝', color: 'text-blue-500' },
  { id: 'financial', label: 'Finansal', icon: '💰', color: 'text-emerald-500' },
  { id: 'work', label: 'İş & Anlam', icon: '✨', color: 'text-amber-500' },
];

export const SurveyShell = ({
  questions,
  onSubmit,
  onDraftSave,
  initialAnswers = {},
  initialDimension = 0,
  language,
  isAnonymous,
  companyName,
  surveyTitle,
  fullName
}: SurveyShellProps) => {
  const [step, setStep] = useState<'welcome' | 'filling' | 'confirm' | 'success'>('welcome');
  const [currentDimensionIdx, setCurrentDimensionIdx] = useState(initialDimension);
  const [answers, setAnswers] = useState<Record<string, number | string>>(initialAnswers);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentDimension = dimensions[currentDimensionIdx];
  const dimensionQuestions = questions.filter(q => q.dimension === currentDimension.id);

  // Auto-save draft
  useEffect(() => {
    if (step === 'filling') {
      onDraftSave?.(answers, currentDimensionIdx);
    }
  }, [answers, currentDimensionIdx, step]);

  const handleAnswerChange = (qId: string, value: number | string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    setErrors(prev => prev.filter(id => id !== qId));
  };

  const validateStep = () => {
    const missing = dimensionQuestions
      .filter(q => q.is_required && !answers[q.id])
      .map(q => q.id);
    setErrors(missing);
    return missing.length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (currentDimensionIdx < dimensions.length - 1) {
      setCurrentDimensionIdx(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setStep('confirm');
    }
  };

  const prevStep = () => {
    if (currentDimensionIdx > 0) {
      setCurrentDimensionIdx(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
      setStep('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2E865A', '#4CAF7D', '#1A1A2E']
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-50">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl w-full glass-card rounded-[40px] p-8 md:p-12 text-center relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <div className="h-24 w-24 premium-gradient rounded-3xl flex items-center justify-center text-white mx-auto mb-10 shadow-xl shadow-primary/20 rotate-3">
             <Zap size={48} />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-navy mb-6 tracking-tight leading-[1.1]">
            {surveyTitle}
          </h1>
          
          <div className="text-lg text-slate-500 mb-10 space-y-2">
            <p>Merhaba <span className="text-navy font-black">{fullName || 'Çalışanımız'}</span> 👋</p>
            <p className="text-sm font-medium">
              <span className="text-primary font-bold">{companyName}</span> esenlik yolculuğuna hoş geldiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left">
             <div className="p-5 rounded-3xl bg-white/50 border border-white shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy uppercase tracking-widest leading-none mb-1">Süre</p>
                  <p className="text-sm font-medium text-slate-500 leading-none">~5-7 Dakika</p>
                </div>
             </div>
             <div className="p-5 rounded-3xl bg-white/50 border border-white shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/5 text-blue-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-navy uppercase tracking-widest leading-none mb-1">Gizlilik</p>
                  <p className="text-sm font-medium text-slate-500 leading-none">Tam Anonim</p>
                </div>
             </div>
          </div>

          <Button variant="primary" size="xl" className="w-full rounded-[24px] hover-lift" onClick={() => setStep('filling')}>
            BAŞLAYALIM <ArrowRight size={22} className="ml-2" />
          </Button>
          
          <p className="mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            POWERED BY WELLBEING METRIC ENGINE
          </p>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const totalAnswered = questions.filter(q => !!answers[q.id]).length;
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-xl w-full glass-card rounded-[40px] p-10 text-center animate-in zoom-in duration-500">
           <div className="h-24 w-24 bg-amber-500/10 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8">
              <Send size={48} />
           </div>
           <h2 className="text-3xl font-black text-navy mb-4 tracking-tight">Tamamlamak Üzeresiniz</h2>
           <p className="text-slate-500 mb-10 leading-relaxed">Yanıtlarınız tamamen anonim olarak kaydedilecektir. Onayladıktan sonra değişiklik yapamazsınız.</p>
           
           <div className="p-8 bg-white/50 rounded-[32px] border border-white shadow-sm mb-10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Katılım Özeti</p>
              <p className="text-3xl font-black text-navy tracking-tighter">{totalAnswered} / {questions.length} Soru Tamamlandı</p>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="py-4 rounded-2xl" onClick={() => setStep('filling')}>GÖZDEN GEÇİR</Button>
              <Button variant="primary" className="py-4 rounded-2xl" onClick={handleFinalSubmit} loading={isSubmitting}>GÖNDER ✓</Button>
           </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center animate-in fade-in zoom-in duration-500">
         <div className="h-24 w-24 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/40">
            <Check size={48} strokeWidth={3} />
         </div>
         <h1 className="text-3xl font-black text-navy mb-4">Teşekkürler!</h1>
         <p className="text-lg text-gray-500 mb-8 leading-relaxed">
            Wellbeing anketini başarıyla tamamladınız. <br /> Katılımınız daha sağlıklı bir çalışma ortamı için çok değerli.
         </p>
         <p className="text-xs text-gray-400 font-medium">Bu pencereyi kapatabilirsiniz.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="space-y-6 sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-4 z-40">
        <ProgressSteps 
          current={currentDimensionIdx} 
          total={dimensions.length} 
          labels={dimensions.map(d => d.label)} 
        />
        <div className="flex items-center gap-4">
           <span className="text-4xl">{currentDimension.icon}</span>
           <div>
             <h2 className={clsx('text-xl font-black uppercase tracking-tight', currentDimension.color)}>
               {currentDimension.label} Wellbeing
             </h2>
             <p className="text-xs text-gray-400 font-medium">Lütfen aşağıdaki ifadelerin size ne kadar uygun olduğunu belirtin.</p>
           </div>
        </div>
      </header>

      {/* Questions */}
      <div className="space-y-6">
        {dimensionQuestions.map((q) => (
          <div key={q.id} className="space-y-4">
            <div className="flex gap-4 items-start">
              <span className="text-primary font-black text-lg">Q.</span>
              <h3 className="text-lg font-bold text-navy leading-snug">
                {language === 'tr' ? q.text_tr : q.text_en}
                {q.is_required && <span className="text-red-500 ml-1">*</span>}
              </h3>
            </div>
            {q.type === 'scale_5' ? (
              <LikertQuestion 
                max={5}
                value={answers[q.id] as number}
                onChange={(val) => handleAnswerChange(q.id, val)}
              />
            ) : (
              <OpenTextQuestion 
                value={answers[q.id] as string}
                onChange={(val) => handleAnswerChange(q.id, val)}
                language={language}
              />
            )}
            {errors.includes(q.id) && (
              <p className="text-red-500 text-xs font-bold animate-pulse">Lütfen bu soruyu yanıtlayın.</p>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-8 border-t border-gray-100 pb-20">
        <Button 
          variant="ghost" 
          onClick={prevStep} 
          disabled={currentDimensionIdx === 0}
          className="px-6 gap-2"
        >
          <ArrowLeft size={18} /> Geri
        </Button>
        <Button 
          onClick={nextStep} 
          className="px-10 gap-2 font-black shadow-lg shadow-primary/20"
        >
          {currentDimensionIdx === dimensions.length - 1 ? 'Bitir' : 'İleri'} 
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
};

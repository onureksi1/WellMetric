'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Send,
  Loader2,
  ShieldCheck,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import client from '@/lib/api/client';
import { SurveyTokenResponse, SurveyQuestion, DimensionType } from '@/types/survey.types';
import { SurveyProgress } from '@/components/survey/SurveyProgress';
import { QuestionRenderer } from '@/components/survey/QuestionRenderer';
import { buildSubmitDto } from '@/lib/survey/answer-builder';
import '@/lib/i18n';

type Phase = 'loading' | 'welcome' | 'survey' | 'submitting' | 'success' | 'error';
type ErrorType = 'used' | 'expired' | 'invalid' | null;

const DIMENSION_ICONS: Record<string, string> = {
  physical: '💪',
  mental: '🧠',
  social: '🤝',
  financial: '💰',
  work: '✨',
  overall: '🌱'
};

export default function PublicSurveyPage() {
  const { token } = useParams() as { token: string };
  const router = useRouter();
  const { t, i18n } = useTranslation('survey');
  
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [surveyData, setSurveyData] = useState<SurveyTokenResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentDimIndex, setCurrentDimIndex] = useState(0);
  const [completedDims, setCompletedDims] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const lang = (surveyData?.token?.language || 'tr') as 'tr' | 'en';

  useEffect(() => {
    fetchSurvey();
  }, [token]);

  // Sync i18n language with token language
  useEffect(() => {
    if (surveyData?.token?.language) {
      i18n.changeLanguage(surveyData.token.language);
    }
  }, [surveyData, i18n]);

  const fetchSurvey = async () => {
    try {
      setPhase('loading');
      const { data } = await client.get(`/public/survey-tokens/${token}`);
      setSurveyData(data);
      
      // Check for draft
      const draft = localStorage.getItem(`survey_draft_${token}`);
      if (draft) {
        const parsed = JSON.parse(draft);
        setAnswers(parsed.answers || {});
      }
      
      setPhase('welcome');
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'SURVEY_TOKEN_USED') setErrorType('used');
      else if (code === 'SURVEY_TOKEN_EXPIRED') setErrorType('expired');
      else setErrorType('invalid');
      setPhase('error');
    }
  };

  const dimensions = useMemo(() => {
    if (!surveyData) return [];
    return Array.from(new Set(surveyData.survey.questions.map(q => q.dimension)));
  }, [surveyData]);

  const currentQuestions = useMemo(() => {
    if (!surveyData || dimensions.length === 0) return [];
    return surveyData.survey.questions.filter(q => q.dimension === dimensions[currentDimIndex]);
  }, [surveyData, dimensions, currentDimIndex]);

  const saveDraft = (newAnswers: Record<string, any>) => {
    localStorage.setItem(`survey_draft_${token}`, JSON.stringify({
      answers: newAnswers,
      currentDimIndex
    }));
  };

  const handleAnswer = (questionId: string, val: any) => {
    const newAnswers = { ...answers, [questionId]: val };
    setAnswers(newAnswers);
    saveDraft(newAnswers);
  };

  const validateCurrentSection = () => {
    const missingRequired = currentQuestions.filter(q => q.is_required && !answers[q.id]);
    if (missingRequired.length > 0) {
      toast.error(t('survey.question.required'));
      return false;
    }
    return true;
  };

  const nextSection = () => {
    if (!validateCurrentSection()) return;
    
    setCompletedDims(prev => Array.from(new Set([...prev, currentDimIndex])));
    if (currentDimIndex < dimensions.length - 1) {
      setCurrentDimIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowConfirm(true);
    }
  };

  const prevSection = () => {
    if (currentDimIndex > 0) {
      setCurrentDimIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    try {
      setPhase('submitting');
      const dto = buildSubmitDto(answers, surveyData!.survey.questions);
      await client.post(`/public-survey/${token}/submit`, dto);
      
      setPhase('success');
      localStorage.removeItem(`survey_draft_${token}`);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#2E865A', '#4CAF7D', '#1A5C3A', '#FFD700', '#FF6B6B']
      });
    } catch (err) {
      toast.error(t('survey.errors.submit_failed'));
      setPhase('survey');
    }
  };

  if (phase === 'loading') {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
            <Loader2 size={40} className="text-primary animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-navy">Wellbeing Metric</h2>
            <p className="text-gray-400 mt-2 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          {errorType === 'used' && (
            <>
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-2xl font-black text-navy">{t('survey.success.title', { name: '' })}</h2>
              <p className="text-gray-500 leading-relaxed">
                {t('survey.errors.token_used')}
              </p>
            </>
          )}
          {errorType === 'expired' && (
            <>
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto">
                <Clock size={48} />
              </div>
              <h2 className="text-2xl font-black text-navy">{t('survey.errors.token_expired_title', 'Süre Doldu')}</h2>
              <p className="text-gray-500">
                {t('survey.errors.token_expired')}
              </p>
            </>
          )}
          {errorType === 'invalid' && (
            <>
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={48} />
              </div>
              <h2 className="text-2xl font-black text-navy">{t('survey.errors.token_invalid_title', 'Geçersiz Bağlantı')}</h2>
              <p className="text-gray-500">
                {t('survey.errors.token_invalid')}
              </p>
            </>
          )}
          <div className="pt-4 border-t border-gray-100">
             <p className="text-xs text-gray-400 font-medium">Wellbeing Metric Wellbeing Platform</p>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'welcome') {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col p-4 sm:p-6">
        <header className="flex justify-between items-center max-w-4xl mx-auto w-full mb-6 sm:mb-12">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl" />
             <span className="font-black text-navy tracking-tight text-sm sm:text-base">WELLBEING METRIC</span>
           </div>
           {surveyData?.company.logo_url && <img src={surveyData.company.logo_url} className="h-7 sm:h-8 object-contain" alt="Company" />}
        </header>

        <main className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[2rem] shadow-xl border border-gray-100 max-w-lg w-full p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-2 bg-primary/20" />

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-wider">
                {t('survey.welcome.title')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-navy">
                {t('survey.welcome.greeting', { name: '' })}
              </h1>
              <p className="text-gray-500 font-medium">
                {t('survey.welcome.intro', { company_name: surveyData?.company.name })}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-1">
                <Timer size={20} className="mx-auto text-primary" />
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t('survey.welcome.duration_label', 'Süre')}</p>
                <p className="text-sm font-black text-navy">{t('survey.welcome.duration', { minutes: 5 })}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-1">
                <ShieldCheck size={20} className="mx-auto text-primary" />
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t('survey.welcome.privacy_label', 'Gizlilik')}</p>
                <p className="text-sm font-black text-navy">{t('survey.welcome.anonymous')}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl text-center space-y-1">
                <div className="text-sm font-black text-primary mx-auto">{dimensions.length}</div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">{t('survey.welcome.sections_label', 'Bölüm')}</p>
                <p className="text-sm font-black text-navy">{t('survey.welcome.sections', { count: dimensions.length })}</p>
              </div>
            </div>

            <button 
              onClick={() => setPhase('survey')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('survey.welcome.start')} <ArrowRight size={20} />
            </button>
          </motion.div>
        </main>

        <footer className="text-center py-4 sm:py-8 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
           {t('survey.welcome.powered_by', 'Powered by Wellbeing Metric 🌱')}
        </footer>
      </div>
    );
  }

  if (phase === 'survey') {
    const currentDim = dimensions[currentDimIndex];
    const totalQuestions = surveyData?.survey.questions.length || 0;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-30">
          <SurveyProgress
            dimensions={dimensions}
            currentIndex={currentDimIndex}
            completedDimensions={completedDims}
            language={lang}
          />
        </div>

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 pt-4 pb-32 touch-pan-y">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentDim}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Dimension Header */}
              <div className="text-center py-4 sm:py-6">
                <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{DIMENSION_ICONS[currentDim]}</div>
                <h2 className="text-2xl sm:text-3xl font-black text-navy capitalize">
                  {t(`dimensions.${currentDim}.title`, currentDim)}
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                  {t(`dimensions.${currentDim}.description`, 'Lütfen soruları içtenlikle yanıtlayın.')}
                </p>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {currentQuestions.map((q, idx) => {
                  const questionText = (lang === 'en' && q.question_text_en) ? q.question_text_en : q.question_text_tr;
                  
                  return (
                    <motion.div 
                      key={q.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
                    >
                      <div className="flex gap-4 items-start mb-6">
                        <span className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center font-black text-sm flex-shrink-0">
                          {idx + 1}
                        </span>
                        <h3 className="text-lg font-bold text-navy leading-snug">
                          {questionText}
                          {q.is_required && <span className="text-danger ml-1">*</span>}
                        </h3>
                      </div>

                      <QuestionRenderer 
                        question={q} 
                        value={answers[q.id]} 
                        onChange={(val) => handleAnswer(q.id, val)}
                        language={lang}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] z-40">
           <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4">
              {currentDimIndex > 0 && (
                <button 
                  onClick={prevSection}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold border-2 border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeft size={18} /> {t('survey.navigation.previous')}
                </button>
              )}
              <button 
                onClick={nextSection}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {currentDimIndex === dimensions.length - 1 ? t('survey.navigation.submit') : t('survey.navigation.next')} <ArrowRight size={18} />
              </button>
           </div>
        </div>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/60 backdrop-blur-sm">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-3xl max-w-sm w-full p-8 text-center space-y-6 shadow-2xl"
             >
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                  <Send size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-navy">{t('survey.confirmation.title')}</h3>
                  <p className="text-gray-500 text-sm">
                    {t('survey.confirmation.desc', 'Tüm bölümleri tamamladınız. Yanıtlarınızı kaydetmek için onaylayın.')}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={handleSubmit} className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">{t('survey.confirmation.submit')}</button>
                  <button onClick={() => setShowConfirm(false)} className="w-full py-3.5 bg-gray-50 text-gray-500 rounded-2xl font-bold">{t('survey.confirmation.review')}</button>
                </div>
             </motion.div>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="text-primary animate-spin mx-auto" />
          <p className="font-bold text-navy">{t('submitting')}</p>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col p-6">
        <main className="flex-1 flex items-center justify-center">
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="text-center max-w-lg space-y-6 sm:space-y-8 px-2"
           >
              <div className="text-7xl sm:text-8xl">🎉</div>
              <div className="space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-4xl font-black text-navy">{t('survey.success.title', { name: '' })}</h1>
                <p className="text-xl text-gray-500 font-medium">
                  {t('survey.success.message')} {t('survey.success.impact')}
                </p>
              </div>
              <div className="p-6 bg-green-50 rounded-3xl border border-green-100">
                <p className="text-sm text-green-700 font-bold">
                  {t('survey.success.anonymous_note')}
                </p>
              </div>
              <button 
                onClick={() => window.close()}
                className="px-8 py-3 bg-gray-100 text-navy rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                {t('survey.success.close')}
              </button>
           </motion.div>
        </main>
      </div>
    );
  }

  return null;
}

function Card({ children, className }: any) {
  return (
    <div className={`bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

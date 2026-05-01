'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SurveyShell } from '@/components/survey/SurveyShell';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function PublicSurveyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-navy">Yükleniyor...</div>}>
      <PublicSurveyContent />
    </Suspense>
  );
}

function PublicSurveyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [isUsed, setIsUsed] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Geçersiz bağlantı.');
      setLoading(false);
      return;
    }

    const fetchSurvey = async () => {
      try {
        // Mocking for now
        setTimeout(() => {
          const mockData = {
            id: 's1',
            title: 'Nisan 2026 Genel Esenlik Anketi',
            company_name: 'Global Tech',
            full_name: 'Ayşe Yılmaz',
            language: 'tr',
            is_used: false,
            questions: [
              { id: 'q1', dimension: 'physical', text_tr: 'Genel olarak fiziksel sağlığımı iyi hissediyorum.', type: 'scale_5', is_required: true },
              { id: 'q2', dimension: 'mental', text_tr: 'İş yerinde kendimi stresli hissediyorum.', type: 'scale_5', is_required: true },
              { id: 'q3', dimension: 'social', text_tr: 'Ekip arkadaşlarımla aramdaki iletişimden memnunum.', type: 'scale_5', is_required: true },
              { id: 'q4', dimension: 'financial', text_tr: 'Ekonomik durumumun geleceği hakkında endişeliyim.', type: 'scale_5', is_required: true },
              { id: 'q5', dimension: 'work', text_tr: 'Yaptığım işin topluma fayda sağladığını düşünüyorum.', type: 'scale_5', is_required: true },
              { id: 'q6', dimension: 'mental', text_tr: 'Bize iletmek istediğiniz başka bir şey var mı?', type: 'open_text', is_required: false },
            ]
          };
          
          if (mockData.is_used) setIsUsed(true);
          setSurveyData(mockData);
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Bağlantı doğrulanamadı.');
        setLoading(false);
      }
    };

    fetchSurvey();
  }, [token]);

  const handleSubmit = async (answers: any): Promise<void> => {
    console.log('Submitting answers for token', token, answers);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleDraftSave = (answers: any, dimension: number) => {
    localStorage.setItem(`draft_${token}`, JSON.stringify({ answers, dimension, timestamp: Date.now() }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-primary/20 animate-pulse">
           W
        </div>
        <div className="flex items-center gap-2 text-navy font-bold text-sm">
           <Loader2 className="animate-spin" size={18} />
           Anket yükleniyor...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
         <div className="h-16 w-16 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} />
         </div>
         <h1 className="text-xl font-bold text-navy mb-2">Bağlantı Geçersiz</h1>
         <p className="text-gray-500 text-sm mb-8">Bu link geçersiz, süresi dolmuş veya hatalı. Lütfen İK departmanınızla iletişime geçin.</p>
      </div>
    );
  }

  if (isUsed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
         <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 size={32} />
         </div>
         <h1 className="text-xl font-bold text-navy mb-2">Zaten Tamamlandı</h1>
         <p className="text-gray-500 text-sm mb-8">Bu anketi daha önce doldurdunuz. Katılımınız için teşekkür ederiz!</p>
      </div>
    );
  }

  const draftStr = typeof window !== 'undefined' ? localStorage.getItem(`draft_${token}`) : null;
  const draft = draftStr ? JSON.parse(draftStr) : null;

  return (
    <div className="min-h-screen bg-white">
      <SurveyShell 
        questions={surveyData.questions}
        onSubmit={handleSubmit}
        onDraftSave={handleDraftSave}
        initialAnswers={draft?.answers}
        initialDimension={draft?.dimension}
        language={surveyData.language}
        isAnonymous={true}
        companyName={surveyData.company_name}
        surveyTitle={surveyData.title}
        fullName={surveyData.full_name}
      />
    </div>
  );
}

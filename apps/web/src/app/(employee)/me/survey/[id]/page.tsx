'use client';

import React, { useState, useEffect } from 'react';
import { SurveyShell } from '@/components/survey/SurveyShell';
import { Loader2, AlertCircle } from 'lucide-react';

export default function EmployeeSurveyPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [surveyData, setSurveyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch survey detail for account mode
    // GET /api/v1/employee/surveys/:id
    setTimeout(() => {
      setSurveyData({
        id: params.id,
        title: 'Mayıs 2026 Wellbeing Anketi',
        company_name: 'TechFlow',
        full_name: 'Elif',
        language: 'tr',
        questions: [
           { id: 'q1', dimension: 'physical', text_tr: 'Genel olarak fiziksel sağlığımı iyi hissediyorum.', type: 'scale_5', is_required: true },
           { id: 'q2', dimension: 'mental', text_tr: 'İş yerinde kendimi stresli hissediyorum.', type: 'scale_5', is_required: true },
           // ... more questions
        ]
      });
      setLoading(false);
    }, 1000);
  }, [params.id]);

  const handleSubmit = async (answers: any): Promise<void> => {
    console.log('Submitting answers for account mode', params.id, answers);
    // POST /api/v1/employee/surveys/:id/submit
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  const handleDraftSave = (answers: any, dimension: number) => {
    // In account mode, save to backend as well
    // POST /api/v1/employee/surveys/:id/draft
    console.log('Saving draft to backend', answers, dimension);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SurveyShell 
        questions={surveyData.questions}
        onSubmit={handleSubmit}
        onDraftSave={handleDraftSave}
        language={surveyData.language}
        isAnonymous={false}
        companyName={surveyData.company_name}
        surveyTitle={surveyData.title}
        fullName={surveyData.full_name}
      />
    </div>
  );
}

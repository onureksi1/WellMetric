'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface Props {
  token: string;
  survey: any;
  employee: any;
}

export function SurveyForm({ token, survey, employee }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const questions = survey.questions || [];
  const question = questions[current];
  const progress = Math.round((current / questions.length) * 100);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(c => c + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/public-survey/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answers: Object.entries(answers).map(([qId, val]) => ({
            question_id: qId,
            answer_value: typeof val === 'number' ? val : undefined,
            answer_text: typeof val === 'string' ? val : undefined,
          }))
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.message || 'Gönderilirken bir hata oluştu');
        return;
      }

      setDone(true);
    } catch (err) {
      toast.error('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="text-center max-w-md animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Teşekkürler, {employee.full_name}!</h2>
          <p className="text-gray-600 mb-8">Yanıtlarınız başarıyla kaydedildi. Katılımınız bizim için çok değerli.</p>
          <p className="text-sm text-gray-400 italic">Bu sayfayı güvenle kapatabilirsiniz.</p>
        </div>
      </div>
    );
  }

  if (!question) return <div>Anket yüklenemedi...</div>;

  return (
    <div className="min-h-screen bg-gray-50/30 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">İlerleme</span>
            <span className="text-xs font-medium text-gray-400">{current + 1} / {questions.length}</span>
          </div>
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-10">
          <h3 className="text-xl md:text-2xl font-semibold text-gray-900 leading-tight mb-8">
            {question.question_text_tr}
          </h3>

          {/* Options - Simplified for now, assuming 1-5 scale or radio */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleAnswer(question.id, val)}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                  answers[question.id] === val 
                    ? 'border-primary bg-primary/5 text-primary font-medium' 
                    : 'border-gray-50 hover:border-gray-200 bg-gray-50/50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[question.id] === val ? 'border-primary' : 'border-gray-300'
                  }`}>
                    {answers[question.id] === val && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                  <span>{val} - {val === 1 ? 'Kesinlikle Katılmıyorum' : val === 5 ? 'Kesinlikle Katılıyorum' : 'Fikrim Yok'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-100 gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="px-8 rounded-xl h-12"
          >
            ← Geri
          </Button>
          
          <div className="flex-1" />

          {current < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={answers[question.id] === undefined}
              className="px-10 rounded-xl h-12"
            >
              İleri →
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={answers[question.id] === undefined}
              className="px-10 rounded-xl h-12"
            >
              Tamamla ✓
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">© 2026 WellAnalytics Wellbeing System. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}

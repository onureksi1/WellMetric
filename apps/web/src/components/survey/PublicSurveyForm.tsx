'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useSettings } from '@/contexts/SettingsContext';

interface Props {
  token: string;
  survey: any;
  employee: any;
}

export function SurveyForm({ token, survey, employee }: Props) {
  const { settings } = useSettings();
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
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        background: 'var(--color-background-primary)',
      }}>
        <img src={settings?.platform_logo_url || "/images/logo.png"} alt="Wellbeing Metric" style={{ height: 48, marginBottom: 40, objectFit: 'contain' }} />
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 'clamp(40px, 12vw, 56px)', marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight:500, marginBottom:8 }}>
            Teşekkürler, {employee.full_name}!
          </div>
          <div style={{ fontSize: 'clamp(13px, 3.5vw, 15px)',
            color:'var(--color-text-secondary)', lineHeight:1.6 }}>
            Yanıtlarınız kaydedildi.<br/>Bu sayfayı kapatabilirsiniz.
          </div>
        </div>
      </div>
    );
  }

  if (!question) return <div>Anket yüklenemedi...</div>;

  return (
    <div style={{
      maxWidth: 640,
      margin: '0 auto',
      padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
      minHeight: '100dvh',
      background: 'var(--color-background-primary)',
    }}>
      {/* Logo Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <img src={settings?.platform_logo_url || "/images/logo.png"} alt="Wellbeing Metric" style={{ height: 32, objectFit: 'contain' }} />
      </div>

      {/* Progress bar — sticky */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'var(--color-background-primary)',
        padding: '12px 0 8px',
        marginBottom: 16,
      }}>
        <div style={{ height:4, background:'var(--color-background-tertiary)',
          borderRadius:2 }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#1D9E75',
            borderRadius: 2,
            transition: 'width .3s',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between',
          fontSize:11, color:'var(--color-text-tertiary)', marginTop:6 }}>
          <span>{current + 1} / {questions.length}</span>
          <span>%{Math.round(progress)} tamamlandı</span>
        </div>
      </div>

      {/* Question */}
      <div className="mb-10">
        <h3 style={{
          fontSize: 'clamp(15px, 4vw, 18px)',
          fontWeight: 500,
          marginBottom: 24,
          lineHeight: 1.5,
          color: 'var(--color-text-primary)',
        }}>
          {question.question_text_tr}
        </h3>

        {/* Options */}
        {question.question_type === 'yes_no' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {['Evet','Hayır'].map((label, idx) => (
              <button key={idx}
                onClick={() => handleAnswer(question.id, idx === 0 ? 1 : 0)}
                style={{
                  padding: '14px',
                  border: answers[question.id] === (idx === 0 ? 1 : 0)
                    ? '2px solid #1D9E75'
                    : '0.5px solid var(--color-border-secondary)',
                  borderRadius: '12px',
                  background: 'var(--color-background-primary)',
                  cursor: 'pointer',
                  fontSize: 14, fontWeight: 500,
                  touchAction: 'manipulation',
                }}>
                {label}
              </button>
            ))}
          </div>
        ) : question.question_type === 'open_text' ? (
          <textarea
            rows={4}
            value={answers[question.id] || ''}
            onChange={e => handleAnswer(question.id, e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 16,
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: '12px',
              resize: 'vertical',
              lineHeight: 1.5,
              touchAction: 'manipulation',
            }}
          />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            {[1,2,3,4,5].map(val => (
              <button key={val}
                onClick={() => handleAnswer(question.id, val)}
                style={{
                  minWidth:  'clamp(44px, 15vw, 56px)',
                  height:    'clamp(44px, 15vw, 56px)',
                  borderRadius: '50%',
                  border: answers[question.id] === val
                    ? '2px solid #1D9E75'
                    : '0.5px solid var(--color-border-secondary)',
                  background: answers[question.id] === val
                    ? '#1D9E7510'
                    : 'var(--color-background-primary)',
                  color: answers[question.id] === val ? '#1D9E75' : 'inherit',
                  cursor: 'pointer',
                  fontSize: 'clamp(13px, 3.5vw, 16px)',
                  fontWeight: answers[question.id] === val ? 500 : 400,
                  touchAction: 'manipulation',
                }}>
                {val}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop: 32, borderTop: '0.5px solid var(--color-border-tertiary)', gap: 16 }}>
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            padding: 'clamp(10px, 3vw, 14px) clamp(16px, 5vw, 24px)',
            fontSize: 'clamp(13px, 3.5vw, 15px)',
            minHeight: 44,
            borderRadius: '12px',
            border: '0.5px solid var(--color-border-secondary)',
            background: 'white',
            opacity: current === 0 ? 0.3 : 1,
            touchAction: 'manipulation',
          }}
        >
          ← Geri
        </button>
        
        {current < questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={answers[question.id] === undefined}
            style={{
              padding: 'clamp(10px, 3vw, 14px) clamp(16px, 5vw, 24px)',
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              minHeight: 44,
              borderRadius: '12px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              fontWeight: 500,
              opacity: answers[question.id] === undefined ? 0.5 : 1,
              touchAction: 'manipulation',
            }}
          >
            İleri →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || answers[question.id] === undefined}
            style={{
              padding: 'clamp(10px, 3vw, 14px) clamp(16px, 5vw, 24px)',
              fontSize: 'clamp(13px, 3.5vw, 15px)',
              minHeight: 44,
              borderRadius: '12px',
              background: '#1D9E75',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              opacity: submitting || answers[question.id] === undefined ? 0.5 : 1,
              touchAction: 'manipulation',
            }}
          >
            {submitting ? 'Gönderiliyor...' : 'Tamamla ✓'}
          </button>
        )}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>© 2026 WellAnalytics Wellbeing System. Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Plus, Database, Sparkles, Clock, AlertTriangle, Wand2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/lib/store/auth.store';

import { QuestionBuilder } from './QuestionBuilder';
import { useDebounce } from '@/hooks/useDebounce';

export default function EditSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { t } = useTranslation(['consultant', 'common']);
  const [companies, setCompanies] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [isIndustriesLoading, setIsIndustriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAnonWarning, setShowAnonWarning] = useState(false);

  const schema = z.object({
    title_tr: z.string().min(3, t('surveys.new.error_title_tr', 'Türkçe başlık zorunludur.')),
    title_en: z.string().optional(),
    company_id: z.string().uuid(t('common.error_company_required', 'Lütfen bir firma seçin.')),
    frequency: z.enum(['once', 'monthly', 'quarterly', 'biannually', 'annually']),
    is_anonymous: z.boolean(),
    link_duration: z.string().default('7'),
    questions: z.array(z.any()).min(1, t('surveys.new.error_min_questions', 'En az bir soru eklemelisiniz.'))
  });

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title_tr: '',
      title_en: '',
      company_id: '',
      frequency: 'monthly',
      is_anonymous: true,
      link_duration: '7',
      questions: []
    }
  });

  const { control, handleSubmit, reset, formState: { errors } } = methods;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "questions"
  });

  const formValues = methods.watch();
  const debouncedValues = useDebounce(formValues, 5000);

  // Fetch Initial Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsIndustriesLoading(true);
        const [compRes, indRes, surveyRes] = await Promise.all([
          client.get('/consultant/companies'),
          client.get('/industries'),
          client.get(`/consultant/surveys/${params.id}`)
        ]);
        
        setCompanies(compRes.data.data || compRes.data);
        setIndustries(indRes.data || []);
        
        const survey = surveyRes.data.data || surveyRes.data;
        
        // Ownership Check
        if (survey.created_by !== user?.id) {
          toast.error('Bu anketi düzenleme yetkiniz yok.');
          router.push('/consultant/surveys');
          return;
        }

        reset({
          title_tr: survey.title_tr,
          title_en: survey.title_en,
          company_id: survey.company_id,
          frequency: survey.frequency || 'monthly',
          is_anonymous: survey.is_anonymous,
          link_duration: survey.link_duration || '7',
          questions: survey.questions?.map((q: any) => ({
            ...q,
            // Format existing questions for builder
            options: q.options || [],
            rows: q.rows || []
          })) || []
        });
      } catch (e) {
        console.error('Failed to fetch data', e);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
        setIsIndustriesLoading(false);
      }
    };
    fetchData();
  }, [params.id, reset, user?.id, router]);

  // Auto-save Draft (Optional for edit, but user requested for new, maybe good here too)
  useEffect(() => {
    const saveDraft = async () => {
      try {
        await client.put('/consultant/surveys/draft', debouncedValues);
        setLastSaved(new Date());
      } catch (e) {
        console.error('Draft save failed', e);
      }
    };
    if (methods.formState.isDirty && !loading) {
      saveDraft();
    }
  }, [debouncedValues, methods.formState.isDirty, loading]);

  const handleAddQuestion = () => {
    append({
      dimension: 'overall',
      question_text_tr: '',
      question_text_en: '',
      question_type: 'likert5',
      is_reversed: false,
      weight: 1.0,
      is_required: true,
      options: [],
      rows: []
    });
  };

  const handleAiGenerate = async (aiDto: any) => {
    try {
      setAiLoading(true);
      const { data: aiRes } = await client.post('/consultant/surveys/ai-generate', aiDto);
      const aiQuestions = aiRes.data?.questions || aiRes.data || aiRes;
      
      const formattedQuestions = aiQuestions.map((q: any) => ({
        dimension: q.dimension,
        question_text_tr: q.question_text_tr,
        question_text_en: q.question_text_en,
        question_type: 'likert5',
        is_reversed: q.is_reversed,
        weight: 1.0,
        is_required: true,
        options: [],
        rows: []
      }));

      formattedQuestions.forEach((q: any) => append(q));
      setIsAiModalOpen(false);
      toast.success(`${formattedQuestions.length} soru AI tarafından eklendi.`);
    } catch (err: any) {
      toast.error('AI soruları oluştururken bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setSaveLoading(true);
      const cleanedData = {
        ...data,
        questions: data.questions.map((q: any) => ({
          ...q,
          options: ['single_choice', 'multi_choice', 'ranking'].includes(q.question_type) ? q.options : undefined,
          rows: q.question_type === 'matrix' ? q.rows : undefined,
        }))
      };

      await client.put(`/consultant/surveys/${params.id}`, cleanedData);
      await client.delete('/consultant/surveys/draft');
      
      toast.success('Anket başarıyla güncellendi!');
      router.push('/consultant/surveys');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Anket güncellenirken hata oluştu.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">Anket verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-32">
        <div className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md pb-4 pt-4 -mt-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/consultant/surveys" className="p-2 bg-white rounded-full border border-gray-200 hover:border-primary transition-colors text-gray-500 hover:text-primary">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-navy">Anket Düzenle</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-gray-500 font-medium italic">v4.5 Müşteri Odaklı Düzenleme</p>
                {lastSaved && (
                  <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full animate-in fade-in">
                    <Save size={10} />
                    💾 Taslak kaydedildi
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition-all shadow-lg shadow-navy/10"
            >
              <Sparkles size={18} className="text-yellow-400" />
              {t('surveys.ai_generate', 'AI ile Soru Ekle')}
            </button>
            <button 
              type="submit" 
              disabled={saveLoading}
              className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              {saveLoading ? 'Güncelleniyor...' : 'Güncellemeleri Kaydet'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-5">
              <h3 className="font-bold text-navy flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database size={18} className="text-primary" /> Anket Ayarları
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hedef Firma*</label>
                <select {...methods.register('company_id')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                  <option value="">Firma Seçin</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Türkçe Başlık*</label>
                <input {...methods.register('title_tr')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">İngilizce Başlık</label>
                <input {...methods.register('title_en')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Frekans*</label>
                <select {...methods.register('frequency')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                  <option value="once">Tek Seferlik</option>
                  <option value="monthly">Aylık</option>
                  <option value="quarterly">3 Aylık (Çeyrek)</option>
                  <option value="biannually">6 Aylık</option>
                  <option value="annually">Yıllık</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 p-3 rounded-xl border border-gray-200 hover:border-primary transition-colors mt-4">
                <div className={`w-10 h-5 rounded-full relative transition-colors ${methods.watch('is_anonymous') ? 'bg-primary' : 'bg-gray-300'}`}>
                  <input 
                    type="checkbox" 
                    checked={methods.watch('is_anonymous')}
                    onChange={(e) => {
                      if (!e.target.checked) setShowAnonWarning(true);
                      else methods.setValue('is_anonymous', true);
                    }}
                    className="hidden" 
                  />
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${methods.watch('is_anonymous') ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-navy">Anonim Anket</span>
                </div>
              </label>

              {showAnonWarning && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl space-y-6">
                    <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                      <AlertTriangle size={32} />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-navy uppercase">Dikkat</h3>
                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Anonimlik ayarını değiştirmek verilerin gizliliğini etkiler.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowAnonWarning(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50">İptal</button>
                      <button type="button" onClick={() => { methods.setValue('is_anonymous', false); setShowAnonWarning(false); }} className="flex-1 py-3 bg-navy text-white rounded-xl font-bold shadow-lg shadow-navy/20">Onayla</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-6">
              {fields.map((field, index) => (
                <QuestionBuilder 
                  key={field.id} 
                  index={index} 
                  remove={remove} 
                  control={control} 
                />
              ))}
            </div>

            <button 
              type="button" 
              onClick={handleAddQuestion}
              className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl font-bold transition-all text-lg"
            >
              <Plus size={24} /> Yeni Soru Ekle
            </button>
          </div>
        </div>
      </form>

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-navy text-white rounded-2xl flex items-center justify-center">
                <Wand2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{t('surveys.ai_generate', 'AI Soru Asistanı')}</h2>
                <p className="text-sm text-gray-400 font-medium">Ankete yeni sorular ekleyin.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sektör</label>
                <div className="relative">
                  <select 
                    id="ai-industry" 
                    defaultValue=""
                    className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 cursor-pointer shadow-sm relative z-50"
                  >
                    <option value="" disabled>Sektör Seçin</option>
                    
                    {/* Fetched Industries */}
                    {industries.length > 0 && industries.map((ind) => (
                      <option key={ind.value} value={ind.value}>{ind.label}</option>
                    ))}

                    {/* Hardcoded Fallbacks */}
                    {(industries.length === 0 && !isIndustriesLoading) && (
                      <>
                        <option value="technology">Teknoloji & Yazılım</option>
                        <option value="service">Hizmet Sektörü</option>
                        <option value="manufacturing">Üretim & Sanayi</option>
                        <option value="healthcare">Sağlık & İlaç</option>
                        <option value="finance">Finans & Bankacılık</option>
                      </>
                    )}
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Soru Sayısı</label>
                <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  <input id="ai-count" type="range" min="3" max="15" defaultValue="5" className="flex-1 accent-navy" />
                  <span className="w-12 text-center font-black text-navy text-sm">5</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsAiModalOpen(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50">İptal</button>
              <button 
                type="button"
                disabled={aiLoading}
                onClick={() => {
                  const industry = (document.getElementById('ai-industry') as HTMLSelectElement).value;
                  const count = parseInt((document.getElementById('ai-count') as HTMLInputElement).value);
                  handleAiGenerate({ sector: industry, count });
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? 'Oluşturuyor...' : t('common.generate', 'Oluştur ve Ekle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </FormProvider>
  );
}

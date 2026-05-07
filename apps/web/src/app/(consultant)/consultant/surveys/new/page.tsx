'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Plus, Database } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';
import { useT } from '@/hooks/useT';

import { QuestionBuilder } from './QuestionBuilder';
import { Sparkles, Clock, CheckCircle2, Wand2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function NewSurveyPage() {
  const router = useRouter();
  const { t, tc } = useT('consultant');
  const [companies, setCompanies] = useState<any[]>([]);

  // Validation Schema (Inside component to use t)
  const schema = z.object({
    title_tr: z.string().min(3, t('surveys.new.error_title_tr')),
    title_en: z.string().optional(),
    company_id: z.string().uuid(tc('error_company_required')),
    frequency: z.enum(['once', 'monthly', 'quarterly', 'biannually', 'annually']),
    link_duration: z.string().default('7'),
    questions: z.array(z.any()).min(1, t('surveys.new.error_min_questions'))
  });

  const [loading, setLoading] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState<any>(null);
  const [industries, setIndustries] = useState<any[]>([]);
  const [isIndustriesLoading, setIsIndustriesLoading] = useState(true);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title_tr: '',
      title_en: '',
      company_id: '',
      frequency: 'monthly',
      link_duration: '7',
      questions: []
    }
  });

  const { control, handleSubmit, formState: { errors } } = methods;

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "questions"
  });

  const formValues = methods.watch();
  const debouncedValues = useDebounce(formValues, 3000);

  // Auto-save Draft
  React.useEffect(() => {
    const saveDraft = async () => {
      try {
        await client.put('/consultant/surveys/draft', debouncedValues);
        setLastSaved(new Date());
      } catch (e) {
        console.error('Draft save failed', e);
      }
    };
    if (methods.formState.isDirty) {
      saveDraft();
    }
  }, [debouncedValues, methods.formState.isDirty]);

  // Load Draft Check on Mount
  React.useEffect(() => {
    const checkDraft = async () => {
      try {
        const { data: draft } = await client.get('/consultant/surveys/draft');
        if (draft?.draft_data) {
          setHasDraft(draft.draft_data);
        }
      } catch (e) {
        console.error('Draft check failed', e);
      }
    };
    checkDraft();
  }, []);

  // Load Data
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsIndustriesLoading(true);
        const [compRes, indRes] = await Promise.all([
          client.get('/consultant/companies'),
          client.get('/industries')
        ]);
        setCompanies(compRes.data.data || compRes.data);
        setIndustries(indRes.data || []);
      } catch (e) {
        console.error('Failed to fetch data', e);
        setIndustries([]);
      } finally {
        setIsIndustriesLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddQuestion = () => {
    append({
      dimension: 'overall',
      question_text_tr: '',
      question_text_en: '',
      question_type: 'likert5',
      is_reversed: false,
      weight: 1.0,
      is_required: true,
      number_min: 0,
      number_max: 100,
      number_step: 1,
      options: [],
      rows: []
    });
  };

  const handleLoadTemplate = () => {
    append({
      dimension: 'mental',
      question_text_tr: 'Genel olarak stres seviyem yönetilebilir düzeydedir.',
      question_text_en: 'Overall, my stress level is manageable.',
      question_type: 'likert5',
      is_reversed: false,
      weight: 1.0,
      is_required: true,
    });
    append({
      dimension: 'social',
      question_text_tr: 'Ekip arkadaşlarımla iletişimim kuvvetlidir.',
      question_text_en: 'I have strong communication with my teammates.',
      question_type: 'likert5',
      is_reversed: false,
      weight: 1.0,
      is_required: true,
    });
    toast.success(t('surveys.new.template_loaded'));
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

      // Append AI questions to form
      formattedQuestions.forEach((q: any) => append(q));
      
      setIsAiModalOpen(false);
      toast.success(t('surveys.new.ai_success', { count: formattedQuestions.length }));
    } catch (err: any) {
      toast.error(t('surveys.new.ai_error'));
    } finally {
      setAiLoading(false);
    }

  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      // Clean up the data before sending
      const cleanedData = {
        ...data,
        questions: data.questions.map((q: any) => ({
          ...q,
          options: ['single_choice', 'multi_choice', 'ranking'].includes(q.question_type) ? q.options : undefined,
          rows: q.question_type === 'matrix' ? q.rows : undefined,
          number_min: q.question_type === 'number_input' ? q.number_min : undefined,
          number_max: q.question_type === 'number_input' ? q.number_max : undefined,
          number_step: q.question_type === 'number_input' ? q.number_step : undefined,
        }))
      };

      await client.post('/consultant/surveys', cleanedData);
      await client.delete('/consultant/surveys/draft'); // Delete draft on success
      
      toast.success(t('surveys.new.success'));
      router.push('/consultant/surveys');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || t('surveys.new.error');
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }

  };

  return (
    <FormProvider {...methods}>
      {hasDraft && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl animate-in slide-in-from-bottom-8">
          <div className="bg-navy text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md bg-navy/90">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-bold">{t('surveys.new.draft_found')}</p>
                <p className="text-[10px] text-gray-400">{t('surveys.new.draft_continue')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={async () => {
                  await client.delete('/consultant/surveys/draft');
                  setHasDraft(null);
                }}
                className="px-4 py-2 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors"
              >
                {tc('start_new')}
              </button>

              <button 
                type="button" 
                onClick={() => {
                  methods.reset(hasDraft);
                  setHasDraft(null);
                }}
                className="px-6 py-2 bg-primary text-white rounded-lg text-xs font-black shadow-lg shadow-primary/20"
              >
                {tc('load_draft')}
              </button>

            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-32">
        
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md pb-4 pt-4 -mt-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Link href="/consultant/surveys" className="p-2 bg-white rounded-full border border-gray-200 hover:border-primary transition-colors text-gray-500 hover:text-primary">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-navy">{t('surveys.new.title')}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-gray-500 font-medium italic">{t('surveys.new.standard')}</p>
                {lastSaved && (
                  <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full animate-in fade-in">
                    <Save size={10} />
                    💾 {t('surveys.new.auto_saved', { time: lastSaved.toLocaleTimeString('tr-TR') })}
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
              {tc('surveys.ai_generate', 'AI ile Oluştur')}
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Save size={18} />
              {loading ? t('surveys.new.publishing') : t('surveys.new.publish')}
            </button>
          </div>
        </div>


        {/* Global Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold">
            {t('surveys.new.form_errors')} (Hata: {Object.values(errors)[0]?.message as string})
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column: Form Settings */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24 space-y-5">
              <h3 className="font-bold text-navy flex items-center gap-2 pb-2 border-b border-gray-100">
                <Database size={18} className="text-primary" /> {t('surveys.new.settings_title')}
              </h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.title_tr')}</label>
                <input {...methods.register('title_tr')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.title_en')}</label>
                <input {...methods.register('title_en')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:bg-white" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.target_company')}</label>
                <select {...methods.register('company_id')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                  <option value="">{t('surveys.new.select_company_placeholder')}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.frequency')}</label>
                <select {...methods.register('frequency')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                  <option value="once">{t('surveys.new.frequencies.once')}</option>
                  <option value="monthly">{t('surveys.new.frequencies.monthly')}</option>
                  <option value="quarterly">{t('surveys.new.frequencies.quarterly')}</option>
                  <option value="biannually">{t('surveys.new.frequencies.biannually')}</option>
                  <option value="annually">{t('surveys.new.frequencies.annually')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.link_duration')}</label>
                <select {...methods.register('link_duration')} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none">
                  <option value="7">{t('surveys.new.durations.7')}</option>
                  <option value="14">{t('surveys.new.durations.14')}</option>
                  <option value="30">{t('surveys.new.durations.30')}</option>
                  <option value="custom">{t('surveys.new.durations.custom')}</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl border border-green-200 mt-4">
                <div className="w-10 h-5 rounded-full relative bg-primary flex-shrink-0">
                  <div className="absolute top-0.5 left-[22px] w-4 h-4 rounded-full bg-white shadow-sm" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-navy">{t('surveys.new.anonymous_title')}</span>
                  <span className="text-[10px] text-gray-500">{t('surveys.new.anonymous_desc')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Questions Builder */}
          <div className="lg:col-span-3 space-y-6">
            
            {fields.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database size={32} />
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">{t('surveys.new.no_questions_title')}</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  {t('surveys.new.no_questions_desc')}
                </p>
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={handleLoadTemplate} className="px-6 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">
                    {t('surveys.new.load_template')}
                  </button>
                  <button type="button" onClick={handleAddQuestion} className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90">
                    <Plus size={18} /> {t('surveys.new.add_first_question')}
                  </button>
                </div>
              </div>
            ) : (
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
            )}

            {fields.length > 0 && (
              <button 
                type="button" 
                onClick={handleAddQuestion}
                className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl font-bold transition-all text-lg"
              >
                <Plus size={24} /> {t('surveys.new.add_new_question')}
              </button>
            )}

          </div>
        </div>
      </form>

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-navy text-white rounded-2xl flex items-center justify-center shadow-lg shadow-navy/20">
                <Wand2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-navy">{tc('surveys.ai_generate', 'AI Soru Asistanı')}</h2>
                <p className="text-sm text-gray-400 font-medium">Sektörünüze özel sorular oluşturun.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <select 
                  id="ai-industry" 
                  defaultValue=""
                  className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 transition-all text-slate-900 cursor-pointer shadow-sm relative z-50"
                >
                  <option value="" disabled>{tc('select_industry', 'Sektör Seçin')}</option>
                  
                  {/* Fetched Industries */}
                  {industries.length > 0 && industries.map((ind) => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}

                  {/* Hardcoded Fallbacks */}
                  {(industries.length === 0 && !isIndustriesLoading) && (
                    <>
                      <option key="fallback-tech" value="technology">{tc('industries.technology', 'Teknoloji & Yazılım')}</option>
                      <option key="fallback-man" value="manufacturing">{tc('industries.manufacturing', 'Üretim & Sanayi')}</option>
                      <option key="fallback-srv" value="service">{tc('industries.service', 'Hizmet Sektörü')}</option>
                      <option key="fallback-health" value="healthcare">{tc('industries.health', 'Sağlık & İlaç')}</option>
                      <option key="fallback-fin" value="finance">{tc('industries.finance', 'Finans & Bankacılık')}</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('surveys.new.dimensions_to_measure', 'Ölçülecek Boyutlar')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'physical', label: tc('dimensions.physical') },
                    { key: 'mental', label: tc('dimensions.mental') },
                    { key: 'social', label: tc('dimensions.social') },
                    { key: 'financial', label: tc('dimensions.financial') },
                    { key: 'work', label: tc('dimensions.work') }
                  ].map((dim) => (
                    <label key={dim.key} className="flex items-center gap-2 p-2 bg-white border border-gray-100 rounded-lg cursor-pointer hover:border-primary transition-colors">
                      <input type="checkbox" className="w-4 h-4 accent-navy ai-dim" value={dim.key} defaultChecked={['physical', 'mental', 'social'].includes(dim.key)} />
                      <span className="text-xs font-bold text-gray-600">{dim.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('surveys.new.question_count', 'Soru Sayısı')}</label>
                <div className="flex items-center gap-4">
                  <input 
                    id="ai-count" 
                    type="range" 
                    min="5" 
                    max="30" 
                    defaultValue="10" 
                    className="flex-1 accent-navy cursor-pointer" 
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      const span = document.getElementById('ai-count-display');
                      if (span) span.innerText = val;
                    }}
                  />
                  <span id="ai-count-display" className="text-sm font-black text-navy w-12">10</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>5 {t('surveys.new.questions_unit', 'SORU')}</span>
                  <span>30 {t('surveys.new.questions_unit', 'SORU')}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('common.language', 'Dil')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ai-lang" value="tr" defaultChecked className="w-4 h-4 accent-navy" />
                    <span className="text-sm font-bold text-navy">{tc('languages.tr')}</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ai-lang" value="en" className="w-4 h-4 accent-navy" />
                    <span className="text-sm font-bold text-navy">{tc('languages.en')}</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAiModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
              >
                {tc('cancel')}
              </button>
              <button 
                type="button"
                disabled={aiLoading}
                onClick={() => {
                  const industry = (document.getElementById('ai-industry') as HTMLSelectElement).value;
                  const count = parseInt((document.getElementById('ai-count') as HTMLInputElement).value);
                  const dims = Array.from(document.querySelectorAll('.ai-dim:checked')).map((el: any) => el.value);
                  const lang = (document.querySelector('input[name="ai-lang"]:checked') as HTMLInputElement).value;
                  
                  if (!industry) {
                    toast.error(tc('select_industry', 'Lütfen bir sektör seçin'));
                    return;
                  }
                  
                  if (dims.length === 0) {
                    toast.error(tc('select_dimension', 'Lütfen en az bir boyut seçin'));
                    return;
                  }

                  handleAiGenerate({ industry, dimensions: dims, question_count: count, language: lang });
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>{tc('ai_generating', 'AI Oluşturuyor...')}</>
                ) : (
                  <>{tc('generate', 'Oluştur')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </FormProvider>
  );
}

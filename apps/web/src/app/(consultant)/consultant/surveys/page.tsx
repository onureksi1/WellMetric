'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  ClipboardList, 
  Building2, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';

export default function ConsultantSurveysPage() {
  const { t } = useTranslation('consultant');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [companies, setCompanies] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [period, setPeriod] = useState('2024-Q1');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [compRes, survRes] = await Promise.all([
          client.get('/admin/companies'),
          client.get('/admin/surveys/templates') // Generic templates endpoint
        ]);
        
        setCompanies(Array.isArray(compRes.data) ? compRes.data : (compRes.data.companies || []));
        setSurveys(survRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // If template endpoint fails, provide some defaults or handle error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedSurvey || selectedCompanies.length === 0) {
      toast.error('Lütfen anket ve en az bir firma seçin.');
      return;
    }

    setIsSubmitting(true);
    try {
      await client.post('/consultant/surveys/assign', {
        survey_id: selectedSurvey,
        company_ids: selectedCompanies,
        period,
        due_at: dueAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      toast.success('Anket başarıyla atandı!');
      setSelectedCompanies([]);
      setSelectedSurvey(null);
    } catch (error) {
      toast.error('Atama sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCompany = (id: string) => {
    setSelectedCompanies(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Sistem verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('surveys.title')}</h1>
        <p className="text-slate-500">{t('surveys.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Select Survey */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">1</div>
              <h3 className="font-bold text-slate-900">Anket Seçin*</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {surveys.length > 0 ? (
                surveys.map((survey) => (
                  <button
                    key={survey.id}
                    onClick={() => setSelectedSurvey(survey.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      selectedSurvey === survey.id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-4 ring-blue-500/5' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <p className={`font-bold text-sm mb-3 ${selectedSurvey === survey.id ? 'text-blue-900' : 'text-slate-900'}`}>
                      {survey.title}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1"><Clock size={12} /> {survey.duration || '5'} dk</span>
                      <span className="flex items-center gap-1"><ClipboardList size={12} /> {survey.questionCount || '12'} Soru</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-full p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                  <AlertCircle className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm text-slate-400">Kullanılabilir anket bulunamadı.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Select Companies */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">2</div>
                <h3 className="font-bold text-slate-900">Firmalar*</h3>
              </div>
              <button 
                onClick={() => setSelectedCompanies(companies.map(c => c.id))}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Tümünü Seç
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {companies.length > 0 ? (
                companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => toggleCompany(company.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedCompanies.includes(company.id)
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${selectedCompanies.includes(company.id) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${selectedCompanies.includes(company.id) ? 'text-blue-900' : 'text-slate-900'}`}>
                        {company.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{company.employee_count || 0} Çalışan</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="col-span-full py-12 text-center text-slate-400 text-sm italic">Yönetilen firma bulunamadı.</p>
              )}
            </div>
          </div>

          {/* Section 3: Timing */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">3</div>
              <h3 className="font-bold text-slate-900">Zamanlama*</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">DÖNEM</label>
                <select 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
                >
                  <option value="2024-Q1">2024 1. Çeyrek</option>
                  <option value="2024-Q2">2024 2. Çeyrek</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">SON TARİH</label>
                <input 
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleAssign}
                disabled={isSubmitting || !selectedSurvey || selectedCompanies.length === 0}
                className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Plus size={20} /> Anket Atamasını Başlat</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Info & History */}
        <div className="space-y-8">
          <div className="bg-blue-600 rounded-[32px] p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-xl">Atama Bilgisi</h3>
              </div>
              <ul className="space-y-4 text-sm text-blue-50/80 leading-relaxed">
                <li className="flex items-start gap-2 italic">
                  <ArrowRight size={14} className="mt-1 shrink-0" />
                  Seçtiğiniz anket, seçilen tüm firmaların çalışanlarına aynı anda atanır.
                </li>
                <li className="flex items-start gap-2 italic">
                  <ArrowRight size={14} className="mt-1 shrink-0" />
                  HR yöneticilerine otomatik bilgilendirme e-postası gider.
                </li>
              </ul>
            </div>
            <ClipboardList className="absolute -bottom-10 -right-10 text-white/5" size={180} />
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
              Geçmiş Atamalar
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Tümü</span>
            </h3>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <Calendar size={32} />
                </div>
                <p className="text-slate-400 text-xs italic">Henüz bir anket ataması gerçekleştirmediniz.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

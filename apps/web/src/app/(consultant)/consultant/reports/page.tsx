'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileBarChart2, 
  Download, 
  Calendar, 
  Clock, 
  FileText,
  Filter,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import client from '@/lib/api/client';

export default function ConsultantReportsPage() {
  const { t } = useTranslation('consultant');
  const router = useRouter();
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [reportType, setReportType] = useState('comparative');
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [format, setFormat] = useState('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await client.get('/consultant/companies');
        setCompanies(Array.isArray(response.data) ? response.data : (response.data.data || []));
      } catch (error) {
        console.error('Error fetching companies for reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleGenerate = async () => {
    if (selectedCompanies.length === 0) {
      toast.error(t('common.select_at_least_one', 'Lütfen en az bir firma seçin.'));
      return;
    }

    setIsGenerating(true);
    try {
      const endpoint = reportType === 'single' 
        ? `/consultant/reports/company/${selectedCompanies[0]}`
        : `/consultant/reports/comparative`;

      const payload = reportType === 'single'
        ? { period, format: format.toLowerCase() }
        : { period, company_ids: selectedCompanies, format: format.toLowerCase() };

      const response = await client.post(endpoint, payload);
      toast.success(t('common.report_success', 'Rapor kuyruğa alındı. Hazır olunca mail gelecek.'));
    } catch (err: any) {
      if (err.response?.status === 402) {
        toast.error('Krediniz yetersiz, lütfen satın alın.', {
          action: {
            label: 'Kredi Al',
            onClick: () => router.push('/consultant/billing?tab=purchase'),
          },
        });
      } else {
        toast.error(err.response?.data?.error?.message || t('common.error', 'Rapor oluşturulamadı.'));
      }
    } finally {
      setIsGenerating(false);
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
        <p className="text-slate-500 font-medium">Firmalar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('reports.title')}</h1>
        <p className="text-slate-500">{t('reports.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileBarChart2 size={18} />
              </div>
              <h3 className="font-bold text-slate-900">{t('reports.comparative')}</h3>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700">{t('reports.format')}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'comparative', title: t('reports.comparative'), icon: FileBarChart2 },
                    { id: 'single', title: 'Firma Bazlı', icon: FileText },
                    { id: 'benchmark', title: 'Benchmark', icon: Filter },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        reportType === type.id 
                          ? 'border-emerald-500 bg-emerald-50/30 ring-4 ring-emerald-500/10' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <type.icon size={20} className={reportType === type.id ? 'text-emerald-600' : 'text-slate-400'} />
                      <p className={`font-bold text-sm mt-3 ${reportType === type.id ? 'text-emerald-700' : 'text-slate-700'}`}>{type.title}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-slate-700">{t('reports.select_companies')}</label>
                  <button 
                    onClick={() => setSelectedCompanies(companies.map(c => c.id))}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    {t('common.select_all', 'Tümünü Seç')}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {companies.length > 0 ? (
                    companies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => toggleCompany(c.id)}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          selectedCompanies.includes(c.id)
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))
                  ) : (
                    <p className="col-span-full text-center py-4 text-slate-400 text-xs italic">Seçilebilecek firma bulunamadı.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('reports.period')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="month"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm appearance-none"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{t('reports.format')}</label>
                  <div className="flex gap-2">
                    {['PDF', 'Excel'].map((f) => (
                      <button 
                        key={f}
                        onClick={() => setFormat(f)}
                        className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition-all ${format === f ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock size={14} />
                  {t('reports.email_notice')}
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || companies.length === 0}
                  className="px-10 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? t('common.generating') : <><Download size={18} /> {t('reports.create')}</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
              {t('reports.history')}
              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-500">{t('common.all')}</span>
            </h3>
            <div className="space-y-4">
              <p className="text-center py-8 text-slate-400 text-xs italic">Henüz oluşturulmuş raporunuz bulunmuyor.</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white overflow-hidden relative shadow-lg shadow-blue-900/20 group">
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-2">
                <Clock className="text-white" size={24} />
              </div>
              <h4 className="text-xl font-bold tracking-tight">{t('reports.auto_reporting')}</h4>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                {t('reports.auto_reporting_desc')}
              </p>
              <button 
                onClick={() => router.push('/consultant/settings?tab=auto-reporting')}
                className="flex items-center gap-2 text-sm font-bold bg-white text-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-all group/btn shadow-sm"
              >
                {t('settings.configure_settings')} <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
            <FileText className="absolute -bottom-6 -right-6 text-white/10 rotate-12" size={160} />
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  Sparkles, 
  Brain, 
  LineChart, 
  Zap,
  ArrowRight,
  Plus,
  MessageSquare,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';

export default function ConsultantAIPage() {
  const { t } = useTranslation('consultant');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await client.get('/admin/companies');
        setCompanies(Array.isArray(response.data) ? response.data : (response.data.companies || []));
      } catch (error) {
        console.error('Error fetching companies for AI analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleRunAnalysis = async () => {
    if (selectedCompanies.length < 2) {
      toast.error('Lütfen karşılaştırma için en az 2 firma seçin.');
      return;
    }

    setIsAnalyzing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('AI Analizi tamamlandı!');
    } catch (err) {
      toast.error('Analiz sırasında bir hata oluştu.');
    } finally {
      setIsAnalyzing(false);
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
        <p className="text-slate-500 font-medium italic">Yapay zeka modelleri hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="text-blue-600" />
          {t('ai.title')}
        </h1>
        <p className="text-slate-500">{t('ai.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              {t('ai.comparative_analysis')}
            </h3>
            
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">FİRMA SEÇİMİ (MİN. 2)</p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {companies.length > 0 ? (
                companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => toggleCompany(c.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                      selectedCompanies.includes(c.id)
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedCompanies.includes(c.id) ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'}`}>
                        <Building2 size={16} />
                      </div>
                      <span className={`text-sm font-bold ${selectedCompanies.includes(c.id) ? 'text-blue-900' : 'text-slate-700'}`}>{c.name}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{c.score || '-'}</span>
                  </button>
                ))
              ) : (
                <p className="text-center py-8 text-slate-400 text-xs italic">Analiz edilecek firma bulunamadı.</p>
              )}
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing || selectedCompanies.length < 2}
              className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10"
            >
              {isAnalyzing ? <><Loader2 className="animate-spin" size={18} /> Analiz Ediliyor...</> : <><Zap size={18} /> {t('ai.run_analysis')}</>}
            </button>
          </div>

          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Brain size={20} />
                {t('ai.intelligence_report')}
              </h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                {t('ai.intelligence_report_desc')}
              </p>
              <button className="flex items-center gap-2 text-xs font-bold text-white hover:opacity-80 transition-opacity">
                Yeni Rapor Başlat <ArrowRight size={14} />
              </button>
            </div>
            <Sparkles className="absolute -bottom-4 -right-4 text-white/10" size={100} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-12 text-center min-h-[600px]">
          {isAnalyzing ? (
            <div className="space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mx-auto" />
                <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Veriler İşleniyor</h3>
                <p className="text-slate-500 max-w-sm mt-2">Yapay zeka modelleri firmaların verilerini karşılaştırıyor ve içgörüleri oluşturuyor.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto">
                <LineChart size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Analiz Bekleniyor</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  Sol taraftaki panelden analiz etmek istediğiniz firmaları seçerek "Analiz Başlat" butonuna tıklayın.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="p-4 rounded-2xl bg-slate-50 text-left border border-slate-100">
                  <CheckCircle2 className="text-emerald-500 mb-2" size={20} />
                  <p className="text-xs font-bold text-slate-800">Çapraz Karşılaştırma</p>
                  <p className="text-[10px] text-slate-500 mt-1">Sektörel benchmark ve firma bazlı analizler.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 text-left border border-slate-100">
                  <MessageSquare className="text-blue-500 mb-2" size={20} />
                  <p className="text-xs font-bold text-slate-800">Doğal Dil Özetleri</p>
                  <p className="text-[10px] text-slate-500 mt-1">Karmaşık verilerin sade ve anlaşılır raporlanması.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

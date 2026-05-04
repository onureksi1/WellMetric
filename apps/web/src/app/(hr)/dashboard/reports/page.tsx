'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  FileText, FileSpreadsheet, Download, Info, CheckCircle2,
  Loader2, Send, Globe, BarChart2, Users, Lightbulb, MessageSquare,
  ClipboardList, BookOpen, Clock, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';

// Generate last 12 months dynamically
function getRecentMonths(count = 12) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    months.push({ value, label });
  }
  return months;
}

const MONTHS = getRecentMonths(12);

const REPORT_SECTIONS = [
  { icon: BookOpen,     label: 'Kapak Sayfası',                   desc: 'Şirket adı, dönem ve özet bilgi' },
  { icon: Lightbulb,   label: 'Yönetici Özeti (AI Destekli)',     desc: 'Yapay zeka tarafından oluşturulan içgörüler' },
  { icon: BarChart2,   label: '5 Boyut Detaylı Analizi',          desc: 'Zihinsel, Fiziksel, Sosyal, Finansal, İş & Anlam' },
  { icon: Users,       label: 'Departman Bazlı Karşılaştırma',    desc: 'Departmanlar arası skor farklılıkları' },
  { icon: MessageSquare, label: 'Çalışan Sesi',                   desc: 'Açık uçlu yanıtlardan temalar' },
  { icon: ClipboardList, label: 'Önerilen Aksiyon Planı',         desc: 'Boyuta özel iyileştirme adımları' },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState(MONTHS[0].value);
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  // Past reports from ai_insights (intelligence_report type)
  const { data: insightsData } = useQuery({
    queryKey: ['hr-insights'],
    queryFn: async () => {
      const { data } = await client.get('/hr/ai/insights');
      return data?.items ?? [];
    },
  });

  const pastReports = (insightsData ?? []).filter(
    (i: any) => i.insight_type === 'intelligence_report' && i.metadata?.pdf_s3_key
  );

  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data } = await client.post('/hr/reports/export', { period, format, language });
      return data;
    },
    onSuccess: (data) => {
      setLastJobId(data.job_id);
      toast.success('Rapor kuyruğa eklendi! Hazır olduğunda e-posta ile bildirileceksiniz.', { duration: 6000 });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Rapor oluşturulamadı.');
    },
  });

  const handleDownload = async (pdfKey: string, periodLabel: string) => {
    try {
      const { data } = await client.get('/reports/signed-url', { params: { key: pdfKey } });
      const link = document.createElement('a');
      link.href = data.url;
      link.setAttribute('download', `WellMetric_Rapor_${periodLabel}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error('İndirme bağlantısı alınamadı.');
    }
  };

  const selectedMonth = MONTHS.find(m => m.value === period);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy">Raporlar</h1>
        <p className="text-sm text-gray-500">Aylık verileri detaylı PDF veya Excel formatında dışa aktarın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration */}
        <Card title="Yeni Rapor Oluştur">
          <div className="space-y-6">
            {/* Period */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dönem Seçimi</label>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-primary/10"
                value={period}
                onChange={e => setPeriod(e.target.value)}
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dosya Formatı</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${format === 'pdf' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                >
                  <FileText size={20} />
                  <span className="text-sm font-bold">PDF Rapor</span>
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${format === 'excel' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                >
                  <FileSpreadsheet size={20} />
                  <span className="text-sm font-bold">Excel Veri</span>
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rapor Dili</label>
              <div className="flex gap-4">
                {[{ val: 'tr', label: 'Türkçe', flag: '🇹🇷' }, { val: 'en', label: 'İngilizce', flag: '🇬🇧' }].map(opt => (
                  <label key={opt.val} className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setLanguage(opt.val as 'tr' | 'en')}
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${language === opt.val ? 'border-primary' : 'border-gray-200'}`}
                    >
                      {language === opt.val && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-bold text-navy">{opt.flag} {opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Job success state */}
            {lastJobId && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3 animate-in fade-in">
                <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-green-700">Rapor kuyruğa eklendi</p>
                  <p className="text-xs text-green-600 mt-0.5">Hazır olduğunda e-posta bildirimi alacaksınız.</p>
                  <p className="text-[10px] text-green-400 font-mono mt-1">Job: {lastJobId}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full py-4 font-black tracking-widest shadow-lg shadow-primary/20 gap-2"
              loading={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              <Send size={18} />
              RAPOR OLUŞTUR — {selectedMonth?.label}
            </Button>
          </div>
        </Card>

        {/* Content Preview */}
        <Card title="Rapor İçeriği" className="bg-slate-50 border-none">
          <div className="space-y-5">
            <p className="text-xs text-slate-500 leading-relaxed">
              Oluşturulacak <strong className="text-slate-700">{format === 'pdf' ? 'PDF' : 'Excel'}</strong> raporu en güncel verilerinizi kullanarak aşağıdaki bölümleri içerecektir:
            </p>
            <ul className="space-y-3">
              {REPORT_SECTIONS.map(({ icon: Icon, label, desc }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="h-7 w-7 bg-white rounded-lg border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">{label}</p>
                    <p className="text-[11px] text-slate-400">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 flex gap-3">
              <Info className="text-primary shrink-0" size={18} />
              <p className="text-[11px] text-slate-500 leading-normal">
                Raporlar seçilen döneme ait tüm yanıtların AI ile analiz edilip görselleştirilmesiyle otomatik olarak hazırlanır. 
                Hazırlık süresi veri miktarına göre 1-5 dakika arasında değişir.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Past Reports */}
      <Card title="Oluşturulan Raporlar">
        {pastReports.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-300">
            <FileText size={40} />
            <div className="text-center">
              <p className="font-bold text-gray-400">Henüz oluşturulan rapor yok</p>
              <p className="text-xs text-gray-300 mt-1">Yukarıdan rapor oluşturduktan sonra burada görünecek.</p>
            </div>
            {lastJobId && (
              <div className="mt-4 flex items-center gap-2 text-primary text-sm font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                Raporunuz hazırlanıyor...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {pastReports.map((insight: any) => {
              const monthLabel = insight.period
                ? new Date(insight.period + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
                : insight.period;
              return (
                <div key={insight.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">Aylık Wellbeing Raporu — {monthLabel}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        PDF • {insight.metadata?.language === 'en' ? 'İNGİLİZCE' : 'TÜRKÇE'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Oluşturma</p>
                      <p className="text-xs font-bold text-navy">
                        {new Date(insight.created_at).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {insight.metadata?.pdf_s3_key ? (
                      <button
                        onClick={() => handleDownload(insight.metadata.pdf_s3_key, monthLabel)}
                        className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                        title="İndir"
                      >
                        <Download size={18} />
                      </button>
                    ) : (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100" title="Hazırlanıyor">
                        <Clock size={18} className="text-amber-400" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, BarChart2, Users, CheckCircle2, Send,
  Clock, TrendingUp, ClipboardList, Calendar, Loader2
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

const DIMENSION_LABELS: Record<string, string> = {
  physical: 'Fiziksel',
  mental: 'Zihinsel',
  social: 'Sosyal',
  financial: 'Finansal',
  work: 'İş Hayatı',
  overall: 'Genel',
};

const DIMENSION_COLORS: Record<string, string> = {
  physical: '#10b981', mental: '#6366f1', social: '#f59e0b',
  financial: '#3b82f6', work: '#ec4899', overall: '#8b5cf6',
};

export default function HrSurveyResultsPage() {
  const { id } = useParams();
  const { t } = useTranslation('dashboard');

  const { data: survey, isLoading: loadingSurvey } = useQuery({
    queryKey: ['hr-survey-detail', id],
    queryFn: async () => { const { data } = await client.get(`/hr/surveys/${id}`); return data; },
  });

  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['hr-survey-results', id],
    queryFn: async () => { const { data } = await client.get(`/hr/surveys/${id}/results`); return data; },
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['hr-campaigns-for-survey', id],
    queryFn: async () => { const { data } = await client.get('/hr/campaigns', { params: { survey_id: id } }); return data; },
  });

  const loading = loadingSurvey || loadingResults;

  const radarData = results?.dimension_scores
    ? Object.entries(results.dimension_scores)
        .filter(([, v]) => v !== null)
        .map(([key, value]) => ({
          dimension: DIMENSION_LABELS[key] ?? key,
          score: value as number,
          fullMark: 100,
        }))
    : [];

  const campaigns = campaignsData?.items ?? [];
  const hasData = results?.has_data === true;

  if (loading) return (
    <div className="h-[70vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/surveys">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
            <ArrowLeft size={16} /> Geri
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-navy">{survey?.title_tr ?? survey?.title}</h1>
            <Badge variant={survey?.type === 'global' ? 'blue' : 'purple'} className="uppercase text-[10px]">
              {survey?.type === 'global' ? 'Global' : 'Firmaya Özel'}
            </Badge>
          </div>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <Calendar size={14} /> Dönem: {survey?.period ?? '—'}
          </p>
        </div>
        <Link href={`/dashboard/campaigns?survey_id=${id}`}>
          <Button variant="primary" size="sm" className="gap-2">
            <Send size={16} /> Kampanyalar
          </Button>
        </Link>
      </div>

      {/* No data banner */}
      {!hasData && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <TrendingUp size={22} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700">Henüz katılım verisi yok</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Anket dağıtımı yapıldıktan ve çalışanlar anketi tamamladıktan sonra burada gerçek sonuçlar görünecek.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Katılım Oranı', value: hasData ? `${results.participation_rate}%` : '—', icon: <TrendingUp size={20} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tamamlayan', value: hasData ? results.total_completed : '—', icon: <CheckCircle2 size={20} />, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Dağıtım Sayısı', value: campaigns.length, icon: <Send size={20} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Soru Sayısı', value: survey?.questions?.length ?? '—', icon: <ClipboardList size={20} />, color: 'text-purple-600 bg-purple-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-navy">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Boyut Skorları</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                <Radar name="Skor" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip formatter={(v: any) => [`${v}`, 'Skor']} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center text-gray-300 gap-3">
              <BarChart2 size={40} />
              <p className="text-sm font-bold text-gray-400">Henüz veri yok</p>
              <p className="text-xs text-gray-300">Çalışanlar ankete katıldıkça grafik dolacak</p>
            </div>
          )}
        </Card>

        {/* Dimension Score List */}
        <Card className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Boyut Detayları</h2>
          <div className="space-y-4">
            {radarData.length > 0 ? radarData.map(d => (
              <div key={d.dimension}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-navy">{d.dimension}</span>
                  <span className="text-sm font-black text-primary">{d.score}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${d.score}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="space-y-4">
                {Object.entries(DIMENSION_LABELS).map(([k, label]) => (
                  <div key={k}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-navy">{label}</span>
                      <span className="text-xs text-gray-300 font-bold">—</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Campaign History */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-black text-navy flex items-center gap-2">
            <Send size={18} className="text-primary" /> Dağıtım Geçmişi
          </h2>
        </div>
        {campaigns.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {campaigns.map((c: any) => (
              <div key={c.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    c.status === 'sent' ? 'bg-emerald-50 text-emerald-600' :
                    c.status === 'scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {c.status === 'sent' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-navy text-sm">{c.period ?? 'Manuel Dağıtım'}</p>
                    <p className="text-xs text-gray-400">
                      {c.sent_at ? new Date(c.sent_at).toLocaleDateString('tr-TR', { day:'2-digit', month:'long', year:'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gönderilen</p>
                    <p className="font-black text-navy">{c.total_recipients ?? 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tamamlayan</p>
                    <p className="font-black text-emerald-600">{c.completed_count ?? 0}</p>
                  </div>
                  <Link href={`/dashboard/campaigns/${c.id}`}>
                    <Button variant="ghost" size="sm" className="text-primary text-xs font-black">Detay →</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Send size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-bold">Henüz dağıtım yapılmadı</p>
          </div>
        )}
      </Card>
    </div>
  );
}

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft, BarChart2, Send, CheckCircle2, Clock,
  Building2, ClipboardList, TrendingUp, Users, Calendar, Loader2, Edit
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const DIMENSION_LABELS: Record<string, string> = {
  physical: 'Fiziksel', mental: 'Zihinsel', social: 'Sosyal',
  financial: 'Finansal', work: 'İş Hayatı', overall: 'Genel',
};

export default function ConsultantSurveyDetailPage() {
  const { id } = useParams();

  const { data: survey, isLoading } = useQuery({
    queryKey: ['consultant-survey', id],
    queryFn: async () => { const { data } = await client.get(`/consultant/surveys/${id}`); return data; },
  });

  const { data: companies } = useQuery({
    queryKey: ['consultant-companies'],
    queryFn: async () => {
      const { data } = await client.get('/consultant/companies');
      return Array.isArray(data) ? data : (data.data ?? []);
    },
  });

  // Find company this survey belongs to
  const company = companies?.find((c: any) => c.id === survey?.company_id);

  if (isLoading) return (
    <div className="h-[70vh] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
    </div>
  );

  if (!survey) return (
    <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
      <ClipboardList size={48} className="text-gray-200" />
      <p className="text-gray-400 font-bold">Anket bulunamadı</p>
      <Link href="/consultant/surveys"><Button variant="ghost">← Anketler</Button></Link>
    </div>
  );

  const questions = survey.questions ?? [];
  const dimensionCounts = questions.reduce((acc: any, q: any) => {
    acc[q.dimension] = (acc[q.dimension] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/consultant/surveys">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-500 mt-1">
            <ArrowLeft size={16} /> Geri
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-navy">{survey.title_tr}</h1>
            <Badge variant="purple" className="uppercase text-[10px]">Firmaya Özel</Badge>
          </div>
          {company && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400 font-medium">
              <Building2 size={14} />
              <Link href={`/consultant/companies/${company.id}`} className="hover:text-primary transition-colors">
                {company.name}
              </Link>
            </div>
          )}
          {survey.description_tr && (
            <p className="text-sm text-gray-500 mt-2">{survey.description_tr}</p>
          )}
        </div>
        <Link href={`/consultant/surveys/${id}/edit`}>
          <Button variant="secondary" size="sm" className="gap-2 flex-shrink-0">
            <Edit size={16} /> Düzenle
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Soru', value: questions.length, icon: <ClipboardList size={20} />, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Boyut Sayısı', value: Object.keys(dimensionCounts).length, icon: <BarChart2 size={20} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Frekans', value: survey.frequency ?? '—', icon: <Calendar size={20} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Durum', value: survey.is_active ? 'Aktif' : 'Pasif', icon: <TrendingUp size={20} />, color: survey.is_active ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-navy capitalize">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions by Dimension */}
        <Card className="p-6">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Boyutlara Göre Sorular</h2>
          <div className="space-y-3">
            {Object.entries(dimensionCounts).map(([dim, count]: any) => (
              <div key={dim}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-bold text-navy">{DIMENSION_LABELS[dim] ?? dim}</span>
                  <span className="text-sm font-black text-primary">{count} soru</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-all"
                    style={{ width: `${(count / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Henüz soru eklenmedi</p>
            )}
          </div>
        </Card>

        {/* Question List */}
        <Card className="p-6 overflow-hidden">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Soru Listesi</h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {questions.map((q: any, idx: number) => (
              <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy leading-snug line-clamp-2">{q.question_text_tr}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white border border-gray-200 px-1.5 py-0.5 rounded-full">
                      {DIMENSION_LABELS[q.dimension] ?? q.dimension}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                      {q.question_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="py-10 text-center text-gray-300">
                <ClipboardList size={32} className="mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-400">Soru bulunamadı</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Company Link */}
      {company && (
        <Card className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center shadow-sm">
              <Building2 size={24} className="text-indigo-500" />
            </div>
            <div>
              <p className="font-black text-navy">{company.name}</p>
              <p className="text-sm text-gray-500">Bu anketin atandığı firma</p>
            </div>
          </div>
          <Link href={`/consultant/companies/${company.id}`}>
            <Button variant="secondary" size="sm" className="gap-2 bg-white">
              <Building2 size={16} /> Firma Detayı →
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

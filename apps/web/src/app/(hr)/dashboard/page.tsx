'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { DimensionBars } from '@/components/charts/DimensionBars';
import { TrendLine } from '@/components/charts/TrendLine';
import { ScoreBar } from '@/components/charts/ScoreBar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { 
  AlertTriangle, 
  Bot, 
  Users, 
  TrendingUp, 
  Target,
  ArrowRight,
  Info,
  ChevronRight
} from 'lucide-react';
import client from '@/lib/api/client';
import { getIndustryLabel } from '@wellanalytics/shared';
import '@/lib/i18n';

export default function HrOverviewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-400">Yükleniyor...</div>}>
      <HrOverviewContent />
    </Suspense>
  );
}

function HrOverviewContent() {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
  
  const [selectedDimension, setSelectedDimension] = useState<string>('overall');
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false);

  // Queries
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['hr-overview', period],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/overview', { params: { period } });
      return res.data;
    },
  });

  const { data: dimensions = [], isLoading: dimsLoading } = useQuery({
    queryKey: ['hr-dimensions', period],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/dimensions', { params: { period } });
      return res.data;
    },
  });

  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['hr-trend', selectedDimension],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/trend', { params: { months: 6 } });
      return res.data;
    },
  });

  const { data: benchmark } = useQuery({
    queryKey: ['hr-benchmark', period],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/benchmark', { params: { period } });
      return res.data;
    },
  });

  const handleRiskClick = (dimension: string) => {
    router.push(`/dashboard/departments?filter=${dimension.toLowerCase()}`);
  };

  if (overviewLoading) return <div className="flex justify-center py-20 text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('overview.title')}</h1>
          <p className="text-sm text-gray-500">{t('overview.subtitle', { company_name: overview?.company_name || 'Şirketiniz' })}</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard 
          label={t('overview.score_card.this_month')} 
          score={overview?.score_card?.overall || 0} 
          change={overview?.changes?.overall_change || 0} 
          size="lg" 
        />
        
        <Card className="flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('overview.participation.title')}</p>
               <h3 className="text-3xl font-bold text-navy mt-1">%{overview?.participation_rate || 0}</h3>
               <p className="text-xs text-gray-500 mt-1">
                 {t('overview.participation.responded', { count: overview?.score_card?.respondent_count || 0 })}
               </p>
             </div>
             <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
               <Users size={20} />
             </div>
           </div>
           <div className="mt-6">
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${overview?.participation_rate || 0}%` }} 
                />
              </div>
           </div>
        </Card>

        <Card className="flex flex-col justify-between border-primary/20 bg-primary/5">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-primary uppercase tracking-wider">{t('overview.benchmark.title')}</p>
               <h3 className="text-3xl font-bold text-navy mt-1">
                 {(benchmark?.difference ?? 0) > 0 ? '+' : ''}{benchmark?.difference ?? 0} Puan
               </h3>
               <p className="text-xs text-gray-400 mt-1">
                  {overview?.industry ? `${getIndustryLabel(overview.industry, i18n.language as any)} ${t('overview.benchmark.avg_suffix', 'ortalaması')}` : t('overview.benchmark.sector_avg', 'Sektör ortalaması')}: {benchmark?.sector_average ?? '--'}
                </p>
             </div>
             <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
               <Target size={20} />
             </div>
           </div>
           <div className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
             <TrendingUp size={14} />
             {(benchmark?.difference ?? 0) < 0 
               ? t('overview.score_card.below_sector') 
               : t('overview.score_card.above_sector')}
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dimension Analysis */}
        <Card title={t('overview.trend.select_dimension')} className="lg:col-span-1">
           <div className="space-y-6">
              {dimensions.map((dim: any) => (
                <ScoreBar 
                  key={dim.name} 
                  label={t(`common:dimensions.${dim.key}`)} 
                  score={dim.score} 
                />
              ))}
           </div>
           
           <div className="mt-10 pt-6 border-t border-gray-50">
              <h4 className="text-xs font-bold text-danger flex items-center gap-2 mb-4 uppercase tracking-wider">
                <AlertTriangle size={14} />
                {t('overview.risk_alerts.title')}
              </h4>
              <div className="space-y-2">
                {dimensions.filter((d: any) => d.score < 60).map((dim: any) => (
                  <button 
                    key={dim.key}
                    onClick={() => handleRiskClick(dim.key)}
                    className="w-full p-3 bg-danger/5 border border-danger/10 rounded-lg text-xs font-medium text-danger flex items-center justify-between hover:bg-danger/10 transition-colors"
                  >
                    <span>{t('overview.risk_alerts.critical', { dimension: t(`common:dimensions.${dim.key}`), score: dim.score })}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
                {dimensions.filter((d: any) => d.score < 60).length === 0 && (
                  <p className="text-xs text-gray-400 italic">{t('overview.risk_alerts.no_alerts')}</p>
                )}
              </div>
           </div>
        </Card>

        {/* Trend & AI */}
        <div className="lg:col-span-2 space-y-8">
          <Card title={t('overview.trend.title')}>
             <div className="flex justify-end mb-4">
                <select 
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="overall">{t('common:dimensions.overall')}</option>
                  <option value="physical">{t('common:dimensions.physical')}</option>
                  <option value="mental">{t('common:dimensions.mental')}</option>
                  <option value="social">{t('common:dimensions.social')}</option>
                  <option value="financial">{t('common:dimensions.financial')}</option>
                  <option value="work">{t('common:dimensions.work')}</option>
                </select>
             </div>
             <TrendLine data={trendData} dimensions={[selectedDimension]} />
          </Card>

          <Card className="bg-navy text-white border-none shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot size={120} />
             </div>
             <div className="relative z-10 p-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Bot size={22} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{t('overview.ai_insight.title')}</h3>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                      {overview?.ai_insight?.generated_at ? new Date(overview.ai_insight.generated_at).toLocaleDateString() : t('overview.ai_insight.generated', { date: period })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed max-w-2xl italic line-clamp-2">
                  "{overview?.ai_insight?.content || t('overview.ai_insight.no_insight')}"
                </p>
                <div className="mt-6">
                  <button 
                    onClick={() => setIsInsightModalOpen(true)}
                    className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/10"
                  >
                    {t('common.view_details', 'Analiz Detaylarını Gör')}
                  </button>
                </div>
             </div>
          </Card>
        </div>
      </div>

      {/* AI Insight Modal */}
      <Modal 
        isOpen={isInsightModalOpen} 
        onClose={() => setIsInsightModalOpen(false)} 
        title={t('overview.ai_insight.title')}
      >
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">
              {overview?.ai_insight?.content || t('overview.ai_insight.no_insight')}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsInsightModalOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

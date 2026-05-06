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
  Users, 
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import client from '@/lib/api/client';
import { BenchmarkComparison } from '@/components/hr/BenchmarkComparison';
import '@/lib/i18n';

export default function HrOverviewPage() {
  const { t } = useTranslation(['common']);
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-400">{t('common.loading')}</div>}>
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
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      await client.post('/admin/cron/recalculate-scores');
      alert(t('dashboard.overview.recalculate_success', 'Güncelleme arka planda başlatıldı. Değişikliklerin yansıması yaklaşık 1 dakika sürebilir, ardından sayfayı yenileyebilirsiniz.'));
    } catch (error) {
      console.error('Failed to recalculate scores', error);
      alert(t('dashboard.overview.recalculate_error', 'Skor güncellenirken bir hata oluştu.'));
    } finally {
      setIsRecalculating(false);
    }
  };

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

  // Önceki ay değişimi overview'dan geliyor

  const handleRiskClick = (dimension: string) => {
    router.push(`/dashboard/departments?filter=${dimension.toLowerCase()}`);
  };

  if (overviewLoading) return <div className="flex justify-center py-20 text-gray-400">{t('common.loading')}</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('dashboard.overview.title')}</h1>
          <p className="text-sm text-gray-500">{t('dashboard.overview.subtitle', { company_name: overview?.company_name || 'Şirketiniz' })}</p>
        </div>
        <div>
          <Button 
            onClick={handleRecalculateScores} 
            disabled={isRecalculating} 
            variant="outline"
            className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            {isRecalculating ? t('common.updating', 'Güncelleniyor...') : t('dashboard.overview.recalculate_button', 'Skorları Güncelle')}
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard 
          label={t('dashboard.overview.score_card.this_month')} 
          score={overview?.score_card?.overall || 0} 
          change={overview?.changes?.overall_change || 0} 
          size="lg" 
        />
        
        <Card className="flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.overview.participation.title')}</p>
               <h3 className="text-3xl font-bold text-navy mt-1">%{overview?.participation_rate || 0}</h3>
               <p className="text-xs text-gray-500 mt-1">
                 {t('dashboard.overview.participation.responded', { count: overview?.score_card?.respondent_count || 0 })}
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

        {/* 3. Kart: Geçen Aya Göre Değişim */}
        {(() => {
          const change = overview?.changes?.overall_change ?? 0;
          const hasPrevData = overview?.changes && Object.values(overview.changes.dimension_changes || {}).some((v: any) => v !== 0);
          const dims = [
            { key: 'mental' },
            { key: 'social' },
            { key: 'physical' },
            { key: 'financial' },
            { key: 'work' },
          ];
          return (
            <Card className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('dashboard.overview.score_card.comparison_prefix')}</p>
                  {!hasPrevData ? (
                    <>
                      <h3 className="text-2xl font-bold text-gray-300 mt-1">{t('dashboard.overview.score_card.first_month')}</h3>
                      <p className="text-xs text-gray-400 mt-1">{t('dashboard.overview.score_card.no_prev_data')}</p>
                    </>
                  ) : (
                    <>
                      <h3 className={`text-3xl font-bold mt-1 ${
                        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {change > 0 ? '+' : ''}{Math.round(change * 10) / 10} {t('dashboard.overview.score_card.points')}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{t('dashboard.overview.score_card.overall_change')}</p>
                    </>
                  )}
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  !hasPrevData ? 'bg-gray-50 text-gray-300' :
                  change > 0 ? 'bg-green-50 text-green-600' : 
                  change < 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'
                }`}>
                  {!hasPrevData ? <Minus size={20} /> : change > 0 ? <TrendingUp size={20} /> : change < 0 ? <TrendingDown size={20} /> : <Minus size={20} />}
                </div>
              </div>
              {hasPrevData && (
                <div className="mt-4 space-y-1.5">
                  {dims.map(d => {
                    const v = overview?.changes?.dimension_changes?.[d.key] ?? 0;
                    if (v === 0) return null;
                    return (
                      <div key={d.key} className="flex items-center justify-between text-[11px]">
                         <span className="text-gray-400 font-medium">{t(`common.dimensions.${d.key}`)}</span>
                        <span className={`font-bold ${v > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {v > 0 ? '+' : ''}{Math.round(v * 10) / 10}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })()}
      </div>

      <BenchmarkComparison 
        companyScores={overview?.score_card} 
        period={period} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dimension Analysis */}
        <Card title={t('dashboard.overview.trend.select_dimension')} className="lg:col-span-1">
           <div className="space-y-6">
              {dimensions.map((dim: any) => (
                <ScoreBar 
                  key={dim.dimension} 
                  label={t(`common.dimensions.${dim.dimension}`)} 
                  score={dim.score} 
                />
              ))}
           </div>
           
           <div className="mt-10 pt-6 border-t border-gray-50">
              <h4 className="text-xs font-bold text-danger flex items-center gap-2 mb-4 uppercase tracking-wider">
                <AlertTriangle size={14} />
                {t('dashboard.overview.risk_alerts.title')}
              </h4>
              <div className="space-y-2">
                {dimensions.filter((d: any) => d.score < 60).map((dim: any) => (
                  <button 
                    key={dim.dimension}
                    onClick={() => handleRiskClick(dim.dimension)}
                    className="w-full p-3 bg-danger/5 border border-danger/10 rounded-lg text-xs font-medium text-danger flex items-center justify-between hover:bg-danger/10 transition-colors"
                  >
                    <span>{t('dashboard.overview.risk_alerts.critical', { dimension: t(`common.dimensions.${dim.dimension}`), score: dim.score })}</span>
                    <ChevronRight size={14} />
                  </button>
                ))}
                {dimensions.filter((d: any) => d.score < 60).length === 0 && (
                  <p className="text-xs text-gray-400 italic">{t('dashboard.overview.risk_alerts.no_alerts')}</p>
                )}
              </div>
           </div>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          <Card title={t('dashboard.overview.trend.title')}>
             <div className="flex justify-end mb-4">
                <select 
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/10"
                >
                  <option value="overall">{t('common.dimensions.overall')}</option>
                  <option value="physical">{t('common.dimensions.physical')}</option>
                  <option value="mental">{t('common.dimensions.mental')}</option>
                  <option value="social">{t('common.dimensions.social')}</option>
                  <option value="financial">{t('common.dimensions.financial')}</option>
                  <option value="work">{t('common.dimensions.work')}</option>
                </select>
             </div>
             <TrendLine data={trendData} dimensions={[selectedDimension]} />
          </Card>
        </div>
      </div>

      {/* Content ends here */}
    </div>
  );
}

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
  TrendingDown,
  Minus,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import client from '@/lib/api/client';
import { BenchmarkComparison } from '@/components/hr/BenchmarkComparison';
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
  const [isRecalculating, setIsRecalculating] = useState(false);

  const handleRecalculateScores = async () => {
    setIsRecalculating(true);
    try {
      await client.post('/admin/cron/recalculate-scores');
      alert('Güncelleme arka planda başlatıldı. Değişikliklerin yansıması yaklaşık 1 dakika sürebilir, ardından sayfayı yenileyebilirsiniz.');
    } catch (error) {
      console.error('Failed to recalculate scores', error);
      alert('Skor güncellenirken bir hata oluştu.');
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
          <h1 className="text-2xl font-bold text-navy">{t('overview.title')}</h1>
          <p className="text-sm text-gray-500">{t('overview.subtitle', { company_name: overview?.company_name || 'Şirketiniz' })}</p>
        </div>
        <div>
          <Button 
            onClick={handleRecalculateScores} 
            disabled={isRecalculating} 
            variant="outline"
            className="flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
          >
            {isRecalculating ? 'Güncelleniyor...' : 'Skorları Güncelle'}
          </Button>
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

        {/* 3. Kart: Geçen Aya Göre Değişim */}
        {(() => {
          const change = overview?.changes?.overall_change ?? 0;
          const hasPrevData = overview?.changes && Object.values(overview.changes.dimension_changes || {}).some((v: any) => v !== 0);
          const dims = [
            { key: 'mental', label: 'Zihinsel' },
            { key: 'social', label: 'Sosyal' },
            { key: 'physical', label: 'Fiziksel' },
            { key: 'financial', label: 'Finansal' },
            { key: 'work', label: 'İş' },
          ];
          return (
            <Card className="flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">GEÇEN AYA GÖRE</p>
                  {!hasPrevData ? (
                    <>
                      <h3 className="text-2xl font-bold text-gray-300 mt-1">İlk Ay</h3>
                      <p className="text-xs text-gray-400 mt-1">Henüz karşılaştırma verisi yok</p>
                    </>
                  ) : (
                    <>
                      <h3 className={`text-3xl font-bold mt-1 ${
                        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {change > 0 ? '+' : ''}{Math.round(change * 10) / 10} Puan
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Genel skor değişimi</p>
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
                        <span className="text-gray-400 font-medium">{d.label}</span>
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
        <Card title={t('overview.trend.select_dimension')} className="lg:col-span-1">
           <div className="space-y-6">
              {dimensions.map((dim: any) => (
                <ScoreBar 
                  key={dim.dimension} 
                  label={t(`common:dimensions.${dim.dimension}`)} 
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
                    key={dim.dimension}
                    onClick={() => handleRiskClick(dim.dimension)}
                    className="w-full p-3 bg-danger/5 border border-danger/10 rounded-lg text-xs font-medium text-danger flex items-center justify-between hover:bg-danger/10 transition-colors"
                  >
                    <span>{t('overview.risk_alerts.critical', { dimension: t(`common:dimensions.${dim.dimension}`), score: dim.score })}</span>
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

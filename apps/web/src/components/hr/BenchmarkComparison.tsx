'use client';

import React, { useEffect, useState } from 'react';
import client from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import { Loader2, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const DIMENSIONS = [
  { key: 'physical',  label: 'Fiziksel' },
  { key: 'mental',    label: 'Zihinsel' },
  { key: 'social',    label: 'Sosyal' },
  { key: 'financial', label: 'Finansal' },
  { key: 'work',      label: 'İş & Anlam' },
];

export function BenchmarkComparison({ companyScores, period }: { companyScores: any, period: string }) {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenchmark = async () => {
      try {
        const res = await client.get(`/hr/dashboard/benchmark?period=${period}`);
        setBenchmark(res.data.data || res.data);
      } catch (error) {
        console.error('Benchmark fetch failed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBenchmark();
  }, [period]);

  if (loading) return <BenchmarkSkeleton />;
  if (!benchmark || !benchmark.benchmark) return null;

  const overall = benchmark.benchmark['overall'];
  if (!overall) return null;

  const isResearch = overall?.turkey_platform?.data_source === 'research';
  const industryLabel = benchmark.industry 
    ? (i18n.language === 'tr' ? (benchmark.industry_label_tr || benchmark.industry) : (benchmark.industry_label_en || benchmark.industry))
    : t('dashboard.overview.benchmark.general');

  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-navy">{t('dashboard.overview.benchmark.title')}</h3>
          <p className="text-sm text-slate-500 font-medium">
            {t('dashboard.overview.benchmark.subtitle', { industry: industryLabel.toUpperCase() })}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          {[
            { color: 'bg-primary', label: t('dashboard.overview.benchmark.your_company') },
            { color: 'bg-green-500', label: t('dashboard.overview.benchmark.turkey') },
            { color: 'bg-blue-500', label: t('dashboard.overview.benchmark.world') },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t('dashboard.overview.benchmark.your_company'), score: companyScores?.overall, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
          { label: t('dashboard.overview.benchmark.turkey_avg'), score: overall?.turkey_platform?.score, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
          { label: t('dashboard.overview.benchmark.world_avg'), score: overall?.global?.score, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        ].map(item => (
          <div key={item.label} className={`${item.bg} ${item.border} border p-6 rounded-3xl text-center relative overflow-hidden group`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${item.color}`}>{item.label}</p>
            <div className={`text-4xl font-black ${item.color}`}>
              {item.score !== undefined && item.score !== null ? Math.round(item.score) : '—'}
            </div>
            
            {item.label === t('dashboard.overview.benchmark.your_company') && overall?.turkey_platform?.score && companyScores?.overall !== undefined && (
              <div className={`mt-2 flex items-center justify-center gap-1 text-[11px] font-bold ${Math.round(companyScores.overall) >= Math.round(overall.turkey_platform.score) ? 'text-green-600' : 'text-red-600'}`}>
                {Math.round(companyScores.overall) >= Math.round(overall.turkey_platform.score) ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                {t('dashboard.overview.benchmark.comparison_result', {
                  points: Math.abs(Math.round(companyScores.overall - overall.turkey_platform.score)),
                  direction: Math.round(companyScores.overall) >= Math.round(overall.turkey_platform.score) ? t('dashboard.overview.score_card.above') : t('dashboard.overview.score_card.below')
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dimensions Detail */}
      <div className="space-y-6 pt-4">
        {DIMENSIONS.map(dim => {
          const bench = benchmark.benchmark?.[dim.key];
          const myScore = companyScores?.[dim.key] ?? 0;
          const trScore = bench?.turkey_platform?.score ?? 0;
          const glScore = bench?.global?.score ?? 0;
          const isFinancial = dim.key === 'financial';

          return (
            <div key={dim.key} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className={`text-xs font-black uppercase tracking-widest ${isFinancial ? 'text-red-500' : 'text-navy'}`}>
                  {t(`common.dimensions.${dim.key}`)}
                  {isFinancial && <span className="ml-2 text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{t('dashboard.overview.benchmark.enflation_effect')}</span>}
                </span>
                <div className="flex gap-4">
                   <span className="text-[10px] font-bold text-primary">{t('dashboard.overview.benchmark.your_company').toUpperCase()}: {Math.round(myScore)}</span>
                   <span className="text-[10px] font-bold text-green-600">{t('dashboard.overview.benchmark.turkey').toUpperCase()}: {Math.round(trScore)}</span>
                   <span className="text-[10px] font-bold text-blue-600">{t('dashboard.overview.benchmark.world').toUpperCase()}: {Math.round(glScore)}</span>
                </div>
              </div>
              
              <div className="relative h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                {/* Global Bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-500/20 transition-all duration-1000 ease-out" 
                  style={{ width: `${glScore}%` }} 
                />
                {/* Turkey Bar */}
                <div 
                  className="absolute inset-y-0 left-0 bg-green-500/30 transition-all duration-1000 ease-out" 
                  style={{ width: `${trScore}%` }} 
                />
                {/* Company Score Marker */}
                <div 
                  className="absolute inset-y-0 left-0 bg-primary shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all duration-1000 ease-out rounded-r-full" 
                  style={{ width: `${myScore}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Research Disclaimer */}
      {isResearch && (
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
          <div className="bg-white p-1.5 rounded-lg shadow-sm">
             <Info className="text-primary" size={16} />
          </div>
          <div className="text-[11px] text-slate-500 leading-relaxed font-medium">
            <p>{t('dashboard.overview.benchmark.research_disclaimer')}</p>
            <p className="mt-1">
              {t('dashboard.overview.benchmark.enflation_note')}
            </p>
            {overall?.platform_progress && (
              <p className="mt-1 text-primary font-bold">
                {t('dashboard.overview.benchmark.platform_data_note')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BenchmarkSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm space-y-8 animate-pulse">
      <div className="h-12 bg-slate-50 rounded-2xl w-1/3" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-24 bg-slate-50 rounded-3xl" />
        <div className="h-24 bg-slate-50 rounded-3xl" />
        <div className="h-24 bg-slate-50 rounded-3xl" />
      </div>
      <div className="space-y-4">
        {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-slate-50 rounded-full" />)}
      </div>
    </div>
  );
}

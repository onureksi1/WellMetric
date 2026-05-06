'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/hooks/useT';
import { 
  ArrowLeft,
  Zap,
  Mail,
  Building2,
  Sparkles,
  Loader2,
  ShieldCheck,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

const PACKAGE_ORDER = ['starter', 'growth', 'enterprise'];

const UpgradePage = () => {
  const router = useRouter();
  const { t, tc, i18n } = useT('consultant');
  const [data, setData] = useState<any>(null);
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await client.get('/consultant/billing/packages');
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch packages:', error);
        toast.error('Paketler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const currentKey = data?.current_package_key;
  const currentOrder = PACKAGE_ORDER.indexOf(currentKey ?? '');

  const getPrice = (pkg: any) => {
    if (interval === 'yearly' && pkg.price_yearly) {
      return (pkg.price_yearly / 12).toFixed(0);
    }
    return pkg.price_monthly;
  };

  const getYearlySaving = (pkg: any) => {
    if (!pkg.price_yearly) return null;
    const monthlyTotal = Number(pkg.price_monthly) * 12;
    const saving = monthlyTotal - Number(pkg.price_yearly);
    return Math.round(saving);
  };

  const handleUpgrade = async (pkg: any) => {
    setPaying(pkg.key);
    router.push(`/consultant/billing?package=${pkg.key}&interval=${interval}&action=checkout`);
  };

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="text-slate-500 font-medium italic">{tc('loading')}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12 pb-20 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold self-start group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {tc('back')}
        </button>
        
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 mb-2">
           <Sparkles size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
          {t('billing.upgrade.title')}
        </h1>
        <p className="text-slate-500 max-w-lg font-medium">
          {t('billing.upgrade.subtitle')}
        </p>
      </div>

      {/* Monthly / Yearly Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 bg-slate-100 rounded-[24px] gap-1 shadow-inner border border-slate-200">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-8 py-3 rounded-[20px] text-sm font-black transition-all ${
              interval === 'monthly' 
                ? 'bg-white text-blue-600 shadow-md translate-y-0' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('billing.upgrade.monthly')}
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-8 py-3 rounded-[20px] text-sm font-black transition-all flex items-center gap-2 ${
              interval === 'yearly' 
                ? 'bg-white text-blue-600 shadow-md' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t('billing.upgrade.yearly')}
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
              {t('billing.upgrade.yearly_discount')}
            </span>
          </button>
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(data?.packages ?? []).map((pkg: any) => {
          const pkgOrder = PACKAGE_ORDER.indexOf(pkg.key);
          const isCurrent = pkg.key === currentKey;
          const isDowngrade = currentOrder > -1 && pkgOrder < currentOrder;
          const isDisabled = isCurrent || isDowngrade;
          const isPopular = pkg.key === 'growth';
          const saving = getYearlySaving(pkg);

          return (
            <div 
              key={pkg.key} 
              className={`relative bg-white rounded-[48px] border-2 p-10 transition-all flex flex-col ${
                isCurrent 
                  ? 'border-blue-400 bg-blue-50/5 shadow-xl' 
                  : isPopular 
                    ? 'border-slate-900 shadow-2xl scale-105 z-10' 
                    : 'border-slate-100 shadow-xl shadow-slate-200/40'
              }`}
            >
              {/* Badges */}
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                  {t('billing.upgrade.current_badge')}
                </div>
              )}
              {!isCurrent && isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                  {t('billing.upgrade.popular_badge')}
                </div>
              )}

              {/* Package Header */}
              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{pkg.label_tr}</h3>
                <p className="text-slate-400 text-xs font-bold min-h-[32px]">{pkg.description_tr}</p>
                
                <div className="mt-8 flex flex-col items-center">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-400">$</span>
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">{getPrice(pkg)}</span>
                    <span className="text-slate-400 text-sm font-bold">{t('billing.upgrade.usd_per_month')}</span>
                  </div>
                  
                  {interval === 'yearly' && saving && (
                    <div className="mt-2 text-xs font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                      {t('billing.upgrade.yearly_saving', { amount: saving })}
                    </div>
                  )}
                  {interval === 'yearly' && pkg.price_yearly && (
                    <div className="mt-1 text-[10px] font-bold text-slate-300">
                      {t('billing.upgrade.yearly_billing', { amount: pkg.price_yearly })}
                    </div>
                  )}
                </div>
              </div>

              {/* Limits List */}
              <div className="bg-slate-50 rounded-[32px] p-8 mb-10 space-y-6 flex-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-200 pb-3 mb-2">
                  {t('billing.upgrade.credits_title')}
                </div>
                
                {/* AI Credit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Zap size={16} className="text-blue-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{t('billing.upgrade.ai_credit')}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {pkg.credits?.ai_credit === -1 
                      ? t('billing.upgrade.unlimited') 
                      : t('billing.upgrade.credits_unit', { n: pkg.credits?.ai_credit?.toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US') })}
                  </span>
                </div>
                
                {/* Mail Credit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Mail size={16} className="text-indigo-500" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{t('billing.upgrade.mail_credit')}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {pkg.credits?.mail_credit === -1 
                      ? t('billing.upgrade.unlimited') 
                      : t('billing.upgrade.credits_unit', { n: pkg.credits?.mail_credit?.toLocaleString(i18n.language === 'tr' ? 'tr-TR' : 'en-US') })}
                  </span>
                </div>

                {/* Company Limit */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">{t('billing.upgrade.companies')}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    {pkg.max_companies === null 
                      ? t('billing.upgrade.unlimited') 
                      : t('billing.upgrade.up_to', { n: pkg.max_companies })}
                  </span>
                </div>

                {/* White Label Special Line (Only for Enterprise) */}
                {pkg.white_label && (
                   <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl shadow-sm">
                          <Sparkles size={16} className="text-amber-500" />
                        </div>
                        <span className="text-sm font-bold text-amber-600">{t('billing.upgrade.white_label')}</span>
                      </div>
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest">{t('billing.upgrade.included')}</span>
                   </div>
                )}

                <p className="text-[10px] font-bold text-slate-400 mt-6 leading-relaxed italic border-t border-slate-100 pt-4">
                   * {t('billing.upgrade.credit_disclaimer')}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => !isDisabled && handleUpgrade(pkg)}
                disabled={isDisabled || paying === pkg.key}
                className={`w-full py-5 rounded-[28px] font-black transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest ${
                  isCurrent
                    ? 'bg-blue-100 text-blue-500 cursor-not-allowed'
                    : isDowngrade
                      ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-2 border-slate-100'
                      : isPopular
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/30 hover:bg-slate-800 hover:-translate-y-1'
                        : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-900 transition-all'
                }`}
              >
                {isCurrent
                  ? t('billing.upgrade.current_btn')
                  : isDowngrade
                    ? t('billing.upgrade.downgrade_btn')
                    : paying === pkg.key
                      ? t('billing.upgrade.redirecting')
                      : t('billing.upgrade.upgrade_btn', { name: pkg.label_tr })}
                {!isDisabled && <ChevronRight size={18} />}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-col items-center space-y-8 pt-10 border-t-2 border-slate-50">
        <div className="flex flex-wrap justify-center gap-12">
           <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
              <ShieldCheck size={24} className="text-emerald-500" /> 
              256-bit Secure SSL
           </div>
           <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
              <CreditCard size={24} className="text-blue-500" /> 
              Global Payment Support
           </div>
        </div>
        
        <p className="text-center max-w-2xl text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-widest">
          {t('billing.upgrade.footer')}
        </p>
      </div>
    </div>
  );
};

export default UpgradePage;

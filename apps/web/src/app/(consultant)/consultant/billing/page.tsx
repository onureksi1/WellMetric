'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, 
  Zap, 
  History, 
  BarChart3, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Loader2,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

const TABS = [
  { key: 'subscription', icon: Package },
  { key: 'credits', icon: Zap },
  { key: 'purchase', icon: CreditCard },
  { key: 'invoices', icon: History },
  { key: 'usage', icon: BarChart3 },
];

export default function BillingPage() {
  const { t } = useTranslation('consultant');
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeTab = searchParams.get('tab') || 'subscription';

  const setTab = (key: string) => {
    router.push(`/consultant/billing?tab=${key}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('billing.title')}</h1>
        <p className="text-slate-500 font-medium">{t('billing.subtitle')}</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon size={18} />
              {t(`billing.tabs.${tab.key}`)}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'subscription' && <SubscriptionTab />}
        {activeTab === 'credits' && <CreditsTab />}
        {activeTab === 'purchase' && <PurchaseTab />}
        {activeTab === 'invoices' && <InvoicesTab />}
        {activeTab === 'usage' && <UsageTab />}
      </div>
    </div>
  );
}

// --- TAB COMPONENTS ---

function SubscriptionTab() {
  const { t } = useTranslation('consultant');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: sub, isLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: () => client.get('/consultant/billing/subscription').then(res => res.data)
  });

  const { data: packages, isLoading: pkgsLoading } = useQuery({
    queryKey: ['billing-packages-popular'],
    queryFn: () => client.get('/consultant/billing/packages?type=subscription').then(res => res.data)
  });

  const cancelMutation = useMutation({
    mutationFn: () => client.post('/consultant/billing/cancel'),
    onSuccess: () => {
      toast.success(t('billing.subscription.cancel_success'));
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
    }
  });

  const handleCancel = () => {
    if (confirm(t('billing.subscription.cancel_confirm'))) {
      cancelMutation.mutate();
    }
  };

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Left Column: Subscription Card */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        <div className="bg-white rounded-[40px] border-2 border-slate-100 p-10 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
             <Package size={200} />
           </div>

           <div className="relative z-10 space-y-8">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${sub ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                     {sub ? t('billing.subscription.active_plan') : t('billing.subscription.free_plan')}
                   </span>
                   <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tighter mt-4">{t('billing.subscription.current_status')}</h2>
                   <p className="text-4xl font-black text-slate-900">{sub ? sub.package_label : t('billing.subscription.no_subscription')}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-[32px]">
                   <Zap className="text-blue-600" size={32} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('billing.subscription.expiry_date')}</p>
                    <p className="text-lg font-black text-slate-900">{sub ? format(new Date(sub.current_period_end), 'dd MMMM yyyy', { locale: tr }) : '-'}</p>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('billing.subscription.monthly_price')}</p>
                    <p className="text-lg font-black text-slate-900">{sub ? `${sub.price}₺` : t('billing.subscription.upgrade')}</p>
                 </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                 <button 
                  onClick={() => router.push('/consultant/billing/upgrade')}
                  className="flex-1 bg-slate-900 text-white py-4 rounded-[24px] font-black hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
                 >
                   {t('billing.subscription.upgrade')}
                   <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </button>
                 <button 
                  onClick={handleCancel}
                  disabled={!sub || sub.cancel_at_period_end}
                  className="px-8 py-4 rounded-[24px] font-black border-2 border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {sub?.cancel_at_period_end ? 'İptal Edildi' : t('billing.subscription.cancel')}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Right Column: Widgets */}
      <div className="col-span-12 lg:col-span-4 space-y-6">
        {/* Popular Packages Widget */}
        <div className="bg-white rounded-[32px] border-2 border-slate-100 p-6 space-y-6 shadow-sm">
           <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-tighter">{t('billing.subscription.popular_packages')}</h3>
              <Package size={20} className="text-slate-300" />
           </div>
           
           <div className="space-y-3">
              {pkgsLoading ? [1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />) : 
               packages?.slice(0, 3).map((pkg: any) => (
                <div key={pkg.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group" onClick={() => router.push('/consultant/billing/upgrade')}>
                   <div>
                      <p className="text-sm font-black text-slate-900">{pkg.label_tr}</p>
                      <p className="text-xs font-bold text-blue-600">{pkg.price_monthly}₺</p>
                   </div>
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                </div>
              ))}
           </div>

           <button 
            onClick={() => router.push('/consultant/billing/upgrade')}
            className="w-full py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
           >
             {t('billing.subscription.view_all')} →
           </button>
        </div>

        {/* Quick Buy Widget */}
        <div 
          onClick={() => router.push('/consultant/billing?tab=purchase')}
          className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 text-white relative overflow-hidden group cursor-pointer shadow-lg shadow-indigo-600/20"
        >
           <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
              <Zap size={120} />
           </div>
           <div className="relative z-10 space-y-4">
              <div className="p-2 bg-white/10 rounded-xl w-fit">
                 <Zap size={20} />
              </div>
              <div>
                 <h3 className="text-xl font-black leading-tight uppercase tracking-tighter">{t('billing.subscription.quick_buy')}</h3>
                 <p className="text-white/60 text-sm font-medium">{t('billing.subscription.quick_buy_desc')}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function CreditsTab() {
  const { t } = useTranslation('consultant');
  const router = useRouter();
  const { data: credits, isLoading } = useQuery({
    queryKey: ['billing-credits'],
    queryFn: () => client.get('/consultant/billing/credits').then(res => res.data)
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {credits?.map((c: any) => {
        const percentage = c.balance === -1 ? 0 : Math.max(0, Math.min(100, (c.used_this_month / c.package_amount) * 100));
        const isCritical = c.balance !== -1 && c.balance < (c.package_amount * 0.1);
        const isWarning = c.balance !== -1 && c.balance < (c.package_amount * 0.25);
        
        return (
          <div key={c.credit_type_key} className={`bg-white rounded-[40px] border-2 p-10 shadow-xl transition-all hover:scale-[1.01] ${isCritical ? 'border-red-100 bg-red-50/10' : 'border-slate-100 shadow-slate-200/50'}`}>
            <div className="flex items-start justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="p-4 rounded-3xl" style={{ backgroundColor: `${c.color}15`, color: c.color }}>
                     <Zap size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-slate-900">{c.label_tr}</h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('billing.credits.renewal')}: {format(new Date(c.reset_date), 'dd MMM', { locale: tr })}</p>
                  </div>
               </div>
               {c.balance === -1 ? (
                 <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                   {t('billing.credits.unlimited')}
                 </span>
               ) : isCritical && (
                 <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                   <AlertCircle size={12} /> {t('billing.credits.out_of_credit')}
                 </span>
               )}
            </div>

            {c.balance !== -1 && (
              <div className="space-y-6">
                <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
                   <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${percentage}%` }}
                   />
                </div>
                
                <div className="flex items-end justify-between">
                   <div>
                      <p className="text-3xl font-black text-slate-900">{c.balance}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('billing.credits.remaining')} / {c.package_amount} {t('billing.credits.total')}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{c.used_this_month}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('billing.credits.used_this_month')}</p>
                   </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => router.push('/consultant/billing?tab=purchase')}
              className="w-full mt-10 py-4 rounded-2xl font-black border-2 border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all"
            >
              {t('billing.credits.add_credits')}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function PurchaseTab() {
  const { t } = useTranslation('consultant');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: creditPackages, isLoading } = useQuery({
    queryKey: ['billing-credit-packages'],
    queryFn: () => client.get('/consultant/billing/packages?type=credit').then(res => res.data)
  });

  const { data: providers } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => client.get('/settings/payment-providers').then(res => res.data)
  });

  const handlePurchase = (pkg: any) => {
    setSelectedPkg(pkg);
    setShowModal(true);
  };

  const handlePayment = async (providerKey: string) => {
    try {
      const res = await client.post('/billing/consultant/subscribe', {
        package_key: selectedPkg.key,
        provider: providerKey,
        interval: 'once'
      });
      toast.success("Ödeme işlemi başlatıldı");
      setShowModal(false);
    } catch (e) {
      toast.error("Hata oluştu");
    }
  };

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {creditPackages?.map((pkg: any) => (
          <div key={pkg.key} className="bg-white rounded-[40px] border-2 border-slate-100 p-8 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center space-y-6 transition-all hover:translate-y-[-4px]">
             <div className="p-6 bg-blue-50 rounded-[32px] text-blue-600">
                <Zap size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-black text-slate-900">{pkg.label_tr}</h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Kredi Paketi</p>
             </div>
             <div className="text-4xl font-black text-slate-900">
                {pkg.price_monthly}₺
             </div>
             <button 
              onClick={() => handlePurchase(pkg)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/20"
             >
               {t('billing.purchase.buy_now')}
             </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
           <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl space-y-8 animate-in zoom-in-95">
              <div className="text-center">
                 <h2 className="text-2xl font-black text-slate-900">{t('billing.purchase.select_provider')}</h2>
                 <p className="text-slate-400 font-medium mt-2">{selectedPkg?.label_tr} Satın Al</p>
              </div>

              <div className="space-y-3">
                 {providers?.map((p: any) => (
                   <button 
                    key={p.key}
                    onClick={() => handlePayment(p.key)}
                    className="w-full flex items-center justify-between p-5 rounded-[24px] border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all group"
                   >
                     <span className="font-bold text-slate-700 group-hover:text-blue-600">{p.label} ile Öde</span>
                     <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600" />
                   </button>
                 ))}
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="w-full text-slate-400 text-sm font-bold hover:text-slate-900 transition-colors"
              >
                Vazgeç
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

function InvoicesTab() {
  const { t } = useTranslation('consultant');
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: () => client.get('/consultant/billing/invoices').then(res => res.data)
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="bg-white rounded-[40px] border-2 border-slate-100 overflow-hidden shadow-xl shadow-slate-200/50">
       <table className="w-full text-left">
          <thead className="bg-slate-50 border-b-2 border-slate-100">
             <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billing.invoices.columns.id')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billing.invoices.columns.date')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billing.invoices.columns.amount')}</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billing.invoices.columns.status')}</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('billing.invoices.columns.actions')}</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {invoices?.length === 0 ? (
               <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    {t('billing.invoices.no_records')}
                  </td>
               </tr>
             ) : invoices?.map((inv: any) => (
               <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6 font-black text-slate-900">{inv.invoice_number || `#${inv.id.slice(0,8)}`}</td>
                  <td className="px-8 py-6 text-slate-500 font-medium">{format(new Date(inv.created_at), 'dd MMM yyyy', { locale: tr })}</td>
                  <td className="px-8 py-6 font-black text-slate-900">{inv.amount} {inv.currency}</td>
                  <td className="px-8 py-6">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        inv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        'bg-red-50 text-red-600'
                     }`}>
                        {t(`billing.invoices.status.${inv.status}`)}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     {inv.invoice_url ? (
                       <a href={inv.invoice_url} target="_blank" className="flex items-center gap-2 text-blue-600 font-black text-xs hover:underline justify-end">
                          <Download size={14} /> {t('billing.invoices.download_pdf')}
                       </a>
                     ) : '-'}
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );
}

function UsageTab() {
  const { t } = useTranslation('consultant');
  const { data: usage, isLoading } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => client.get('/consultant/billing/usage').then(res => res.data)
  });

  if (isLoading) return <TabSkeleton />;

  return (
    <div className="space-y-8">
       {/* Summary Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {usage?.summary.map((s: any) => (
            <div key={s.credit_type_key} className="bg-white rounded-[32px] border-2 border-slate-100 p-8 shadow-sm flex items-center justify-between">
               <div className="space-y-1">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{s.label_tr}</p>
                  <p className="text-3xl font-black text-slate-900">{s.used} <span className="text-lg text-slate-300">/ {s.total === -1 ? '∞' : s.total}</span></p>
               </div>
               <div className="flex flex-col items-end gap-2">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.percentage}%` }} />
                  </div>
                  <span className="text-xs font-black text-blue-600">%{s.percentage}</span>
               </div>
            </div>
          ))}
       </div>

       {/* Chart */}
       <div className="bg-white rounded-[40px] border-2 border-slate-100 p-10 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('billing.usage.daily_trend')}</h3>
                <p className="text-slate-400 text-sm font-medium">Son 30 günlük tüketim verileri</p>
             </div>
             <TrendingUp className="text-blue-600" size={24} />
          </div>
          
          <div className="h-[300px] w-full">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={usage?.daily}>
                   <defs>
                      <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                    tickFormatter={(val) => format(new Date(val), 'dd MMM', { locale: tr })}
                   />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                   <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                   />
                   <Area type="monotone" dataKey="ai_credit" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorAI)" />
                   <Area type="monotone" dataKey="mail_credit" stroke="#9333ea" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Company Breakdown */}
          <div className="bg-white rounded-[40px] border-2 border-slate-100 overflow-hidden shadow-sm">
             <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">{t('billing.usage.by_company')}</h3>
                <Building2 size={20} className="text-slate-300" />
             </div>
             <div className="p-0">
                <table className="w-full text-left">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase">{t('billing.usage.columns.company')}</th>
                         <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">AI</th>
                         <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase text-right">MAIL</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {usage?.by_company.map((c: any) => (
                        <tr key={c.company_name} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-bold text-slate-900 text-sm">{c.company_name}</td>
                           <td className="px-6 py-4 text-right font-black text-blue-600 text-sm">{c.ai_used}</td>
                           <td className="px-6 py-4 text-right font-black text-purple-600 text-sm">{c.mail_used}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Recent History */}
          <div className="bg-white rounded-[40px] border-2 border-slate-100 overflow-hidden shadow-sm">
             <div className="p-8 border-b-2 border-slate-50 flex items-center justify-between">
                <h3 className="font-black text-slate-900 uppercase tracking-tighter">{t('billing.usage.history')}</h3>
                <History size={20} className="text-slate-300" />
             </div>
             <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                   <tbody className="divide-y divide-slate-100">
                      {usage?.transactions.map((t: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-900 leading-tight">{t.description}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(t.date), 'dd MMM HH:mm', { locale: tr })}</p>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className={`font-black text-sm ${t.amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                 {t.amount > 0 ? '+' : ''}{t.amount}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
       </div>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
       <div className="h-64 bg-slate-100 rounded-[40px]" />
       <div className="grid grid-cols-2 gap-8">
          <div className="h-48 bg-slate-100 rounded-[32px]" />
          <div className="h-48 bg-slate-100 rounded-[32px]" />
       </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  ArrowLeft,
  Zap,
  Globe,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

export default function UpgradePage() {
  const { t } = useTranslation('consultant');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // 1. Fetch Subscription Packages
  const { data: packages, isLoading: pkgsLoading } = useQuery({
    queryKey: ['billing-packages-subscription'],
    queryFn: () => client.get('/consultant/billing/packages?type=subscription').then(res => res.data)
  });

  // 2. Fetch Current Subscription
  const { data: currentSub } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: () => client.get('/consultant/billing/subscription').then(res => res.data)
  });

  // 3. Fetch Providers
  const { data: providers } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => client.get('/settings/payment-providers').then(res => res.data)
  });

  const subscribeMutation = useMutation({
    mutationFn: (data: { package_key: string, interval: string, provider: string }) => 
      client.post('/consultant/billing/subscribe', data),
    onSuccess: () => {
      toast.success("Aboneliğiniz başlatıldı! 🎉");
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
      router.push('/consultant/billing');
    },
    onError: () => {
      toast.error("Ödeme işlemi sırasında bir hata oluştu.");
    }
  });

  const handleSelectPackage = (pkg: any) => {
    if (currentSub?.package_key === pkg.key) return;
    setSelectedPkg(pkg);
    setShowModal(true);
  };

  const handlePayment = (providerKey: string) => {
    subscribeMutation.mutate({
      package_key: selectedPkg.key,
      interval,
      provider: providerKey
    });
  };

  if (pkgsLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Paketler hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold self-start group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Geri Dön
        </button>
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 mb-2">
           <Sparkles size={32} />
        </div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Mükemmel Planı Seçin</h1>
        <p className="text-slate-500 max-w-lg font-medium">
          İhtiyacınıza en uygun planı seçin, Wellbeing Metric'in tüm gücünü kısıtlamasız kullanmaya başlayın.
        </p>
        
        {/* Interval Toggle */}
        <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-2xl mt-8">
          <button 
            onClick={() => setInterval('monthly')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${interval === 'monthly' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Aylık
          </button>
          <button 
            onClick={() => setInterval('yearly')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${interval === 'yearly' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Yıllık
            <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full">%17 Kar</span>
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {packages?.sort((a:any, b:any) => a.sort_order - b.sort_order).map((pkg: any) => {
          const isGrowth = pkg.key.includes('growth');
          const isEnterprise = pkg.key.includes('enterprise');
          const price = interval === 'monthly' ? pkg.price_monthly : pkg.price_yearly;
          const isCurrent = currentSub?.package_key === pkg.key;
          
          if (interval === 'monthly' && !pkg.price_monthly) return null;
          if (interval === 'yearly' && !pkg.price_yearly) return null;

          return (
            <div 
              key={pkg.key} 
              className={`relative bg-white rounded-[48px] border-2 p-10 transition-all hover:scale-[1.02] flex flex-col ${isGrowth ? 'border-blue-600 shadow-2xl shadow-blue-600/10' : 'border-slate-100 shadow-xl shadow-slate-200/40'}`}
            >
              {isGrowth && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg shadow-blue-600/30">
                  En Popüler
                </div>
              )}
              
              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-4">{pkg.label_tr}</h3>
                <div className="flex items-center justify-center gap-1">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">{price ? Math.round(Number(price)) : '-'}₺</span>
                  <span className="text-slate-400 text-sm font-bold">/{interval === 'monthly' ? 'ay' : 'yıl'}</span>
                </div>
              </div>

              <div className="space-y-5 flex-1">
                {Object.entries(pkg.credits).map(([ck, amount]: [string, any]) => (
                  <div key={ck} className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-600">
                      {amount === -1 ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg text-[10px] uppercase font-black">Sınırsız</span>
                      ) : (
                        <span className="text-slate-900 font-black">{amount}</span>
                      )}
                      {' '}{ck.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
                
                <div className="flex items-center gap-3">
                   <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                   <span className="text-sm font-bold text-slate-600">
                      <span className="text-slate-900 font-black">{pkg.max_companies || 'Sınırsız'}</span> Firma Yönetimi
                   </span>
                </div>

                {pkg.ai_enabled && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-2xl">
                     <Zap size={20} className="text-purple-600 shrink-0" />
                     <span className="text-xs font-black text-purple-600 uppercase tracking-tight">AI Analiz Raporları Dahil</span>
                  </div>
                )}
                {pkg.white_label && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl">
                     <Globe size={20} className="text-indigo-600 shrink-0" />
                     <span className="text-xs font-black text-indigo-600 uppercase tracking-tight">White-Label Desteği</span>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleSelectPackage(pkg)}
                disabled={isCurrent || subscribeMutation.isPending}
                className={`w-full mt-10 py-5 rounded-[28px] font-black transition-all flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-slate-50 text-slate-400 cursor-not-allowed border-2 border-slate-100' 
                    : isGrowth
                      ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500'
                      : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20'
                }`}
              >
                {isCurrent ? (
                  <>Mevcut Plan <CheckCircle2 size={18} /></>
                ) : (
                  <>Planı Seç <ChevronRight size={18} /></>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-12 pt-10 border-t-2 border-slate-50">
         <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
            <ShieldCheck size={24} className="text-emerald-500" /> 
            256-bit Güvenli SSL Ödeme
         </div>
         <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
            <CreditCard size={24} className="text-blue-500" /> 
            Tüm Kartlar Geçerlidir
         </div>
         <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
            <Sparkles size={24} className="text-amber-500" /> 
            Anında Aktivasyon
         </div>
      </div>

      {/* Provider Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[48px] p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 space-y-8">
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Ödeme Yöntemi</h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  {selectedPkg?.label_tr} ({interval === 'monthly' ? 'Aylık' : 'Yıllık'})
                </p>
             </div>
             
             <div className="space-y-3">
                {providers?.map((p: any) => (
                  <button
                    key={p.key}
                    onClick={() => handlePayment(p.key)}
                    disabled={subscribeMutation.isPending}
                    className="w-full p-6 rounded-[32px] border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50/50 flex items-center justify-between group transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white transition-colors">
                          <CreditCard className="text-slate-400 group-hover:text-blue-600" />
                       </div>
                       <span className="font-black text-slate-900">{p.label}</span>
                    </div>
                    {subscribeMutation.isPending && selectedPkg?.key === selectedPkg?.key ? (
                      <Loader2 className="animate-spin text-blue-600" size={20} />
                    ) : (
                      <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition-all" />
                    )}
                  </button>
                ))}
             </div>
             
             <button 
               onClick={() => setShowModal(false)}
               className="w-full py-2 text-slate-400 text-sm font-black hover:text-slate-900 transition-colors uppercase tracking-widest"
             >
               Vazgeç
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

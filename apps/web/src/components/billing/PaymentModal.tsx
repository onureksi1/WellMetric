'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import client from '@/lib/api/client';

const formatPrice = (amount: number | string | null, currency: string) => {
  if (amount === null || amount === '') return '-';
  const val = Number(amount);
  if (currency === 'USD') return `$${val}`;
  if (currency === 'TRY') return `${val} ₺`;
  return `${val} ${currency}`;
};

interface PaymentModalProps {
  pkg: any;
  onClose: () => void;
}

export const PaymentModal = ({ pkg, onClose }: PaymentModalProps) => {
  const router = useRouter();
  const [provider, setProvider] = useState<any>(null);
  const [activeProviders, setActiveProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client.get('/settings/active-providers')
      .then(res => {
        const providers = res.data;
        setActiveProviders(providers);
        if (providers.length > 0) {
          setProvider(providers[0].key);
        }
      })
      .catch(() => toast.error('Ödeme yöntemleri yüklenemedi'));
  }, []);

  // ── PayTR: iframe aç ─────────────────────────────────────────────
  const [paytrIframeToken, setPaytrIframeToken] = useState<string | null>(null);

  const handlePaytrInit = async () => {
    setLoading(true);
    try {
      const res = await client.post('/consultant/billing/payment', {
        provider:    'paytr',
        package_key: pkg.key,
        type:        pkg.type,
      });
      const data = res.data;
      if (data.iframe_token) {
        setPaytrIframeToken(data.iframe_token);
      } else {
        toast.error('PayTR başlatılamadı');
      }
    } catch {
      toast.error('PayTR başlatılamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative space-y-6 border border-slate-100">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div>
          <h2 className="text-2xl font-black text-slate-900">{pkg.label_tr}</h2>
          <p className="text-slate-500 font-bold mt-1">{formatPrice(pkg.price_monthly, pkg.currency)} / {pkg.type === 'subscription' ? 'ay' : 'paket'}</p>
        </div>

        {/* Provider Selector */}
        {activeProviders.length > 0 ? (
          <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
            {activeProviders.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setProvider(p.key);
                  setPaytrIframeToken(null);
                }}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  provider === p.key 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-red-50 rounded-2xl text-red-600 text-[10px] font-black text-center uppercase tracking-widest">
            Ödeme yöntemi yapılandırılmamış
          </div>
        )}

        {/* PayTR iframe */}
        {provider === 'paytr' && (
          <div className="space-y-4">
            {!paytrIframeToken ? (
              <button 
                onClick={handlePaytrInit} 
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                PayTR ile Güvenli Öde →
              </button>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-slate-100 h-[500px]">
                <iframe
                  src={`https://www.paytr.com/odeme/guvenli/${paytrIframeToken}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}

        {/* Stripe Placeholder */}
        {provider === 'stripe' && (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <CreditCard className="mx-auto text-slate-300 mb-4" size={48} />
             <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Stripe Checkout Yakında</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <ShieldCheck size={14} className="text-emerald-500" />
           256-bit SSL ile Güvenli Ödeme
        </div>
      </div>
    </div>
  );
};


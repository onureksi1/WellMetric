'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  pkg: any;
  onClose: () => void;
}

export const PaymentModal = ({ pkg, onClose }: PaymentModalProps) => {
  const [provider, setProvider] = useState<'iyzico' | 'paytr' | 'stripe'>('iyzico');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ── iyzico: kart formu direkt burada ────────────────────────────
  const handleIyzicoSubmit = async (cardData: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/consultant/billing/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider:    'iyzico',
          package_key: pkg.key,
          type:        pkg.type,
          payment_card: {
            cardHolderName: cardData.name,
            cardNumber:     cardData.number.replace(/\s/g, ''),
            expireMonth:    cardData.expiry.split('/')[0],
            expireYear:     '20' + cardData.expiry.split('/')[1],
            cvc:            cardData.cvc,
          },
          ip: '127.0.0.1', 
        }),
      });
      const data = await res.json();
      if (data.data?.success || res.ok) {
        toast.success('Ödeme başarılı!');
        onClose();
        router.refresh();
      } else {
        toast.error(data.error?.message || 'Ödeme başarısız');
      }
    } catch (err) {
      toast.error('Ödeme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // ── PayTR: iframe aç ─────────────────────────────────────────────
  const [paytrIframeToken, setPaytrIframeToken] = useState<string | null>(null);

  const handlePaytrInit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/consultant/billing/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider:    'paytr',
          package_key: pkg.key,
          type:        pkg.type,
        }),
      });
      const data = await res.json();
      if (data.data?.iframe_token) {
        setPaytrIframeToken(data.data.iframe_token);
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
          <p className="text-slate-500 font-bold mt-1">{pkg.price_monthly}₺ / ay</p>
        </div>

        {/* Provider Selector */}
        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
          {(['iyzico', 'paytr', 'stripe'] as const).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProvider(p);
                setPaytrIframeToken(null);
              }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                provider === p 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p === 'iyzico' ? 'iyzico' : p === 'paytr' ? 'PayTR' : 'Stripe'}
            </button>
          ))}
        </div>

        {/* iyzico Card Form */}
        {provider === 'iyzico' && (
          <IyzicoCardForm onSubmit={handleIyzicoSubmit} loading={loading} />
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

const IyzicoCardForm = ({ onSubmit, loading }: any) => {
  const [card, setCard] = useState({
    name: '', number: '', expiry: '', cvc: ''
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kart Üzerindeki İsim</label>
        <input 
          placeholder="AD SOYAD"
          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900 uppercase"
          value={card.name}
          onChange={e => setCard(c => ({...c, name: e.target.value}))} 
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kart Numarası</label>
        <input 
          placeholder="0000 0000 0000 0000"
          maxLength={19}
          className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-mono font-bold text-slate-900"
          value={card.number}
          onChange={e => {
            const v = e.target.value.replace(/\D/g,'').slice(0,16);
            const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
            setCard(c => ({...c, number: formatted}));
          }} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sön Sür. Tarihi</label>
          <input 
            placeholder="AA/YY" 
            maxLength={5}
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-center"
            value={card.expiry}
            onChange={e => {
              let v = e.target.value.replace(/\D/g,'').slice(0,4);
              if (v.length >= 2) v = v.slice(0,2) + '/' + v.slice(2);
              setCard(c => ({...c, expiry: v}));
            }} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CVC</label>
          <input 
            placeholder="***" 
            maxLength={3} 
            type="password"
            className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all font-bold text-slate-900 text-center"
            value={card.cvc}
            onChange={e => setCard(c => ({...c, cvc: e.target.value.slice(0,3)}))} 
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(card)}
        disabled={loading || !card.name || card.number.length < 19}
        className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black hover:bg-slate-900 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? 'İşleniyor...' : 'Ödemeyi Tamamla'}
      </button>

      <p className="text-[9px] text-slate-400 font-bold text-center px-4 leading-relaxed">
        Kart bilgileriniz iyzico güvenli altyapısıyla işlenir ve sunucularımızda saklanmaz.
      </p>
    </div>
  );
};

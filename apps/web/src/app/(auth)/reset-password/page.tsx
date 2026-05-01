'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Lock, Loader2, Zap, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import client from '@/lib/api/client';
import '@/lib/i18n';

export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-navy">{t('common.loading', 'Yükleniyor...')}</div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}

function ResetPasswordContent() {
  const { t } = useTranslation(['auth', 'common']);
  
  // Validation Schema (Inside component to use t)
  const schema = z.object({
    new_password: z.string()
      .min(8, t('reset_password.error_min_length', 'Şifre en az 8 karakter olmalıdır'))
      .regex(/[A-Z]/, t('reset_password.error_uppercase', 'En az bir büyük harf içermelidir'))
      .regex(/[a-z]/, t('reset_password.error_lowercase', 'En az bir küçük harf içermelidir'))
      .regex(/[0-9]/, t('reset_password.error_number', 'En az bir rakam içermelidir')),
    confirm_password: z.string(),
  }).refine((data) => data.new_password === data.confirm_password, {
    message: t('reset_password.error_match', 'Şifreler eşleşmiyor'),
    path: ['confirm_password'],
  });

  type FormData = z.infer<typeof schema>;
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [loading, setLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);


  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    if (!token) return;
    
    setLoading(true);
    try {
      await client.post('/auth/reset-password', {
        token,
        new_password: data.new_password,
      });
      toast.success(t('reset_password.success'));
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'INVITATION_EXPIRED' || code === 'TOKEN_EXPIRED') {
        setIsExpired(true);
      } else {
        toast.error(err.response?.data?.message || t('common.errors.generic', 'Bir hata oluştu'));
      }

    } finally {
      setLoading(false);
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="w-full max-w-md glass-card rounded-[32px] p-10 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-navy">{t('reset_password.error_expired')}</h2>
            <p className="text-slate-400 text-sm">
              {t('reset_password.error_expired_desc', 'Bu şifre sıfırlama bağlantısının süresi dolmuş veya daha önce kullanılmış.')}
            </p>
          </div>

          <Button 
            variant="ghost" 
            onClick={() => router.push('/forgot-password')}
            className="w-full text-primary font-bold"
          >
            {t('reset_password.retry_forgot', 'Tekrar şifre sıfırlama maili al')}
          </Button>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="h-14 w-14 premium-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-navy tracking-tighter">Wellbeing Metric</h1>
        </div>

        <div className="glass-card rounded-[32px] p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-navy">{t('reset_password.title')}</h3>
            <p className="text-slate-400 text-sm mt-2">{t('reset_password.subtitle', 'Lütfen yeni ve güvenli bir şifre belirleyin.')}</p>
          </div>


          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('reset_password.new_password')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  {...register('new_password')}
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full bg-white/50 border ${errors.new_password ? 'border-red-300' : 'border-slate-200'} rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all`}
                />
              </div>
              <div className="px-1 flex flex-col gap-1">
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{t('reset_password.requirements')}</p>
                 {errors.new_password && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">{errors.new_password.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('reset_password.confirm_password')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  {...register('confirm_password')}
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full bg-white/50 border ${errors.confirm_password ? 'border-red-300' : 'border-slate-200'} rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all`}
                />
              </div>
              {errors.confirm_password && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">{errors.confirm_password.message}</p>}
            </div>

            <Button disabled={loading} type="submit" className="w-full py-4 rounded-2xl premium-gradient text-white font-bold text-sm tracking-widest hover-lift shadow-lg shadow-primary/20 flex gap-2 justify-center items-center">
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>{t('reset_password.submit')} <ArrowRight size={18} /></>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

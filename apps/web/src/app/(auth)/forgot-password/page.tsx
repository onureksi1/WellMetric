'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, Loader2, MailCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import client from '@/lib/api/client';
import '@/lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation(['auth', 'common']);
  
  // Validation Schema (Inside component to use t)
  const schema = z.object({
    email: z.string().email(t('errors.invalid_email', 'Geçerli bir e-posta adresi giriniz')),
  });

  type FormData = z.infer<typeof schema>;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });


  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      await client.post('/auth/forgot-password', data);
      setSuccess(true);
    } catch (err: any) {
      // For security, we might show success even if email not found, 
      // but usually for internal panels we show error or follow standard 200 response
      setSuccess(true); 
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md glass-card rounded-[32px] p-10 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <MailCheck size={40} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-navy">{t('forgot_password.title')}</h2>
            <p className="text-slate-500 leading-relaxed">
              {t('forgot_password.success')} 📬
            </p>
          </div>
          <div className="pt-4">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              {t('forgot_password.back_to_login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#f8fafc] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
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
            <h3 className="text-2xl font-black text-navy">{t('forgot_password.title')}</h3>
            <p className="text-slate-400 text-sm mt-2">{t('forgot_password.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('login.email')}</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  {...register('email')}
                  type="email" 
                  placeholder={t('login.email_placeholder')}
                  className={`w-full bg-white/50 border ${errors.email ? 'border-red-300' : 'border-slate-200'} rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all`}
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-bold ml-2 uppercase tracking-tighter">{errors.email.message}</p>}
            </div>

            <Button disabled={loading} type="submit" className="w-full py-4 rounded-2xl premium-gradient text-white font-bold text-sm tracking-widest hover-lift shadow-lg shadow-primary/20 flex gap-2 justify-center items-center">
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                t('forgot_password.submit')
              )}
            </Button>

            <div className="text-center pt-4">
              <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                {t('forgot_password.back_to_login')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

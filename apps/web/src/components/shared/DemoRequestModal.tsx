'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import { Building2, Mail, User, Phone, Users2, MessageSquare, Briefcase, CheckCircle2, Sparkles } from 'lucide-react';
import { IndustrySelect } from './IndustrySelect';
import confetti from 'canvas-confetti';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMPANY_SIZES = [
  '1-50',
  '51-250',
  '251-500',
  '501-1000',
  '1000+'
];

export function DemoRequestModal({ isOpen, onClose }: DemoRequestModalProps) {
  const { t } = useTranslation(['auth', 'common']);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const schema = z.object({
    full_name: z.string().min(2, t('demo.error_name_min')),
    email: z.string().email(t('common.errors.invalid_email')),
    company_name: z.string().min(2, t('demo.error_company_min')),
    company_size: z.string().min(1, t('common.errors.required')),
    industry: z.string().min(1, t('common.errors.required')),
    phone: z.string().optional(),
    user_type: z.string().optional(),
    message: z.string().max(1000, t('demo.error_message_max')).optional(),
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      user_type: 'needs_consultant'
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await client.post('/demo-requests', data);
      setIsSuccess(true);
      
      // Trigger soft confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6']
      });

      toast.success(t('demo.success_title'));
    } catch (error: any) {
      console.error('[DemoRequest] Error:', error);
      const message = error.response?.data?.message || t('demo.error_submit');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    onClose();
  };

  if (!mounted) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('demo.title')}
      maxWidth="md"
    >
      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-navy">{t('demo.success_title')}</h3>
            <p className="text-slate-500 max-w-sm mx-auto">{t('demo.success_message')}</p>
          </div>
          <Button onClick={handleClose} className="w-full max-w-[200px] rounded-2xl premium-gradient text-white font-bold">
            {t('demo.back_to_login')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.full_name')}*</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <User size={16} />
                </div>
                <input
                  {...register('full_name')}
                  placeholder={t('demo.full_name_placeholder')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              {errors.full_name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.full_name.message as string}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.email')}*</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="mail@firma.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message as string}</p>}
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.company_name')}*</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Building2 size={16} />
                </div>
                <input
                  {...register('company_name')}
                  placeholder={t('demo.company_name_placeholder')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
              {errors.company_name && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.company_name.message as string}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.phone')}</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                  <Phone size={16} />
                </div>
                <input
                  {...register('phone')}
                  placeholder={t('demo.phone_placeholder')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.industry')}*</label>
              <IndustrySelect
                value={watch('industry')}
                onChange={(val) => setValue('industry', val || '')}
                className="bg-slate-50 border-slate-100 rounded-xl py-2.5"
              />
              {errors.industry && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.industry.message as string}</p>}
            </div>

            {/* Company Size */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.company_size')}*</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors z-10">
                  <Users2 size={16} />
                </div>
                <select
                  {...register('company_size')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t('common.select')}</option>
                  {COMPANY_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
              {errors.company_size && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.company_size.message as string}</p>}
            </div>
          </div>

          {/* User Type Selection */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
              {t('demo.i_am')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'trainer', label: t('demo.i_am_trainer'), icon: User, color: 'emerald' },
                { id: 'has_consultant', label: t('demo.has_consultant'), icon: CheckCircle2, color: 'blue' },
                { id: 'needs_consultant', label: t('demo.needs_consultant'), icon: Sparkles, color: 'indigo' },
                { id: 'individual', label: t('demo.individual'), icon: Users2, color: 'slate' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setValue('user_type', type.id)}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 gap-2 group relative overflow-hidden ${
                    watch('user_type') === type.id
                      ? `bg-${type.color}-500/5 border-${type.color}-500 shadow-md`
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors ${
                    watch('user_type') === type.id ? `bg-${type.color}-500 text-white` : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
                  }`}>
                    <type.icon size={18} className="sm:size-5" />
                  </div>
                  <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight px-1 ${
                    watch('user_type') === type.id ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('demo.message')}</label>
            <div className="relative group">
              <div className="absolute left-3 top-4 text-slate-400 group-focus-within:text-primary transition-colors">
                <MessageSquare size={16} />
              </div>
              <textarea
                {...register('message')}
                placeholder={t('demo.message_placeholder')}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              className="w-full py-4 rounded-2xl premium-gradient text-white font-bold text-sm tracking-widest hover-lift shadow-lg shadow-primary/20"
            >
              {t('demo.submit').toUpperCase()}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

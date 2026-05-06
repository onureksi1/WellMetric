'use client'

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Building2, 
  Users2, 
  Briefcase, 
  Phone, 
  Mail, 
  User,
  ArrowRight,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import client from '@/lib/api/client';
import confetti from 'canvas-confetti';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { GraduationCap, HeartHandshake, UserCheck, UserPlus } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/Command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

export default function DemoRequestPage() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  
  // Validation Schema (Inside component to use t)
  const demoSchema = z.object({
    full_name: z.string().min(2, t('auth.demo.error_name_min')).max(200),
    email: z.string().email(t('auth.errors.invalid_email', 'Geçerli bir e-posta adresi girin')),
    company_name: z.string().min(2, t('auth.demo.error_company_min')).max(200),
    company_size: z.string().optional(),
    industry: z.string().optional(),
    phone: z.string().optional(),
    user_type: z.string().optional(),
    message: z.string().max(1000, t('auth.demo.error_message_max')).optional(),
  });

  type DemoFormValues = z.infer<typeof demoSchema>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [openIndustry, setOpenIndustry] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data } = await client.get(`/industries?lang=${i18n.language}`);
        setIndustries(data);
      } catch (error) {
        console.error('Failed to fetch industries', error);
      }
    };
    fetchIndustries();
  }, [i18n.language]);

  const form = useForm<DemoFormValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      full_name: '',
      email: '',
      company_name: '',
      company_size: '',
      industry: '',
      phone: '',
      user_type: '',
      message: '',
    },
  });

  const triggerWellbeingConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // Wellbeing Colors: Emeralds, Teals, Blues
      const colors = ['#10b981', '#059669', '#34d399', '#3b82f6', '#60a5fa', '#fcd34d'];

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors
      });
    }, 250);
  };

  if (!mounted) return null;

  const onSubmit = async (values: DemoFormValues) => {
    setIsSubmitting(true);
    try {
      await client.post('/demo-request', values);
      setIsSuccess(true);
      triggerWellbeingConfetti(); // Boom! Wellbeing celebration
      toast.success(t('auth.demo.success_title'));
    } catch (error: any) {
      console.error('Demo request submission failed', error);
      const message = error.response?.data?.message || t('auth.demo.error_submit');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">{t('auth.demo.success_title')}</h1>
            <p className="text-slate-400">{t('auth.demo.success_message')}</p>
          </div>
          <Link href="/login" className="block">
            <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              {t('auth.demo.back_to_login')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 py-8 md:py-12">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Wellbeing Metric</h2>
              <p className="text-[10px] text-emerald-500 font-bold tracking-wider uppercase">Platform Experience</p>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{t('auth.demo.title')}</h1>
          <p className="text-sm text-slate-400">{t('auth.demo.subtitle')}</p>
        </div>

        <div className="p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.full_name')} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('auth.demo.full_name_placeholder')} 
                          {...field} 
                          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-emerald-500/20"
                        />
                      </FormControl>

                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.email')} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder={t('auth.demo.email_placeholder')}
                          {...field} 
                          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-emerald-500/20"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.company_name')} *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t('auth.demo.company_name_placeholder')} 
                          {...field} 
                          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-emerald-500/20"
                        />
                      </FormControl>

                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        <Users2 className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.company_size')}
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-white focus:ring-emerald-500/20">
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="1-50">1-50</SelectItem>
                          <SelectItem value="51-250">51-250</SelectItem>
                          <SelectItem value="251-1000">251-1000</SelectItem>
                          <SelectItem value="1000+">1000+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-slate-300 flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.industry')}
                      </FormLabel>
                      <Popover open={openIndustry} onOpenChange={setOpenIndustry}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-slate-950 border-slate-800 text-white hover:bg-slate-900 hover:text-white text-left font-normal h-10",
                                !field.value && "text-slate-600"
                              )}
                            >
                              {field.value
                                ? industries.find((i) => i.value === field.value)?.label
                                : t('auth.demo.industry_placeholder')}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />

                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-slate-900 border-slate-800">
                          <Command className="bg-slate-900">
                            <CommandInput placeholder={t('auth.demo.search_placeholder')} className="text-white" />
                            <CommandList>
                              <CommandEmpty className="p-4 text-sm text-slate-500">Sektör bulunamadı.</CommandEmpty>
                              <CommandGroup>
                                {industries.map((i) => (
                                  <CommandItem
                                    key={i.value}
                                    value={i.label}
                                    onSelect={() => {
                                      form.setValue("industry", i.value);
                                      setOpenIndustry(false);
                                    }}
                                    className="text-slate-300 hover:bg-emerald-500/10 hover:text-white cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        i.value === field.value ? "opacity-100 text-emerald-500" : "opacity-0"
                                      )}
                                    />
                                    {i.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {t('auth.demo.phone')}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="tel"
                          placeholder={t('auth.demo.phone_placeholder')} 
                          {...field} 
                          className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-emerald-500/20"
                        />
                      </FormControl>
                      <FormMessage className="text-rose-500" />
                    </FormItem>
                  )}
                />
              </div>

              {/* User Type Selection */}
              <FormField
                control={form.control}
                name="user_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-slate-300 text-xs font-bold uppercase tracking-widest opacity-70">
                      {t('auth.demo.i_am', { defaultValue: 'Ben...' })}
                    </FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => field.onChange('trainer')}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-3 group relative overflow-hidden",
                          field.value === 'trainer'
                            ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          field.value === 'trainer' ? "bg-emerald-500 text-white" : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                        )}>
                          <GraduationCap size={24} />
                        </div>
                        <span className={cn(
                          "text-xs font-bold text-center",
                          field.value === 'trainer' ? "text-white" : "text-slate-400"
                        )}>
                          {t('auth.demo.i_am_trainer')}
                        </span>
                        {field.value === 'trainer' && (
                          <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange('needs_trainer')}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-3 group relative overflow-hidden",
                          field.value === 'needs_trainer'
                            ? "bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/10"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          field.value === 'needs_trainer' ? "bg-blue-500 text-white" : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                        )}>
                          <HeartHandshake size={24} />
                        </div>
                        <span className={cn(
                          "text-xs font-bold text-center",
                          field.value === 'needs_trainer' ? "text-white" : "text-slate-400"
                        )}>
                          {t('auth.demo.need_trainer')}
                        </span>
                        {field.value === 'needs_trainer' && (
                          <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange('has_consultant')}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-3 group relative overflow-hidden",
                          field.value === 'has_consultant'
                            ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          field.value === 'has_consultant' ? "bg-amber-500 text-white" : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                        )}>
                          <UserCheck size={24} />
                        </div>
                        <span className={cn(
                          "text-xs font-bold text-center",
                          field.value === 'has_consultant' ? "text-white" : "text-slate-400"
                        )}>
                          {t('auth.demo.has_consultant')}
                        </span>
                        {field.value === 'has_consultant' && (
                          <div className="absolute top-2 right-2 bg-amber-500 rounded-full p-1">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => field.onChange('needs_consultant')}
                        className={cn(
                          "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 gap-3 group relative overflow-hidden",
                          field.value === 'needs_consultant'
                            ? "bg-purple-500/10 border-purple-500 shadow-lg shadow-purple-500/10"
                            : "bg-slate-950 border-slate-800 hover:border-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          field.value === 'needs_consultant' ? "bg-purple-500 text-white" : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                        )}>
                          <UserPlus size={24} />
                        </div>
                        <span className={cn(
                          "text-xs font-bold text-center",
                          field.value === 'needs_consultant' ? "text-white" : "text-slate-400"
                        )}>
                          {t('auth.demo.needs_consultant')}
                        </span>
                        {field.value === 'needs_consultant' && (
                          <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    </div>
                    <FormMessage className="text-red-400 font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">
                      {t('auth.demo.message')}
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('auth.demo.message_placeholder')} 
                        {...field} 
                        rows={4}
                        className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:ring-emerald-500/20"
                      />
                    </FormControl>

                    <FormMessage className="text-rose-500" />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 text-lg font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('common.submitting')}</span>
                  </div>
                ) : (

                  <div className="flex items-center justify-center gap-2">
                    <span>{t('auth.demo.submit')}</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}

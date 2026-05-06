'use client';

import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ArrowRight, Zap, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import client from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth.store';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { DemoRequestModal } from '@/components/shared/DemoRequestModal';
import Link from 'next/link';
import '@/lib/i18n';

export default function LoginPage() {
  const { settings } = useSettings();
  const router = useRouter();
  const { t } = useTranslation(['auth', 'common']);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill email if rememberMe was active
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await client.post('/auth/login', { email, password });
      if (response.data?.access_token) {
        setAuth(response.data.user, response.data.access_token);
        
        // Handle Remember Me
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Save token to cookie for Next.js Middleware
        document.cookie = `accessToken=${response.data.access_token}; path=/; max-age=604800; SameSite=Strict`;
        
        // Redirect based on role
        if (response.data.user.role === 'super_admin') {
          router.push('/admin');
        } else if (response.data.user.role === 'hr_admin') {
          router.push('/dashboard');
        } else if (response.data.user.role === 'consultant') {
          router.push('/consultant');
        } else {
          router.push('/me');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || t('login.error_invalid'));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#f8fafc]">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col space-y-12">
          <div className="flex items-center gap-4">
             <img src={settings?.platform_logo_url || "/images/logo.png"} alt={settings?.platform_name || "Wellbeing Metric"} className="h-16 object-contain" />
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl font-black text-navy leading-[1.1] tracking-tight">
              {t('login.hero_title', 'Geleceğin Wellbeing Deneyimi.')}
            </h2>
            <p className="text-lg text-slate-500 max-w-md leading-relaxed">
              {t('login.hero_desc', 'Veri odaklı analizler, AI destekli içgörüler ve kişiselleştirilmiş esenlik yolculuğu ile çalışan mutluluğunu yeniden tanımlayın.')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <FeatureItem 
              icon={ShieldCheck} 
              label={t('login.feature_kvkk', 'KVKK Uyumlu')} 
              description={t('login.feature_kvkk_desc', 'Tamamen anonim veri işleme')} 
             />
             <FeatureItem 
              icon={Sparkles} 
              label={t('login.feature_ai', 'AI Destekli')} 
              description={t('login.feature_ai_desc', 'Tahminleyici analiz motoru')} 
             />
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex justify-center">
          <div className="w-full max-w-md glass-card rounded-[32px] p-6 sm:p-10 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                <img src={settings?.platform_logo_url || "/images/logo.png"} alt={settings?.platform_name || "Wellbeing Metric"} className="h-12 object-contain" />
            </div>

            <div className="text-center mb-10">
              <h3 className="text-2xl font-black text-navy">{t('login.title')}</h3>
              <p className="text-slate-400 text-sm mt-2">{t('login.subtitle_admin', 'Yönetim panelinize erişmek için bilgilerinizi girin.')}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t('login.email')}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.email_placeholder')}
                    required
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('login.password')}</label>
                   <Link href="/forgot-password" title={t('login.forgot_password')} className="text-[10px] font-bold text-primary hover:underline">
                     {t('login.forgot_password')}
                   </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/50 border border-slate-200 rounded-2xl pl-12 pr-12 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 transition-colors">{t('login.remember_me')}</span>
                </label>
              </div>

              <div className="space-y-4 pt-2">
                <Button disabled={loading} type="submit" className="w-full py-4 rounded-2xl premium-gradient text-white font-bold text-sm tracking-widest hover-lift shadow-lg shadow-primary/20 flex gap-2 justify-center items-center">
                  {loading ? t('login.submitting', 'GİRİŞ YAPILIYOR...') : (
                    <>{t('login.submit_caps', 'OTURUM AÇ')} <ArrowRight size={18} /></>
                  )}
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('common.of', 'VEYA')}</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsDemoOpen(true)}
                  className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-navy font-bold text-sm tracking-widest hover:bg-slate-50 transition-all flex gap-2 justify-center items-center shadow-sm"
                >
                   <Sparkles size={18} className="text-primary" />
                   {t('demo.title', 'DEMO TALEP ET')}
                </button>
              </div>
            </form>

            <DemoRequestModal 
              isOpen={isDemoOpen} 
              onClose={() => setIsDemoOpen(false)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, label, description }: any) {
  return (
    <div className="flex gap-4 items-start">
      <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-bold text-navy">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

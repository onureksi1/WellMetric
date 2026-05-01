'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Mail, 
  User, 
  Globe2, 
  Users, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { IndustrySelect } from '@/components/shared/IndustrySelect';
import { useAuthStore } from '@/lib/store/auth.store';

const companySchema = z.object({
  name: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır.'),
  industry: z.string().min(1, 'Sektör seçimi zorunludur.'),
  plan: z.string(),
  contact_email: z.string().email('Geçerli bir email giriniz.'),
  hr_admin_email: z.string().email('Geçerli bir email giriniz.'),
  hr_admin_full_name: z.string().min(2, 'Ad soyad zorunludur.'),
  size_band: z.string().min(1, 'Çalışan sayısı seçimi zorunludur.'),
  default_language: z.string(),
});

type CompanyForm = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const language = (i18n.language as any) || 'tr';
  const { user } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    formState: { errors, isSubmitting } 
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      plan: 'starter',
      default_language: 'tr',
      industry: '',
    }
  });

  const selectedIndustry = watch('industry');

  const onSubmit = async (data: CompanyForm) => {
    try {
      await client.post('/admin/companies', {
        ...data,
        consultant_id: user?.id
      });
      toast.success(t('consultant.companies.create_success', 'Firma başarıyla oluşturuldu ve HR davet edildi.'));
      router.push('/consultant/companies');
    } catch (err: any) {
      console.error('Error creating company:', err);
      toast.error(err.response?.data?.message || 'Firma oluşturulurken bir hata oluştu.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb / Back */}
      <Link 
        href="/consultant/companies" 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group w-fit"
      >
        <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-slate-300 transition-colors">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm font-medium">Firmalarım'a Geri Dön</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Form Header */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">{t('consultant.companies.new')}</h1>
            <p className="text-slate-400 mt-1">Yeni bir firma oluşturun ve HR yöneticisini sisteme davet edin.</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Section: Company Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">Firma Bilgileri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Firma Adı*</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('name')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-xl focus:outline-none focus:ring-2 transition-all text-sm`}
                    placeholder="Örn: Acme Teknoloji A.Ş."
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Sektör*</label>
                <IndustrySelect 
                  value={selectedIndustry}
                  onChange={(val) => setValue('industry', val || '')}
                  language={language}
                />
                {errors.industry && <p className="text-xs text-red-500 font-medium">{errors.industry.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">İletişim E-postası*</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('contact_email')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.contact_email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                    placeholder="info@acme.com"
                  />
                </div>
                {errors.contact_email && <p className="text-xs text-red-500 font-medium">{errors.contact_email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Çalışan Sayısı Aralığı*</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    {...register('size_band')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.size_band ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                  >
                    <option value="">Aralık Seçin</option>
                    <option value="1-50">1-50 Çalışan</option>
                    <option value="51-200">51-200 Çalışan</option>
                    <option value="201-500">201-500 Çalışan</option>
                    <option value="501+">501+ Çalışan</option>
                  </select>
                </div>
                {errors.size_band && <p className="text-xs text-red-500 font-medium">{errors.size_band.message}</p>}
              </div>
            </div>
          </div>

          {/* Section: HR Admin Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <User size={18} />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">HR Yönetici Bilgileri</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">HR Yetkili Ad Soyad*</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('hr_admin_full_name')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.hr_admin_full_name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                    placeholder="Ad Soyad"
                  />
                </div>
                {errors.hr_admin_full_name && <p className="text-xs text-red-500 font-medium">{errors.hr_admin_full_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">HR Yetkili E-postası*</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('hr_admin_email')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.hr_admin_email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                    placeholder="hr-admin@firma.com"
                  />
                </div>
                {errors.hr_admin_email && <p className="text-xs text-red-500 font-medium">{errors.hr_admin_email.message}</p>}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex gap-4">
              <CheckCircle2 className="text-indigo-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="text-sm font-bold text-indigo-900">E-posta Daveti Gönderilecek</p>
                <p className="text-xs text-indigo-700/80 leading-relaxed">
                  Firma oluşturulduğunda HR yöneticisine sisteme giriş yapabilmesi ve şifresini belirleyebilmesi için otomatik bir davet maili gönderilecektir.
                </p>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertCircle size={14} />
              * işaretli alanların doldurulması zorunludur.
            </div>
            
            <div className="flex gap-3">
              <Link 
                href="/consultant/companies"
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
              >
                İptal
              </Link>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  'Firma Oluştur ve HR Davet Et'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

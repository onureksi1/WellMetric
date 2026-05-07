'use client';

import React, { useEffect, useState } from 'react';
import { useT } from '@/hooks/useT';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  Mail, 
  User, 
  Users, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { IndustrySelect } from '@/components/shared/IndustrySelect';

const companySchema = z.object({
  name: z.string().min(2, 'Firma adı en az 2 karakter olmalıdır.'),
  industry: z.string().min(1, 'Sektör seçimi zorunludur.'),
  plan: z.string(),
  contact_email: z.string().email('Geçerli bir email giriniz.'),
  size_band: z.string().min(1, 'Çalışan sayısı seçimi zorunludur.'),
  default_language: z.string(),
});

type CompanyForm = z.infer<typeof companySchema>;

export default function EditCompanyPage() {
  const { t, tc, i18n } = useT('consultant');
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const language = (i18n.language as any) || 'tr';
  const [loading, setLoading] = useState(true);
  
  const { 
    register, 
    handleSubmit, 
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting } 
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  });

  const selectedIndustry = watch('industry');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await client.get(`/consultant/companies/${companyId}`);
        const data = res.data;
        reset({
          name: data.name,
          industry: data.industry,
          plan: data.plan || 'starter',
          contact_email: data.contact_email,
          size_band: data.size_band || '',
          default_language: data.default_language || 'tr',
        });
      } catch (err) {
        toast.error('Firma bilgileri yüklenemedi.');
        router.push('/consultant/companies');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [companyId, reset, router]);

  const onSubmit = async (data: CompanyForm) => {
    try {
      await client.patch(`/admin/companies/${companyId}`, data);
      toast.success('Firma başarıyla güncellendi.');
      router.push('/consultant/companies');
    } catch (err: any) {
      toast.error(err.response?.data?.message || tc('error'));
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">{t('companies.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link 
        href="/consultant/companies" 
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group w-fit"
      >
        <div className="p-1.5 rounded-lg bg-white border border-slate-200 group-hover:border-slate-300 transition-colors">
          <ArrowLeft size={16} />
        </div>
        <span className="text-sm font-medium">{tc('cancel')}</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold">{tc('edit', 'Firmayı Düzenle')}</h1>
            <p className="text-slate-400 mt-1">{t('companies.subtitle')}</p>
          </div>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Building2 size={120} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 size={18} />
              </div>
              <h2 className="font-bold text-slate-900 text-lg">{t('companies.create.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('companies.create.company_name')}*</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('name')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('companies.create.industry')}*</label>
                <IndustrySelect 
                  value={selectedIndustry}
                  onChange={(val) => setValue('industry', val || '')}
                  language={language}
                />
                {errors.industry && <p className="text-xs text-red-500 font-medium">{errors.industry.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('companies.create.contact_email')}*</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    {...register('contact_email')}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.contact_email ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
                  />
                </div>
                {errors.contact_email && <p className="text-xs text-red-500 font-medium">{errors.contact_email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">{t('companies.create.size_band')}*</label>
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

          <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <AlertCircle size={14} />
              {tc('required_fields', '* işaretli alanların doldurulması zorunludur.')}
            </div>
            
            <div className="flex gap-3">
              <Link 
                href="/consultant/companies"
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
              >
                {tc('cancel')}
              </Link>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {tc('save', 'Kaydet')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

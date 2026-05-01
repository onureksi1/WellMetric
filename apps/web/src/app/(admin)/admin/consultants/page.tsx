'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  TrendingUp, 
  Building2, 
  ShieldCheck, 
  Calendar,
  Settings2,
  ExternalLink,
  Ban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  UserPlus,
  ArrowRight,
  Info,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, differenceInDays, isBefore } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import i18n from '@/lib/i18n';
import client from '@/lib/api/client';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';

// ────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

const createSchema = z.object({
  full_name: z.string().min(3, 'admin:consultants.errors.name_min'),
  email: z.string().email('common:errors.invalid_email'),
  plan: z.string().min(1, 'admin:consultants.errors.select_plan'),
  max_companies: z.number().nullable().optional(),
  max_employees: z.number().nullable().optional(),
  valid_until: z.string().optional(),
});

const updatePlanSchema = z.object({
  plan: z.string().min(1, 'admin:consultants.errors.select_plan'),
  max_companies: z.number().nullable().optional(),
  max_employees: z.number().nullable().optional(),
  valid_until: z.string().optional(),
});

const updateProfileSchema = z.object({
  full_name: z.string().min(3, 'admin:consultants.errors.name_min'),
  email: z.string().email('common:errors.invalid_email'),
});

// ────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────────────────

export default function AdminConsultantsPage() {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [packages, setPackages] = useState<any>({});
  
  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);

  const currentLocale = i18n.language === 'tr' ? tr : enUS;

  const fetchConsultants = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await client.get('/admin/consultants', {
        params: { page, limit: 10, search }
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (err: any) {
      console.error('[AdminConsultants] Fetch error:', err);
      toast.error(t('common:error'));
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchPackages = async () => {
    try {
      const res = await client.get('/settings');
      setPackages(res.data.consultant_packages || {});
    } catch (err) {}
  };

  useEffect(() => {
    fetchConsultants();
    fetchPackages();
  }, [fetchConsultants]);

  const handleToggleStatus = async (consultant: any) => {
    const newStatus = !consultant.is_active;
    const confirmText = newStatus 
      ? t('consultants.status_change.activate_confirm') 
      : t('consultants.status_change.deactivate_confirm');
    
    if (!window.confirm(confirmText)) return;

    try {
      await client.patch(`/admin/consultants/${consultant.id}/status`, { is_active: newStatus });
      toast.success(newStatus ? t('consultants.status_change.success_active') : t('consultants.status_change.success_passive'));
      fetchConsultants(meta.page);
    } catch (err: any) {
      console.error('[AdminConsultants] Status toggle error:', err);
      toast.error(t('common:error'));
    }
  };

  const handleOpenDetail = async (consultant: any) => {
    try {
      const res = await client.get(`/admin/consultants/${consultant.id}`);
      setSelectedConsultant(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      toast.error(t('common:error'));
    }
  };

  const handleDelete = async (consultant: any) => {
    if (!window.confirm(t('consultants.delete_confirm', { name: consultant.full_name }))) return;

    try {
      await client.delete(`/admin/consultants/${consultant.id}`);
      toast.success(t('consultants.delete_success'));
      fetchConsultants(meta.page);
    } catch (err: any) {
      console.error('[AdminConsultants] Delete error:', err);
      toast.error(err.response?.data?.message || t('common:error'));
    }
  };

  // Components
  const ValidityBadge = ({ date }: { date: string }) => {
    if (!date) return <span className="text-slate-300 text-xs">-</span>;
    const validUntil = new Date(date);
    const today = new Date();
    const daysLeft = differenceInDays(validUntil, today);
    const isExpired = isBefore(validUntil, today);

    if (isExpired) return <Badge variant="red">{t('consultants.expired')}</Badge>;
    if (daysLeft < 30) return <Badge variant="orange">{t('consultants.expires_in', { days: daysLeft })}</Badge>;
    
    return (
      <span className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
        <Calendar size={14} className="text-slate-400" />
        {format(validUntil, 'dd MMM yyyy', { locale: currentLocale })}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-navy tracking-tight">{t('consultants.title')}</h1>
          <p className="text-slate-500 font-medium">{t('consultants.subtitle')}</p>
        </div>
        
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="premium-gradient text-white shadow-xl shadow-primary/20 px-8 py-4 h-auto rounded-2xl flex gap-2 items-center"
        >
          <Plus size={20} />
          {t('consultants.new')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={TrendingUp} label={t('consultants.stats.total')} value={meta.total} variant="blue" />
        <StatCard icon={ShieldCheck} label={t('consultants.stats.active')} value={data.filter(c => c.is_active).length} variant="green" />
        <StatCard icon={Building2} label={t('consultants.stats.total_companies')} value={data.reduce((acc, c) => acc + (c.company_count || 0), 0)} variant="purple" />
      </div>

      {/* Filters */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder={t('consultants.search_placeholder')}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" className="bg-white border-slate-100 rounded-2xl px-6">
          <Filter size={18} className="mr-2" />
          {t('common:filter')}
        </Button>
      </div>

      {/* List */}
      {loading && data.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">{t('consultants.table.name')}</th>
                  <th className="px-8 py-5">{t('consultants.table.plan')}</th>
                  <th className="px-8 py-5 text-center">{t('consultants.table.usage')}</th>
                  <th className="px-8 py-5 text-center">{t('consultants.table.ai')}</th>
                  <th className="px-8 py-5">{t('consultants.table.valid_until')}</th>
                  <th className="px-8 py-5">{t('consultants.table.status')}</th>
                  <th className="px-8 py-5 text-right">{t('consultants.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((c) => (
                  <tr key={c.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-navy group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetail(c)}>{c.full_name}</span>
                        <span className="text-xs text-slate-400 font-medium">{c.email}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={c.plan === 'enterprise' ? 'purple' : c.plan === 'growth' ? 'blue' : 'gray'}>
                        {c.plan?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-black text-navy">{c.company_count} / {c.max_companies || '∞'}</span>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${(c.company_count / (c.max_companies || 100)) > 0.8 ? 'bg-orange-500' : 'bg-primary'}`} 
                            style={{ width: `${Math.min(100, (c.company_count / (c.max_companies || 100)) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className={`w-2.5 h-2.5 rounded-full mx-auto ${c.ai_enabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`} />
                    </td>
                    <td className="px-8 py-5">
                      <ValidityBadge date={c.valid_until} />
                    </td>
                    <td className="px-8 py-5">
                      <Badge variant={c.is_active ? 'green' : 'gray'}>
                        {c.is_active ? t('consultants.status.active') : t('consultants.status.passive')}
                      </Badge>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedConsultant(c); setIsEditOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title={t('common:edit')}><Edit size={18} /></button>
                        <button onClick={() => { setSelectedConsultant(c); setIsUpdateOpen(true); }} className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" title={t('consultants.table.plan')}><Settings2 size={18} /></button>
                        <Link href={`/admin/companies?consultant_id=${c.id}`} className="p-2.5 text-slate-400 hover:text-navy hover:bg-slate-100 rounded-xl transition-all"><ExternalLink size={18} /></Link>
                        <button onClick={() => handleToggleStatus(c)} className={`p-2.5 rounded-xl transition-all ${c.is_active ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                          {c.is_active ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title={t('common:delete')}><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {data.map((c) => (
              <Card key={c.id} className="p-5 space-y-5 border-slate-100">
                <div className="flex justify-between items-start">
                  <div onClick={() => handleOpenDetail(c)}>
                    <p className="font-bold text-navy">{c.full_name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </div>
                  <Badge variant={c.plan === 'enterprise' ? 'purple' : c.plan === 'growth' ? 'blue' : 'gray'}>{c.plan?.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('consultants.table.usage')}</p>
                    <p className="text-xs font-black text-navy">{c.company_count} / {c.max_companies || '∞'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('consultants.table.valid_until')}</p>
                    <ValidityBadge date={c.valid_until} />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <Badge variant={c.is_active ? 'green' : 'gray'}>{c.is_active ? t('consultants.status.active') : t('consultants.status.passive')}</Badge>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedConsultant(c); setIsEditOpen(true); }} className="p-2 text-blue-500"><Edit size={18} /></button>
                    <button onClick={() => { setSelectedConsultant(c); setIsUpdateOpen(true); }} className="p-2 text-primary"><Settings2 size={18} /></button>
                    <button onClick={() => handleToggleStatus(c)} className={c.is_active ? 'text-orange-400' : 'text-emerald-400'}>{c.is_active ? <Ban size={18} /> : <CheckCircle2 size={18} />}</button>
                    <button onClick={() => handleDelete(c)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <CreateConsultantModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={() => { setIsCreateOpen(false); fetchConsultants(); }}
        packages={packages}
      />

      {selectedConsultant && (
        <>
          <EditConsultantModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSuccess={() => { setIsEditOpen(false); fetchConsultants(); }}
            consultant={selectedConsultant}
          />
          <UpdatePlanModal 
            isOpen={isUpdateOpen} 
            onClose={() => setIsUpdateOpen(false)} 
            onSuccess={() => { setIsUpdateOpen(false); fetchConsultants(); }}
            consultant={selectedConsultant}
            packages={packages}
          />
          <ConsultantDetailDrawer 
            isOpen={isDetailOpen} 
            onClose={() => setIsDetailOpen(false)} 
            consultant={selectedConsultant}
          />
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, variant }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-indigo-50 text-indigo-600'
  };
  return (
    <Card className="p-6 border-slate-100 flex items-center gap-5 group hover:border-primary/20 transition-all">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colors[variant as keyof typeof colors]}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-navy">{value}</p>
      </div>
    </Card>
  );
}

function EditConsultantModal({ isOpen, onClose, onSuccess, consultant }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: consultant.full_name || consultant.user?.full_name || '',
      email: consultant.email || consultant.user?.email || '',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await client.patch(`/admin/consultants/${consultant.id}/profile`, data);
      toast.success(t('consultants.update_profile.success'));
      onSuccess();
    } catch (err: any) {
      console.error('[AdminConsultants] Update profile error:', err);
      toast.error(err.response?.data?.message || t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('consultants.update_profile.title')} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <InputGroup label={t('consultants.create.full_name')} {...register('full_name')} error={errors.full_name?.message} />
        <InputGroup label={t('consultants.create.email')} type="email" {...register('email')} error={errors.email?.message} />

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">{t('common:cancel')}</Button>
          <Button disabled={loading} type="submit" className="premium-gradient text-white px-8">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
            {t('common:save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateConsultantModal({ isOpen, onClose, onSuccess, packages }: any) {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: { plan: 'starter' }
  });

  const selectedPlan = watch('plan');
  
  // Update limits when plan changes
  useEffect(() => {
    if (packages[selectedPlan]) {
      setValue('max_companies', packages[selectedPlan].max_companies);
      setValue('max_employees', packages[selectedPlan].max_employees);
    }
  }, [selectedPlan, packages, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await client.post('/admin/consultants', data);
      toast.success(t('consultants.create.success'));
      onSuccess();
    } catch (err: any) {
      console.error('[AdminConsultants] Create error:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        t('common:error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('consultants.create.title')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup label={t('consultants.create.full_name')} {...register('full_name')} error={errors.full_name?.message} />
          <InputGroup label={t('consultants.create.email')} type="email" {...register('email')} error={errors.email?.message} />
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('consultants.create.package')}</label>
          <div className="grid grid-cols-3 gap-3">
            {['starter', 'growth', 'enterprise'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue('plan', p)}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedPlan === p 
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <p className={`text-xs font-black uppercase tracking-widest ${selectedPlan === p ? 'text-primary' : 'text-slate-400'}`}>{p}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-1">{packages[p]?.max_companies || '∞'} Firma</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
           <div className="flex items-center gap-2 mb-6">
              <Settings2 size={16} className="text-primary" />
              <h4 className="text-xs font-black text-navy uppercase tracking-widest">{t('consultants.create.custom_limits')}</h4>
           </div>
           <div className="grid grid-cols-2 gap-6">
              <InputGroup 
                label={t('consultants.create.max_companies')} 
                type="number" 
                {...register('max_companies', { valueAsNumber: true })} 
              />
              <InputGroup 
                label={t('consultants.create.max_employees')} 
                type="number" 
                {...register('max_employees', { valueAsNumber: true })} 
              />
           </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">{t('common:cancel')}</Button>
          <Button disabled={loading} type="submit" className="premium-gradient text-white px-8">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <UserPlus className="mr-2" size={18} />}
            {t('consultants.create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function UpdatePlanModal({ isOpen, onClose, onSuccess, consultant, packages }: any) {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(updatePlanSchema),
    defaultValues: {
      plan: consultant.plan?.plan || consultant.plan || 'starter',
      max_companies: consultant.plan?.max_companies,
      max_employees: consultant.plan?.max_employees,
      valid_until: consultant.plan?.valid_until ? format(new Date(consultant.plan.valid_until), 'yyyy-MM-dd') : ''
    }
  });

  const selectedPlan = watch('plan');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await client.put(`/admin/consultants/${consultant.id}/plan`, data);
      toast.success(t('consultants.update_plan.success'));
      onSuccess();
    } catch (err: any) {
      toast.error(t('common:error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('consultants.update_plan.title')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
         <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
               <Info className="text-primary" size={20} />
            </div>
            <div>
               <p className="text-xs font-bold text-navy">{consultant.user?.full_name || consultant.full_name}</p>
               <p className="text-[10px] text-slate-500 font-medium">{t('consultants.update_plan.current')}: <span className="font-black text-primary uppercase">{consultant.plan?.plan || consultant.plan}</span></p>
            </div>
         </div>

         <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('consultants.update_plan.new_package')}</label>
          <div className="grid grid-cols-3 gap-3">
            {['starter', 'growth', 'enterprise'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setValue('plan', p);
                  if (packages[p]) {
                    setValue('max_companies', packages[p].max_companies);
                    setValue('max_employees', packages[p].max_employees);
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedPlan === p 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                <p className={`text-xs font-black uppercase tracking-widest ${selectedPlan === p ? 'text-primary' : 'text-slate-400'}`}>{p}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <InputGroup label={t('consultants.create.max_companies')} type="number" {...register('max_companies', { valueAsNumber: true })} />
          <InputGroup label={t('consultants.create.max_employees')} type="number" {...register('max_employees', { valueAsNumber: true })} />
          <div className="col-span-2">
            <InputGroup label={t('consultants.create.valid_until')} type="date" {...register('valid_until')} />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">{t('common:cancel')}</Button>
          <Button disabled={loading} type="submit" className="premium-gradient text-white px-8">
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle2 className="mr-2" size={18} />}
            {t('consultants.update_plan.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ConsultantDetailDrawer({ isOpen, onClose, consultant }: any) {
  const { t } = useTranslation('admin');
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('common:details')} size="lg">
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-100 rounded-[28px] flex items-center justify-center text-3xl font-black text-slate-300">
            {consultant.user.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-navy">{consultant.user.full_name}</h3>
            <p className="text-sm text-slate-500 font-medium">{consultant.user.email}</p>
            <div className="flex gap-2 mt-3">
              <Badge variant={consultant.user.is_active ? 'green' : 'gray'}>{consultant.user.is_active ? t('consultants.status.active') : t('consultants.status.passive')}</Badge>
              <Badge variant="blue">{consultant.plan?.plan?.toUpperCase()}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('common:companies')}</p>
              <p className="text-xl font-black text-navy">{consultant.companies?.length || 0} / {consultant.plan?.max_companies || '∞'}</p>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('consultants.max_employees')}</p>
              <p className="text-xl font-black text-navy">{consultant.plan?.max_employees || '∞'}</p>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('consultants.ai_enabled')}</p>
              <div className={`w-3 h-3 rounded-full mx-auto mt-2 ${consultant.plan?.ai_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
           </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black text-navy uppercase tracking-widest">{t('consultants.companies_title')}</h4>
            <Link href={`/admin/companies?consultant_id=${consultant.user.id}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              {t('common:view_all')} <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="space-y-2">
            {consultant.companies?.length > 0 ? (
              consultant.companies.map((comp: any) => (
                <div key={comp.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-primary/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><Building2 size={16} className="text-slate-400" /></div>
                    <div>
                      <p className="text-sm font-bold text-navy">{comp.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{comp.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-navy">{comp.employee_count} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">{t('users.stats.employees')}</span></p>
                    <Badge variant={comp.is_active ? 'green' : 'gray'} className="mt-1">{(comp.plan || 'starter').toUpperCase()}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-400 font-medium">{t('consultants.no_companies')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

const InputGroup = React.forwardRef(({ label, error, ...props }: any, ref: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <Input ref={ref} {...props} error={!!error} />
    {error && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
  </div>
));

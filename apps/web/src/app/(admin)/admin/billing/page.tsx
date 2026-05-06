'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Package,
  Plus,
  Edit3,
  DollarSign,
  TrendingUp,
  Activity,
  Loader2,
  X,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Mail
} from 'lucide-react';
import client from '@/lib/api/client';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// ── Helpers ──────────────────────────────────────────────────────────────────

const defaultCreditForm = {
  key: '', label_tr: '', label_en: '', description_tr: '', description_en: '',
  icon: 'Brain', color: '#6C3A8E', sort_order: 0,
};

const defaultPackageForm = {
  key: '', type: 'subscription', label_tr: '', label_en: '',
  description_tr: '', description_en: '',
  price_monthly: '', price_yearly: '', currency: 'USD',
  max_companies: '', max_employees: '',
  ai_enabled: false, white_label: false, sort_order: 0,
};

const formatPrice = (amount: number | string | null, currency: string) => {
  if (amount === null || amount === '') return '-';
  const val = Number(amount);
  if (currency === 'USD') return `$${val}`;
  if (currency === 'TRY') return `${val} ₺`;
  return `${val} ${currency}`;
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBilling() {
  const { t, i18n } = useTranslation('admin');
  const [loading, setLoading]           = useState(true);
  const [creditTypes, setCreditTypes]   = useState<any[]>([]);
  const [packages, setPackages]         = useState<any[]>([]);
  const [stats, setStats]               = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  // Credit type modal
  const [ctModal, setCtModal]   = useState(false);
  const [ctEditing, setCtEdit]  = useState<any>(null);
  const [ctForm, setCtForm]     = useState({ ...defaultCreditForm });
  const [ctSaving, setCtSaving] = useState(false);

  // Package modal
  const [pkgModal, setPkgModal]     = useState(false);
  const [pkgEditing, setPkgEdit]    = useState<any>(null);
  const [pkgForm, setPkgForm]       = useState<any>({ ...defaultPackageForm });
  const [pkgCredits, setPkgCredits] = useState<Record<string, number | string>>({});
  const [pkgSaving, setPkgSaving]   = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const getLabel = (obj: any) => {
    const isTr = i18n.language === 'tr';
    return isTr ? (obj.label_tr || obj.label_en) : (obj.label_en || obj.label_tr);
  };

  const fetchAll = async () => {
    try {
      const [typesRes, pkgRes, statsRes, transRes] = await Promise.allSettled([
        client.get('/admin/billing/credit-types'),
        client.get('/admin/billing/packages'),
        client.get('/admin/billing/stats'),
        client.get('/admin/billing/transactions'),
      ]);

      if (typesRes.status === 'fulfilled') setCreditTypes(typesRes.value.data);
      if (pkgRes.status === 'fulfilled') setPackages(pkgRes.value.data);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (transRes.status === 'fulfilled') setTransactions(transRes.value.data);
    } catch (err) {
      console.error('Admin billing fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Credit Type CRUD ───────────────────────────────────────────────────────

  const openCreateCt = () => {
    setCtEdit(null);
    setCtForm({ ...defaultCreditForm });
    setCtModal(true);
  };

  const openEditCt = (item: any) => {
    setCtEdit(item);
    setCtForm({
      key: item.key, label_tr: item.label_tr, label_en: item.label_en ?? '',
      description_tr: item.description_tr ?? '', description_en: item.description_en ?? '',
      icon: item.icon ?? 'Brain', color: item.color ?? '#6C3A8E',
      sort_order: item.sort_order ?? 0,
    });
    setCtModal(true);
  };

  const saveCt = async () => {
    if (!ctForm.key || !ctForm.label_tr) { toast.error('Key ve Türkçe etiket zorunlu'); return; }
    setCtSaving(true);
    try {
      if (ctEditing) {
        await client.put(`/admin/billing/credit-types/${ctEditing.key}`, ctForm);
        toast.success(t('admin.billing.credit_types.updated_success', { defaultValue: 'Kredi türü güncellendi' }));
      } else {
        await client.post('/admin/billing/credit-types', ctForm);
        toast.success(t('admin.billing.credit_types.created_success', { defaultValue: 'Kredi türü oluşturuldu' }));
      }
      setCtModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Kaydedilemedi');
    } finally {
      setCtSaving(false);
    }
  };

  const toggleCtStatus = async (item: any) => {
    try {
      await client.patch(`/admin/billing/credit-types/${item.key}/status`, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Pasife alındı' : 'Aktive edildi');
      fetchAll();
    } catch { toast.error('Güncellenemedi'); }
  };

  const deleteCt = async (item: any) => {
    if (!window.confirm(`${item.key} kredi türünü silmek istediğinize emin misiniz?`)) return;
    try {
      await client.delete(`/admin/billing/credit-types/${item.key}`);
      toast.success('Kredi türü silindi');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Silinemedi. Bağımlı veriler olabilir.');
    }
  };

  // ── Package CRUD ───────────────────────────────────────────────────────────

  const openCreatePkg = () => {
    setPkgEdit(null);
    setPkgForm({ ...defaultPackageForm });
    setPkgCredits({});
    setPkgModal(true);
  };

  const openEditPkg = (pkg: any) => {
    setPkgEdit(pkg);
    setPkgForm({
      key: pkg.key, type: pkg.type, label_tr: pkg.label_tr, label_en: pkg.label_en ?? '',
      description_tr: pkg.description_tr ?? '', description_en: pkg.description_en ?? '',
      price_monthly: pkg.price_monthly ?? '', price_yearly: pkg.price_yearly ?? '',
      currency: pkg.currency ?? 'TRY',
      max_companies: pkg.max_companies ?? '', max_employees: pkg.max_employees ?? '',
      ai_enabled: pkg.ai_enabled ?? false, white_label: pkg.white_label ?? false,
      sort_order: pkg.sort_order ?? 0,
    });
    setPkgCredits({ ...(pkg.credits ?? {}) });
    setPkgModal(true);
  };

  const savePkg = async () => {
    if (!pkgForm.key || !pkgForm.label_tr) { toast.error('Key ve Türkçe etiket zorunlu'); return; }
    setPkgSaving(true);
    try {
      const body = {
        ...pkgForm,
        price_monthly:  pkgForm.price_monthly !== '' ? Number(pkgForm.price_monthly) : null,
        price_yearly:   pkgForm.price_yearly !== '' ? Number(pkgForm.price_yearly) : null,
        max_companies:  pkgForm.max_companies !== '' ? Number(pkgForm.max_companies) : null,
        max_employees:  pkgForm.max_employees !== '' ? Number(pkgForm.max_employees) : null,
        credits: Object.fromEntries(
          Object.entries(pkgCredits).map(([k, v]) => [k, Number(v)])
        ),
      };
      if (pkgEditing) {
        await client.put(`/admin/billing/packages/${pkgEditing.key}`, body);
        toast.success('Paket güncellendi');
      } else {
        await client.post('/admin/billing/packages', body);
        toast.success('Paket oluşturuldu');
      }
      setPkgModal(false);
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Kaydedilemedi');
    } finally {
      setPkgSaving(false);
    }
  };

  const togglePkgStatus = async (pkg: any) => {
    try {
      await client.patch(`/admin/billing/packages/${pkg.key}/status`, { is_active: !pkg.is_active });
      toast.success(pkg.is_active ? 'Pasife alındı' : 'Aktive edildi');
      fetchAll();
    } catch { toast.error('Güncellenemedi'); }
  };

  const togglePkgVisibility = async (pkg: any) => {
    try {
      await client.patch(`/admin/billing/packages/${pkg.key}/visibility`, { is_visible: !pkg.is_visible });
      toast.success(pkg.is_visible ? 'Gizlendi' : 'Görünür yapıldı');
      fetchAll();
    } catch { toast.error('Güncellenemedi'); }
  };

  const deletePkg = async (pkg: any) => {
    if (!window.confirm(`${pkg.key} paketini silmek istediğinize emin misiniz?`)) return;
    try {
      await client.delete(`/admin/billing/packages/${pkg.key}`);
      toast.success('Paket silindi');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Silinemedi. Bağımlı veriler olabilir.');
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">{t('admin.billing.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('admin.billing.title')}</h1>
          <p className="text-slate-500 font-medium">{t('admin.billing.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard icon={DollarSign} color="indigo" label={t('admin.billing.stats.monthly_revenue')} change={stats?.revenue_change || '+0%'}>
          {formatPrice(stats?.monthly_revenue, stats?.currency || 'USD')}
        </StatCard>
        <StatCard icon={Activity} color="purple" label={t('admin.billing.stats.active_subscriptions')} change={`+${stats?.new_subscriptions || 0}`}>
          {stats?.new_subscriptions || 0}
        </StatCard>
        <StatCard icon={TrendingUp} color="teal" label="AI Kredileri" change="Servis Sağlayıcı">
          <div className="flex flex-col">
            <span className="text-slate-400 text-lg font-bold">Bağlı Değil</span>
            <span className="text-[10px] text-slate-400 font-bold mt-1">
              Dağıtılan: {stats?.active_credits?.ai_credit?.toLocaleString('tr-TR') || 0}
            </span>
          </div>
        </StatCard>
        <StatCard icon={Mail} color="teal" label="Mail Kredileri" change="Resend Bakiyesi">
          <div className="flex flex-col">
            <span>
              {stats?.external_quotas?.mail 
                ? stats.external_quotas.mail.remaining?.toLocaleString('tr-TR') 
                : (stats?.external_quotas?.mail_error || 'Bağlı Değil')}
            </span>
            <span className="text-[10px] text-slate-400 font-bold mt-1">
              Dağıtılan: {stats?.active_credits?.mail_credit?.toLocaleString('tr-TR') || 0}
            </span>
          </div>
        </StatCard>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">{t('admin.billing.transactions.title')}</h3>
            <p className="text-sm text-slate-400 font-medium">{t('admin.billing.transactions.subtitle')}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[11px] font-black tracking-[0.1em]">
              <tr>
                <th className="px-8 py-5">{t('admin.billing.transactions.table.customer')}</th>
                <th className="px-8 py-5">{t('admin.billing.transactions.table.package')}</th>
                <th className="px-8 py-5">{t('admin.billing.transactions.table.amount')}</th>
                <th className="px-8 py-5">{t('admin.billing.transactions.table.payment')}</th>
                <th className="px-8 py-5 text-right">{t('admin.billing.transactions.table.date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                        {tx.consultant?.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.consultant?.full_name || 'Bilinmeyen'}</p>
                        <p className="text-xs text-slate-400">{tx.consultant?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-700">{tx.package_key || '-'}</td>
                  <td className="px-8 py-6 font-black text-slate-900">{tx.amount} {tx.currency}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">{tx.provider}</span>
                  </td>
                  <td className="px-8 py-6 text-right text-xs font-bold text-slate-500">
                    {new Date(tx.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400">{t('admin.billing.transactions.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Types + Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Credit Types ── */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-white"><Settings size={18} /></div>
              {t('admin.billing.credit_types.title')}
            </h3>
            <button
              onClick={openCreateCt}
              className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> {t('admin.billing.credit_types.add')}
            </button>
          </div>
          <div className="p-8 space-y-4">
            {creditTypes.map((ct: any) => (
              <div key={ct.key} className="flex items-center justify-between p-5 rounded-[24px] border border-slate-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: `${ct.color}20`, color: ct.color }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{getLabel(ct)}</h4>
                    <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">{ct.key}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${ct.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {ct.is_active ? t('common.active') : t('common.passive')}
                  </span>
                  <button onClick={() => openEditCt(ct)} className="p-2 bg-white shadow border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all" title="Düzenle">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => toggleCtStatus(ct)} className={`p-2 rounded-xl border transition-all ${ct.is_active ? 'border-red-100 text-red-400 hover:bg-red-50' : 'border-emerald-100 text-emerald-400 hover:bg-emerald-50'}`}>
                    {ct.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => deleteCt(ct)} className="p-2 bg-white shadow border border-red-50 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Sil">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {creditTypes.length === 0 && (
              <p className="text-center text-slate-400 text-sm py-8">{t('admin.billing.credit_types.empty')}</p>
            )}
          </div>
        </div>

        {/* ── Packages ── */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-white"><Package size={18} /></div>
              {t('admin.billing.packages.title')}
            </h3>
            <button
              onClick={openCreatePkg}
              className="text-xs font-bold text-white bg-slate-900 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> {t('admin.billing.packages.add')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">{t('admin.billing.packages.table.package')}</th>
                  <th className="px-6 py-4">{t('admin.billing.packages.table.price')}</th>
                  <th className="px-6 py-4">{t('admin.billing.packages.table.status')}</th>
                  <th className="px-6 py-4 text-right">{t('admin.billing.packages.table.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg: any) => (
                  <tr key={pkg.key} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900">{getLabel(pkg)}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pkg.type} · {pkg.key}</p>
                    </td>
                    <td className="px-6 py-5 font-black text-slate-900">{formatPrice(pkg.price_monthly, pkg.currency)}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${pkg.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                          {pkg.is_active ? t('common.active') : t('common.passive')}
                        </span>
                        {!pkg.is_visible && (
                          <span className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg">{t('admin.billing.packages.hidden')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openEditPkg(pkg)} className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all" title="Düzenle"><Edit3 size={15} /></button>
                        <button onClick={() => togglePkgVisibility(pkg)} className="p-2 rounded-lg border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all" title={pkg.is_visible ? 'Gizle' : 'Göster'}>
                          {pkg.is_visible ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        <button onClick={() => togglePkgStatus(pkg)} className={`p-2 rounded-lg border transition-all ${pkg.is_active ? 'border-red-100 text-red-400 hover:bg-red-50' : 'border-emerald-100 text-emerald-400 hover:bg-emerald-50'}`}>
                          {pkg.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button onClick={() => deletePkg(pkg)} className="p-2 rounded-lg border border-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Sil">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Credit Type Modal ── */}
      {ctModal && (
        <Modal title={ctEditing ? t('admin.billing.credit_types.edit') : t('admin.billing.credit_types.new')} onClose={() => setCtModal(false)}>
          <div className="space-y-4">
            <Field label="ANAHTAR (KEY) *">
              <input
                value={ctForm.key}
                disabled={!!ctEditing}
                onChange={e => setCtForm(f => ({ ...f, key: e.target.value }))}
                placeholder="ai_credit"
                className={`w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 ${ctEditing ? 'bg-slate-50 text-slate-400' : ''}`}
              />
              {!ctEditing && <p className="text-[10px] text-slate-400 mt-1">Sadece küçük harf ve _ — oluşturulduktan sonra değiştirilemez.</p>}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ETİKET TR *">
                <input value={ctForm.label_tr} onChange={e => setCtForm(f => ({ ...f, label_tr: e.target.value }))} placeholder="AI Analiz Kredisi" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </Field>
              <Field label="ETİKET EN">
                <input value={ctForm.label_en} onChange={e => setCtForm(f => ({ ...f, label_en: e.target.value }))} placeholder="AI Analysis Credit" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="RENK">
                <div className="flex gap-2 items-center">
                  <input type="color" value={ctForm.color} onChange={e => setCtForm(f => ({ ...f, color: e.target.value }))} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-1" />
                  <input value={ctForm.color} onChange={e => setCtForm(f => ({ ...f, color: e.target.value }))} placeholder="#6C3A8E" className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
                </div>
              </Field>
              <Field label="SIRA">
                <input type="number" value={ctForm.sort_order} onChange={e => setCtForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
            </div>
            <ModalFooter onClose={() => setCtModal(false)} onSave={saveCt} saving={ctSaving} />
          </div>
        </Modal>
      )}

      {/* ── Package Modal ── */}
      {pkgModal && (
        <Modal title={pkgEditing ? t('admin.billing.packages.edit') : t('admin.billing.packages.new')} onClose={() => setPkgModal(false)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ANAHTAR (KEY) *">
                <input
                  value={pkgForm.key}
                  disabled={!!pkgEditing}
                  onChange={e => setPkgForm((f: any) => ({ ...f, key: e.target.value }))}
                  placeholder="starter_monthly"
                  className={`w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none ${pkgEditing ? 'bg-slate-50 text-slate-400' : ''}`}
                />
              </Field>
              <Field label="TİP">
                <select value={pkgForm.type} onChange={e => setPkgForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none">
                  <option value="subscription">Abonelik</option>
                  <option value="credit">Kredi Paketi</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ETİKET TR *">
                <input value={pkgForm.label_tr} onChange={e => setPkgForm((f: any) => ({ ...f, label_tr: e.target.value }))} placeholder="Başlangıç Paketi" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
              <Field label="ETİKET EN">
                <input value={pkgForm.label_en} onChange={e => setPkgForm((f: any) => ({ ...f, label_en: e.target.value }))} placeholder="Starter Package" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label={`AYLIK FİYAT (${pkgForm.currency})`}>
                <input type="number" value={pkgForm.price_monthly} onChange={e => setPkgForm((f: any) => ({ ...f, price_monthly: e.target.value }))} placeholder="99" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
              <Field label={`YILLIK FİYAT (${pkgForm.currency})`}>
                <input type="number" value={pkgForm.price_yearly} onChange={e => setPkgForm((f: any) => ({ ...f, price_yearly: e.target.value }))} placeholder="990" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
              <Field label="SIRA">
                <input type="number" value={pkgForm.sort_order} onChange={e => setPkgForm((f: any) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
            </div>

            {/* Credit allocations */}
            {(creditTypes || []).length > 0 && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAKET KREDİ TAHSİSATI</p>
                   <span className="text-[9px] font-bold text-slate-400">Eğitmenin her ay / paket alışında tanımlanacak miktar</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {(creditTypes || []).filter((ct: any) => ct.is_active).map((ct: any) => (
                    <div key={ct.key} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm" style={{ backgroundColor: `${ct.color}15`, color: ct.color }}>
                        {ct.icon === 'Brain' ? '🧠' : ct.icon === 'Mail' ? '📧' : '💎'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900">{ct.label_tr}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{ct.key}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pkgCredits[ct.key] === -1 ? '' : (pkgCredits[ct.key] ?? '')}
                          disabled={pkgCredits[ct.key] === -1}
                          onChange={e => setPkgCredits(c => ({ ...c, [ct.key]: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-50 disabled:text-slate-300 transition-all"
                        />
                        <label className="flex items-center gap-1.5 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={pkgCredits[ct.key] === -1}
                            onChange={e => setPkgCredits(c => ({ ...c, [ct.key]: e.target.checked ? -1 : 0 }))}
                            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 transition-all"
                          />
                          <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{t('admin.billing.packages.unlimited', { defaultValue: 'Sınırsız' })}</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="MAKS. FİRMA">
                <input type="number" value={pkgForm.max_companies} onChange={e => setPkgForm((f: any) => ({ ...f, max_companies: e.target.value }))} placeholder="Boş = sınırsız" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
              <Field label="MAKS. ÇALIŞAN">
                <input type="number" value={pkgForm.max_employees} onChange={e => setPkgForm((f: any) => ({ ...f, max_employees: e.target.value }))} placeholder="Boş = sınırsız" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none" />
              </Field>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" checked={pkgForm.ai_enabled} onChange={e => setPkgForm((f: any) => ({ ...f, ai_enabled: e.target.checked }))} className="w-4 h-4 rounded" />
                AI Özelliği
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input type="checkbox" checked={pkgForm.white_label} onChange={e => setPkgForm((f: any) => ({ ...f, white_label: e.target.checked }))} className="w-4 h-4 rounded" />
                White Label
              </label>
            </div>

            <ModalFooter onClose={() => setPkgModal(false)} onSave={savePkg} saving={pkgSaving} />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, color, label, change, children }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-500/10',
    purple: 'bg-purple-50 text-purple-600 shadow-purple-500/10',
    teal:   'bg-teal-50 text-teal-600 shadow-teal-500/10',
  };
  return (
    <div className={`relative overflow-hidden bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 hover:-translate-y-1 transition-all`}>
      <div className="flex justify-between items-start mb-8">
        <div className={`p-4 rounded-2xl border ${colors[color]?.split(' ').slice(0, 2).join(' ')} border-opacity-50`}>
          <Icon size={24} />
        </div>
        <span className={`text-[11px] font-black px-3 py-1.5 rounded-full ${colors[color]?.split(' ').slice(0, 2).join(' ')} border border-opacity-50`}>{change}</span>
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{children}</h3>
    </div>
  );
}

function Modal({ title, onClose, children, wide }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="font-black text-slate-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-all text-slate-400"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving }: any) {
  const { t } = useTranslation('admin');
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
      <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
        {t('common.cancel')}
      </button>
      <button onClick={onSave} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-all flex items-center gap-2">
        {saving && <Loader2 size={15} className="animate-spin" />}
        {saving ? t('common.saving') : t('common.save')}
      </button>
    </div>
  );
}

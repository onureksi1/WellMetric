'use client';

import React, { useEffect, useState } from 'react';
import { 
  Settings, 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight,
  Loader2,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';
import client from '@/lib/api/client';

export default function AdminBilling() {
  const [loading, setLoading] = useState(true);
  const [creditTypes, setCreditTypes] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, pkgRes, statsRes, transRes] = await Promise.all([
          client.get('/admin/billing/credit-types'),
          client.get('/admin/billing/packages'),
          client.get('/admin/billing/stats'),
          client.get('/admin/billing/transactions')
        ]);
        setCreditTypes(typesRes.data);
        setPackages(pkgRes.data);
        setStats(statsRes.data);
        setTransactions(transRes.data);
        console.log('Admin Billing Stats:', statsRes.data);
        console.log('Admin Billing Transactions:', transRes.data);
      } catch (error) {
        console.error('Admin billing fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Finansal veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Platform Finans Yönetimi</h1>
          <p className="text-slate-500 font-medium">Kredi türlerini, paketleri ve platform gelirlerini anlık takip edin.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 hover-lift shadow-xl shadow-slate-900/20 transition-all">
            <Plus size={18} />
            Yeni Paket Ekle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Monthly Revenue Card */}
        <div className="relative overflow-hidden group bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 transition-all hover:shadow-indigo-500/10 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                <DollarSign size={24} className="text-indigo-600" />
              </div>
              <span className="text-[11px] font-black bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100">{stats?.revenue_change || '+0%'}</span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aylık Toplam Gelir</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
              {stats?.monthly_revenue?.toLocaleString('tr-TR')}
              <span className="text-xl ml-1 text-slate-400 font-bold tracking-normal">₺</span>
            </h3>
          </div>
        </div>

        {/* New Subscriptions Card */}
        <div className="relative overflow-hidden group bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 transition-all hover:shadow-purple-500/10 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100/50">
                <Activity size={24} className="text-purple-600" />
              </div>
              <span className="text-[11px] font-black bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full border border-purple-100">+{stats?.new_subscriptions || 0}</span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aktif Abonelikler</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats?.new_subscriptions || 0}</h3>
          </div>
        </div>

        {/* Active Credits Card */}
        <div className="relative overflow-hidden group bg-white p-8 rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 transition-all hover:shadow-teal-500/10 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100/50">
                <TrendingUp size={24} className="text-teal-600" />
              </div>
              <span className="text-[11px] font-black bg-teal-50 text-teal-600 px-3 py-1.5 rounded-full border border-teal-100">Sistemde</span>
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Toplam Kredi Havuzu</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
              {stats?.active_credits > 1000000 
                ? (stats.active_credits / 1000000).toFixed(1) + 'M' 
                : stats?.active_credits?.toLocaleString('tr-TR') || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Sales / Transactions Table */}
      <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900">Son Satışlar ve İşlemler</h3>
            <p className="text-sm text-slate-400 font-medium">Platform üzerinden gerçekleşen son 20 işlem.</p>
          </div>
          <button className="text-sm font-bold text-slate-900 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all">Tümünü Gör</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 uppercase text-[11px] font-black tracking-[0.1em]">
              <tr>
                <th className="px-8 py-5">Eğitmen / Müşteri</th>
                <th className="px-8 py-5">Paket Detayı</th>
                <th className="px-8 py-5">Tutar</th>
                <th className="px-8 py-5">Ödeme Yöntemi</th>
                <th className="px-8 py-5 text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length > 0 ? transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm border-2 border-white shadow-sm">
                        {tx.consultant?.full_name?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.consultant?.full_name || 'Bilinmeyen Kullanıcı'}</p>
                        <p className="text-xs text-slate-400">{tx.consultant?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <p className="text-sm font-bold text-slate-700">{tx.package_key || 'Kredi Yüklemesi'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900">{tx.amount} {tx.currency}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider">{tx.provider}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-black">
                      {new Date(tx.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">Henüz bir işlem gerçekleşmedi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credit Types Section */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <Settings size={18} />
              </div>
              Kredi Türleri
            </h3>
            <button className="text-xs font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all">Tür Ekle</button>
          </div>
          <div className="p-8 space-y-4">
            {creditTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between p-5 rounded-[24px] border border-slate-100 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: `${type.color}15`, color: type.color }}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">{type.label_tr}</h4>
                    <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">{type.key}</p>
                  </div>
                </div>
                <button className="p-3 opacity-0 group-hover:opacity-100 bg-white shadow-md border border-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                  <Edit3 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Packages Section */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg text-white">
                <Package size={18} />
              </div>
              Paket Tanımları
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-8 py-5">Paket</th>
                  <th className="px-8 py-5">Fiyat</th>
                  <th className="px-8 py-5">Durum</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg) => (
                  <tr key={pkg.key} className={`hover:bg-slate-50/50 transition-colors group cursor-pointer`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-black text-slate-900">{pkg.label_tr}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{pkg.type}</p>
                        </div>
                        {!pkg.is_visible && (
                          <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-md uppercase">Gizli</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-slate-900 text-lg">{pkg.price_monthly}₺</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                        pkg.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {pkg.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

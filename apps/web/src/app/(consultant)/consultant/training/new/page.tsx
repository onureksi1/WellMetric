'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';

export default function NewTrainingPlanPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchingDepts, setFetchingDepts] = useState(false);

  const [form, setForm] = useState({
    title: '',
    company_id: '',
    department_id: '',
    description: '',
    starts_at: '',
    ends_at: '',
  });

  useEffect(() => {
    client.get('/consultant/companies')
      .then(res => {
        setCompanies(res.data?.data || res.data || []);
      })
      .catch(() => toast.error('Firmalar yüklenemedi'))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (form.company_id) {
      setFetchingDepts(true);
      client.get(`/consultant/companies/${form.company_id}/departments`)
        .then(res => {
          setDepartments(res.data || []);
          // Reset department if not in list
          if (form.department_id && !res.data.find((d: any) => d.id === form.department_id)) {
            setForm(f => ({ ...f, department_id: '' }));
          }
        })
        .catch(() => toast.error('Departmanlar yüklenemedi'))
        .finally(() => setFetchingDepts(false));
    } else {
      setDepartments([]);
      setForm(f => ({ ...f, department_id: '' }));
    }
  }, [form.company_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_id) {
      toast.error('Lütfen bir firma seçin');
      return;
    }

    setLoading(true);
    try {
      const res = await client.post('/consultant/training/plans', form);
      toast.success('Plan oluşturuldu');
      router.push(`/consultant/training/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all duration-200 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-100"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Yeni Eğitim Planı</h1>
            <p className="text-slate-500 text-sm mt-1">Eğitim modüllerini firmanıza veya departmana özel kurgulayın.</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                Firma Seçimi
                {fetching && <Loader2 className="animate-spin text-indigo-500" size={14} />}
              </label>
              <select
                value={form.company_id}
                onChange={e => setForm({ ...form, company_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                disabled={fetching}
                required
              >
                <option value="">Firma Seçin...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                Departman (Opsiyonel)
                {fetchingDepts && <Loader2 className="animate-spin text-indigo-500" size={14} />}
              </label>
              <select
                value={form.department_id}
                onChange={e => setForm({ ...form, department_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                disabled={!form.company_id || fetchingDepts}
              >
                <option value="">Tüm Şirket</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Plan Başlığı</label>
            <Input
              placeholder="Örn: 2026 Yılı Esenlik ve Verimlilik Eğitim Serisi"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Açıklama</label>
            <Textarea
              placeholder="Planın genel amacı ve kapsamı hakkında bilgi verin..."
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Başlangıç Tarihi</label>
              <Input
                type="date"
                value={form.starts_at}
                onChange={e => setForm({ ...form, starts_at: e.target.value })}
                className="px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Bitiş Tarihi</label>
              <Input
                type="date"
                value={form.ends_at}
                onChange={e => setForm({ ...form, ends_at: e.target.value })}
                className="px-4 py-3 bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center gap-2 font-semibold"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Planı Kaydet ve İlerle
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

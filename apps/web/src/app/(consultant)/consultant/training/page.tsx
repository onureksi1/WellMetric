'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/hooks/useT';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Plus, Calendar, Building2, ChevronRight, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import client from '@/lib/api/client';

export default function ConsultantTrainingPage() {
  const { t } = useT('consultant');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const res = await client.get('/consultant/training/plans');
      setPlans(res.data?.data || res.data || []);
    } catch (err) {
      toast.error(t('training.load_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handlePublish = async (id: string) => {
    if (!confirm(t('training.publish_confirm'))) return;
    try {
      await client.post(`/consultant/training/plans/${id}/publish`);
      toast.success(t('training.published'));
      fetchPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('training.publish_error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('training.delete_confirm'))) return;
    try {
      await client.delete(`/consultant/training/plans/${id}`);
      toast.success(t('training.deleted'));
      fetchPlans();
    } catch (err) {
      toast.error(t('training.delete_error'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('training.status.published')}
          </div>
        );
      case 'draft': 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t('training.status.draft')}
          </div>
        );
      case 'completed': 
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-bold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {t('training.status.completed')}
          </div>
        );
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('training.title')}</h1>
          <p className="text-slate-500 mt-1">{t('training.subtitle')}</p>
        </div>
        <Link href="/consultant/training/new">
          <Button className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 transition-all duration-200 flex items-center gap-2 font-semibold">
            <Plus size={20} />
            {t('training.new')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64 animate-pulse bg-slate-50/50 border-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-16 border-dashed border-2 border-slate-200 bg-slate-50/30 flex flex-col items-center justify-center text-center space-y-6 rounded-3xl">
          <div className="w-20 h-20 bg-white shadow-xl rounded-2xl flex items-center justify-center text-indigo-500">
            <Calendar size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">{t('training.empty_title')}</h3>
            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">{t('training.empty_desc')}</p>
          </div>
          <Link href="/consultant/training/new">
            <Button variant="outline" className="h-11 px-8 rounded-xl border-slate-200 hover:bg-white hover:shadow-md transition-all">
              {t('training.new')}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.id} className="group overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 rounded-2xl bg-white flex flex-col">
              <div className="p-6 flex-1 flex flex-col space-y-5">
                <div className="flex justify-between items-start">
                  {getStatusBadge(plan.status)}
                  {plan.status === 'draft' && (
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-xl leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                    {plan.title}
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-slate-600">
                      <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
                        <Building2 size={16} className="text-slate-500 group-hover:text-indigo-500" />
                      </div>
                      <span className="text-sm font-semibold">{plan.company?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2.5 text-slate-500">
                      <div className="p-1.5 bg-slate-100 rounded-lg">
                        <Plus size={16} className="rotate-45" />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-wider">
                        {plan.department?.name ? plan.department.name : 'Tüm Firma'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-50 mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={15} />
                    <span className="font-medium">{t('training.events', { count: plan.events?.length || 0 })}</span>
                  </div>
                  <span className="font-medium">{new Date(plan.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <Link href={`/consultant/training/${plan.id}`} className="flex-1">
                    <Button variant="outline" className="w-full h-11 text-sm rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-1 font-bold">
                      {t('training.details')} <ChevronRight size={16} />
                    </Button>
                  </Link>
                  {plan.status === 'draft' && (
                    <Button
                      onClick={() => handlePublish(plan.id)}
                      className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1 font-bold"
                    >
                      {t('training.publish')} <Send size={16} />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

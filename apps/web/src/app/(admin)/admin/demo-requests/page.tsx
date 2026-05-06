'use client'

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  Calendar, 
  Eye, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Mail,
  Phone,
  Building2,
  Users2,
  MessageSquare,
  User,
  FileText,
  Save,
  Check,
  X,
  Briefcase,
  TrendingUp,
  ArrowRight,
  FilterX
} from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoRequest {
  id: string;
  full_name: string;
  email: string;
  company_name: string;
  company_size: string;
  industry: string;
  phone: string;
  message: string;
  status: 'pending' | 'contacted' | 'done' | 'converted' | 'rejected';
  notes: string;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
}

const statusColors: Record<string, any> = {
  pending: { variant: 'orange', icon: Clock },
  contacted: { variant: 'blue', icon: Phone },
  done: { variant: 'green', icon: CheckCircle2 },
  converted: { variant: 'purple', icon: TrendingUp },
  rejected: { variant: 'red', icon: XCircle },
};

export default function AdminDemoRequestsPage() {
  const { t, i18n } = useTranslation('admin');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: stats } = useApi('/admin/demo-requests/stats');
  const { data: demoRes, loading, refresh } = useApi<any>(`/admin/demo-requests`, {
    params: Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
  });

  const demoRequests = demoRes?.data || [];
  
  const handleOpenDetails = (request: DemoRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await client.patch(`/admin/demo-requests/${id}/status`, { status });
      toast.success(t('admin.demo.status_updated', 'Durum güncellendi'));
      refresh();
      if (selectedRequest?.id === id) {
        setSelectedRequest(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      toast.error('Hata oluştu');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedRequest) return;
    setIsSaving(true);
    try {
      await client.put(`/admin/demo-requests/${selectedRequest.id}/notes`, { notes });
      toast.success(t('admin.demo.notes_saved', 'Notlar kaydedildi'));
      refresh();
    } catch (error) {
      toast.error('Hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('admin.demo.title')}</h1>
          <p className="text-sm text-gray-500">{t('admin.demo.subtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label={t('admin.demo.stats_total')} 
          value={stats?.total || 0} 
          icon={<FileText className="text-primary" />}
        />
        <StatCard 
          label={t('admin.demo.stats_pending')} 
          value={stats?.pending || 0} 
          icon={<Clock className="text-amber-500" />}
          highlight="bg-amber-500"
        />
        <StatCard 
          label={t('admin.demo.stats_contacted')} 
          value={stats?.contacted || 0} 
          icon={<Phone className="text-blue-500" />}
        />
        <StatCard 
          label={t('admin.demo.stats_converted')} 
          value={stats?.converted || 0} 
          icon={<TrendingUp className="text-emerald-500" />}
          subValue={`${stats?.conversion_rate || 0}% Conversion`}
        />
      </div>

      {/* Filters Card */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t('common.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 min-w-[150px]"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">{t('common.all_statuses')}</option>
              <option value="pending">{t('admin.demo.status_pending')}</option>
              <option value="contacted">{t('admin.demo.status_contacted')}</option>
              <option value="done">{t('admin.demo.status_done')}</option>
              <option value="converted">{t('admin.demo.status_converted')}</option>
              <option value="rejected">{t('admin.demo.status_rejected')}</option>
            </select>
            {(filters.status || filters.search) && (
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500" onClick={() => setFilters({ status: '', search: '' })}>
                <FilterX size={16} className="mr-1" />
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">{t('admin.demo.columns.customer_company')}</th>
                <th className="py-4 px-6">{t('admin.demo.columns.contact')}</th>
                <th className="py-4 px-6 text-center">{t('common.status')}</th>
                <th className="py-4 px-6 text-center">{t('common.date')}</th>
                <th className="py-4 px-6 text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-gray-300 italic animate-pulse">{t('common.loading')}</td></tr>
              ) : demoRequests.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                      <FileText size={24} />
                    </div>
                    <p className="text-gray-400 italic text-xs">{t('common.no_data')}</p>
                  </div>
                </td></tr>
              ) : (
                demoRequests.map((req: DemoRequest) => (
                  <tr key={req.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenDetails(req)}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-navy group-hover:text-primary transition-colors">{req.company_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{req.full_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Mail size={12} className="text-gray-300" /> {req.email}
                        </div>
                        {req.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                            <Phone size={12} className="text-gray-300" /> {req.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant={statusColors[req.status]?.variant || 'gray'} className="text-[10px] uppercase px-2 py-0.5">
                        {t(`admin.demo.status_${req.status}`)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <p className="text-xs font-bold text-gray-600">
                        {format(new Date(req.created_at), 'dd MMM yyyy', { locale: dateLocale })}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {format(new Date(req.created_at), 'HH:mm')}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm" className="text-gray-300 hover:text-primary group-hover:translate-x-1 transition-transform">
                        <ArrowRight size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-[80]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white shadow-2xl z-[90] flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-navy">{t('admin.demo.detail_title')}</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Request ID: {selectedRequest?.id.split('-')[0]}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Profile Card */}
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100">
                        <Building2 size={28} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-navy leading-tight">{selectedRequest?.company_name}</h3>
                        <p className="text-sm text-gray-500 font-medium flex items-center gap-1 mt-1">
                          <User size={14} className="text-gray-300" /> {selectedRequest?.full_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusColors[selectedRequest?.status || 'pending']?.variant} className="text-[10px] uppercase">
                      {t(`admin.demo.status_${selectedRequest?.status}`)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-6 border-t border-gray-100">
                    <InfoField label={t('common.email')} icon={<Mail size={14} />} value={selectedRequest?.email} />
                    <InfoField label={t('admin.demo.columns.phone')} icon={<Phone size={14} />} value={selectedRequest?.phone || '-'} />
                    <InfoField label={t('admin.demo.columns.employee_count')} icon={<Users2 size={14} />} value={selectedRequest?.company_size || '-'} />
                    <InfoField label={t('common.industry')} icon={<Briefcase size={14} />} value={selectedRequest?.industry || '-'} />
                  </div>
                </div>

                {/* Message Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <MessageSquare size={14} className="text-primary" />
                    {t('admin.demo.customer_message')}
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed italic relative">
                    <div className="absolute -left-1 top-4 w-1 h-8 bg-primary/20 rounded-full" />
                    "{selectedRequest?.message || t('admin.demo.no_message')}"
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('admin.demo.update_status')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['contacted', 'done', 'converted', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleUpdateStatus(selectedRequest!.id, status)}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all text-left flex items-center justify-between group",
                          selectedRequest?.status === status 
                            ? "bg-navy border-navy text-white" 
                            : "bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
                        )}
                      >
                        {t(`admin.demo.status_${status}`)}
                        <ArrowRight size={14} className={cn("opacity-0 -translate-x-2 transition-all", selectedRequest?.status === status ? "opacity-100 translate-x-0" : "group-hover:opacity-100 group-hover:translate-x-0")} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-3 pb-10">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-gray-300" />
                      {t('admin.demo.admin_notes')}
                    </div>
                  </div>
                  <div className="relative">
                    <textarea 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-navy min-h-[120px] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all placeholder:text-gray-400"
                      placeholder={t('admin.demo.notes_placeholder')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3">
                      <Button 
                        size="sm" 
                        className="h-8 text-[10px] font-bold"
                        onClick={handleSaveNotes}
                        loading={isSaving}
                      >
                        <Save size={12} className="mr-1.5" />
                        {t('common.save')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 mt-auto">
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>{t('common.close')}</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, subValue, highlight }: any) {
  return (
    <Card className="p-5 flex flex-col gap-3 relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all">
      {highlight && <div className={cn("absolute top-0 left-0 w-1 h-full", highlight)} />}
      <div className="flex items-center justify-between">
        <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all border border-gray-100">
          {React.cloneElement(icon, { size: 20 })}
        </div>
        {subValue && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{subValue}</span>}
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-navy mt-1">{value}</p>
      </div>
    </Card>
  );
}

function InfoField({ label, icon, value }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</p>
      <p className="text-sm text-navy font-semibold flex items-center gap-2">
        <span className="text-gray-300">{icon}</span> {value}
      </p>
    </div>
  );
}

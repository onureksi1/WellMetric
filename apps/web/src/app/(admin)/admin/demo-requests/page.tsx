'use client'

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Filter, 
  Calendar, 
  MoreHorizontal, 
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
  ArrowUpDown,
  History,
  FileText,
  Save,
  Check,
  ChevronRight,
  X,
  Zap,
  Briefcase
} from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Mock types for better readability
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

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  contacted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  converted: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

export default function AdminDemoRequestsPage() {
  const { t, i18n } = useTranslation(['admin']);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: demoRes, refresh } = useApi<any>(`/admin/demo-requests`, {
    params: filters
  });

  const demoRequests = demoRes?.data || [];
  const meta = demoRes?.meta || {};

  const handleOpenDetails = (request: DemoRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
    setIsDrawerOpen(true);
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await client.patch(`/admin/demo-requests/${id}/status`, { status });
      toast.success(t('admin:demo.status_updated', 'Durum güncellendi'));
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
      toast.success(t('admin:demo.notes_saved', 'Notlar kaydedildi'));
      refresh();
    } catch (error) {
      toast.error('Hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const dateLocale = i18n.language === 'tr' ? tr : enUS;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{t('admin:demo.title', 'Demo Talepleri')}</h1>
          <p className="text-sm text-slate-400">{t('admin:demo.subtitle', 'Gelen demo taleplerini yönetin ve takip edin.')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
             <input 
               type="text" 
               placeholder="Ara..."
               className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-full lg:w-64"
               onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
             />
           </div>
           
           <select 
             className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
             value={filters.status}
             onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
           >
            <select 
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">{t('common:all_statuses')}</option>
              <option value="pending">{t('admin:demo.status_pending')}</option>
              <option value="contacted">{t('admin:demo.status_contacted')}</option>
              <option value="done">{t('admin:demo.status_done')}</option>
              <option value="converted">{t('admin:demo.status_converted')}</option>
              <option value="rejected">{t('admin:demo.status_rejected')}</option>
            </select>
           </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Desktop Table */}
        <table className="hidden lg:table w-full text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin:demo.columns.customer_company')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('admin:demo.columns.contact')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common:status')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common:date')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">{t('common:actions')}</th>
            </tr>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {demoRequests.map((req: DemoRequest) => (
              <tr key={req.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{req.company_name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{req.full_name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                      <Mail className="w-3 h-3" /> {req.email}
                    </div>
                    {req.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                        <Phone className="w-3 h-3" /> {req.phone}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", statusColors[req.status])}>
                    {t(`admin:demo.status_${req.status}`)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[11px] font-bold text-slate-400">
                    {format(new Date(req.created_at), 'dd MMM yyyy', { locale: dateLocale })}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono">
                    {format(new Date(req.created_at), 'HH:mm')}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
                    onClick={() => handleOpenDetails(req)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-slate-800">
          {demoRequests.map((req: DemoRequest) => (
            <div key={req.id} className="p-4 space-y-4 active:bg-slate-800/50 transition-colors" onClick={() => handleOpenDetails(req)}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{req.company_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{req.full_name}</p>
                  </div>
                </div>
                <div className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", statusColors[req.status])}>
                  {t(`admin:demo.status_${req.status}`)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-1">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('admin:demo.columns.contact')}</p>
                    <p className="text-[10px] text-slate-300 font-medium truncate">{req.email}</p>
                    {req.phone && <p className="text-[10px] text-slate-500">{req.phone}</p>}
                 </div>
                 <div className="space-y-1 text-right">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t('common:date')}</p>
                    <p className="text-[10px] text-slate-300 font-bold">{format(new Date(req.created_at), 'dd MMM yyyy', { locale: dateLocale })}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{format(new Date(req.created_at), 'HH:mm')}</p>
                 </div>
              </div>
            </div>
          </div>
          ))}
        </div>
        
        {demoRequests.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-500">{t('common:no_data')}</p>
          </div>
        )}
      </div>

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{t('admin:demo.detail_title', 'Demo Talebi Detayları')}</h2>
                  <p className="text-xs text-slate-400">Talep ID: {selectedRequest?.id.split('-')[0]}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Header Info */}
                <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Building2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedRequest?.company_name}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3" /> {selectedRequest?.full_name}
                        </p>
                      </div>
                    </div>
                    <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusColors[selectedRequest?.status || 'pending'])}>
                      {t(`admin:demo.status_${selectedRequest?.status}`)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('common:email')}</p>
                      <p className="text-sm text-white flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {selectedRequest?.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('admin:demo.columns.phone')}</p>
                      <p className="text-sm text-white flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedRequest?.phone || '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('admin:demo.columns.employee_count')}</p>
                      <p className="text-sm text-white flex items-center gap-2">
                        <Users2 className="w-3.5 h-3.5 text-slate-500" /> {selectedRequest?.company_size || '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{t('common:industry')}</p>
                      <p className="text-sm text-white flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" /> {selectedRequest?.industry || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {t('admin:demo.customer_message')}
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed italic">
                    "{selectedRequest?.message || t('admin:demo.no_message')}"
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-white">{t('admin:demo.update_status')}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className={cn("bg-slate-950 border-slate-800 text-xs", selectedRequest?.status === 'contacted' && "border-blue-500 text-blue-500")}
                      onClick={() => handleUpdateStatus(selectedRequest!.id, 'contacted')}
                    >
                      {t('admin:demo.status_contacted')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn("bg-slate-950 border-slate-800 text-xs", selectedRequest?.status === 'done' && "border-emerald-500 text-emerald-500")}
                      onClick={() => handleUpdateStatus(selectedRequest!.id, 'done')}
                    >
                      {t('admin:demo.status_done')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn("bg-slate-950 border-slate-800 text-xs", selectedRequest?.status === 'converted' && "border-purple-500 text-purple-500")}
                      onClick={() => handleUpdateStatus(selectedRequest!.id, 'converted')}
                    >
                      {t('admin:demo.status_converted')}
                    </Button>
                    <Button 
                      variant="outline" 
                      className={cn("bg-slate-950 border-slate-800 text-xs", selectedRequest?.status === 'rejected' && "border-rose-500 text-rose-500")}
                      onClick={() => handleUpdateStatus(selectedRequest!.id, 'rejected')}
                    >
                      {t('admin:demo.status_rejected')}
                    </Button>
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      {t('admin:demo.admin_notes')}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-[10px] text-primary hover:text-primary-light"
                      onClick={handleSaveNotes}
                      disabled={isSaving}
                    >
                      {isSaving ? t('common:saving') : t('common:save')}
                    </Button>
                  </div>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-white min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-700"
                    placeholder={t('admin:demo.notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  {t('common:close')}
                </Button>
                <Button className="bg-primary text-white" onClick={handleSaveNotes} disabled={isSaving}>
                  {isSaving ? t('common:saving') : t('common:save')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function placeholder() {} // Removed local cn

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import client from '@/lib/api/client';
import { 
  Search, 
  History, 
  Calendar, 
  Download,
  Shield,
  User,
  Activity,
  Loader2,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { useTranslation } from 'react-i18next';

export default function AuditLogPage() {
  const { t } = useTranslation('admin');
  const searchParams = useSearchParams();
  const companyIdParam = searchParams.get('company_id') || '';
  
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    company_id: companyIdParam,
    action: '',
    date_from: '',
    date_to: '',
    page: 1,
    per_page: 50
  });

  const fetchCompanies = async () => {
    try {
      const res = await client.get('/admin/companies');
      setCompanies(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch companies', err);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await client.get('/admin/audit-logs', { params: filters });
      setLogs(res.data.items || []);
      setTotal(res.data.meta?.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleExport = () => {
    // Basic CSV export
    const headers = ['Tarih', 'Kullanıcı', 'Firma', 'İşlem', 'Hedef', 'IP'];
    const csvContent = [
      headers.join(';'),
      ...logs.map(l => [
        format(new Date(l.created_at), 'dd.MM.yyyy HH:mm'),
        l.user?.full_name || l.user?.email || 'System',
        l.user?.company?.name || 'System',
        l.action,
        l.target_type || '-',
        l.ip_address || '-'
      ].join(';'))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getVariant = (action: string) => {
    if (action.includes('delete')) return 'red';
    if (action.includes('update') || action.includes('edit')) return 'blue';
    if (action.includes('create') || action.includes('add')) return 'green';
    if (action.includes('status')) return 'orange';
    if (action.includes('survey')) return 'purple';
    return 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('audit.title')}</h1>
          <p className="text-sm text-gray-500">{t('audit.subtitle')}</p>
        </div>
        <Button variant="ghost" onClick={handleExport} className="w-full sm:w-auto flex gap-2 text-xs md:text-sm border border-gray-100 bg-white shadow-sm">
          <Download size={16} />
          {t('audit.export_csv')}
        </Button>
      </div>

      <Card>
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('audit.search_placeholder')}
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2">
            <select 
              value={filters.company_id}
              onChange={(e) => setFilters({ ...filters, company_id: e.target.value, page: 1 })}
              className="w-full sm:w-48 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">{t('common:all_companies')}</option>
              <option value="system">{t('audit.system_global')}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
               <input 
                 type="date" 
                 value={filters.date_from}
                 onChange={(e) => setFilters({ ...filters, date_from: e.target.value, page: 1 })}
                 className="flex-1 sm:w-32 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
               />
               <input 
                 type="date" 
                 value={filters.date_to}
                 onChange={(e) => setFilters({ ...filters, date_to: e.target.value, page: 1 })}
                 className="flex-1 sm:w-32 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
               />
            </div>
            <Button variant="secondary" className="lg:px-6" onClick={() => setFilters({ ...filters, page: 1 })}>{t('common:filter')}</Button>
          </div>
        </div>

        {/* Table */}
        <div className="p-0 overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-black uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-4 px-4">{t('audit.columns.date')}</th>
                <th className="py-4 px-4">{t('audit.columns.user')}</th>
                <th className="py-4 px-4">{t('audit.columns.company')}</th>
                <th className="py-4 px-4">{t('audit.columns.action')}</th>
                <th className="py-4 px-4">{t('audit.columns.target')}</th>
                <th className="py-4 px-4 text-right">{t('audit.columns.ip')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 italic">{t('common:no_data')}</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <AuditRow 
                    key={log.id}
                    date={format(new Date(log.created_at), 'dd MMM HH:mm', { locale: tr })} 
                    user={log.user?.full_name || log.user?.email || 'System'} 
                    company={log.user?.company?.name || 'System'} 
                    action={log.action} 
                    target={log.target_type || '-'} 
                    ip={log.ip_address || '-'} 
                    variant={getVariant(log.action)} 
                  />
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
             {logs.map((log) => (
                <MobileAuditCard 
                  key={log.id}
                  date={format(new Date(log.created_at), 'dd MMM HH:mm', { locale: tr })} 
                  user={log.user?.full_name || log.user?.email || 'System'} 
                  company={log.user?.company?.name || 'System'} 
                  action={log.action} 
                  target={log.target_type || '-'} 
                  ip={log.ip_address || '-'} 
                  variant={getVariant(log.action)} 
                />
             ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-50 pt-4 gap-4">
          <p className="text-xs text-gray-500">{t('audit.pagination_info', { total, per_page: filters.per_page })}</p>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={filters.page === 1}
              onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button variant="ghost" size="sm" className="bg-primary/5 text-primary font-bold">{filters.page}</Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={logs.length < filters.per_page}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MobileAuditCard({ date, user, company, action, target, ip, variant }: any) {
  const { t } = useTranslation('admin');
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
           <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 border border-gray-200">
              {user === 'System' ? <Shield size={14} /> : <User size={14} />}
           </div>
           <div>
             <p className="text-xs font-bold text-navy">{user}</p>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{company}</p>
           </div>
        </div>
        <span className="text-[10px] font-bold text-gray-400 font-mono">{date}</span>
      </div>
      
      <div className="flex flex-col gap-1.5">
         <div className="flex justify-between items-center">
            <Badge variant={variant} className="text-[8px] px-1 py-0 font-black uppercase tracking-widest">{action}</Badge>
            <span className="text-[10px] text-gray-400 font-mono">{ip}</span>
         </div>
         <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">{t('audit.columns.target')}: {target}</p>
      </div>
    </div>
  );
}

function AuditRow({ date, user, company, action, target, ip, variant }: any) {
  const { t } = useTranslation('admin');
  return (
    <tr className="hover:bg-gray-50/50 transition-colors group">
      <td className="py-4 px-4 text-gray-500 font-mono text-[10px] font-bold">{date}</td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2">
           <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:border-primary/30 transition-all border border-transparent">
              {user === 'System' ? <Shield size={12} /> : <User size={12} />}
           </div>
           <span className="font-bold text-navy text-xs">{user}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-gray-600 font-bold text-[10px] uppercase tracking-tighter">{company}</td>
      <td className="py-4 px-4">
        <Badge variant={variant} className="text-[8px] px-1 py-0 font-black uppercase tracking-widest">{action}</Badge>
      </td>
      <td className="py-4 px-4 text-gray-500 text-[10px] italic font-medium">{target}</td>
      <td className="py-4 px-4 text-right text-gray-400 font-mono text-[10px]">{ip}</td>
    </tr>
  );
}

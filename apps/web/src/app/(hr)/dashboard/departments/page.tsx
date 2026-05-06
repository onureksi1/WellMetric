'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TrendLine } from '@/components/charts/TrendLine';
import { 
  Table as TableIcon, 
  Grid, 
  Search, 
  Filter, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Info,
  Users,
  Target,
  Plus,
  Settings
} from 'lucide-react';
import { clsx } from 'clsx';
import client from '@/lib/api/client';
import '@/lib/i18n';

// Types
interface DepartmentStats {
  id: string;
  name: string;
  users_count: number;
  overall_score: number;
  physical_score: number;
  mental_score: number;
  social_score: number;
  financial_score: number;
  work_score: number;
  participation_rate: number;
}

interface ContentItem {
  id: string;
  title: string;
  type: string;
}

// Validation Schema
export default function DepartmentsPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  
  // Validation Schema (Inside component to use t)
  const actionSchema = z.object({
    title: z.string().min(3, t('common.errors.min_length', { min: 3, defaultValue: 'Başlık en az 3 karakter olmalıdır' })),
    dimension_key: z.string().min(1, t('common.errors.required', 'Boyut seçiniz')),
    department_id: z.string().min(1, t('common.errors.required', 'Departman seçiniz')),
    content_id: z.string().optional(),
    due_date: z.string().min(1, t('common.errors.required', 'Son tarih seçiniz')),
  });

  type ActionFormValues = z.infer<typeof actionSchema>;

  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const filterFromUrl = searchParams.get('filter');

  const [view, setView] = useState<'table' | 'heatmap'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentStats | null>(null);

  // Queries
  const { data: departments = [], isLoading: deptsLoading } = useQuery<DepartmentStats[]>({
    queryKey: ['hr-departments'],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/departments');
      return res.data;
    },
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ['hr-dept-trend', selectedDept?.id],
    queryFn: async () => {
      const res = await client.get('/hr/dashboard/trend', { 
        params: { department_id: selectedDept?.id, months: 6 } 
      });
      return res.data;
    },
    enabled: !!selectedDept?.id && isDetailModalOpen,
  });

  const { data: contentItems = [] } = useQuery<ContentItem[]>({
    queryKey: ['content-items'],
    queryFn: async () => {
      const res = await client.get('/content');
      return res.data;
    },
    enabled: isActionModalOpen,
  });

  // Mutations
  const createActionMutation = useMutation({
    mutationFn: (data: ActionFormValues) => client.post('/hr/actions', data),
    onSuccess: () => {
      toast.success(t('dashboard.actions.create_modal.success', 'Aksiyon oluşturuldu'));
      setIsActionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hr-actions'] });
    },
  });

  // Forms
  const actionForm = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
  });

  // Handlers
  const handleRowClick = (dept: DepartmentStats) => {
    setSelectedDept(dept);
    setIsDetailModalOpen(true);
  };

  const handleCreateAction = (dimensionKey?: string) => {
    actionForm.reset({
      department_id: selectedDept?.id,
      dimension_key: dimensionKey || 'overall',
      title: '',
      content_id: '',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsActionModalOpen(true);
  };

  const filteredDepts = departments
    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (!filterFromUrl) return 0;
      const key = `${filterFromUrl}_score` as keyof DepartmentStats;
      return (Number(a[key]) || 0) - (Number(b[key]) || 0);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('dashboard.departments.title')}</h1>
          <p className="text-sm text-gray-500">{t('dashboard.departments.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link href="/dashboard/departments/manage" className="w-full sm:w-auto">
            <Button variant="ghost" className="w-full sm:w-auto flex gap-2 text-xs border border-gray-100 bg-white hover:bg-gray-50">
              <Settings size={14} />
              {t('dashboard.departments.manage.title', 'Departmanları Yönet')}
            </Button>
          </Link>
          <div className="flex bg-white border border-gray-100 rounded-lg p-1 shadow-sm w-full sm:w-auto">
            <button 
              onClick={() => setView('table')}
              className={clsx('flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all', view === 'table' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-navy')}
            >
              <TableIcon size={14} />
              <span className="xs:inline">{t('dashboard.departments.view_table')}</span>
            </button>
            <button 
              onClick={() => setView('heatmap')}
              className={clsx('flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all', view === 'heatmap' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-navy')}
            >
              <Grid size={14} />
              <span className="xs:inline">{t('dashboard.departments.view_heatmap')}</span>
            </button>
          </div>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('dashboard.departments.manage.search', 'Departman ara...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <Button variant="ghost" className="w-full sm:w-auto flex gap-2 text-xs border border-gray-100">
            <Filter size={16} />
            {t('common.filter')}
          </Button>
        </div>

        {deptsLoading ? (
          <div className="text-center py-20 text-gray-400">{t('common.loading')}</div>
        ) : view === 'table' ? (
          <div className="p-0 overflow-x-auto">
            {/* Desktop Table */}
            <table className="hidden md:table w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="py-4 px-4">{t('dashboard.departments.columns.department')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.overall')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.physical')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.mental')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.social')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.financial')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.work')}</th>
                  <th className="py-4 px-4 text-center">{t('dashboard.departments.columns.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleRowClick(dept)}>
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-bold text-navy group-hover:text-primary transition-colors">{dept.name}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{dept.users_count} {t('dashboard.departments.columns.employees')}</p>
                      </div>
                    </td>
                    <ScoreCell score={dept.overall_score} isBold />
                    <ScoreCell score={dept.physical_score} />
                    <ScoreCell score={dept.mental_score} />
                    <ScoreCell score={dept.social_score} />
                    <ScoreCell score={dept.financial_score} />
                    <ScoreCell score={dept.work_score} />
                    <td className="py-4 px-4 text-center">
                       <StatusDot score={dept.overall_score} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredDepts.map((dept) => (
                <div key={dept.id} className="p-4 space-y-4 active:bg-gray-50 transition-colors" onClick={() => handleRowClick(dept)}>
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="font-bold text-navy">{dept.name}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{dept.users_count} {t('dashboard.departments.columns.employees')}</p>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <StatusDot score={dept.overall_score} />
                        <span className={clsx('text-xl font-black', dept.overall_score >= 70 ? 'text-primary' : dept.overall_score >= 50 ? 'text-warning' : 'text-danger')}>
                          {dept.overall_score}
                        </span>
                     </div>
                   </div>

                   <div className="grid grid-cols-5 gap-1.5">
                      <MiniScore label="Fiz" score={dept.physical_score} />
                      <MiniScore label="Zih" score={dept.mental_score} />
                      <MiniScore label="Sos" score={dept.social_score} />
                      <MiniScore label="Fin" score={dept.financial_score} />
                      <MiniScore label="İş" score={dept.work_score} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 min-h-[400px]">
             {filteredDepts.map((dept) => (
                <div 
                  key={dept.id} 
                  onClick={() => handleRowClick(dept)}
                  className={clsx(
                    'p-4 rounded-xl flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer shadow-sm border border-black/5',
                    dept.overall_score >= 70 ? 'bg-primary text-white' : 
                    dept.overall_score >= 50 ? 'bg-warning text-white' : 'bg-danger text-white'
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-widest opacity-80">{dept.users_count} {t('dashboard.departments.columns.employees')}</p>
                  <div className="py-6">
                    <h3 className="text-xl font-bold">{dept.name}</h3>
                    <p className="text-4xl font-black mt-2">{dept.overall_score}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold opacity-80">
                    <TrendingUp size={12} />
                    {t('common.participation_rate')}: %{dept.participation_rate}
                  </div>
                </div>
             ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
           <Info className="text-blue-500 mt-0.5" size={18} />
           <p className="text-xs text-blue-700 leading-relaxed">
             <strong>{t('dashboard.departments.anonymity_note', 'Anonimlik Eşiği')}:</strong> 
             {t('dashboard.departments.anonymity_desc', 'Şirket ayarlarınız gereği 5\'ten az çalışanı olan departmanların detaylı skorları bireysel gizliliği korumak amacıyla maskelenmiş olabilir.')}
           </p>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title={selectedDept?.name || ''}
        maxWidth="lg"
      >
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.departments.columns.employees')}</p>
              <h4 className="text-3xl font-black text-navy">{selectedDept?.users_count}</h4>
            </div>
            <div className="flex gap-4">
              <ScoreBadge label={String(t('common.dimensions.overall'))} score={selectedDept?.overall_score || 0} />
              <ScoreBadge label={String(t('common.dimensions.mental'))} score={selectedDept?.mental_score || 0} />
              <ScoreBadge label={String(t('common.dimensions.physical'))} score={selectedDept?.physical_score || 0} />
            </div>
          </div>

          <Card title={String(t('dashboard.departments.detail.trend'))}>
            <TrendLine data={trendData} dimensions={['overall']} />
          </Card>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
            <SmallScoreCard label={String(t('common.dimensions.physical'))} score={selectedDept?.physical_score || 0} />
            <SmallScoreCard label={String(t('common.dimensions.mental'))} score={selectedDept?.mental_score || 0} />
            <SmallScoreCard label={String(t('common.dimensions.social'))} score={selectedDept?.social_score || 0} />
            <SmallScoreCard label={String(t('common.dimensions.financial'))} score={selectedDept?.financial_score || 0} />
            <SmallScoreCard label={String(t('common.dimensions.work'))} score={selectedDept?.work_score || 0} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDetailModalOpen(false)}>{t('common.close')}</Button>
            <Button className="flex-1 gap-2" onClick={() => handleCreateAction()}>
              <Plus size={18} />
              {t('dashboard.departments.detail.create_action')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Action Modal */}
      <Modal 
        isOpen={isActionModalOpen} 
        onClose={() => setIsActionModalOpen(false)} 
        title={t('dashboard.actions.create_modal.title')}
      >
        <form onSubmit={actionForm.handleSubmit(v => createActionMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.actions.create_modal.action_title')}*</label>
            <input 
              {...actionForm.register('title')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10"
              placeholder={t('dashboard.actions.create_modal.placeholder', 'Örn: Stres Yönetimi Atölyesi')}
            />

            {actionForm.formState.errors.title && <p className="text-danger text-[10px] font-bold mt-1">{actionForm.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.actions.create_modal.dimension')}</label>
              <select 
                {...actionForm.register('dimension_key')}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10"
              >
                <option value="overall">{t('common.dimensions.overall')}</option>
                <option value="physical">{t('common.dimensions.physical')}</option>
                <option value="mental">{t('common.dimensions.mental')}</option>
                <option value="social">{t('common.dimensions.social')}</option>
                <option value="financial">{t('common.dimensions.financial')}</option>
                <option value="work">{t('common.dimensions.work')}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.actions.create_modal.department')}</label>
              <select 
                {...actionForm.register('department_id')}
                disabled
                className="w-full bg-gray-100 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold outline-none opacity-60 cursor-not-allowed"
              >
                <option value={selectedDept?.id}>{selectedDept?.name}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.actions.create_modal.content')}</label>
            <select 
              {...actionForm.register('content_id')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="">{t('common.none')}</option>
              {contentItems.map(c => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.actions.create_modal.due_date')}*</label>
            <input 
              type="date"
              {...actionForm.register('due_date')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsActionModalOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={createActionMutation.isPending} className="flex-1" type="submit">{t('dashboard.actions.create_modal.submit')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MiniScore({ label, score }: { label: string, score: number | null }) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-300';
    if (s >= 70) return 'text-primary';
    if (s >= 50) return 'text-warning';
    return 'text-danger';
  };
  
  return (
    <div className="bg-gray-50 p-2 rounded-lg text-center flex-1 min-w-0">
      <p className="text-[7px] font-black text-gray-400 uppercase truncate">{label}</p>
      <p className={clsx('text-[10px] font-black', getScoreColor(score))}>{score ?? '--'}</p>
    </div>
  );
}

function ScoreCell({ score, isBold = false }: { score: number | null, isBold?: boolean }) {
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-300';
    if (s >= 70) return 'text-primary';
    if (s >= 50) return 'text-warning';
    return 'text-danger';
  };

  return (
    <td className="py-4 px-4 text-center">
       <div className={clsx(
         'inline-flex items-center justify-center h-8 w-10 rounded-lg text-xs font-bold transition-all',
         score === null ? 'bg-gray-50' : 'bg-gray-100/50',
         getScoreColor(score),
         isBold && 'border border-current scale-110'
       )}>
         {score ?? '--'}
       </div>
    </td>
  );
}

function StatusDot({ score }: { score: number }) {
  if (score >= 70) return <div className="inline-flex h-2 w-2 rounded-full bg-primary" />;
  if (score >= 50) return <div className="inline-flex h-2 w-2 rounded-full bg-warning" />;
  return <div className="inline-flex h-2 w-2 rounded-full bg-danger animate-pulse" />;
}

function ScoreBadge({ label, score }: { label: string, score: number }) {
  const color = score >= 70 ? 'bg-primary' : score >= 50 ? 'bg-warning' : 'bg-danger';
  return (
    <div className={clsx('p-3 rounded-xl text-white shadow-lg', color)}>
      <p className="text-[10px] font-bold uppercase opacity-80">{label}</p>
      <p className="text-xl font-black">{score}</p>
    </div>
  );
}

function SmallScoreCard({ label, score }: { label: string, score: number }) {
  const textColor = score >= 70 ? 'text-primary' : score >= 50 ? 'text-warning' : 'text-danger';
  const bgColor = score >= 70 ? 'bg-primary/5' : score >= 50 ? 'bg-warning/5' : 'bg-danger/5';
  
  return (
    <div className={clsx('p-3 rounded-xl border border-gray-100', bgColor)}>
      <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{label}</p>
      <p className={clsx('text-lg font-bold', textColor)}>{score}</p>
    </div>
  );
}

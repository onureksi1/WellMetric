'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  UserPlus, 
  Upload, 
  Search, 
  Mail, 
  RefreshCcw, 
  UserMinus,
  UserCheck,
  Edit2,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  Trash2,
  Send
} from 'lucide-react';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import axios from 'axios';
import '@/lib/i18n';

// Types
interface Employee {
  id: string;
  full_name: string;
  email: string;
  department_name: string;
  department_id: string;
  position: string;
  is_active: boolean;
  status: 'invited' | 'active' | 'expired' | 'token_sent';
  survey_count: number;
}

interface Department {
  id: string;
  name: string;
}

// Validation Schemas
const inviteSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  full_name: z.string().min(1, 'Ad soyad zorunludur'),
  department_id: z.string().optional().or(z.literal('')),
  position: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  seniority: z.string().optional().or(z.literal('')),
  age_group: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  language: z.enum(['tr', 'en']),
});

const editSchema = inviteSchema.extend({});

type InviteFormValues = z.infer<typeof inviteSchema>;

export default function EmployeesPage() {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isTargetedSurveyModalOpen, setIsTargetedSurveyModalOpen] = useState(false);
  const [targetedSurveyId, setTargetedSurveyId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget]           = useState<Employee | null>(null);

  // CSV Upload state
  const [csvStep, setCsvStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvResults, setCsvResults] = useState<any>(null);
  const [isAllSurveyModalOpen, setIsAllSurveyModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useQuery({
    queryKey: ['employees', searchTerm, deptFilter, statusFilter],
    queryFn: async () => {
      console.log('[EmployeesPage] API isteği atılıyor', { searchTerm, deptFilter, statusFilter });
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (deptFilter && deptFilter !== '') params.department_id = deptFilter;
      
      const res = await client.get('/hr/employees-no-account', { params });
      console.log('[EmployeesPage] API cevabı', res.data);
      return res.data;
    },
  });

  console.log('[EmployeesPage] Render durumu', {
    employeesLoading,
    employeesError,
    employeesData,
    itemCount: employeesData?.items?.length,
  });

  const { data: surveys = [] } = useQuery<any[]>({
    queryKey: ['active-surveys'],
    queryFn: async () => {
      const res = await client.get('/hr/surveys');
      return res.data;
    },
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await client.get('/hr/departments');
      return res.data;
    },
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormValues) => client.post('/hr/employees-no-account', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(t('dashboard.employees.invite_modal.success', 'Davet gönderildi'));
      setIsInviteModalOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        toast.error(t('dashboard.employees.errors.email_exists', 'Bu e-posta zaten kayıtlı'));
      } else {
        toast.error(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: InviteFormValues) => client.put(`/hr/employees-no-account/${selectedEmployee?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(t('common.saved', 'Çalışan güncellendi'));
      setIsEditModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Güncelleme sırasında bir hata oluştu';
      toast.error(msg);
      console.error('Update Error:', err.response?.data);
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: (surveyData: { survey_id: string; period: string }) => 
      client.post(`/hr/employees-no-account/${selectedEmployee?.id}/send-survey`, surveyData),
    onSuccess: () => {
      toast.success(t('dashboard.employees.actions.resend_success', 'Yeni davet gönderildi'));
      setIsResendModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Durum güncellenemedi');
    }
  });

  const targetedSurveyMutation = useMutation({
    mutationFn: ({ survey_id, employee_id }: { survey_id: string; employee_id: string }) =>
      client.post('/hr/campaigns', {
        survey_id,
        target_employee_ids: [employee_id],
      }),
    onSuccess: () => {
      toast.success(`✓ ${selectedEmployee?.full_name} kişisine anket gönderildi`);
      setIsTargetedSurveyModalOpen(false);
      setTargetedSurveyId('');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Anket gönderilemedi');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => client.delete(`/hr/employees-no-account/${id}`),
    onSuccess: (res) => {
      const data = res.data;
      const anonCount = data?.anonymized?.responses ?? 0;
      toast.success(
        `${deleteTarget?.full_name ?? 'Çalışan'} kalıcı olarak silindi.` +
        (anonCount > 0 ? ` ${anonCount} anket yanıtı anonim bırakıldı.` : '')
      );
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Silinemedi');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (is_active: boolean) => 
      client.patch(`/hr/employees/${selectedEmployee?.id}/status`, { is_active }),
    onSuccess: (_, is_active) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(is_active ? t('dashboard.employees.actions.activated', 'Çalışan aktifleştirildi') : t('dashboard.employees.actions.deactivated', 'Çalışan devre dışı bırakıldı'));
      setIsStatusModalOpen(false);
    }
  });

  const confirmUploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return client.post('/hr/employees-no-account/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      setCsvResults(res.data);
      setCsvStep(3);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (err: any) => {
      console.error('CSV Import Error:', err.response?.data || err.message);
      const msg = err.response?.data?.message || 'Dosya işlenirken hata oluştu';
      toast.error(`İşleme Hatası: ${msg}`);
      setCsvStep(1);
    }
  });

  // Forms
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { language: 'tr' }
  });

  const editForm = useForm<InviteFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { language: 'tr' }
  });

  // Handlers
  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    // Fetch full data for editing
    client.get(`/hr/employees-no-account/${emp.id}`).then(res => {
      editForm.reset(res.data);
      setIsEditModalOpen(true);
    });
  };

  const downloadTemplate = () => {
    const headers = ['email', 'full_name', 'department_name', 'position', 'location', 'seniority', 'age_group', 'gender', 'start_date', 'language'];
    const csvContent = headers.join(',') + '\n' + 'test@example.com,Test User,Software,Developer,Istanbul,Senior,26-35,male,2024-01-01,tr';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wellbeing_metric_employee_template.csv';
    a.click();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvStep(2);
    setUploadProgress(10);

    try {
      setUploadProgress(100);
      confirmUploadMutation.mutate(file);
    } catch (err: any) {
      console.error('CSV Upload Error Detail:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      const errorMessage = err.response?.data?.message || err.message || 'Dosya yüklenemedi';
      toast.error(`Yükleme Hatası: ${errorMessage}`);
      setCsvStep(1);
    }
  };

  const employees = employeesData?.items || [];
  const meta = employeesData?.meta || { total: 0, page: 1, per_page: 20 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('dashboard.employees.title')}</h1>
          <p className="text-sm text-gray-500">{t('dashboard.employees.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button 
            variant="ghost" 
            className="flex-1 sm:flex-none flex gap-2 border border-gray-100 bg-white"
            onClick={() => {
              setCsvStep(1);
              setCsvResults(null);
              setIsCsvModalOpen(true);
            }}
          >
            <Upload size={18} />
            <span className="hidden xs:inline">{t('dashboard.employees.invite_csv')}</span>
            <span className="xs:hidden">CSV</span>
          </Button>
          <Button 
            className="flex-1 sm:flex-none flex gap-2 shadow-lg shadow-primary/20"
            onClick={() => {
              inviteForm.reset();
              setIsInviteModalOpen(true);
            }}
          >
            <UserPlus size={18} />
            {t('dashboard.employees.invite_single')}
          </Button>
          <Button 
            variant="outline"
            className="flex-1 sm:flex-none flex gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={() => setIsAllSurveyModalOpen(true)}
          >
            <Mail size={18} />
            Tümüne Anket Gönder
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('dashboard.employees.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <select 
              className="w-full sm:w-40 bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold text-navy outline-none"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">{t('dashboard.employees.filter_department')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select 
              className="w-full sm:w-40 bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold text-navy outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('dashboard.employees.filter_status')}</option>
              <option value="active">{t('dashboard.employees.invite_status.active')}</option>
              <option value="invited">{t('dashboard.employees.invite_status.invited')}</option>
              <option value="expired">{t('dashboard.employees.invite_status.expired')}</option>
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-4 px-4">{t('dashboard.employees.columns.name')}</th>
                <th className="py-4 px-4">{t('dashboard.employees.columns.department')} / {t('dashboard.employees.columns.position')}</th>
                <th className="py-4 px-4 text-center">{t('dashboard.employees.columns.invite_status')}</th>
                <th className="py-4 px-4 text-center">{t('dashboard.employees.columns.survey_count')}</th>
                <th className="py-4 px-4 text-right">{t('dashboard.employees.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employeesLoading ? (
                <tr><td colSpan={5} className="text-center py-20 text-gray-400 italic">{t('common.loading')}</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium">{t('common.no_data')}</td></tr>
              ) : employees.map((emp: Employee) => (
                <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs shadow-sm">
                        {(emp.full_name || emp.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-navy group-hover:text-primary transition-colors">{emp.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-navy text-xs">{emp.department_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.position}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <StatusBadge status={emp.status} t={t} />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gray-50 text-[11px] font-black text-navy border border-gray-100 shadow-sm">
                      {emp.survey_count}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-lg transition-all" 
                        onClick={() => handleEditClick(emp)}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Anket Gönder"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setTargetedSurveyId(surveys[0]?.id ?? '');
                          setIsTargetedSurveyModalOpen(true);
                        }}
                      >
                        <Send size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsResendModalOpen(true);
                        }}
                      >
                        <RefreshCcw size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={emp.is_active ? "p-2 text-gray-400 hover:text-danger hover:bg-danger/5 rounded-lg transition-all" : "p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"}
                        onClick={() => {
                          setSelectedEmployee(emp);
                          setIsStatusModalOpen(true);
                        }}
                      >
                        {emp.is_active ? <UserMinus size={16} /> : <UserCheck size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        onClick={() => setDeleteTarget(emp)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
             {employeesLoading ? (
                <div className="py-12 text-center text-gray-400 italic">{t('common.loading')}</div>
             ) : employees.length === 0 ? (
                <div className="py-12 text-center text-gray-400">{t('common.no_data')}</div>
             ) : employees.map((emp: Employee) => (
                <div key={emp.id} className="p-4 space-y-4 active:bg-gray-50 transition-colors">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs">
                          {(emp.full_name || emp.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-navy">{emp.full_name}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{emp.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={emp.status} t={t} />
                   </div>

                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t('dashboard.employees.columns.department')}</p>
                        <p className="text-xs font-bold text-navy truncate">{emp.department_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Anketler</p>
                        <p className="text-xs font-black text-navy">{emp.survey_count}</p>
                      </div>
                   </div>

                   <div className="pt-2 flex justify-between items-center border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{emp.position}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-navy bg-navy/5" onClick={() => handleEditClick(emp)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-primary bg-primary/5" onClick={() => { setSelectedEmployee(emp); setIsResendModalOpen(true); }}>
                          <RefreshCcw size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" className={emp.is_active ? "p-2 h-8 w-8 rounded-lg text-danger bg-danger/5" : "p-2 h-8 w-8 rounded-lg text-green-600 bg-green-50"} onClick={() => { setSelectedEmployee(emp); setIsStatusModalOpen(true); }}>
                          {emp.is_active ? <UserMinus size={14} /> : <UserCheck size={14} />}
                        </Button>
                        <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-lg text-red-500 bg-red-50" onClick={() => setDeleteTarget(emp)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title={t('dashboard.employees.invite_modal.title')}>
        <form onSubmit={inviteForm.handleSubmit(v => inviteMutation.mutate(v))} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.full_name')}*</label>
            <input {...inviteForm.register('full_name')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            {inviteForm.formState.errors.full_name && <p className="text-danger text-[10px] font-bold mt-1">{inviteForm.formState.errors.full_name.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.email')}*</label>
            <input {...inviteForm.register('email')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            {inviteForm.formState.errors.email && <p className="text-danger text-[10px] font-bold mt-1">{inviteForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.department')}*</label>
            <select {...inviteForm.register('department_id')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10">
              <option value="">{t('common.select')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.position')}</label>
            <input {...inviteForm.register('position')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={inviteMutation.isPending} className="flex-1" type="submit">{t('dashboard.employees.invite_modal.submit')}</Button>
          </div>
        </form>
      </Modal>

      {/* CSV Modal */}
      <Modal isOpen={isCsvModalOpen} onClose={() => { setIsCsvModalOpen(false); setCsvStep(1); setCsvResults(null); }} title={t('dashboard.employees.invite_csv')}>
        <div className="space-y-8">
          {/* Steps indicator */}
          <div className="flex justify-between relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
            {[1, 2, 3].map(step => (
              <div key={step} className={`relative h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${csvStep >= step ? 'bg-primary text-white' : 'bg-white border border-gray-100 text-gray-300'}`}>
                {step}
              </div>
            ))}
          </div>

          {csvStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <FileText size={32} />
              </div>
              <div>
                <h4 className="font-bold text-navy">{t('dashboard.employees.csv_modal.step1_title')}</h4>
                <p className="text-xs text-gray-500 mt-2">{t('dashboard.employees.csv_modal.step1_desc')}</p>
              </div>
              <Button variant="ghost" className="flex gap-2 mx-auto border border-gray-100" onClick={downloadTemplate}>
                <Download size={16} />
                {t('dashboard.employees.csv_modal.download_template')}
              </Button>
              <Button className="w-full" onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = '';
                fileInputRef.current?.click();
              }}>
                <Upload size={16} className="mr-2" />
                CSV Dosyası Seç
              </Button>
            </div>
          )}

          {csvStep === 2 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="animate-spin" size={32} />
              </div>
              <div>
                <h4 className="font-bold text-navy">{t('dashboard.employees.csv_modal.step2_title')}</h4>
                <p className="text-xs text-gray-500 mt-2">Dosya yükleniyor ve işleniyor...</p>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {csvStep === 3 && csvResults && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle2 className="text-green-500 mx-auto mb-2" size={48} />
                <h4 className="font-bold text-navy">{t('dashboard.employees.csv_modal.success_count', { count: csvResults.success_count })}</h4>
                {csvResults.error_count > 0 && (
                   <p className="text-sm text-danger font-bold mt-1">{t('dashboard.employees.csv_modal.error_count', { count: csvResults.error_count })}</p>
                )}
              </div>
              
              {csvResults.errors?.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2">Satır</th>
                        <th className="p-2">E-posta</th>
                        <th className="p-2">Hata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {csvResults.errors.map((err: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-bold">{err.row}</td>
                          <td className="p-2">{err.email}</td>
                          <td className="p-2 text-danger">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <Button className="w-full" onClick={() => { setIsCsvModalOpen(false); setCsvStep(1); setCsvResults(null); }}>{t('common.close')}</Button>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCsvUpload} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      </Modal>

      {/* Edit Modal (Summary same as Invite) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('dashboard.employees.actions.edit')}>
        <form 
          onSubmit={editForm.handleSubmit((v) => updateMutation.mutate(v))} 
          className="grid grid-cols-2 gap-4"
        >
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.full_name')}*</label>
            <input {...editForm.register('full_name')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.email')}*</label>
            <input {...editForm.register('email')} readOnly className="w-full bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.department')}*</label>
            <select {...editForm.register('department_id')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10">
              <option value="">{t('common.select')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('dashboard.employees.invite_modal.position')}</label>
            <input {...editForm.register('position')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2 flex gap-3 mt-4">
            <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              loading={updateMutation.isPending} 
              className="flex-1" 
              type="submit"
            >
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modals (Resend/Status/All) */}
      <Modal 
        isOpen={isAllSurveyModalOpen} 
        onClose={() => setIsAllSurveyModalOpen(false)} 
        title="Tüm Çalışanlara Anket Gönder"
      >
        <div className="space-y-6">
          <div className="h-16 w-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
            <Mail size={32} />
          </div>
          <p className="text-sm text-center text-gray-500">
            Sistemdeki tüm hesapsız çalışanlara anket daveti gönderilecek.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Gönderilecek Anket</label>
              <select 
                id="all-survey-id"
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {surveys.map(s => <option key={s.id} value={s.id}>{s.title || s.title_tr || 'İsimsiz Anket'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dönem</label>
              <input 
                id="all-period"
                type="month" 
                defaultValue={new Date().toISOString().slice(0, 7)}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsAllSurveyModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              className="flex-1" 
              onClick={() => {
                const survey_id = (document.getElementById('all-survey-id') as HTMLSelectElement).value;
                const period = (document.getElementById('all-period') as HTMLInputElement).value;
                toast.success('Toplu gönderim başlatıldı...');
                client.post('/hr/employees-no-account/send-survey/all', { survey_id, period })
                  .then(() => {
                    toast.success('Tüm çalışanlara anket gönderildi');
                    setIsAllSurveyModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['employees'] });
                  })
                  .catch((err) => toast.error(err.response?.data?.message || 'Gönderim sırasında hata oluştu'));
              }}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isResendModalOpen} 
        onClose={() => setIsResendModalOpen(false)} 
        title={t('dashboard.employees.actions.resend')}
      >
        <div className="space-y-6">
          <div className="h-16 w-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
            <RefreshCcw size={32} />
          </div>
          <p className="text-sm text-center text-gray-500">
            <strong>{selectedEmployee?.full_name}</strong> isimli çalışana yeni bir davet linki gönderilecek.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Gönderilecek Anket</label>
              <select 
                id="resend-survey-id"
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {surveys.map(s => <option key={s.id} value={s.id}>{s.title || s.title_tr || 'İsimsiz Anket'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dönem</label>
              <input 
                id="resend-period"
                type="month" 
                defaultValue={new Date().toISOString().slice(0, 7)}
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsResendModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              loading={resendInviteMutation.isPending} 
              className="flex-1" 
              onClick={() => {
                const survey_id = (document.getElementById('resend-survey-id') as HTMLSelectElement).value;
                const period = (document.getElementById('resend-period') as HTMLInputElement).value;
                resendInviteMutation.mutate({ survey_id, period });
              }}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        title={selectedEmployee?.is_active ? t('dashboard.employees.actions.deactivate') : t('dashboard.employees.actions.activate')}
      >
        <div className="text-center space-y-6">
          <div className={`h-16 w-16 ${selectedEmployee?.is_active ? 'bg-danger/5 text-danger' : 'bg-green-50 text-green-500'} rounded-full flex items-center justify-center mx-auto`}>
            {selectedEmployee?.is_active ? <UserMinus size={32} /> : <UserCheck size={32} />}
          </div>
          <p className="text-sm text-gray-500">
            <strong>{selectedEmployee?.full_name}</strong> isimli çalışanın hesabını {selectedEmployee?.is_active ? 'devre dışı bırakmak' : 'aktifleştirmek'} istediğinize emin misiniz?
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsStatusModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              variant={selectedEmployee?.is_active ? "danger" : "primary"}
              loading={updateStatusMutation.isPending} 
              className="flex-1" 
              onClick={() => updateStatusMutation.mutate(!selectedEmployee?.is_active)}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Targeted Survey Modal */}
      <Modal
        isOpen={isTargetedSurveyModalOpen}
        onClose={() => setIsTargetedSurveyModalOpen(false)}
        title="Anket Gönder"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
            <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm flex-shrink-0">
              {selectedEmployee?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-navy">{selectedEmployee?.full_name}</p>
              <p className="text-xs text-gray-400">{selectedEmployee?.email}</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            <strong>Anonim veri:</strong> Çalışanın yanıtları bireysel olarak görüntülenemez,
            yalnızca departman/şirket ortalamaları raporlara yansır.
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">Gönderilecek Anket</label>
              <select
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={targetedSurveyId}
                onChange={e => setTargetedSurveyId(e.target.value)}
              >
                <option value="">-- Anket seçin --</option>
                {surveys.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.title || s.title_tr || 'İsimsiz Anket'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsTargetedSurveyModalOpen(false)}>İptal</Button>
            <Button
              className="flex-1 gap-2"
              loading={targetedSurveyMutation.isPending}
              disabled={!targetedSurveyId}
              onClick={() => {
                if (selectedEmployee && targetedSurveyId) {
                  targetedSurveyMutation.mutate({
                    survey_id: targetedSurveyId,
                    employee_id: selectedEmployee.id,
                  });
                }
              }}
            >
              <Send size={16} /> Gönder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hard Delete Onay Modalı */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Çalışanı Kalıcı Sil">
        <div className="space-y-5">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto">
            <Trash2 size={26} className="text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <p className="font-semibold text-navy">{deleteTarget?.full_name}</p>
            <p className="text-sm text-gray-500">{deleteTarget?.email}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
            <strong>Bu işlem geri alınamaz.</strong> Çalışan kalıcı olarak silinecek.
            Doldurduğu anket yanıtları anonim olarak saklanmaya devam edecek ve skor hesaplarını etkilemeyecek.
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white border-0"
              loading={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Evet, kalıcı sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string, t: any }) {
  switch (status) {
    case 'active':
      return <Badge variant="green" size="md">{t('dashboard.employees.invite_status.active')}</Badge>;
    case 'invited':
      return <Badge variant="yellow" size="md">{t('dashboard.employees.invite_status.invited')}</Badge>;
    case 'token_sent':
      return <Badge variant="blue" size="md">{t('dashboard.employees.invite_status.token_sent')}</Badge>;
    case 'expired':
      return <Badge variant="red" size="md">{t('dashboard.employees.invite_status.expired')}</Badge>;
    default:
      return <Badge variant="gray" size="md">BİLİNMİYOR</Badge>;
  }
}

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
  Loader2
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
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  department_id: z.string().min(1, 'Departman seçiniz'),
  position: z.string().optional(),
  location: z.string().optional(),
  seniority: z.string().optional(),
  age_group: z.string().optional(),
  gender: z.string().optional(),
  start_date: z.string().optional(),
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
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // CSV Upload state
  const [csvStep, setCsvStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvResults, setCsvResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: employeesData, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees', searchTerm, deptFilter, statusFilter],
    queryFn: async () => {
      const res = await client.get('/hr/employees', {
        params: {
          search: searchTerm,
          department_id: deptFilter,
          status: statusFilter,
        }
      });
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
    mutationFn: (data: InviteFormValues) => client.post('/hr/employees/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(t('employees.invite_modal.success', 'Davet gönderildi'));
      setIsInviteModalOpen(false);
    },
    onError: (err: any) => {
      if (err.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        toast.error(t('employees.errors.email_exists', 'Bu e-posta zaten kayıtlı'));
      } else {
        toast.error(err.response?.data?.message || 'Bir hata oluştu');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: InviteFormValues) => client.put(`/hr/employees/${selectedEmployee?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(t('common:saved', 'Çalışan güncellendi'));
      setIsEditModalOpen(false);
    }
  });

  const resendInviteMutation = useMutation({
    mutationFn: () => client.post(`/hr/employees/${selectedEmployee?.id}/resend-invite`),
    onSuccess: () => {
      toast.success(t('employees.actions.resend_success', 'Yeni davet gönderildi'));
      setIsResendModalOpen(false);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (is_active: boolean) => 
      client.patch(`/hr/employees/${selectedEmployee?.id}/status`, { is_active }),
    onSuccess: (_, is_active) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(is_active ? t('employees.actions.activated', 'Çalışan aktifleştirildi') : t('employees.actions.deactivated', 'Çalışan devre dışı bırakıldı'));
      setIsStatusModalOpen(false);
    }
  });

  const confirmUploadMutation = useMutation({
    mutationFn: (s3_key: string) => client.post('/uploads/confirm', { s3_key, context: 'csv' }),
    onSuccess: (res) => {
      setCsvResults(res.data);
      setCsvStep(3);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: () => {
      toast.error('Dosya işlenirken hata oluştu');
      setCsvStep(2);
    }
  });

  // Forms
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { language: 'tr' }
  });

  const editForm = useForm<InviteFormValues>({
    resolver: zodResolver(editSchema)
  });

  // Handlers
  const handleEditClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    // Fetch full data for editing
    client.get(`/hr/employees/${emp.id}`).then(res => {
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
      // 1. Get Presigned URL
      const { data } = await client.post('/uploads/presigned-url', {
        file_type: 'csv',
        mime_type: file.type,
        file_size: file.size,
        context: 'csv'
      });

      setUploadProgress(30);

      // 2. Upload to S3
      await axios.put(data.url, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(30 + (percent * 0.4)); // 30-70 range
        }
      });

      setUploadProgress(80);

      // 3. Confirm
      confirmUploadMutation.mutate(data.s3_key);
    } catch (err) {
      toast.error('Dosya yüklenemedi');
      setCsvStep(1);
    }
  };

  const employees = employeesData?.items || [];
  const meta = employeesData?.meta || { total: 0, page: 1, per_page: 20 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-navy">{t('employees.title')}</h1>
          <p className="text-sm text-gray-500">{t('employees.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button 
            variant="ghost" 
            className="flex-1 sm:flex-none flex gap-2 border border-gray-100 bg-white"
            onClick={() => {
              setCsvStep(1);
              setIsCsvModalOpen(true);
            }}
          >
            <Upload size={18} />
            <span className="hidden xs:inline">{t('employees.invite_csv')}</span>
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
            {t('employees.invite_single')}
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('employees.search_placeholder')}
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
              <option value="">{t('employees.filter_department')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select 
              className="w-full sm:w-40 bg-gray-50/50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold text-navy outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('employees.filter_status')}</option>
              <option value="active">{t('employees.invite_status.active')}</option>
              <option value="invited">{t('employees.invite_status.invited')}</option>
              <option value="expired">{t('employees.invite_status.expired')}</option>
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {/* Desktop Table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-4 px-4">{t('employees.columns.name')}</th>
                <th className="py-4 px-4">{t('employees.columns.department')} / {t('employees.columns.position')}</th>
                <th className="py-4 px-4 text-center">{t('employees.columns.invite_status')}</th>
                <th className="py-4 px-4 text-center">{t('employees.columns.survey_count')}</th>
                <th className="py-4 px-4 text-right">{t('employees.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employeesLoading ? (
                <tr><td colSpan={5} className="text-center py-20 text-gray-400 italic">{t('common:loading')}</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-20 text-gray-400 font-medium">{t('common:no_data')}</td></tr>
              ) : employees.map((emp: Employee) => (
                <tr key={emp.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs shadow-sm">
                        {emp.full_name.split(' ').map(n => n[0]).join('')}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
             {employeesLoading ? (
                <div className="py-12 text-center text-gray-400 italic">{t('common:loading')}</div>
             ) : employees.length === 0 ? (
                <div className="py-12 text-center text-gray-400">{t('common:no_data')}</div>
             ) : employees.map((emp: Employee) => (
                <div key={emp.id} className="p-4 space-y-4 active:bg-gray-50 transition-colors">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xs">
                          {emp.full_name.split(' ').map(n => n[0]).join('')}
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
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t('employees.columns.department')}</p>
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
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </Card>

      {/* Invite Modal */}
      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title={t('employees.invite_modal.title')}>
        <form onSubmit={inviteForm.handleSubmit(v => inviteMutation.mutate(v))} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.full_name')}*</label>
            <input {...inviteForm.register('full_name')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            {inviteForm.formState.errors.full_name && <p className="text-danger text-[10px] font-bold mt-1">{inviteForm.formState.errors.full_name.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.email')}*</label>
            <input {...inviteForm.register('email')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
            {inviteForm.formState.errors.email && <p className="text-danger text-[10px] font-bold mt-1">{inviteForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.department')}*</label>
            <select {...inviteForm.register('department_id')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10">
              <option value="">{t('common:select')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.position')}</label>
            <input {...inviteForm.register('position')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsInviteModalOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={inviteMutation.isPending} className="flex-1" type="submit">{t('employees.invite_modal.submit')}</Button>
          </div>
        </form>
      </Modal>

      {/* CSV Modal */}
      <Modal isOpen={isCsvModalOpen} onClose={() => setIsCsvModalOpen(false)} title={t('employees.invite_csv')}>
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
                <h4 className="font-bold text-navy">{t('employees.csv_modal.step1_title')}</h4>
                <p className="text-xs text-gray-500 mt-2">{t('employees.csv_modal.step1_desc')}</p>
              </div>
              <Button variant="ghost" className="flex gap-2 mx-auto border border-gray-100" onClick={downloadTemplate}>
                <Download size={16} />
                {t('employees.csv_modal.download_template')}
              </Button>
              <Button className="w-full" onClick={() => fileInputRef.current?.click()}>
                {t('common:next')}
              </Button>
            </div>
          )}

          {csvStep === 2 && (
            <div className="space-y-6 text-center">
              <div className="h-16 w-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mx-auto">
                <Loader2 className="animate-spin" size={32} />
              </div>
              <div>
                <h4 className="font-bold text-navy">{t('employees.csv_modal.step2_title')}</h4>
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
                <h4 className="font-bold text-navy">{t('employees.csv_modal.success_count', { count: csvResults.valid_count })}</h4>
                {csvResults.error_count > 0 && (
                   <p className="text-sm text-danger font-bold mt-1">{t('employees.csv_modal.error_count', { count: csvResults.error_count })}</p>
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
              
              <Button className="w-full" onClick={() => setIsCsvModalOpen(false)}>{t('common:close')}</Button>
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
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('employees.actions.edit')}>
        {/* Simplified for demo, same as invite form */}
        <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="grid grid-cols-2 gap-4">
           {/* Form fields same as invite */}
           <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.full_name')}*</label>
            <input {...editForm.register('full_name')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.email')}*</label>
            <input {...editForm.register('email')} disabled className="w-full bg-gray-100 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.department')}*</label>
            <select {...editForm.register('department_id')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10">
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">{t('employees.invite_modal.position')}</label>
            <input {...editForm.register('position')} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10" />
          </div>
          <div className="col-span-2 flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)}>{t('common:cancel')}</Button>
            <Button loading={updateMutation.isPending} className="flex-1" type="submit">{t('common:save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Modals (Resend/Status) */}
      <Modal 
        isOpen={isResendModalOpen} 
        onClose={() => setIsResendModalOpen(false)} 
        title={t('employees.actions.resend')}
      >
        <div className="text-center space-y-6">
          <div className="h-16 w-16 bg-primary/5 text-primary rounded-full flex items-center justify-center mx-auto">
            <RefreshCcw size={32} />
          </div>
          <p className="text-sm text-gray-500">
            <strong>{selectedEmployee?.full_name}</strong> isimli çalışana yeni bir davet linki gönderilecek. Onaylıyor musunuz?
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsResendModalOpen(false)}>{t('common:cancel')}</Button>
            <Button loading={resendInviteMutation.isPending} className="flex-1" onClick={() => resendInviteMutation.mutate()}>{t('common:confirm')}</Button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isStatusModalOpen} 
        onClose={() => setIsStatusModalOpen(false)} 
        title={selectedEmployee?.is_active ? t('employees.actions.deactivate') : t('employees.actions.activate')}
      >
        <div className="text-center space-y-6">
          <div className={`h-16 w-16 ${selectedEmployee?.is_active ? 'bg-danger/5 text-danger' : 'bg-green-50 text-green-500'} rounded-full flex items-center justify-center mx-auto`}>
            {selectedEmployee?.is_active ? <UserMinus size={32} /> : <UserCheck size={32} />}
          </div>
          <p className="text-sm text-gray-500">
            <strong>{selectedEmployee?.full_name}</strong> isimli çalışanın hesabını {selectedEmployee?.is_active ? 'devre dışı bırakmak' : 'aktifleştirmek'} istediğinize emin misiniz?
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsStatusModalOpen(false)}>{t('common:cancel')}</Button>
            <Button 
              variant={selectedEmployee?.is_active ? "danger" : "primary"}
              loading={updateStatusMutation.isPending} 
              className="flex-1" 
              onClick={() => updateStatusMutation.mutate(!selectedEmployee?.is_active)}
            >
              {t('common:confirm')}
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
      return <Badge variant="green" size="md">{t('employees.invite_status.active')}</Badge>;
    case 'invited':
      return <Badge variant="yellow" size="md">{t('employees.invite_status.invited')}</Badge>;
    case 'token_sent':
      return <Badge variant="blue" size="md">{t('employees.invite_status.token_sent')}</Badge>;
    case 'expired':
      return <Badge variant="red" size="md">{t('employees.invite_status.expired')}</Badge>;
    default:
      return <Badge variant="gray" size="md">BİLİNMİYOR</Badge>;
  }
}

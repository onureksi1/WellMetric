'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Edit2, 
  Users, 
  Trash2, 
  ArrowRightLeft,
  Search,
  MoreVertical,
  AlertCircle
} from 'lucide-react';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import '@/lib/i18n';

// Types
interface Department {
  id: string;
  name: string;
  users_count: number;
  created_at: string;
}

export default function ManageDepartmentsPage() {
  const { t } = useTranslation(['dashboard', 'common']);
  
  // Validation Schemas (Inside component to use t)
  const departmentSchema = z.object({
    name: z.string().min(2, t('errors.min_length', { min: 2, defaultValue: 'En az 2 karakter olmalıdır' }))
                   .max(150, t('errors.max_length', { max: 150, defaultValue: 'En fazla 150 karakter olabilir' })),
  });

  const moveUsersSchema = z.object({
    target_department_id: z.string().min(1, t('common.select', 'Lütfen seçim yapın')),
  });

  type DepartmentFormValues = z.infer<typeof departmentSchema>;
  type MoveUsersFormValues = z.infer<typeof moveUsersSchema>;

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Queries
  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await client.get('/hr/departments');
      return res.data;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: DepartmentFormValues) => client.post('/hr/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.manage.created', 'Departman oluşturuldu'));
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('departments.manage.create_error', 'Bu departman adı zaten var'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: DepartmentFormValues) => 
      client.put(`/hr/departments/${selectedDept?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.manage.updated', 'Departman güncellendi'));
      setIsEditModalOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => client.delete(`/hr/departments/${selectedDept?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.manage.deleted', 'Departman silindi'));
      setIsDeleteModalOpen(false);
    },
  });

  const moveUsersMutation = useMutation({
    mutationFn: (data: MoveUsersFormValues) => 
      client.post(`/hr/departments/${selectedDept?.id}/move-users`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success(t('departments.manage.users_moved', 'Çalışanlar taşındı'));
      setIsMoveModalOpen(false);
    },
  });

  // Forms
  const createForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '' },
  });

  const editForm = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
  });

  const moveForm = useForm<MoveUsersFormValues>({
    resolver: zodResolver(moveUsersSchema),
  });

  // Handlers
  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept);
    editForm.reset({ name: dept.name });
    setIsEditModalOpen(true);
  };

  const handleMoveClick = (dept: Department) => {
    setSelectedDept(dept);
    moveForm.reset({ target_department_id: '' });
    setIsMoveModalOpen(true);
  };

  const handleDeleteClick = async (dept: Department) => {
    setSelectedDept(dept);
    // Check if department has employees
    try {
      const res = await client.get(`/hr/employees?department_id=${dept.id}`);
      const count = res.data.meta?.total || res.data.length || 0;
      if (count > 0) {
        setSelectedDept({ ...dept, users_count: count });
        setIsDeleteModalOpen(true);
      } else {
        setIsDeleteModalOpen(true);
      }
    } catch (err) {
      toast.error(t('departments.manage.info_error', 'Departman bilgisi alınamadı'));
    }

  };

  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('departments.manage.title', 'Departman Yönetimi')}</h1>
          <p className="text-sm text-gray-500">{t('departments.manage.subtitle', 'Şirket yapısını ve departmanları yönetin.')}</p>
        </div>
        <Button 
          onClick={() => {
            createForm.reset();
            setIsCreateModalOpen(true);
          }}
          className="flex gap-2"
        >
          <Plus size={18} />
          {t('departments.manage.new', 'Yeni Departman')}
        </Button>
      </div>

      <Card>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('departments.manage.search', 'Departman ara...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">{t('common.loading', 'Yükleniyor...')}</div>
        ) : filteredDepts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {searchTerm ? t('departments.manage.no_results', 'Aramanızla eşleşen departman bulunamadı.') : t('departments.manage.empty', 'Henüz departman eklenmemiş.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepts.map((dept) => (
              <div 
                key={dept.id} 
                className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy group-hover:text-primary transition-colors">{dept.name}</h3>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-1">
                      <Users size={14} />
                      {dept.users_count} {t('common.employees', 'Çalışan')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-[11px] font-bold gap-1.5 border border-gray-100"
                    onClick={() => handleEditClick(dept)}
                  >
                    <Edit2 size={14} />
                    {t('common.edit', 'Düzenle')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 text-[11px] font-bold gap-1.5 border border-gray-100"
                    onClick={() => handleMoveClick(dept)}
                  >
                    <ArrowRightLeft size={14} />
                    {t('departments.manage.move_users', 'Çalışan Taşı')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 text-gray-400 hover:text-danger hover:bg-danger/5 border border-gray-100"
                    onClick={() => handleDeleteClick(dept)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title={t('departments.manage.new', 'Yeni Departman')}
      >
        <form onSubmit={createForm.handleSubmit(v => createMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              {t('departments.manage.dept_name', 'Departman Adı')}*
            </label>
            <input
              {...createForm.register('name')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10"
              placeholder={t('departments.manage.name_placeholder', 'Örn: Pazarlama')}
            />

            {createForm.formState.errors.name && (
              <p className="text-[10px] text-danger font-bold mt-1">{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsCreateModalOpen(false)}>
              {t('common.cancel', 'İptal')}
            </Button>
            <Button loading={createMutation.isPending} className="flex-1" type="submit">
              {t('common.create', 'Oluştur')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title={t('departments.manage.edit_title', 'Departmanı Düzenle')}
      >
        <form onSubmit={editForm.handleSubmit(v => updateMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              {t('departments.manage.dept_name', 'Departman Adı')}*
            </label>
            <input
              {...editForm.register('name')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
            {editForm.formState.errors.name && (
              <p className="text-[10px] text-danger font-bold mt-1">{editForm.formState.errors.name.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel', 'İptal')}
            </Button>
            <Button loading={updateMutation.isPending} className="flex-1" type="submit">
              {t('common.save', 'Kaydet')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Move Users Modal */}
      <Modal 
        isOpen={isMoveModalOpen} 
        onClose={() => setIsMoveModalOpen(false)} 
        title={t('departments.manage.move_users', 'Çalışan Taşı')}
      >
        <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-xl text-xs text-primary font-medium leading-relaxed">
          {t('departments.manage.move_hint', '{{dept_name}} departmanındaki tüm çalışanlar taşınacak.', { dept_name: selectedDept?.name })}
        </div>
        <form onSubmit={moveForm.handleSubmit(v => moveUsersMutation.mutate(v))} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
              {t('departments.manage.target_dept', 'Hedef Departman')}*
            </label>
            <select
              {...moveForm.register('target_department_id')}
              className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/10"
            >
              <option value="">{t('common.select', 'Seçiniz')}</option>
              {departments.filter(d => d.id !== selectedDept?.id).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {moveForm.formState.errors.target_department_id && (
              <p className="text-[10px] text-danger font-bold mt-1">{moveForm.formState.errors.target_department_id.message}</p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsMoveModalOpen(false)}>
              {t('common.cancel', 'İptal')}
            </Button>
            <Button loading={moveUsersMutation.isPending} className="flex-1" type="submit">
              {t('departments.manage.move_action', 'Taşı')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title={t('departments.manage.delete_title', 'Departmanı Sil')}
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-navy">
              {selectedDept?.users_count && selectedDept.users_count > 0 
                ? t('departments.manage.delete_warning_title', 'Departman Silinemez')
                : t('departments.manage.delete_confirm_title', 'Silmek istediğinize emin misiniz?')}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {selectedDept?.users_count && selectedDept.users_count > 0 
                ? t('departments.manage.delete_warning_desc', 'Bu departmanda {{count}} çalışan var. Silmeden önce çalışanları taşıyın.', { count: selectedDept.users_count })
                : t('departments.manage.delete_confirm_desc', '{{name}} departmanını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.', { name: selectedDept?.name })}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1 font-bold" onClick={() => setIsDeleteModalOpen(false)}>
              {t('common.cancel', 'İptal')}
            </Button>
            {selectedDept?.users_count && selectedDept.users_count > 0 ? (
              <Button 
                className="flex-1" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setIsMoveModalOpen(true);
                }}
              >
                {t('departments.manage.move_users', 'Çalışanları Taşı')}
              </Button>
            ) : (
              <Button 
                variant="danger" 
                className="flex-1" 
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {t('common.delete', 'Sil')}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

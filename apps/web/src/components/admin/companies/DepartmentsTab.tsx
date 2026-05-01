'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import client from '@/lib/api/client';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DepartmentsTabProps {
  companyId: string;
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ companyId }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/admin/companies/${companyId}/departments`);
      setDepartments(res.data.data || res.data || []);
    } catch (err) {
      toast.error('Departmanlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingDept) {
        await client.put(`/admin/companies/${companyId}/departments/${editingDept.id}`, { name });
        toast.success('Departman güncellendi.');
      } else {
        await client.post(`/admin/companies/${companyId}/departments`, { name });
        toast.success('Departman oluşturuldu.');
      }
      setIsModalOpen(false);
      setName('');
      setEditingDept(null);
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (dept: any) => {
    if (dept.user_count > 0) {
      toast.error(`${dept.user_count} çalışan bu departmanda. Önce çalışanları başka departmana taşıyın.`);
      return;
    }

    if (!confirm('Bu departmanı silmek istediğinize emin misiniz?')) return;
    try {
      await client.delete(`/admin/companies/${companyId}/departments/${dept.id}`);
      toast.success('Departman silindi.');
      fetchDepartments();
    } catch (err) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-navy">Departmanlar</h3>
        <Button onClick={() => { setEditingDept(null); setName(''); setIsModalOpen(true); }} className="gap-2">
          <Plus size={18} /> Departman Ekle
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl" />)}
        </div>
      ) : departments.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          Henüz departman eklenmemiş.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="group relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-navy text-lg">{dept.name}</h4>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Users size={14} />
                    <span>{dept.user_count} Çalışan</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-primary" onClick={() => { setEditingDept(dept); setName(dept.name); setIsModalOpen(true); }}>
                      <Edit2 size={14} />
                   </Button>
                   <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-danger" onClick={() => handleDelete(dept)}>
                      <Trash2 size={14} />
                   </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Departmanı Düzenle' : 'Yeni Departman Ekle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Departman Adı</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={150}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="örn: Pazarlama"
            />
          </div>
          <div className="pt-4 flex gap-3">
             <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>İptal</Button>
             <Button className="flex-1" type="submit" loading={isSubmitting}>
                {editingDept ? 'Güncelle' : 'Oluştur'}
             </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import client from '@/lib/api/client';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Trash2, 
  Edit2, 
  Shield, 
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface UsersTabProps {
  companyId: string;
  departments: any[];
  filterRole?: 'hr_admin' | 'employee';
}

export const UsersTab: React.FC<UsersTabProps> = ({ companyId, departments, filterRole }) => {
  const { t } = useTranslation('admin');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    is_active: '',
    department_id: ''
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importStep, setImportStep] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<{ success: number, errors: any[] } | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'employee',
    department_id: '',
    language: 'tr'
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const activeFilters = { ...filters };
      if (filterRole) activeFilters.role = filterRole;
      const query = new URLSearchParams(activeFilters as any).toString();
      const res = await client.get(`/admin/companies/${companyId}/users?${query}`);
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Kullanıcılar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId, filters]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await client.post(`/admin/companies/${companyId}/users`, formData);
      toast.success('Kullanıcı eklendi ve davet gönderildi.');
      setIsAddModalOpen(false);
      setFormData({ email: '', full_name: '', role: 'employee', department_id: '', language: 'tr' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kullanıcı eklenemedi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await client.patch(`/admin/companies/${companyId}/users/${editingUser.id}`, formData);
      toast.success('Kullanıcı güncellendi.');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = !user.is_active;
    try {
      await client.patch(`/admin/companies/${companyId}/users/${user.id}/status`, { is_active: newStatus });
      toast.success(newStatus ? 'Kullanıcı aktifleştirildi.' : 'Kullanıcı pasif yapıldı.');
      fetchUsers();
    } catch (err) {
      toast.error('İşlem başarısız.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('DİKKAT: Kullanıcıyı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await client.delete(`/admin/companies/${companyId}/users/${userId}`);
      toast.success('Kullanıcı tamamen silindi.');
      fetchUsers();
    } catch (err) {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const handleResendInvite = async (userId: string) => {
    try {
      setIsSubmitting(true);
      await client.post(`/admin/companies/${companyId}/users/${userId}/resend-invite`);
      toast.success('Davet e-postası tekrar gönderildi.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İşlem başarısız.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`${selectedUsers.length} kullanıcıyı silmek istediğinize emin misiniz?`)) return;
    try {
      await client.post(`/admin/companies/${companyId}/users/bulk-delete`, { user_ids: selectedUsers });
      toast.success(`${selectedUsers.length} kullanıcı silindi.`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (err) {
      toast.error('Toplu silme başarısız.');
    }
  };

  const handleImport = async () => {
    setIsSubmitting(true);
    try {
      const res = await client.post(`/admin/companies/${companyId}/users/import`, { users: importPreview });
      setImportResults({
        success: res.data.success_count,
        errors: res.data.errors || []
      });
      setImportStep(4);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'İçe aktarma başarısız.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      // Detect delimiter and clean BOM
      const firstLine = lines[0].replace(/^\uFEFF/, '');
      const semiCount = (firstLine.match(/;/g) || []).length;
      const commaCount = (firstLine.match(/,/g) || []).length;
      const delimiter = semiCount > commaCount ? ';' : ',';
      
      const rawHeaders = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
      
      const parsed = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const rawRow: any = {};
          rawHeaders.forEach((h, i) => {
            rawRow[h] = values[i];
          });

          // Flexible mapping
          return {
            email: rawRow.email || rawRow['e-posta'] || rawRow['eposta'] || rawRow['mail'],
            full_name: rawRow.full_name || rawRow['ad soyad'] || rawRow['isim'] || rawRow['ad_soyad'],
            role: rawRow.role || rawRow['rol'] || 'employee',
            department_name: rawRow.department_name || rawRow['departman'] || rawRow['bolum'] || rawRow['department'],
            position: rawRow.position || rawRow['pozisyon'] || rawRow['unvan'] || rawRow['gorev'],
            location: rawRow.location || rawRow['lokasyon'] || rawRow['konum'],
            seniority: rawRow.seniority || rawRow['kıdem'] || rawRow['kidem'],
            age_group: rawRow.age_group || rawRow['yas_grubu'] || rawRow['yaş grubu'],
            gender: rawRow.gender || rawRow['cinsiyet'],
            start_date: rawRow.start_date || rawRow['baslangic_tarihi'] || rawRow['başlangıç tarihi'],
            language: rawRow.language || rawRow['dil'] || 'tr'
          };
        });
      
      setImportPreview(parsed);
      setImportStep(3);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers = 'email,full_name,role,department_name,position,location,seniority,age_group,gender,start_date,language';
    const example = 'ali@firma.com,Ali Yılmaz,employee,Yazılım,Backend Developer,İstanbul,senior,26-35,male,2023-01-15,tr';
    const csvContent = `${headers}\n${example}`;
    // Add BOM for Excel UTF-8 compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'wellbeing_metric_user_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('companies.user_search_placeholder', 'İsim veya e-posta ile ara...')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.role}
            onChange={e => setFilters({...filters, role: e.target.value})}
          >
            <option value="">Tüm Roller</option>
            <option value="hr_admin">HR Admin</option>
            <option value="employee">Çalışan</option>
          </select>
          <select 
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            value={filters.department_id}
            onChange={e => setFilters({...filters, department_id: e.target.value})}
          >
            <option value="">Tüm Departmanlar</option>
            {departments?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <Button variant="ghost" className="flex-1 md:flex-none gap-2" onClick={() => setIsImportModalOpen(true)}>
              <Download size={18} className="rotate-180" /> İçe Aktar
           </Button>
           <Button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none gap-2">
              <UserPlus size={18} /> Kullanıcı Ekle
           </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <p className="text-sm font-medium text-primary">
            {selectedUsers.length} kullanıcı seçildi
          </p>
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="text-danger hover:bg-danger/10" onClick={handleBulkDelete}>
                <Trash2 size={16} className="mr-2" /> Toplu Sil
             </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-6 w-10">
                   <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={() => setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id))}
                   />
                </th>
                <th className="py-4 px-4">Ad Soyad / E-posta</th>
                <th className="py-4 px-4">Rol</th>
                <th className="py-4 px-4">Departman</th>
                <th className="py-4 px-4">Durum</th>
                <th className="py-4 px-4">Son Giriş</th>
                <th className="py-4 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20 text-gray-400">Yükleniyor...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-20 text-gray-400">Kullanıcı bulunamadı.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-navy">{user.full_name}</span>
                        <span className="text-xs text-gray-400">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={user.role === 'hr_admin' ? 'purple' : 'blue'} className="text-[10px] font-bold">
                        {user.role === 'hr_admin' ? 'HR ADMIN' : 'ÇALIŞAN'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-600 font-medium">{user.department_name || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-1.5">
                          {user.is_active ? (
                            <CheckCircle2 size={14} className="text-green-500" />
                          ) : (
                            <XCircle size={14} className="text-gray-300" />
                          )}
                          <span className={`text-xs font-semibold ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {user.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                       </div>
                    </td>
                    <td className="py-4 px-4">
                       <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Clock size={12} />
                          {user.last_login_at 
                            ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true, locale: tr })
                            : 'Henüz girmedi'}
                       </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!user.has_password && !user.last_login_at && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="p-2 text-warning hover:text-warning/80" 
                              title="Davet Yenile"
                              onClick={() => handleResendInvite(user.id)}
                            >
                               <Mail size={14} />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`p-2 ${user.is_active ? 'text-gray-400 hover:text-warning' : 'text-gray-400 hover:text-green-500'}`}
                            title={user.is_active ? 'Pasife Al' : 'Aktifleştir'}
                            onClick={() => handleToggleStatus(user)}
                          >
                             {user.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-2 text-gray-400 hover:text-primary"
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                email: user.email,
                                full_name: user.full_name,
                                role: user.role,
                                department_id: user.department_id || '',
                                language: user.language || 'tr'
                              });
                              setIsEditModalOpen(true);
                            }}
                          >
                             <Edit2 size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-2 text-gray-400 hover:text-danger" onClick={() => handleDeleteUser(user.id)}>
                             <Trash2 size={14} />
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Yeni Kullanıcı Ekle"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Ad Soyad</label>
            <input 
              type="text" required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
              placeholder="örn: Ali Yılmaz"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">E-posta</label>
            <input 
              type="email" required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="ali@sirket.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Rol</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as any})}
              >
                <option value="employee">Çalışan</option>
                <option value="hr_admin">HR Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Dil</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value})}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Departman</label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.department_id}
              onChange={e => setFormData({...formData, department_id: e.target.value})}
            >
              <option value="">Departman Seçin...</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex gap-3">
             <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsAddModalOpen(false)}>İptal</Button>
             <Button className="flex-1" type="submit" loading={isSubmitting}>Ekle ve Davet Gönder</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Kullanıcıyı Düzenle"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Ad Soyad</label>
            <input 
              type="text" required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Rol</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as any})}
              >
                <option value="employee">Çalışan</option>
                <option value="hr_admin">HR Admin</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase">Dil</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value})}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase">Departman</label>
            <select 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={formData.department_id}
              onChange={e => setFormData({...formData, department_id: e.target.value})}
            >
              <option value="">Departman Seçin...</option>
              {departments?.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex gap-3">
             <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
             <Button className="flex-1" type="submit" loading={isSubmitting}>Güncelle</Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => { setIsImportModalOpen(false); setImportStep(1); setImportResults(null); }} 
        title={t('companies.import_modal.title')}
        maxWidth="xl"
      >
        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between px-4">
             {[1, 2, 3, 4].map(s => (
               <div key={s} className="flex items-center gap-2">
                 <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${importStep >= s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                   {s}
                 </div>
                 {s < 4 && <div className={`h-px w-12 ${importStep > s ? 'bg-primary' : 'bg-gray-100'}`} />}
               </div>
             ))}
          </div>

          {importStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                 <h4 className="font-bold text-navy mb-2">{t('companies.import_modal.step1_title')}</h4>
                 <p className="text-sm text-gray-500 leading-relaxed mb-4">
                    {t('companies.import_modal.step1_desc')}
                 </p>
                 <div className="bg-white p-3 rounded-lg border border-primary/20 text-[10px] text-primary font-bold leading-relaxed mb-4">
                    ℹ️ {t('companies.import_modal.format_info')}
                 </div>
                 <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-[10px] bg-white rounded-lg border border-gray-100">
                      <thead>
                        <tr className="bg-gray-50 text-gray-400">
                           <th className="p-2 border-b">email</th>
                           <th className="p-2 border-b">full_name</th>
                           <th className="p-2 border-b">role</th>
                           <th className="p-2 border-b">department_name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 border-b font-mono">test@firma.com</td>
                          <td className="p-2 border-b font-mono">Ali Yılmaz</td>
                          <td className="p-2 border-b font-mono">employee</td>
                          <td className="p-2 border-b font-mono">Yazılım</td>
                        </tr>
                      </tbody>
                    </table>
                 </div>
              </div>
              <div className="flex gap-3">
                 <Button variant="ghost" className="flex-1" onClick={() => setIsImportModalOpen(false)}>İptal</Button>
                 <Button className="flex-1 gap-2" onClick={downloadTemplate}>
                    <Download size={18} /> {t('dashboard.employees.csv_modal.download_template')}
                 </Button>
                 <Button className="flex-1" onClick={() => setImportStep(2)}>{t('common.next', 'Sonraki Adım')}</Button>
              </div>
            </div>
          )}

          {importStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="h-48 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-all relative group bg-gray-50/50">
                  <input type="file" accept=".csv" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileSelect} />
                  <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                     <Download size={32} className="rotate-180" />
                  </div>
                  <div className="text-center">
                     <p className="font-bold text-navy">CSV Dosyası Seçin</p>
                     <p className="text-xs text-gray-400 mt-1">Sürükleyip bırakabilir veya tıklayabilirsiniz (Max 10MB)</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setImportStep(1)}>Geri</Button>
               </div>
            </div>
          )}

          {importStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-navy">Önizleme ({importPreview.length} Kullanıcı)</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">İlk 5 Satır Gösteriliyor</p>
               </div>
               <div className="border border-gray-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                     <thead className="bg-gray-50">
                        <tr>
                           <th className="p-3 border-b">Email</th>
                           <th className="p-3 border-b">İsim</th>
                           <th className="p-3 border-b">Rol</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                        {importPreview.slice(0, 5).map((row, i) => (
                           <tr key={i}>
                              <td className="p-3">{row.email}</td>
                              <td className="p-3">{row.full_name}</td>
                              <td className="p-3"><Badge size="sm">{row.role}</Badge></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setImportStep(2)}>Geri</Button>
                  <Button className="flex-1" onClick={handleImport} loading={isSubmitting}>Yükle ve İşle</Button>
               </div>
            </div>
          )}

          {importStep === 4 && importResults && (
            <div className="space-y-6 animate-in fade-in zoom-in-95">
               <div className="text-center space-y-2">
                  <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-navy">İşlem Tamamlandı</h4>
                  <p className="text-sm text-gray-500">{importResults.success} kullanıcı başarıyla eklendi.</p>
               </div>

               {importResults.errors.length > 0 && (
                 <div className="space-y-3">
                    <p className="text-xs font-bold text-danger uppercase flex items-center gap-1">
                       <AlertCircle size={14} /> {importResults.errors.length} Hata Bulundu
                    </p>
                    <div className="max-h-48 overflow-y-auto border border-danger/10 rounded-xl bg-danger/5">
                       <table className="w-full text-[10px] text-left">
                          <thead className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm">
                             <tr>
                                <th className="p-2 border-b">Satır</th>
                                <th className="p-2 border-b">E-posta</th>
                                <th className="p-2 border-b text-danger">Hata Nedeni</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-danger/10">
                             {importResults.errors.map((err, i) => (
                                <tr key={i}>
                                   <td className="p-2">{err.row}</td>
                                   <td className="p-2">{err.email}</td>
                                   <td className="p-2 text-danger">{err.message}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
               )}

               <div className="flex gap-3 pt-4">
                  <Button className="w-full" onClick={() => { setIsImportModalOpen(false); setImportStep(1); }}>Kapat</Button>
               </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

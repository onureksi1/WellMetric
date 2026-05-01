'use client';

import React, { useState, useEffect } from 'react';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScoreCard } from '@/components/shared/ScoreCard';
import { 
  Building2, 
  Mail, 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard,
  ChevronLeft,
  Settings as SettingsIcon,
  PieChart,
  Bot,
  Layers,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Modal } from '@/components/ui/Modal';
import { IndustrySelect } from '@/components/shared/IndustrySelect';
import { AssignSurveyModal } from '@/components/surveys/AssignSurveyModal';
import { UsersTab } from '@/components/admin/companies/UsersTab';
import { useSearchParams, useRouter } from 'next/navigation';
import { DepartmentsTab } from '@/components/admin/companies/DepartmentsTab';
import { SurveysTab } from '@/components/admin/companies/SurveysTab';
import { InsightsTab } from '@/components/admin/companies/InsightsTab';
export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    const urlParams = new URLSearchParams(searchParams.toString());
    urlParams.set('tab', id);
    router.push(`/admin/companies/${params.id}?${urlParams.toString()}`);
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    plan: '',
    contact_email: '',
    industry: '',
    size_band: ''
  });
  const [consultants, setConsultants] = useState<any[]>([]);

  const fetchConsultants = async () => {
    try {
      const res = await client.get('/admin/consultants', { params: { limit: 100 } });
      setConsultants(res.data.data || []);
    } catch (err) {}
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await client.get(`/admin/companies/${params.id}`);
      const companyData = res.data.data || res.data;
      setData(companyData);
      
      // Initialize edit form
      if (companyData.company) {
        setEditFormData({
          name: companyData.company.name,
          plan: companyData.company.plan,
          contact_email: companyData.company.contact_email,
          industry: companyData.company.industry || '',
          size_band: companyData.company.size_band || '',
          consultant_id: companyData.company.consultant_id || ''
        } as any);
      }
      fetchConsultants();
    } catch (err) {
      console.error('Failed to fetch company', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const handleToggleStatus = async () => {
    if (!data?.company) return;
    try {
      setActionLoading(true);
      const newStatus = !data.company.is_active;
      await client.patch(`/admin/companies/${params.id}/status`, { is_active: newStatus });
      setData({
        ...data,
        company: { ...data.company, is_active: newStatus }
      });
    } catch (err) {
      alert('Durum güncellenirken bir hata oluştu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (data?.company?.users_count > 0) {
      if (confirm(`Bu firmada ${data.company.users_count} aktif kullanıcı var. Firmayı silmeden önce kullanıcıları silmeniz gerekiyor. Kullanıcıları yönetmek ister misiniz?`)) {
        handleTabChange('users');
      }
      return;
    }

    if (!window.confirm('Bu firmayı kalıcı olarak silmek istediğinize emin misiniz?')) return;
    
    try {
      setActionLoading(true);
      await client.delete(`/admin/companies/${params.id}`);
      window.location.href = '/admin/companies';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Firma silinirken bir hata oluştu.');
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await client.put(`/admin/companies/${params.id}`, editFormData);
      setIsEditModalOpen(false);
      fetchData(); // Reload
    } catch (err) {
      alert('Güncelleme başarısız.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-500">Yükleniyor...</div>;
  }

  if (!data || !data.company) {
    return <div className="flex justify-center py-20 text-red-500">Firma bulunamadı.</div>;
  }

  const { company, hr_admins, wellbeing_chart, scores } = data;
  
  const trendData = wellbeing_chart?.length > 0 
    ? wellbeing_chart.map((c: any) => ({ name: c.period, score: parseFloat(c.score) }))
    : [];

  const primaryHr = hr_admins && hr_admins.length > 0 ? hr_admins[0].email : company.contact_email;

  return (
    <div className="space-y-8">
      {/* Breadcrumb / Back */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/companies">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-navy">{company.name}</h1>
            <p className="text-sm text-gray-500">ID: {company.id}</p>
          </div>
        </div>
        <div className="md:ml-auto flex flex-wrap gap-2">
          <Button 
            variant="ghost" 
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={company.is_active ? 'text-warning' : 'text-green-600'}
          >
            {company.is_active ? 'Askıya Al' : 'Aktifleştir'}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={actionLoading}>Sil</Button>
          <Button onClick={() => setIsEditModalOpen(true)}>Düzenle</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Card */}
        <Card className="lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center pb-6 border-b border-gray-50">
            <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center text-3xl font-bold text-gray-400 uppercase mb-4">
              {company.name.substring(0, 2)}
            </div>
            <h2 className="text-xl font-bold text-navy">{company.name}</h2>
            <Badge variant={company.plan === 'enterprise' ? 'green' : 'blue'} className="mt-2 uppercase">
              {company.plan} PLAN
            </Badge>
          </div>

          <div className="py-6 space-y-4">
            <InfoRow icon={MapPin} label="Sektör" value={company.industry_label_tr || company.industry || '-'} />
            <InfoRow icon={Users} label="Çalışan Sayısı" value={company.size_band || '-'} />
            <InfoRow icon={Mail} label="İletişim / HR" value={primaryHr || '-'} />
            <InfoRow icon={Calendar} label="Kayıt Tarihi" value={new Date(company.created_at).toLocaleDateString('tr-TR')} />
          </div>

          <div className="pt-6 border-t border-gray-50">
            <Button variant="secondary" className="w-full">Plan Değiştir</Button>
          </div>
        </Card>

        {/* Overview / Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScoreCard label="Genel Skor" score={scores?.overall || null} />
            <ScoreCard label="Zihinsel" score={scores?.mental || null} />
            <ScoreCard label="Fiziksel" score={scores?.physical || null} />
          </div>

          {/* Trend Chart */}
          <Card title="Wellbeing Trendi (Son 12 Ay)">
            <div className="h-64">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2E865A" strokeWidth={3} dot={{ fill: '#2E865A', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Henüz analiz verisi bulunmuyor.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="space-y-6">
        <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <TabButton id="overview" label="Genel Bakış" active={activeTab === 'overview'} onClick={handleTabChange} />
          <TabButton id="departments" label="Departmanlar" active={activeTab === 'departments'} onClick={handleTabChange} />
          <TabButton id="users" label={`Kullanıcılar (${data?.company?.users_count || 0})`} active={activeTab === 'users'} onClick={handleTabChange} />
          <TabButton id="surveys" label="Anketler" active={activeTab === 'surveys'} onClick={handleTabChange} />
          <TabButton id="ai-insights" label="AI Insights" active={activeTab === 'ai-insights'} onClick={handleTabChange} />
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Firma Ayarları">
              <div className="space-y-6">
                <ToggleRow label="Çalışan Hesabı Modu" description="Çalışanlar platforma kendi şifreleri ile girsinler." defaultChecked />
                <SelectRow label="Varsayılan Dil" options={['Türkçe', 'İngilizce']} />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Anonimlik Eşiği</label>
                  <input type="range" min="3" max="20" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>3</span>
                    <span>En az 5 çalışan cevabı zorunlu</span>
                    <span>20</span>
                  </div>
                </div>
                <Button className="w-full">Değişiklikleri Kaydet</Button>
              </div>
            </Card>

            <Card title="Hızlı Aksiyonlar">
               <div className="grid grid-cols-2 gap-4">
                  <ActionButton icon={Users} label="Çalışan İçe Aktar" onClick={() => setActiveTab('users')} />
                  <ActionButton icon={Layers} label="Anket Ata" onClick={() => setIsAssignModalOpen(true)} />
                  <ActionButton icon={Bot} label="AI Analizi Başlat" />
                  <ActionButton icon={Mail} label="Tümüne Duyuru" />
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <UsersTab companyId={params.id} departments={data.departments || []} />
        )}

        {activeTab === 'departments' && (
          <DepartmentsTab companyId={params.id} />
        )}


        {activeTab === 'surveys' && (
          <SurveysTab companyId={params.id} />
        )}

        {activeTab === 'ai-insights' && (
          <InsightsTab companyId={params.id} />
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Firmayı Düzenle"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Firma Adı</label>
            <input 
              type="text" 
              required 
              value={editFormData.name}
              onChange={e => setEditFormData({...editFormData, name: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Plan</label>
              <select 
                value={editFormData.plan}
                onChange={e => setEditFormData({...editFormData, plan: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="enterprise">Enterprise</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Sektör</label>
              <IndustrySelect
                value={editFormData.industry}
                onChange={(val) => setEditFormData({ ...editFormData, industry: val || '' })}
                language="tr"
                placeholder="Sektör seçin"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">İletişim E-posta</label>
            <input 
              type="email" 
              required 
              value={editFormData.contact_email}
              onChange={e => setEditFormData({...editFormData, contact_email: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" 
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Çalışan Sayısı</label>
            <select 
              value={editFormData.size_band}
              onChange={e => setEditFormData({...editFormData, size_band: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="1-50">1 - 50</option>
              <option value="51-200">51 - 200</option>
              <option value="201-500">201 - 500</option>
              <option value="501+">501+</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Danışman / Eğitmen</label>
            <select 
              value={(editFormData as any).consultant_id}
              onChange={e => setEditFormData({...editFormData, consultant_id: e.target.value} as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Eğitmen Seçilmemiş</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>İptal</Button>
            <Button loading={actionLoading} type="submit">Güncelle</Button>
          </div>
        </form>
      </Modal>

      <AssignSurveyModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        initialCompanyId={params.id}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-none mb-1">{label}</p>
        <p className="text-sm font-medium text-navy leading-none">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ id, label, active, onClick }: { id: string, label: string, active: boolean, onClick: (id: string) => void }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-6 py-4 text-sm font-medium transition-all relative ${
        active ? 'text-primary' : 'text-gray-500 hover:text-navy'
      }`}
    >
      {label}
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
    </button>
  );
}

function ToggleRow({ label, description, defaultChecked }: { label: string, description: string, defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
         <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${defaultChecked ? 'translate-x-6 !bg-primary' : ''}`} />
      </div>
    </div>
  );
}

function SelectRow({ label, options }: { label: string, options: string[] }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20">
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all gap-2"
    >
      <Icon className="text-primary" size={20} />
      <span className="text-xs font-medium text-navy">{label}</span>
    </button>
  );
}

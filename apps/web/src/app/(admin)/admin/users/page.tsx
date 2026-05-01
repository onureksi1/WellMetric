'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  UserPlus, 
  Mail, 
  Power, 
  Trash2, 
  X, 
  Building2, 
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FilterX,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useApi } from '@/lib/hooks/use-api'
import client from '@/lib/api/client'
import { adminUsersApi } from '@/lib/api/users'
import '@/lib/i18n'

// Skeleton Loader Component
const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-100 rounded-lg" />
    ))}
  </div>
)

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation('admin')
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = i18n.language === 'tr' ? tr : enUS

  // ── STATE ──────────────────────────────────────────────────────────
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [filters, setFilters] = useState({
    company_id: searchParams.get('company_id') || '',
    role: searchParams.get('role') || '',
    is_active: searchParams.get('is_active') || '',
    search: searchParams.get('search') || ''
  })
  const [searchTerm, setSearchTerm] = useState(filters.search)

  // Selected User for Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Modals
  const [modals, setModals] = useState({
    create: false,
    edit: false,
    assign: false,
    delete: false,
    status: false
  })

  // Form State
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)

  // ── DATA FETCHING ──────────────────────────────────────────────────
  const { data: stats, refresh: refreshStats } = useApi('/admin/users/stats')
  const { data: usersData, loading: usersLoading, refresh: refreshUsers } = useApi('/admin/users', {
    params: { ...filters, page, per_page: 50 }
  })
  const { data: companies } = useApi('/admin/companies')
  const { data: userDetails, refresh: refreshDetails } = useApi(selectedUserId ? `/admin/users/${selectedUserId}` : '', {
    manual: !selectedUserId
  })

  // ── EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (filters.company_id) params.set('company_id', filters.company_id)
    if (filters.role) params.set('role', filters.role)
    if (filters.is_active) params.set('is_active', filters.is_active)
    if (filters.search) params.set('search', filters.search)
    
    router.replace(`/admin/users?${params.toString()}`)
  }, [page, filters, router])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
      setPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // ── HANDLERS ───────────────────────────────────────────────────────
  const handleOpenDrawer = (userId: string) => {
    setSelectedUserId(userId)
    setIsDrawerOpen(true)
  }

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedUserId(null)
  }

  const handleAction = async (action: string, id?: string, data?: any) => {
    setLoading(true)
    const targetId = id || selectedUserId
    try {
      switch (action) {
        case 'create':
          await adminUsersApi.create(data)
          toast.success(t('users.create.success'))
          setModals(m => ({ ...m, create: false }))
          break
        case 'update':
          await adminUsersApi.update(targetId!, data)
          toast.success(t('common:updated'))
          setModals(m => ({ ...m, edit: false }))
          break
        case 'assign':
          await adminUsersApi.assignCompany(targetId!, data)
          toast.success(t('users.assign.success'))
          setModals(m => ({ ...m, assign: false }))
          break
        case 'status':
          await adminUsersApi.updateStatus(targetId!, data.is_active)
          toast.success(t('common.updated'))
          setModals(m => ({ ...m, status: false }))
          break
        case 'resend':
          await adminUsersApi.resendInvite(targetId!)
          toast.success(t('users.actions.resend_invite_success') || 'Davet yeniden gönderildi')
          break
        case 'delete':
          await adminUsersApi.delete(targetId!)
          toast.success(t('users.delete.success'))
          setModals(m => ({ ...m, delete: false }))
          break
      }
      refreshUsers()
      refreshStats()
      if (selectedUserId) refreshDetails()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message
      if (errorMsg === 'USER_ALREADY_ACTIVATED' || errorMsg === 'Bu kullanıcı zaten kaydını tamamlamış.') {
        toast.error('Bu kullanıcı zaten aktif')
      } else {
        toast.error(errorMsg || t('common.error'))
      }
    } finally {
      setLoading(false)
    }
  }

  // ── HELPERS ────────────────────────────────────────────────────────
  const getStatusBadge = (user: any) => {
    if (!user.is_active) return <Badge variant="gray">{t('users.status.inactive')}</Badge>
    if (!user.password_hash) return <Badge variant="orange">{t('users.status.pending_invite')}</Badge>
    return <Badge variant="green">{t('users.status.active')}</Badge>
  }

  const timeAgo = (date: any) => {
    if (!date) return t('users.never_logged_in')
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: lang })
  }

  // ── RENDER ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('users.title')}</h1>
          <p className="text-sm text-gray-500">{t('users.subtitle')}</p>
        </div>
        <Button 
          className="w-full sm:w-auto gap-2 shadow-lg shadow-primary/20"
          onClick={() => {
            setFormData({ role: 'employee', language: 'tr' })
            setModals(m => ({ ...m, create: true }))
          }}
        >
          <Plus size={18} />
          {t('users.add')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<UsersIcon className="text-primary" />} 
          label={t('users.stats.total')} 
          value={stats?.total || 0} 
          subValue={`${stats?.by_role?.hr_admin || 0} HR | ${stats?.by_role?.employee || 0} ${t('users.stats.employees')}`}
        />
        <StatCard 
          icon={<CheckCircle2 className="text-green-500" />} 
          label={t('users.stats.active')} 
          value={stats?.active || 0} 
          subValue={`${t('users.stats.recent_login')}: ${stats?.login_last_30_days || 0}`}
        />
        <StatCard 
          icon={<UserX className="text-gray-400" />} 
          label={t('users.stats.inactive')} 
          value={stats?.inactive || 0} 
          subValue={`${t('users.stats.new_month')}: ${stats?.new_this_month || 0}`}
        />
        <StatCard 
          icon={<Clock className="text-amber-500" />} 
          label={t('users.stats.pending')} 
          value={stats?.pending_invite || 0} 
          highlight
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder={t('header.search_placeholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.company_id}
              onChange={(e) => setFilters(f => ({ ...f, company_id: e.target.value }))}
            >
              <option value="">{t('common:all_companies')}</option>
              {companies?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.role}
              onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
            >
              <option value="">{t('common:all_roles')}</option>
              <option value="hr_admin">HR Admin</option>
              <option value="employee">{t('users.stats.employees')}</option>
            </select>
            <select 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={filters.is_active}
              onChange={(e) => setFilters(f => ({ ...f, is_active: e.target.value }))}
            >
              <option value="">{t('common:all_statuses')}</option>
              <option value="true">{t('users.status.active')}</option>
              <option value="false">{t('users.status.inactive')}</option>
            </select>
            {(filters.company_id || filters.role || filters.is_active || filters.search) && (
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-danger" onClick={() => {
                setFilters({ company_id: '', role: '', is_active: '', search: '' })
                setSearchTerm('')
              }}>
                <FilterX size={16} className="mr-1" />
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6">{t('users.columns.user')}</th>
                <th className="py-4 px-6">{t('users.columns.company')}</th>
                <th className="py-4 px-6 text-center">{t('users.columns.role')}</th>
                <th className="py-4 px-6 text-center">{t('users.columns.status')}</th>
                <th className="py-4 px-6 text-center">{t('users.columns.last_login')}</th>
                <th className="py-4 px-6 text-right">{t('users.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usersLoading ? (
                <tr><td colSpan={6} className="p-8"><TableSkeleton /></td></tr>
              ) : usersData?.data?.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500 italic">{t('users.no_users')}</td></tr>
              ) : (
                usersData?.data?.map((user: any) => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDrawer(user.id)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-navy group-hover:text-primary transition-colors">
                            {user.full_name || '-'}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Link 
                        href={`/admin/companies/${user.company_id}`} 
                        className="flex flex-col hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium text-gray-700">{user.company?.name || '-'}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.company?.plan}</span>
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant={user.role === 'hr_admin' ? 'purple' : 'blue'} className="text-[10px] uppercase">
                        {user.role === 'hr_admin' ? 'HR Admin' : t('users.stats.employees')}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getStatusBadge(user)}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-500 text-xs">
                      {timeAgo(user.last_login_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                        <UserActionsMenu 
                          user={user} 
                          onEdit={() => { setFormData(user); setModals(m => ({ ...m, edit: true })) }}
                          onAssign={() => { setFormData(user); setModals(m => ({ ...m, assign: true })) }}
                          onResend={() => handleAction('resend', user.id)}
                          onStatusToggle={() => handleAction('status', user.id, { is_active: !user.is_active })}
                          onDelete={() => { setFormData(user); setModals(m => ({ ...m, delete: true })) }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t('common:showing')}: {usersData?.data?.length || 0} / {usersData?.meta?.total || 0}
          </p>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex items-center px-4 text-xs font-bold text-gray-600">
              {page} / {usersData?.meta?.total_pages || 1}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={page >= (usersData?.meta?.total_pages || 1)} 
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* User Detail Drawer */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        user={userDetails} 
        onAction={handleAction}
        t={t}
        timeAgo={timeAgo}
      />

      {/* Modals */}
      <UserFormModal 
        isOpen={modals.create || modals.edit}
        onClose={() => setModals(m => ({ ...m, create: false, edit: false }))}
        onSubmit={(data: any) => handleAction(modals.create ? 'create' : 'update', undefined, data)}
        initialData={formData}
        companies={companies?.data || []}
        loading={loading}
        isEdit={modals.edit}
        t={t}
      />

      <AssignCompanyModal 
        isOpen={modals.assign}
        onClose={() => setModals(m => ({ ...m, assign: false }))}
        onSubmit={(data: any) => handleAction('assign', undefined, data)}
        user={formData}
        companies={companies?.data || []}
        loading={loading}
        t={t}
      />

      <Modal
        isOpen={modals.delete}
        onClose={() => setModals(m => ({ ...m, delete: false }))}
        title={t('users.delete.confirm')}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>{formData?.full_name || formData?.email}</strong> isimli kullanıcıyı veritabanından <strong>kalıcı olarak</strong> silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setModals(m => ({ ...m, delete: false }))}>{t('common.cancel')}</Button>
            <Button variant="danger" loading={loading} onClick={() => handleAction('delete')}>Kalıcı Olarak Sil</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── SUBCOMPONENTS ───────────────────────────────────────────────────

function StatCard({ icon, label, value, subValue, highlight }: any) {
  return (
    <Card className="p-4 flex flex-col gap-2 relative overflow-hidden">
      {highlight && <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-black text-navy">{value}</span>
      </div>
      {subValue && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{subValue}</p>}
    </Card>
  )
}

function UserActionsMenu({ user, onEdit, onAssign, onResend, onStatusToggle, onDelete }: any) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation('admin')

  return (
    <div className="relative">
      <button 
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
        onClick={() => setOpen(!open)}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in duration-200">
            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50" onClick={() => { onEdit(); setOpen(false) }}>
              <Edit2 size={14} /> {t('users.actions.edit')}
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50" onClick={() => { onAssign(); setOpen(false) }}>
              <Building2 size={14} /> {t('users.actions.assign_company')}
            </button>
            {!user.password_hash && user.is_active && (
              <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-primary hover:bg-primary/5" onClick={() => { onResend(); setOpen(false) }}>
                <Mail size={14} /> {t('users.actions.resend_invite')}
              </button>
            )}
            <button 
              className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-medium hover:bg-gray-50 ${user.is_active ? 'text-amber-600' : 'text-green-600'}`} 
              onClick={() => { onStatusToggle(); setOpen(false) }}
            >
              <Power size={14} /> {user.is_active ? t('users.actions.deactivate') : t('users.actions.activate')}
            </button>
            <div className="h-px bg-gray-100 my-1" />
            <button className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-danger hover:bg-danger/5" onClick={() => { onDelete(); setOpen(false) }}>
              <Trash2 size={14} /> Kalıcı Olarak Sil
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Drawer({ isOpen, onClose, user, onAction, t, timeAgo }: any) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm z-[80] animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-[90] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-navy">{t('common:details')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        {!user ? (
          <div className="p-12 text-center text-gray-400 italic">{t('common.loading')}</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-2xl shadow-inner">
                {user.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">{user.full_name || '-'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-2 flex justify-center">
                   {user.is_active ? <Badge variant="green">{t('users.status.active')}</Badge> : <Badge variant="gray">{t('users.status.inactive')}</Badge>}
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-4">
               <InfoItem label={t('users.columns.company')} value={
                 <Link href={`/admin/companies/${user.company?.id}`} className="text-primary hover:underline flex items-center gap-1">
                   {user.company?.name} <ExternalLink size={12} />
                 </Link>
               } />
               <InfoItem label={t('users.columns.role')} value={
                 <Badge variant={user.role === 'hr_admin' ? 'purple' : 'blue'} className="text-[10px]">
                   {user.role === 'hr_admin' ? 'HR Admin' : t('users.stats.employees')}
                 </Badge>
               } />
               <InfoItem label={t('users.columns.department')} value={user.department?.name || '-'} />
               <InfoItem label={t('users.labels.language')} value={user.language?.toUpperCase()} />
               <InfoItem label={t('users.labels.location')} value={user.location || '-'} />
               <InfoItem label={t('users.labels.seniority')} value={user.seniority || '-'} />
               <InfoItem label={t('users.labels.start_date')} value={user.start_date ? new Date(user.start_date).toLocaleDateString() : '-'} />
               <InfoItem label={t('users.columns.last_login')} value={timeAgo(user.last_login_at)} />
               <InfoItem label={t('users.labels.registration_date')} value={new Date(user.created_at).toLocaleDateString()} />
            </div>

            {/* Survey Stats */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('surveys.title')}</h4>
              <div className="bg-gray-50 rounded-xl p-4 flex justify-between">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Toplam Katılım</p>
                  <p className="text-xl font-black text-navy">{user.survey_responses?.length || 0}</p>
                </div>
                {user.survey_responses?.[0] && (
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Son Katılım</p>
                    <p className="text-xs font-bold text-gray-700">{new Date(user.survey_responses[0].created_at).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {user.survey_responses?.map((res: any) => (
                  <div key={res.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-center bg-white">
                    <div>
                      <p className="text-xs font-bold text-navy truncate max-w-[180px]">{res.survey_title || 'Wellbeing Anketi'}</p>
                      <p className="text-[10px] text-gray-400">{res.period || 'Periyodik'}</p>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{new Date(res.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {user.survey_responses?.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-4 italic">{t('users.labels.no_participation')}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="p-6 border-t border-gray-100 grid grid-cols-2 gap-2">
          <Button variant="ghost" className="text-xs" onClick={() => onAction('resend')} disabled={!user?.is_active || user?.password_hash}>
            <Mail size={14} className="mr-2" /> {t('users.actions.resend_invite')}
          </Button>
          <Button variant="ghost" className={`text-xs ${user?.is_active ? 'text-amber-600' : 'text-green-600'}`} onClick={() => onAction('status', undefined, { is_active: !user?.is_active })}>
            <Power size={14} className="mr-2" /> {user?.is_active ? t('users.actions.deactivate') : t('users.actions.activate')}
          </Button>
        </div>
      </div>
    </>
  )
}

function InfoItem({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-xs font-bold text-navy">{value}</span>
    </div>
  )
}

function UserFormModal({ isOpen, onClose, onSubmit, initialData, companies, loading, isEdit, t }: any) {
  const [data, setData] = useState<any>(initialData || {})
  const [depts, setDepts] = useState<any[]>([])

  useEffect(() => {
    setData(initialData || { role: 'employee', language: 'tr' })
  }, [initialData, isOpen])

  useEffect(() => {
    if (data.company_id) {
       client.get(`/admin/companies/${data.company_id}/departments`).then(res => setDepts(res.data)).catch(() => setDepts([]))
    } else {
       setDepts([])
    }
  }, [data.company_id])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('users.actions.edit') : t('users.create.title')} maxWidth="md">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(data) }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('common:full_name')}*</label>
            <input 
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={data.full_name || ''}
              onChange={e => setData({ ...data, full_name: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('common:email')}*</label>
            <input 
              required
              disabled={isEdit}
              type="email"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={data.email || ''}
              onChange={e => setData({ ...data, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.columns.role')}*</label>
            <div className="flex gap-2">
              <button 
                type="button"
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${data.role === 'hr_admin' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                onClick={() => setData({ ...data, role: 'hr_admin' })}
              >
                HR Admin
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${data.role === 'employee' ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                onClick={() => setData({ ...data, role: 'employee' })}
              >
                {t('users.stats.employees')}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('common:language')}*</label>
            <div className="flex gap-2">
              <button 
                type="button"
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${data.language === 'tr' ? 'bg-navy border-navy text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                onClick={() => setData({ ...data, language: 'tr' })}
              >
                TR
              </button>
              <button 
                type="button"
                className={`flex-1 py-2 text-[10px] font-bold rounded-lg border transition-all ${data.language === 'en' ? 'bg-navy border-navy text-white' : 'bg-white border-gray-200 text-gray-500'}`}
                onClick={() => setData({ ...data, language: 'en' })}
              >
                EN
              </button>
            </div>
          </div>
          <div className="col-span-2 md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.columns.company')}*</label>
            <select 
              required
              disabled={isEdit}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={data.company_id || ''}
              onChange={e => setData({ ...data, company_id: e.target.value })}
            >
              <option value="">{t('common:select_company')}</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1 space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.columns.department')}</label>
            <select 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              value={data.department_id || ''}
              disabled={!data.company_id}
              onChange={e => setData({ ...data, department_id: e.target.value })}
            >
              <option value="">{t('users.placeholders.select_department')}</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <details className="group border-t border-gray-100 pt-4">
          <summary className="list-none flex items-center gap-2 cursor-pointer text-[10px] font-bold text-gray-400 uppercase hover:text-primary transition-colors">
            <Plus size={14} className="group-open:rotate-45 transition-transform" />
            {t('users.create.advanced')}
          </summary>
          <div className="grid grid-cols-2 gap-4 mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.labels.seniority')}</label>
              <select 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={data.seniority || ''}
                onChange={e => setData({ ...data, seniority: e.target.value })}
              >
                <option value="">{t('common:select')}</option>
                <option value="0-1">0-1 {t('common:year')}</option>
                <option value="1-3">1-3 {t('common:year')}</option>
                <option value="3-5">3-5 {t('common:year')}</option>
                <option value="5-10">5-10 {t('common:year')}</option>
                <option value="10+">10+ {t('common:year')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.labels.location')}</label>
              <input 
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={data.location || ''}
                onChange={e => setData({ ...data, location: e.target.value })}
                placeholder={t('users.placeholders.location_hint')}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.labels.start_date')}</label>
              <input 
                type="date"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={data.start_date || ''}
                onChange={e => setData({ ...data, start_date: e.target.value })}
              />
            </div>
          </div>
        </details>

        {!isEdit && (
          <div className="p-3 bg-amber-50 rounded-lg flex gap-3 text-amber-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-[10px] font-medium leading-relaxed">{t('users.create.invite_note')}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="ghost" type="button" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={loading} type="submit">{isEdit ? t('common.save') : t('users.create.submit')}</Button>
        </div>
      </form>
    </Modal>
  )
}

function AssignCompanyModal({ isOpen, onClose, onSubmit, user, companies, loading, t }: any) {
  const [data, setData] = useState<any>({})
  const [depts, setDepts] = useState<any[]>([])

  useEffect(() => {
    if (data.company_id) {
       client.get(`/admin/companies/${data.company_id}/departments`).then(res => setDepts(res.data)).catch(() => setDepts([]))
    } else {
       setDepts([])
    }
  }, [data.company_id])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.assign.title')} maxWidth="sm">
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(data) }}>
        <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
           <span className="text-[10px] font-bold text-gray-500 uppercase">{t('users.assign.current_company')}</span>
           <span className="text-xs font-bold text-navy">{user?.company?.name || '-'}</span>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.assign.new_company')}*</label>
            <select 
              required
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
              onChange={e => setData({ ...data, company_id: e.target.value })}
            >
              <option value="">Firma Seçin</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('users.columns.department')}</label>
            <select 
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              disabled={!data.company_id}
              onChange={e => setData({ ...data, department_id: e.target.value })}
            >
              <option value="">Departman Seçin</option>
              {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-700">
           <AlertCircle size={20} className="shrink-0" />
           <p className="text-[10px] font-medium leading-relaxed">{t('users.assign.warning')}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>{t('common.cancel')}</Button>
          <Button loading={loading} type="submit" variant="primary">{t('users.assign.submit')}</Button>
        </div>
      </form>
    </Modal>
  )
}

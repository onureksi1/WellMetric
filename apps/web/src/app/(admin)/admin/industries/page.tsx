'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import client from '@/lib/api/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { 
  Plus, 
  Search, 
  GripVertical, 
  Edit2, 
  Pause, 
  Play, 
  Factory,
  Globe,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

interface Industry {
  id: string;
  slug: string;
  label_tr: string;
  label_en: string;
  is_active: boolean;
  is_default: boolean;
  order_index: number;
}

function SortableIndustryRow({ 
  industry, 
  t,
  onEdit, 
  onToggleStatus 
}: { 
  industry: Industry, 
  t: any,
  onEdit: (i: Industry) => void,
  onToggleStatus: (slug: string, active: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: industry.slug });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors group"
    >
      <td className="py-4 px-4">
        <button 
          {...attributes} 
          {...listeners}
          className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={18} />
        </button>
      </td>
      <td className="py-4 px-4 font-semibold text-navy">
        {industry.label_tr}
      </td>
      <td className="py-4 px-4 text-gray-500">
        {industry.label_en || '-'}
      </td>
      <td className="py-4 px-4">
        <Badge variant={industry.is_default ? 'gray' : 'blue'}>
          {industry.is_default ? t('industries.default') : t('industries.custom')}
        </Badge>

      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${industry.is_active ? 'bg-primary' : 'bg-red-500'}`} />
          <span className="text-xs font-medium text-gray-600">
            {industry.is_active ? t('common.active') : t('common.passive')}
          </span>

        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(industry)}
            className="p-2 text-gray-400 hover:text-primary"
          >
            <Edit2 size={16} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onToggleStatus(industry.slug, !industry.is_active)}
            disabled={industry.is_default}
            className={`p-2 ${industry.is_default ? 'text-gray-200' : 'text-gray-400 hover:text-danger'}`}
            title={industry.is_default ? t('industries.default_readonly') : ''}
          >
            {industry.is_active ? <Pause size={16} /> : <Play size={16} />}
          </Button>

        </div>
      </td>
    </tr>
  );
}

export default function IndustryManagementPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);
  const [formData, setFormData] = useState({ label_tr: '', label_en: '', order_index: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: industries = [], isLoading } = useQuery({
    queryKey: ['admin-industries'],
    queryFn: async () => {
      const res = await client.get('/admin/industries');
      return res.data as Industry[];
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingIndustry) {
        return client.put(`/admin/industries/${editingIndustry.slug}`, data);
      }
      return client.post('/admin/industries', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
      setIsModalOpen(false);
      setEditingIndustry(null);
      setFormData({ label_tr: '', label_en: '', order_index: 0 });
      toast.success(editingIndustry ? t('industries.updated') : t('industries.created'));
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || t('common.error'));
    }

  });

  const statusMutation = useMutation({
    mutationFn: async ({ slug, active }: { slug: string, active: boolean }) => {
      return client.patch(`/admin/industries/${slug}/status`, { is_active: active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
      toast.success(t('industries.status_updated'));
    }

  });

  const reorderMutation = useMutation({
    mutationFn: async ({ slug, order }: { slug: string, order: number }) => {
      return client.put(`/admin/industries/${slug}`, { order_index: order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-industries'] });
    }
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = industries.findIndex(i => i.slug === active.id);
      const newIndex = industries.findIndex(i => i.slug === over.id);
      
      const newArray = arrayMove(industries, oldIndex, newIndex);
      
      // Update the dragged item's order index on the server
      // In a real app, you might want to update ALL affected items or have a dedicated bulk reorder endpoint
      reorderMutation.mutate({ slug: active.id as string, order: newIndex + 1 });
    }
  };

  const openModal = (industry?: Industry) => {
    if (industry) {
      setEditingIndustry(industry);
      setFormData({ 
        label_tr: industry.label_tr, 
        label_en: industry.label_en || '', 
        order_index: industry.order_index 
      });
    } else {
      setEditingIndustry(null);
      setFormData({ label_tr: '', label_en: '', order_index: industries.length + 1 });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('industries.title', 'Sektör Yönetimi')}</h1>
          <p className="text-gray-500">{t('industries.subtitle', 'Firma sektörlerini yönetin. Varsayılan sektörler pasif yapılamaz.')}</p>
        </div>
        <Button className="flex gap-2" onClick={() => openModal()}>
          <Plus size={18} />
          {t('industries.new')}
        </Button>
      </div>


      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : (

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={industries.map(i => i.slug)}
                strategy={verticalListSortingStrategy}
              >
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-4 px-4 w-10"></th>
                      <th className="py-4 px-4">{t('industries.label_tr')}</th>
                      <th className="py-4 px-4">{t('industries.label_en')}</th>
                      <th className="py-4 px-4">{t('common.type')}</th>
                      <th className="py-4 px-4">{t('common.status')}</th>
                      <th className="py-4 px-4 text-right">{t('common.actions')}</th>
                    </tr>

                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {industries.map((industry) => (
                      <SortableIndustryRow 
                        key={industry.slug} 
                        industry={industry} 
                        t={t}
                        onEdit={openModal}
                        onToggleStatus={(slug, active) => statusMutation.mutate({ slug, active })}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIndustry ? t('industries.edit_title') : t('industries.new_title')}
        maxWidth="sm"
      >

        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">{t('industries.form_label_tr', 'Türkçe Etiket')} <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              required
              value={formData.label_tr}
              onChange={e => setFormData({...formData, label_tr: e.target.value})}
              placeholder={t('industries.placeholder_tr')}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>


          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">{t('industries.form_label_en', 'İngilizce Etiket')}</label>
            <input 
              type="text"
              value={formData.label_en}
              onChange={e => setFormData({...formData, label_en: e.target.value})}
              placeholder={t('industries.placeholder_en')}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>


          {editingIndustry && (
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-[11px] flex gap-2">
              <AlertCircle size={14} className="shrink-0" />
              {t('industries.slug_info', { slug: editingIndustry.slug })}
            </div>
          )}


          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button loading={mutation.isPending} type="submit">
              {editingIndustry ? t('common.update') : t('common.create')}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

interface AssignContentModalProps {
  content: any;
  onClose: () => void;
  onSaved: () => void;
}

const AssignContentModal = ({ content, onClose, onSaved }: AssignContentModalProps) => {
  // If 'content' has 'content_item_id' or 'content_item', it's an assignment we're editing
  const isEditing = !!(content.content_item_id || content.content_item);
  const contentItem = isEditing ? (content.content_item || content) : content;

  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedCompany, setCompany] = useState(content.company_id || '');
  const [selectedDept, setDept] = useState(content.department_id || '');
  const [notes, setNotes] = useState(content.notes || '');
  const [saving, setSaving] = useState(false);

  // Consultant'ın firmalarını yükle
  useEffect(() => {
    client.get('/admin/companies')
      .then(res => setCompanies(res.data?.data || res.data || []))
      .catch(() => toast.error('Firmalar yüklenemedi'));
  }, []);

  // Firma seçince o firmanın departmanlarını yükle
  useEffect(() => {
    if (!selectedCompany) {
      setDepartments([]);
      setDept('');
      return;
    }
    client.get(`/admin/companies/${selectedCompany}/departments`)
      .then(res => setDepartments(res.data || []))
      .catch(() => toast.error('Departmanlar yüklenemedi'));
  }, [selectedCompany]);

  const handleAssign = async () => {
    if (!selectedCompany) {
      toast.error('Lütfen bir firma seçin');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await client.put(`/consultant/content/assignments/${content.id}`, {
          department_id: selectedDept || null,
          notes,
        });
        toast.success('Atama güncellendi');
      } else {
        await client.post('/consultant/content/assignments', {
          content_item_id: contentItem.id,
          company_id: selectedCompany,
          department_id: selectedDept || undefined,
          notes,
        });
        toast.success('İçerik başarıyla atandı');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız oldu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white', width: '100%', maxWidth: 500,
        borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{isEditing ? 'Atamayı Düzenle' : 'İçeriği Atama'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{isEditing ? 'İçerik' : 'Atanacak İçerik'}</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{contentItem?.title_tr}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Firma Seçin *</label>
            <select
              required
              disabled={isEditing}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500"
              value={selectedCompany}
              onChange={e => setCompany(e.target.value)}
            >
              <option value="">Firma seçin</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Departman (Opsiyonel)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={selectedDept}
                onChange={e => setDept(e.target.value)}
              >
                <option value="">Tüm firma</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>HR'a Not</label>
            <textarea
              placeholder="HR yöneticisine iletilecek not..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button variant="outline" onClick={onClose} style={{ flex: 1 }}>İptal</Button>
            <Button disabled={saving || !selectedCompany} onClick={handleAssign} style={{ flex: 1 }}>
              {saving ? 'Kaydediliyor...' : (isEditing ? 'Güncelle' : 'Firmaya Ata')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignContentModal;

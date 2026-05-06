'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { Button } from '@/components/ui/Button';

interface AddContentModalProps {
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
}

const AddContentModal = ({ onClose, onSaved, initialData }: AddContentModalProps) => {
  const [form, setForm] = useState({
    title_tr:        initialData?.title_tr || '',
    title_en:        initialData?.title_en || '',
    description_tr:  initialData?.description_tr || '',
    type:            initialData?.type || 'article',
    dimension:       initialData?.dimension || '',
    url_tr:          initialData?.url_tr || '',
    url_en:          initialData?.url_en || '',
    score_threshold: initialData?.score_threshold?.toString() || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_tr || !form.url_tr) {
      toast.error('Başlık ve URL zorunlu');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        score_threshold: form.score_threshold
          ? parseInt(form.score_threshold)
          : undefined,
      };

      if (initialData?.id) {
        await client.put(`/consultant/content/${initialData.id}`, payload);
        toast.success('İçerik güncellendi');
      } else {
        await client.post('/consultant/content', payload);
        toast.success('İçerik başarıyla eklendi');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Kaydedilemedi');
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
        background: 'white', width: '100%', maxWidth: 600,
        borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{initialData?.id ? 'İçeriği Düzenle' : 'Yeni İçerik Ekle'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Başlık (TR) *</label>
              <input
                required
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.title_tr}
                onChange={e => setForm({ ...form, title_tr: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Başlık (EN)</label>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.title_en}
                onChange={e => setForm({ ...form, title_en: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Tür</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="article">Makale</option>
                <option value="video">Video</option>
                <option value="webinar">Webinar</option>
                <option value="pdf">PDF</option>
                <option value="template">Şablon</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Boyut (Opsiyonel)</label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.dimension}
                onChange={e => setForm({ ...form, dimension: e.target.value })}
              >
                <option value="">Seçiniz</option>
                <option value="physical">Fiziksel</option>
                <option value="mental">Mental</option>
                <option value="social">Sosyal</option>
                <option value="financial">Finansal</option>
                <option value="work">İş Yaşamı</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>URL (TR) *</label>
            <input
              required
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.url_tr}
              onChange={e => setForm({ ...form, url_tr: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>URL (EN)</label>
              <input
                placeholder="https://..."
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.url_en}
                onChange={e => setForm({ ...form, url_en: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Skor Eşiği (0-100)</label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={form.score_threshold}
                onChange={e => setForm({ ...form, score_threshold: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>Açıklama</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              value={form.description_tr}
              onChange={e => setForm({ ...form, description_tr: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <Button type="button" variant="outline" onClick={onClose} style={{ flex: 1 }}>İptal</Button>
            <Button type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;

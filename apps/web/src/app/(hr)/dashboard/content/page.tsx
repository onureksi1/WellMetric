'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import { useTranslation } from 'react-i18next';
import ContentViewer from '@/components/content/ContentViewer';

const HrContentPage = () => {
  const { t, i18n } = useTranslation(['dashboard', 'common']);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await client.get('/hr/content-assignments');
      setAssignments(res.data || []);
    } catch (err) {
      toast.error(t('dashboard.content.errors.load_failed') || 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyEmployees = async (id: string) => {
    if (!confirm('Bu içeriği seçili çalışanlara duyurmak istediğinize emin misiniz?')) return;

    try {
      await client.post(`/hr/content-assignments/${id}/notify`);
      toast.success('İçerik çalışanlara başarıyla duyuruldu');
      fetchAssignments(); // Durumu güncellemek için (notified_at)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'İşlem başarısız');
    }
  };

  const TYPE_ICONS: Record<string, string> = {
    video: '🎥',
    webinar: '🎙️',
    pdf: '📄',
    article: '📰',
    template: '📋',
  };

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 600, fontSize: 20, color: 'var(--color-text-primary)' }}>{t('dashboard.content.title') || 'Danışman İçerikleri'}</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          {t('dashboard.content.subtitle') || 'Danışmanınız tarafından paylaşılan kaynaklar'}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>{t('common.loading') || 'Yükleniyor...'}</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {assignments.map(a => (
            <div
              key={a.id}
              style={{
                background: 'white',
                border: '1px solid var(--color-border-tertiary)',
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{TYPE_ICONS[a.content_item?.type] ?? '📎'}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#64748b',
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: 6,
                  }}>
                    {a.content_item?.type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(a.sent_at).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US')}
                </div>
              </div>

              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#1e293b' }}>
                {i18n.language === 'tr' ? (a.content_item?.title_tr || a.content_item?.title) : (a.content_item?.title_en || a.content_item?.title)}
              </div>

              {a.notes && (
                <div style={{
                  fontSize: 13,
                  color: '#475569',
                  background: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontStyle: 'italic',
                  borderLeft: '3px solid #1D9E75',
                }}>
                  " {a.notes} "
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                {a.content_item?.dimension && (
                  <div style={{ fontSize: 12, color: '#1D9E75', fontWeight: 600 }}>
                    #{a.content_item.dimension}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {t('dashboard.content.consultant') || 'Danışman'}: <strong>{a.consultant?.full_name}</strong>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <ContentViewer 
                  url={i18n.language === 'tr' ? (a.content_item?.url_tr || a.content_item?.url) : (a.content_item?.url_en || a.content_item?.url)} 
                  title={i18n.language === 'tr' ? (a.content_item?.title_tr || a.content_item?.title) : (a.content_item?.title_en || a.content_item?.title)} 
                />

                {a.notified_at ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '10px', 
                    background: '#f0fdf4', 
                    color: '#166534', 
                    borderRadius: 8, 
                    fontSize: 12, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    border: '1px solid #bbf7d0'
                  }}>
                    <span>✓</span> {t('dashboard.content.already_notified')}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNotifyEmployees(a.id)}
                    style={{
                      padding: '10px',
                      background: '#1D9E75',
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#15805d')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#1D9E75')}
                  >
                    {t('dashboard.content.notify_btn')}
                  </button>
                )}
              </div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748b',
              background: '#f8fafc',
              borderRadius: 16,
              border: '2px dashed #e2e8f0',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('dashboard.content.empty_title')}</div>
              <p style={{ fontSize: 14 }}>{t('dashboard.content.empty_desc')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HrContentPage;

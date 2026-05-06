'use client';

import React, { useState, useEffect } from 'react';
import { useT } from '@/hooks/useT';
import { toast } from 'react-hot-toast';
import client from '@/lib/api/client';
import ContentViewer from '@/components/content/ContentViewer';
import AddContentModal from '@/components/content/AddContentModal';
import AssignContentModal from '@/components/content/AssignContentModal';

import { 
  Video, 
  Mic, 
  FileText, 
  Newspaper, 
  Clipboard, 
  Sparkles, 
  Plus, 
  Eye, 
  Trash2, 
  Edit3, 
  Globe,
  Share2,
  AlertCircle,
  CheckCircle2,
  Send
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  video: Video,
  webinar: Mic,
  pdf: FileText,
  article: Newspaper,
  template: Clipboard,
};

const TYPE_LABELS: Record<string, string> = {
  video: 'Video',
  webinar: 'Webinar',
  pdf: 'PDF',
  article: 'Makale',
  template: 'Şablon',
};

const ConsultantContentPage = () => {
  const { t } = useT('consultant');
  const [tab, setTab] = useState<'library' | 'assignments'>('library');
  const [contents, setContents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [suggestionModal, setSuggestionModal] = useState<{
    content: any;
    loading: boolean;
    data:    any | null;
    selectedCompanies: string[];
  } | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  useEffect(() => {
    if (tab === 'assignments') fetchAssignments();
  }, [tab]);

  const fetchContents = async () => {
    try {
      const res = await client.get('/consultant/content');
      setContents(res.data || []);
    } catch (err) {
      toast.error(t('content.load_error'));
    }
  };

  const fetchAssignments = async () => {
    try {
      const res = await client.get('/consultant/content/assignments');
      setAssignments(res.data || []);
    } catch (err) {
      toast.error(t('content.assignments_error'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('content.delete_confirm', 'Bu içeriği silmek istediğinizden emin misiniz?'))) return;
    try {
      await client.delete(`/consultant/content/${id}`);
      toast.success(t('content.delete_success', 'İçerik silindi'));
      fetchContents();
    } catch (err) {
      toast.error(t('content.delete_error', 'Silme işlemi başarısız'));
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm(t('content.delete_assignment_confirm', 'Bu atamayı silmek istediğinizden emin misiniz?'))) return;
    try {
      await client.delete(`/consultant/content/assignments/${id}`);
      toast.success(t('content.assignment_deleted', 'Atama silindi'));
      fetchAssignments();
    } catch (err) {
      toast.error(t('content.assignment_delete_error', 'Silme işlemi başarısız'));
    }
  };

  const handleSend = async (assignmentId: string) => {
    if (!confirm(t('content.send_confirm'))) return;
    try {
      const res = await client.post(`/consultant/content/assignments/${assignmentId}/send`);
      toast.success(t('content.sent_success', { count: res.data?.recipients ?? 0 }));
      fetchAssignments();
    } catch (err) {
      toast.error(t('content.send_error'));
    }
  };

  const handleAiSuggest = async (content: any) => {
    setSuggestionModal({
      content,
      loading: true,
      data:    null,
      selectedCompanies: [],
    });

    try {
      const res = await client.post(`/consultant/content/${content.id}/suggest`);
      const data = res.data;

      setSuggestionModal(prev => prev ? {
        ...prev,
        loading:           false,
        data:              data.data ?? data,
        selectedCompanies: (data.data ?? data).suggestions.map(
          (s: any) => s.company_id
        ),
      } : null);

    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Öneri alınamadı';
      toast.error(msg);
      setSuggestionModal(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!suggestionModal?.selectedCompanies.length) {
      toast.error('En az bir firma seçin');
      return;
    }

    try {
      const res = await client.post(`/consultant/content/${suggestionModal.content.id}/bulk-assign`, {
        company_ids: suggestionModal.selectedCompanies,
        notes:       'AI önerisiyle atandı',
      });
      
      const { assigned, skipped } = res.data.data ?? res.data;
      toast.success(
        `${assigned} firmaya atandı` +
        (skipped > 0 ? `, ${skipped} atlandı (zaten atanmış)` : '')
      );
      setSuggestionModal(null);
      setTab('assignments');
      fetchAssignments();
    } catch (err) {
      toast.error('Atama başarısız');
    }
  };

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 20, color: 'var(--color-text-primary)' }}>{t('content.title')}</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
            {t('content.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(29, 158, 117, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(29, 158, 117, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(29, 158, 117, 0.2)';
          }}
        >
          <Plus size={18} /> {t('content.add_new')}
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--color-border-tertiary)',
        marginBottom: 24,
      }}>
        {(['library', 'assignments'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: tab === key ? 800 : 500,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              color: tab === key ? '#1D9E75' : '#64748b',
              transition: 'all 0.2s',
            }}
          >
            {t(`content.tabs.${key}`)}
            {tab === key && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '24px',
                right: '24px',
                height: '3px',
                background: '#1D9E75',
                borderRadius: '3px 3px 0 0'
              }} />
            )}
          </button>
        ))}
      </div>

      {tab === 'library' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24,
        }}>
          {contents.map(item => {
            const Icon = TYPE_ICONS[item.type] || FileText;
            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                  border: '1px solid #f1f5f9',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)';
                  e.currentTarget.style.borderColor = '#f1f5f9';
                }}
              >
                {/* Top Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 12, background: '#f8fafc',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                    }}>
                      <Icon size={20} />
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#475569',
                      background: '#f1f5f9',
                      padding: '4px 12px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em'
                    }}>
                      {TYPE_LABELS[item.type] ?? item.type}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!item.is_global && (
                      <>
                        <button
                          onClick={() => setEditModal(item)}
                          title="Düzenle"
                          style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          title="Sil"
                          style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#ffe4e6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#fff1f2'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {item.is_global && (
                      <div style={{ 
                        display: 'flex', alignItems: 'center', gap: 4, 
                        background: '#f0fdf4', color: '#16a34a', padding: '4px 10px', 
                        borderRadius: 10, fontSize: 10, fontWeight: 800
                      }}>
                        <Globe size={12} /> GLOBAL
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Info */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontWeight: 800, fontSize: '18px', color: '#0f172a', 
                    marginBottom: 8, lineHeight: 1.3, letterSpacing: '-0.01em'
                  }}>
                    {item.title_tr}
                  </h3>
                  
                  <p style={{ 
                    fontSize: '14px', color: '#64748b', marginBottom: 20, 
                    lineHeight: 1.6, fontWeight: 400
                  }}>
                    {item.description_tr && (item.description_tr.length > 100
                      ? `${item.description_tr.slice(0, 100)}...`
                      : item.description_tr)}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                    {item.dimension && (
                      <div style={{ 
                        fontSize: 12, color: '#059669', fontWeight: 700, 
                        background: '#ecfdf5', padding: '4px 12px', borderRadius: 8 
                      }}>
                        #{item.dimension}
                      </div>
                    )}
                    {item.score_threshold && (
                      <div style={{ 
                        fontSize: 12, color: '#d97706', fontWeight: 700, 
                        background: '#fffbeb', padding: '4px 12px', borderRadius: 8,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <AlertCircle size={14} /> Eşik: &lt;{item.score_threshold}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <ContentViewer url={item.url_tr} title={item.title_tr} />
                    </div>
                    <button
                      onClick={() => setAssignModal(item)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        background: '#ffffff',
                        color: '#475569',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <Share2 size={16} /> Firmaya Ata
                    </button>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => handleAiSuggest(item)}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 16,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(139, 92, 246, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(139, 92, 246, 0.3)';
                      }}
                    >
                      <Sparkles size={18} /> ✨ AI Öner
                    </button>
                    <div style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      textAlign: 'center',
                      marginTop: 6,
                      fontWeight: 500
                    }}>
                      ~2 AI kredisi kullanılacaktır
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {contents.length === 0 && (
            <div style={{
              gridColumn: '1/-1',
              textAlign: 'center',
              padding: '80px 40px',
              color: '#64748b',
              background: '#ffffff',
              borderRadius: 32,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
              <div style={{ 
                width: 80, height: 80, background: '#f1f5f9', borderRadius: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <FileText size={40} color="#cbd5e1" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>İçerik Kütüphanesi Boş</h3>
              <p style={{ fontSize: 15, marginBottom: 32, maxWidth: 300, margin: '0 auto 32px' }}>
                Henüz kütüphanenize içerik eklemediniz. Yeni içerikler ekleyerek firmalarınıza atayabilirsiniz.
              </p>
              <button
                onClick={() => setAddModal(true)}
                style={{
                  padding: '12px 28px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'white',
                  background: '#1D9E75',
                  border: 'none',
                  borderRadius: 16,
                  cursor: 'pointer',
                  boxShadow: '0 10px 15px -3px rgba(29, 158, 117, 0.2)'
                }}
              >
                Yeni İçerik Ekle
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {assignments.map(a => (
            <div
              key={a.id}
              style={{
                background: '#ffffff',
                border: '1px solid #f1f5f9',
                borderRadius: '20px',
                padding: '20px 24px',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto auto',
                gap: 24,
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f1f5f9';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, background: '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'
                }}>
                  {TYPE_ICONS[a.content_item?.type] ? React.createElement(TYPE_ICONS[a.content_item?.type], { size: 20 }) : <FileText size={20} />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
                    {a.content_item?.title_tr}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#059669', fontWeight: 700 }}>
                      <Globe size={14} /> {a.company?.name}
                    </div>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      {a.department ? a.department.name : t('content.all_company')}
                    </span>
                  </div>
                  {a.notes && (
                    <div style={{
                      fontSize: 12, color: '#94a3b8', marginTop: 8, fontStyle: 'italic',
                      padding: '4px 12px', borderLeft: '2px solid #e2e8f0', background: '#f8fafc',
                      borderRadius: '0 8px 8px 0'
                    }}>
                      "{a.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {a.status === 'sent' ? (
                  <div style={{
                    fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: '12px',
                    background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <CheckCircle2 size={14} /> GÖNDERİLDİ
                  </div>
                ) : (
                  <div style={{
                    fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: '12px',
                    background: '#fffbeb', color: '#d97706', display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <AlertCircle size={14} /> TASLAK
                  </div>
                )}
              </div>

              <div style={{ minWidth: 100, textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {a.status === 'sent' ? 'Gönderim:' : 'Oluşturma:'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 700, marginTop: 2 }}>
                  {new Date(a.status === 'sent' && a.sent_at ? a.sent_at : a.created_at).toLocaleDateString('tr-TR')}
                </div>
              </div>

              <div style={{ minWidth: 140, textAlign: 'right' }}>
                {a.status === 'draft' ? (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setAssignModal(a)}
                      title="Düzenle"
                      style={{
                        width: 38, height: 38, borderRadius: 12, border: 'none',
                        background: '#f1f5f9', color: '#475569', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(a.id)}
                      title="Sil"
                      style={{
                        width: 38, height: 38, borderRadius: 12, border: 'none',
                        background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => handleSend(a.id)}
                      style={{
                        height: 38, padding: '0 16px', fontSize: 13, fontWeight: 800,
                        background: '#1D9E75', color: 'white', border: 'none', borderRadius: 12,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 6px -1px rgba(29, 158, 117, 0.2)'
                      }}
                    >
                      <Send size={16} /> Gönder
                    </button>
                  </div>
                ) : (
                  <div style={{ color: '#16a34a', display: 'flex', justifyContent: 'flex-end' }}>
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {assignments.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#64748b',
              background: '#f8fafc',
              borderRadius: 16,
              border: '2px dashed #e2e8f0',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📤</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{t('content.empty.assignments')}</div>
              <p style={{ fontSize: 14 }}>{t('content.empty.assignments_desc')}</p>
            </div>
          )}
        </div>
      )}

      {(addModal || editModal) && (
        <AddContentModal
          initialData={editModal}
          onClose={() => { setAddModal(false); setEditModal(null); }}
          onSaved={() => { setAddModal(false); setEditModal(null); fetchContents(); }}
        />
      )}

      {assignModal && (
        <AssignContentModal
          content={assignModal}
          onClose={() => setAssignModal(null)}
          onSaved={() => {
            setAssignModal(null);
            setTab('assignments');
            fetchAssignments();
          }}
        />
      )}

      {suggestionModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 200,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: '1.5rem',
            width: 520, maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            {/* Başlık */}
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:16 }}>
              <div>
                <div style={{ fontWeight:600, fontSize:16, color: '#1e293b' }}>
                  ✨ AI Atama Önerisi
                </div>
                <div style={{ fontSize:12,
                  color:'#64748b', marginTop:2 }}>
                  {suggestionModal.content.title_tr}
                </div>
              </div>
              <button onClick={() => setSuggestionModal(null)}
                style={{ background:'none', border:'none',
                  cursor:'pointer', fontSize:20,
                  color:'#94a3b8' }}>
                ✕
              </button>
            </div>

            {/* Yükleniyor */}
            {suggestionModal.loading && (
              <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
                <div style={{ fontSize:40, marginBottom:12, animation: 'pulse 2s infinite' }}>🤖</div>
                <div style={{ fontSize:14, fontWeight: 500, color:'#475569' }}>
                  Firmalarınız analiz ediliyor...
                </div>
                <div style={{ fontSize:11,
                  color:'#94a3b8', marginTop:6 }}>
                  2 AI kredisi kullanılacak
                </div>
              </div>
            )}

            {/* Sonuçlar */}
            {!suggestionModal.loading && suggestionModal.data && (
              <>
                {/* AI Yorumu */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(108,58,142,0.05), rgba(29,158,117,0.05))',
                  border: '1px solid rgba(108,58,142,0.1)',
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 20,
                }}>
                  <div style={{ fontSize:10, fontWeight:700,
                    color:'#6C3A8E', marginBottom:8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🤖 AI YORUMU
                  </div>
                  <div style={{ fontSize:13, lineHeight:1.6,
                    color:'#334155', fontWeight: 400 }}>
                    {suggestionModal.data.ai_comment}
                  </div>
                  <div style={{ fontSize:10,
                    color:'#94a3b8', marginTop:8 }}>
                    {suggestionModal.data.credits_used} AI kredisi kullanıldı
                  </div>
                </div>

                {/* Firma Listesi */}
                {suggestionModal.data.suggestions.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'2rem',
                    color:'#94a3b8', fontSize:13, background: '#f8fafc', borderRadius: 12 }}>
                    Eşik altında firma bulunamadı.
                    Tüm firmalarınız bu içerik için yeterli skorlara sahip.
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:11, fontWeight:600,
                      color:'#64748b', marginBottom:10, textTransform: 'uppercase' }}>
                      ÖNERİLEN FİRMALAR
                      <span style={{ fontWeight:400, marginLeft:4, textTransform: 'none' }}>
                        (seçimleri değiştirebilirsiniz)
                      </span>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:10,
                      marginBottom:24 }}>
                      {suggestionModal.data.suggestions.map((s: any) => {
                        const isSelected = suggestionModal.selectedCompanies
                          .includes(s.company_id);
                        return (
                          <div key={s.company_id}
                            onClick={() => setSuggestionModal(prev => {
                              if (!prev) return prev;
                              const selected = prev.selectedCompanies.includes(s.company_id)
                                ? prev.selectedCompanies.filter(id => id !== s.company_id)
                                : [...prev.selectedCompanies, s.company_id];
                              return { ...prev, selectedCompanies: selected };
                            })}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr auto',
                              gap: 12, alignItems: 'center',
                              padding: '12px 16px',
                              border: isSelected
                                ? '2px solid #1D9E75'
                                : '1px solid #e2e8f0',
                              borderRadius: 12,
                              cursor: 'pointer',
                              background: isSelected
                                ? '#f0fdf4'
                                : 'white',
                              transition: 'all .2s',
                            }}>
                            {/* Checkbox */}
                            <div style={{
                              width: 20, height: 20,
                              borderRadius: 6,
                              border: isSelected
                                ? 'none'
                                : '2px solid #cbd5e1',
                              background: isSelected
                                ? '#1D9E75'
                                : 'transparent',
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12, color: 'white',
                              flexShrink: 0,
                            }}>
                              {isSelected && '✓'}
                            </div>

                            {/* Firma bilgisi */}
                            <div>
                              <div style={{ fontWeight:600, fontSize:14, color: '#1e293b' }}>
                                {s.company_name}
                              </div>
                              <div style={{ fontSize:11,
                                color:'#64748b', marginTop:2 }}>
                                {s.reason}
                              </div>
                            </div>

                            {/* Match level badge */}
                            <span style={{
                              fontSize: 10, padding: '3px 8px',
                              borderRadius: 6, fontWeight: 700,
                              background: s.match_level === 'high'
                                ? '#fee2e2'
                                : s.match_level === 'medium'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color: s.match_level === 'high'
                                ? '#b91c1c'
                                : s.match_level === 'medium'
                                  ? '#92400e'
                                  : '#475569',
                            }}>
                              {s.match_level === 'high'   ? 'Yüksek ihtiyaç' :
                               s.match_level === 'medium' ? 'Orta ihtiyaç'   :
                                                            'Düşük ihtiyaç'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Butonlar */}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setSuggestionModal(null)}
                    style={{ flex:1, padding:'12px',
                      border:'1px solid #e2e8f0',
                      borderRadius:10,
                      cursor:'pointer', fontSize:14, fontWeight: 600,
                      color: '#475569',
                      background:'white' }}>
                    İptal
                  </button>
                  {suggestionModal.data.suggestions.length > 0 && (
                    <button
                      onClick={handleBulkAssign}
                      disabled={!suggestionModal.selectedCompanies.length}
                      style={{
                        flex: 2, padding: '12px',
                        border: 'none',
                        borderRadius: 10,
                        cursor: suggestionModal.selectedCompanies.length
                          ? 'pointer' : 'not-allowed',
                        fontSize: 14, fontWeight: 600,
                        background: suggestionModal.selectedCompanies.length
                          ? 'linear-gradient(135deg, #6C3A8E, #1D9E75)'
                          : '#f1f5f9',
                        color: suggestionModal.selectedCompanies.length
                          ? 'white' : '#94a3b8',
                        boxShadow: suggestionModal.selectedCompanies.length ? '0 10px 15px -3px rgba(108,58,142,0.3)' : 'none'
                      }}>
                      {suggestionModal.selectedCompanies.length > 0
                        ? `${suggestionModal.selectedCompanies.length} Firmaya Ata →`
                        : 'Firma Seçin'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantContentPage;

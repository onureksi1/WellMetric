'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Search, 
  Video, 
  FileText, 
  Globe, 
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
  Play
} from 'lucide-react';
import client from '@/lib/api/client';
import { toast } from 'react-hot-toast';

export default function ConsultantContentPage() {
  const { t } = useTranslation('consultant');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title_tr: '',
    description_tr: '',
    type: 'video',
    dimension: 'mental',
    url_tr: '',
    score_threshold: 50,
  });

  const fetchContent = async () => {
    try {
      const response = await client.get('/api/v1/consultant/content-items');
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching consultant content:', error);
      toast.error('İçerikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/consultant/content-items', formData);
      toast.success('İçerik başarıyla eklendi.');
      setShowAddForm(false);
      setFormData({
        title_tr: '',
        description_tr: '',
        type: 'video',
        dimension: 'mental',
        url_tr: '',
        score_threshold: 50,
      });
      fetchContent();
    } catch (error) {
      toast.error('Ekleme işlemi başarısız oldu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
    try {
      await client.delete(`/api/v1/consultant/content-items/${id}`);
      toast.success('İçerik başarıyla silindi.');
      fetchContent();
    } catch (error) {
      toast.error('Silme işlemi başarısız oldu.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Eğitim İçeriklerim</h1>
          <p className="text-gray-500">Müşterilerinize önereceğiniz size özel eğitim ve kaynaklar.</p>
        </div>
        <Button className="flex gap-2" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Kapat' : <><Plus size={18} /> Yeni Eğitim Ekle</>}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-2 border-primary/10 animate-in slide-in-from-top-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">İçerik Başlığı</label>
                <input
                  required
                  type="text"
                  value={formData.title_tr}
                  onChange={e => setFormData({ ...formData, title_tr: e.target.value })}
                  placeholder="Örn: Stres Yönetimi Teknikleri"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Video URL (YouTube / Vimeo / Embed)</label>
                <input
                  required
                  type="text"
                  value={formData.url_tr}
                  onChange={e => setFormData({ ...formData, url_tr: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Tür</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none"
                >
                  <option value="video">Video Eğitim</option>
                  <option value="article">Makale / Yazı</option>
                  <option value="podcast">Podcast</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Esenlik Boyutu</label>
                <select
                  value={formData.dimension}
                  onChange={e => setFormData({ ...formData, dimension: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none"
                >
                  <option value="mental">Mental</option>
                  <option value="physical">Fiziksel</option>
                  <option value="social">Sosyal</option>
                  <option value="financial">Finansal</option>
                  <option value="work">İş Yaşamı</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-navy">Skor Eşiği (Threshold)</label>
                <input
                  type="number"
                  value={formData.score_threshold}
                  onChange={e => setFormData({ ...formData, score_threshold: parseInt(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="w-full md:w-auto px-12">Yayınla</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="İçeriklerimde ara..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse h-64 bg-gray-50" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-blue-50 p-4 rounded-full text-blue-500 mb-4">
            <Video size={32} />
          </div>
          <h3 className="text-lg font-bold text-navy">Henüz İçerik Yok</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Şirketlerinize önermek üzere YouTube veya Vimeo eğitimlerinizi eklemeye başlayın.
          </p>
          <Button variant="outline" className="mt-6 flex gap-2">
            <Plus size={18} />
            İlk İçeriğini Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="group hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  item.type === 'video' ? 'bg-red-50 text-red-500' :
                  item.type === 'article' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                }`}>
                  {item.type === 'video' ? <Play size={24} /> : 
                   item.type === 'article' ? <FileText size={24} /> : <Globe size={24} />}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="p-1.5"><Edit2 size={14} /></Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1.5 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-navy line-clamp-2 min-h-[3.5rem]">{item.title_tr}</h3>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={
                  item.dimension === 'mental' ? 'purple' : 
                  item.dimension === 'physical' ? 'blue' : 'green'
                } size="md">
                  {item.dimension?.toUpperCase() || 'GENEL'}
                </Badge>
                <Badge variant="gray" size="md">
                  Threshold: &lt; {item.score_threshold || 50}
                </Badge>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </div>
                <a 
                  href={item.url_tr} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary text-xs font-bold flex gap-1 items-center hover:underline"
                >
                  <ExternalLink size={14} />
                  İzle / Oku
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

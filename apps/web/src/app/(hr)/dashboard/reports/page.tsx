'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  FileSpreadsheet, 
  Globe, 
  Calendar, 
  Download,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Rapor talebi alındı. Hazır olduğunda e-posta ile bilgilendirileceksiniz.', { duration: 5000 });
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-navy">Raporlar</h1>
        <p className="text-sm text-gray-500">Aylık verileri detaylı PDF veya Excel formatında dışa aktarın.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Report Configuration */}
        <Card title="Yeni Rapor Oluştur">
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dönem Seçimi</label>
                 <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-navy outline-none focus:ring-2 focus:ring-primary/10">
                    <option>Nisan 2026</option>
                    <option>Mart 2026</option>
                    <option>Şubat 2026</option>
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dosya Formatı</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5 text-primary">
                       <FileText size={20} />
                       <span className="text-sm font-bold">PDF Rapor</span>
                    </button>
                    <button className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-50 bg-white text-gray-400 hover:border-gray-100 transition-all">
                       <FileSpreadsheet size={20} />
                       <span className="text-sm font-bold">Excel Veri</span>
                    </button>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rapor Dili</label>
                 <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                       </div>
                       <span className="text-sm font-bold text-navy">Türkçe</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                       <div className="h-5 w-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-transparent" />
                       </div>
                       <span className="text-sm font-bold text-gray-400">İngilizce</span>
                    </label>
                 </div>
              </div>

              <Button className="w-full py-4 font-black tracking-widest shadow-lg shadow-primary/20" loading={loading} onClick={handleGenerate}>
                📑 RAPOR OLUŞTUR
              </Button>
           </div>
        </Card>

        {/* Report Preview */}
        <Card title="Rapor İçeriği" className="bg-gray-50/50">
           <p className="text-xs text-gray-500 mb-6 leading-relaxed">
             Oluşturulacak olan PDF raporu aşağıdaki bölümleri içerecektir:
           </p>
           <ul className="space-y-4">
              <ReportContentItem label="Kapak Sayfası" />
              <ReportContentItem label="Yönetici Özeti (AI Destekli)" />
              <ReportContentItem label="5 Boyut Detaylı Analizi" />
              <ReportContentItem label="Departman Bazlı Karşılaştırma" />
              <ReportContentItem label="Çalışan Sesi (Açık Uçlu Yanıtlar)" />
              <ReportContentItem label="Önerilen Aksiyon Planı" />
           </ul>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card title="Son Oluşturulan Raporlar">
         <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                       <FileText size={20} />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-navy">Aylık Wellbeing Raporu - {i === 1 ? 'Mart' : 'Şubat'} 2026</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF • TÜRKÇE • 12 SAYFA</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] text-gray-400 font-bold uppercase">Oluşturma</p>
                       <p className="text-xs font-bold text-navy">24.03.2026</p>
                    </div>
                    <button className="p-2 rounded-lg bg-white border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
                       <Download size={18} />
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </Card>
    </div>
  );
}

function ReportContentItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 text-sm font-bold text-navy/80">
       <CheckCircle2 size={16} className="text-primary" />
       {label}
    </li>
  );
}

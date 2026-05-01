'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Bot, 
  Send, 
  Sparkles, 
  History, 
  AlertCircle,
  Zap,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AiCenterPage() {
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Merhaba! Platform genelindeki verilerle ilgili size nasıl yardımcı olabilirim?' }
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;
    setChat([...chat, { role: 'user', text: message }]);
    setMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      setChat(prev => [...prev, { 
        role: 'assistant', 
        text: 'Analiz tamamlandı. Bu ay platform genelinde katılım oranı %12 artış gösterdi. En yüksek esenlik skoru "Teknoloji" sektöründe görülüyor.' 
      }]);
    }, 1000);
  };

  return (
    <div className="space-y-8 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy">AI Merkezi</h1>
          <p className="text-gray-500">Platform geneli akıllı analizler ve asistan sohbeti.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 overflow-hidden">
        {/* Admin Chat Section */}
        <Card className="lg:col-span-2 flex flex-col h-full !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
            <div className="h-8 w-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-navy">Platform Asistanı</p>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Claude 3.5 Sonnet ile Güçlendirildi</p>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chat.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                  msg.role === 'user' 
                  ? 'bg-primary text-white rounded-tr-none' 
                  : 'bg-gray-100 text-navy rounded-tl-none border border-gray-100'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Queries */}
          <div className="px-6 py-2 flex flex-wrap gap-2 border-t border-gray-50">
            <QuickQuery label="En düşük esenlik skoru olan sektör hangisi?" />
            <QuickQuery label="Katılımı düşük firmaları listele" />
            <QuickQuery label="Son 3 ayın trend analizi" />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
             <div className="relative flex items-center">
               <input 
                 type="text" 
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                 placeholder="Veriler hakkında bir soru sorun..."
                 className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
               />
               <button 
                 onClick={sendMessage}
                 className="absolute right-2 h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center hover:bg-primary-dark transition-colors shadow-sm"
               >
                 <Send size={16} />
               </button>
             </div>
          </div>
        </Card>

        {/* Anomaly Analysis Section */}
        <div className="space-y-6 overflow-y-auto pr-2">
          <Card title="Platform Anomali Analizi">
            <p className="text-xs text-gray-500 mb-6">
              Platform genelindeki verileri analiz ederek beklenmedik sapmaları (standart sapma dışı) tespit eder.
            </p>
            <Button className="w-full flex gap-2" onClick={() => toast.success('Analiz başlatıldı. Mail ile bildirileceksiniz.')}>
              <Zap size={18} />
              Yeni Analiz Başlat
            </Button>
          </Card>

          <div className="space-y-4">
             <h3 className="text-sm font-bold text-navy flex items-center gap-2">
               <History size={16} className="text-gray-400" />
               Son Analiz Raporları
             </h3>

             {[1, 2].map(i => (
               <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                 <div className="flex justify-between items-start mb-2">
                   <p className="text-xs font-bold text-gray-400">{i === 1 ? 'Nisan 2026' : 'Mart 2026'}</p>
                   <div className="h-2 w-2 rounded-full bg-danger animate-pulse" />
                 </div>
                 <h4 className="text-sm font-semibold text-navy group-hover:text-primary transition-colors">Aylık Anomali Raporu</h4>
                 <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">"Bazı kurumlarda fiziksel esenlik skorlarında ani bir düşüş tespit edildi..."</p>
                 <div className="mt-3 flex justify-end">
                    <ArrowRight size={14} className="text-gray-300 group-hover:text-primary transition-colors" />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickQuery({ label }: { label: string }) {
  return (
    <button className="text-[10px] font-bold text-gray-400 hover:text-primary hover:bg-primary/5 border border-gray-100 hover:border-primary/20 px-2 py-1 rounded-full transition-all uppercase tracking-tight">
      {label}
    </button>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, X, AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';

export const DebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<{ type: 'error' | 'success' | 'info', message: string, time: string }[]>([]);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    // Intercept console.error to show in debug overlay
    const originalError = console.error;
    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-9), { 
        type: 'error', 
        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), 
        time: new Date().toLocaleTimeString() 
      }]);
      originalError.apply(console, args);
    };

    // Check API health
    const checkApi = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/health').catch(() => null);
        setApiStatus(res?.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 10000);

    return () => {
      console.error = originalError;
      clearInterval(interval);
    };
  }, []);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-10 w-10 bg-navy text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all z-[9999] border border-white/10"
      >
        <Terminal size={18} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[360px] glass-card rounded-[32px] overflow-hidden shadow-2xl z-[9999] border-navy/10 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-navy p-4 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <Terminal size={16} className="text-primary" />
            <span className="text-xs font-black text-white tracking-widest uppercase">Debug Console</span>
         </div>
         <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
            <X size={16} />
         </button>
      </div>

      <div className="p-4 space-y-4">
         {/* API Status Card */}
         <div className={clsx(
           'p-3 rounded-2xl flex items-center justify-between border',
           apiStatus === 'online' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
         )}>
            <div className="flex items-center gap-3">
               {apiStatus === 'online' ? (
                 <CheckCircle2 size={18} className="text-primary" />
               ) : (
                 <WifiOff size={18} className="text-danger" />
               )}
               <span className="text-[10px] font-black text-navy uppercase tracking-tight">API Server (3001)</span>
            </div>
            <Badge color={apiStatus === 'online' ? 'green' : 'red'}>
              {apiStatus.toUpperCase()}
            </Badge>
         </div>

         {/* Logs */}
         <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
            {logs.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-medium text-center py-4 italic">Hata bulunamadı.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex gap-2 items-start">
                   <AlertCircle size={12} className={clsx('mt-0.5 shrink-0', log.type === 'error' ? 'text-danger' : 'text-primary')} />
                   <div>
                      <p className="text-[10px] font-mono text-navy break-all leading-tight">{log.message}</p>
                      <span className="text-[8px] font-bold text-slate-300">{log.time}</span>
                   </div>
                </div>
              ))
            )}
         </div>

         <div className="pt-2">
            <p className="text-[9px] text-slate-400 font-medium leading-relaxed">
              <strong>İpucu:</strong> Eğer API 'OFFLINE' ise terminalden <code>npm run start:dev</code> çalıştığından emin olun.
            </p>
         </div>
      </div>
    </div>
  );
};

function Badge({ color, children }: any) {
  return (
    <span className={clsx(
      'text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest',
      color === 'green' ? 'bg-primary/20 text-primary' : 'bg-danger/20 text-danger'
    )}>
      {children}
    </span>
  );
}

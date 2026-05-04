'use client';
import { Component, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface Props { 
  children: ReactNode; 
  fallback?: ReactNode;
}

interface State { 
  hasError: boolean; 
  error?: Error; 
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    logger.error('React render hatası', { component: 'ErrorBoundary' }, {
      message: error.message,
      stack:   error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-8 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 m-4">
          <div className="font-black text-slate-900 mb-2 uppercase tracking-widest text-sm">Bir şeyler ters gitti</div>
          <div className="text-xs text-slate-500 font-bold mb-6 max-w-md mx-auto leading-relaxed">
            {this.state.error?.message}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

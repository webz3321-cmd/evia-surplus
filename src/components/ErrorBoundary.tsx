import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error bound:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 font-sans">
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#9f3a38]/5 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#9f3a38]/5 blur-[100px]" />
          </div>

          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-8 shadow-xl relative z-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
              <AlertOctagon size={24} className="text-[#9f3a38]" />
            </div>

            <h1 className="font-serif text-2xl font-black text-stone-900 tracking-tight lowercase">
              studio<span className="text-[#9f3a38]">.</span>interruption
            </h1>
            
            <p className="mt-4 text-xs text-stone-500 leading-relaxed uppercase tracking-wider">
              An unexpected UI rendering sequence error was caught.
            </p>

            {this.state.error && (
              <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-150 text-left">
                <p className="text-[10px] font-mono font-medium text-stone-400 uppercase tracking-widest mb-1.5">Diagnostic Signal</p>
                <p className="text-xs font-mono text-stone-700 break-all leading-relaxed bg-white p-3 rounded-lg border border-stone-100 max-h-36 overflow-y-auto">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-stone-900 hover:bg-stone-850 text-white text-xs font-black uppercase tracking-wider transition-all duration-300"
              >
                <RotateCcw size={14} />
                <span>Reload Application</span>
              </button>
              
              <a
                href="/"
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-full bg-white border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-900 text-xs font-black uppercase tracking-wider transition-all duration-300"
              >
                <Home size={14} />
                <span>Go to Home</span>
              </a>
            </div>
            
            <p className="mt-6 text-[9px] font-bold text-stone-300 uppercase tracking-[0.2em]">
              EVIA Co. Security & Stability Engine
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

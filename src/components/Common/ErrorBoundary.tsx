import React, { ErrorInfo, ReactNode } from 'react';
import { safeStorage } from '../../lib/storage';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
    this.handleRejection = this.handleRejection.bind(this);
  }

  private handleRejection(event: PromiseRejectionEvent) {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    
    // Ignore benign errors that shouldn't crash the app
    if (message.toLowerCase().includes('websocket') || 
        message.toLowerCase().includes('resizeobserver') ||
        message.toLowerCase().includes('hmr') ||
        message.toLowerCase().includes('heartbeat')) {
      return;
    }

    this.setState({
      hasError: true,
      error: reason instanceof Error ? reason : new Error(String(reason || 'Unhandled Promise Rejection'))
    });
  }

  public componentDidMount() {
    window.addEventListener('unhandledrejection', this.handleRejection as any);
  }

  public componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleRejection as any);
  }

  public static getDerivedStateFromError(error: Error): State {
    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('websocket') || msg.includes('resizeobserver') || msg.includes('hmr')) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-rose-100 max-w-md w-full space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">Algo salió mal</h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              La aplicación encontró un error al cargar. Por favor, intenta recargar la página o borrar el caché.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-auto max-h-48 text-left">
              <code className="text-[10px] text-rose-600 font-mono italic whitespace-pre-wrap">
                {this.state.error?.name}: {this.state.error?.message}
                {this.state.error?.stack && `\n\nStack:\n${this.state.error.stack}`}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-teal-500/25 active:scale-95 transition-all"
            >
              Recargar Aplicación
            </button>
            <button
              onClick={() => { safeStorage.clear(); window.location.reload(); }}
              className="w-full py-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest"
            >
              Forzar Limpieza de Caché
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

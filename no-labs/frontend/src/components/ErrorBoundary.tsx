import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface State {
  error: Error | null;
}

/** Top-level crash screen: shows the error and a Reload button instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('NO LABS crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="min-h-full flex items-center justify-center bg-bg text-fg px-4 py-16" role="alert">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-sub mb-4">
            <AlertTriangle size={18} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm text-sub mt-1.5">The page hit an unexpected error. Reloading usually fixes it.</p>
          <pre className="mt-4 text-left text-2xs text-sub bg-surface border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words max-h-40">
            {error.message || String(error)}
          </pre>
          <button className="btn-primary mt-5" onClick={() => window.location.reload()}>
            <RotateCw size={14} /> Reload
          </button>
        </div>
      </div>
    );
  }
}

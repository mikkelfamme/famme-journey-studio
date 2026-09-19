import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { restoreLatestRecovery } from '../lib/db';

interface State { error?: Error }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = {};
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Famme Journey Studio render error', error, info); }
  async restore() {
    const workspace = await restoreLatestRecovery();
    if (workspace) window.location.reload();
    else window.alert('No recovery snapshot is available yet.');
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="crash-screen"><div className="crash-card"><div className="crash-icon"><AlertTriangle size={28}/></div><span className="eyebrow-small">RECOVERY MODE</span><h1>Famme Journey Studio hit an unexpected error.</h1><p>Your workspace is stored locally. Reload first; if the same error returns, restore the most recent recovery snapshot.</p><details><summary>Technical detail</summary><pre>{this.state.error.message}</pre></details><div className="stack-actions"><button className="button primary" onClick={() => window.location.reload()}><RefreshCw size={16}/> Reload app</button><button className="button" onClick={() => void this.restore()}><RotateCcw size={16}/> Restore latest recovery</button></div></div></main>;
  }
}

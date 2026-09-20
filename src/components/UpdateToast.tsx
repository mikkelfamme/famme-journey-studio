import { CheckCircle2, DownloadCloud, Loader2, X } from 'lucide-react';
import { APP_VERSION } from '../lib/appMeta';
import { useAppUpdate } from '../lib/useAppUpdate';

export function UpdateToast() {
  const { updateAvailable, offlineReady, updating, applyUpdate, dismissOfflineReady } = useAppUpdate();
  if (!updateAvailable && !offlineReady) return null;

  if (updateAvailable) {
    return <aside className="update-toast" role="status" aria-live="polite">
      <div className="update-toast-icon"><DownloadCloud size={18}/></div>
      <div className="update-toast-copy">
        <strong>New version ready</strong>
        <span>Your local workspaces stay on this device. Update Journey Studio by Famme when you are ready.</span>
      </div>
      <button className="button primary compact" onClick={()=>void applyUpdate()} disabled={updating}>
        {updating ? <><Loader2 size={14}/> Updating…</> : 'Update now'}
      </button>
    </aside>;
  }

  return <aside className="update-toast offline-ready" role="status" aria-live="polite">
    <div className="update-toast-icon"><CheckCircle2 size={18}/></div>
    <div className="update-toast-copy"><strong>Ready offline</strong><span>Version {APP_VERSION} is cached and can be opened without internet.</span></div>
    <button className="icon-button" onClick={dismissOfflineReady} aria-label="Dismiss"><X size={15}/></button>
  </aside>;
}

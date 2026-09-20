import { AlertCircle, CheckCircle2, CircleHelp, Download, FileUp, Loader2, MonitorDown, Plus, Search, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SaveState } from '../store/WorkspaceContext';
import { usePwaInstall } from '../lib/usePwaInstall';
import { useI18n } from '../i18n';

function SaveIndicator({ state, lastSavedAt, error }: { state: SaveState; lastSavedAt?: string; error?: string }) {
  const { t } = useI18n();
  if (state === 'saving') return <div className="save-indicator saving" title="Saving changes locally"><Loader2 size={13}/><span>{t('save.saving')}</span></div>;
  if (state === 'error') return <div className="save-indicator error" title={error || 'Autosave failed'}><AlertCircle size={13}/><span>{t('save.error')}</span></div>;
  if (state === 'saved') return <div className="save-indicator saved" title={lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Saved locally'}><CheckCircle2 size={13}/><span>{t('save.saved')}</span></div>;
  return <div className="save-indicator"><span>{t('save.local')}</span></div>;
}

export function Topbar({ title, subtitle, onNew, onExport, onImport, onCommand, onHelp, saveState, lastSavedAt, saveError }: { title: string; subtitle?: string; onNew?: () => void; onExport: () => void; onImport: () => void; onCommand: () => void; onHelp: () => void; saveState: SaveState; lastSavedAt?: string; saveError?: string }) {
  const { canInstall, install } = usePwaInstall();
  const { t } = useI18n();
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
        <SaveIndicator state={saveState} lastSavedAt={lastSavedAt} error={saveError}/>
        {!online && <div className="save-indicator offline" title="The app is offline. Local work remains available."><WifiOff size={13}/><span>Offline</span></div>}
      </div>
      <div className="topbar-actions">
        {canInstall && <button className="button install-button" onClick={()=>void install()} title="Install Famme Journey Studio as an app"><MonitorDown size={16}/> {t('topbar.install')}</button>}
        <button className="icon-button topbar-tool" onClick={onCommand} title="Command palette (Ctrl/⌘ K)" aria-label="Open command palette"><Search size={16}/></button>
        <button className="icon-button topbar-tool" onClick={onHelp} title="Context help (?)" aria-label="Open contextual help"><CircleHelp size={16}/></button>
        {onNew && <button className="button primary" onClick={onNew}><Plus size={16} /> {t('topbar.newJourney')}</button>}
        <button className="button" onClick={onImport}><FileUp size={16} /> {t('topbar.import')}</button>
        <button className="button" onClick={onExport}><Download size={16} /> {t('topbar.export')}</button>
      </div>
    </header>
  );
}

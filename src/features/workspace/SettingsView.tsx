import { useEffect, useRef, useState } from 'react';
import { Database, Download, FileDown, FileUp, GraduationCap, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react';
import { downloadActualPathMap, downloadPerformanceMap, downloadWorkspace, importPreview, parseStudioDataFile, type StudioImport, type StudioImportPreview } from '../../lib/files';
import { clearRecoverySnapshots, listRecoverySnapshots, restoreRecoverySnapshot, type RecoverySnapshot } from '../../lib/db';
import { ensureMetricDictionary } from '../../lib/performance';
import { ImportPreviewDialog } from '../../components/ImportPreviewDialog';
import { useWorkspace } from '../../store/WorkspaceContext';

interface PendingImport { imported: StudioImport; preview: StudioImportPreview }

export function SettingsView() {
  const { workspace, saveState, lastSavedAt, saveError, setWorkspace, updateWorkspace, resetWorkspace, saveNow } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [recoveries, setRecoveries] = useState<RecoverySnapshot[]>([]);
  useEffect(() => { void listRecoverySnapshots().then(setRecoveries); }, [workspace?.updatedAt]);
  if (!workspace) return null;

  async function readImport(file?: File) {
    if (!file) return;
    try {
      const imported = await parseStudioDataFile(file);
      setPendingImport({ imported, preview: importPreview(imported) });
    } catch (error) { window.alert(error instanceof Error ? error.message : 'Import failed'); }
  }
  function applyImport(imported: StudioImport) {
    setPendingImport(null);
    if (imported.kind === 'workspace') { setWorkspace(imported.workspace); return; }
    if (imported.kind === 'performance') {
      updateWorkspace(ws => {
        const snapshots = [...ws.performanceSnapshots.filter(item => item.id !== imported.snapshot.id), imported.snapshot];
        return { ...ws, performanceSnapshots: snapshots, metricDictionary: ensureMetricDictionary(ws.metricDictionary, snapshots), settings: { ...ws.settings, activePerformanceSnapshotId: imported.snapshot.id } };
      });
      return;
    }
    updateWorkspace(ws => ({ ...ws, actualPathSnapshots: [...ws.actualPathSnapshots.filter(item => item.id !== imported.snapshot.id), imported.snapshot], settings: { ...ws.settings, activeActualPathSnapshotId: imported.snapshot.id } }));
  }
  async function restore(key: string) {
    if (!window.confirm('Restore this recovery snapshot and replace the current local workspace?')) return;
    const recovered = await restoreRecoverySnapshot(key);
    if (recovered) setWorkspace(recovered);
  }
  async function clearRecoveries() {
    if (!window.confirm('Delete all local recovery snapshots?')) return;
    await clearRecoverySnapshots();
    setRecoveries([]);
  }

  return <section className="content-section settings-page">
    <div className="section-toolbar"><div><h2>Settings</h2><p>Workspace identity, editor defaults, portable data, recovery and intelligence-layer inputs.</p></div></div>
    <div className="settings-grid">
      <div className="settings-card"><h3>Workspace</h3><label>Name<input value={workspace.name} onChange={e=>updateWorkspace(ws=>({...ws,name:e.target.value}))}/></label><label>Organization<input value={workspace.organization} onChange={e=>updateWorkspace(ws=>({...ws,organization:e.target.value}))}/></label><label>Primary product<input value={workspace.product} onChange={e=>updateWorkspace(ws=>({...ws,product:e.target.value}))}/></label></div>
      <div className="settings-card"><h3>Autosave</h3><div className={`save-detail save-${saveState}`}><ShieldCheck size={17}/><div><strong>{saveState === 'saving' ? 'Saving locally…' : saveState === 'error' ? 'Autosave error' : 'Local autosave active'}</strong><span>{saveError || (lastSavedAt ? `Last saved ${new Date(lastSavedAt).toLocaleString()}` : 'Changes are saved to IndexedDB in this browser.')}</span></div></div><button className="button" onClick={()=>void saveNow()}>Save now</button></div>
      <div className="settings-card"><h3>Editor</h3><label className="toggle-row"><span>Show minimap</span><input type="checkbox" checked={workspace.settings.showMiniMap} onChange={e=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,showMiniMap:e.target.checked}}))}/></label><label className="toggle-row"><span>Snap to grid</span><input type="checkbox" checked={workspace.settings.snapToGrid} onChange={e=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,snapToGrid:e.target.checked}}))}/></label><label className="toggle-row"><span>Keyboard shortcuts</span><input type="checkbox" checked={workspace.settings.keyboardShortcuts} onChange={e=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,keyboardShortcuts:e.target.checked}}))}/></label><label className="toggle-row"><span>Performance overlay by default</span><input type="checkbox" checked={workspace.settings.showPerformanceOverlay} onChange={e=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,showPerformanceOverlay:e.target.checked}}))}/></label><label>Freshness threshold (hours)<input type="number" min={1} max={720} value={workspace.settings.freshnessThresholdHours} onChange={e=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,freshnessThresholdHours:Math.max(1,Number(e.target.value)||48)}}))}/></label><p className="muted-small"><strong>Ctrl/⌘ K</strong> command palette · <strong>Ctrl/⌘ Z/Y</strong> undo/redo · <strong>Delete</strong> remove · <strong>?</strong> help</p></div>
      <div className="settings-card"><h3>Portable workspace & data</h3><p>One importer recognizes current workspaces, legacy V1.x backups, performance snapshots and actual-path snapshots. Every import is previewed before it changes local data.</p><div className="stack-actions"><button className="button" onClick={()=>downloadWorkspace(workspace)}><Download size={16}/> Export .fjs</button><button className="button" onClick={()=>inputRef.current?.click()}><FileUp size={16}/> Preview & import data</button><input hidden ref={inputRef} type="file" accept=".fjs,.json,application/json" onChange={e=>{void readImport(e.target.files?.[0]); e.currentTarget.value='';}}/></div></div>
      <div className="settings-card recovery-card"><div className="card-heading-row"><div><h3>Recovery snapshots</h3><p>Recent local versions are retained automatically before newer workspace states are written.</p></div>{recoveries.length>0&&<button className="icon-button danger-icon" onClick={()=>void clearRecoveries()} title="Clear recovery snapshots"><Trash2 size={14}/></button>}</div>{recoveries.length===0?<div className="empty-mini">Recovery history appears after the workspace has been saved and changed.</div>:<div className="recovery-list">{recoveries.map(item=><div className="recovery-row" key={item.key}><div><strong>{item.workspace.name}</strong><span>{new Date(item.createdAt).toLocaleString()} · {item.workspace.journeys.length} journeys</span></div><button className="button compact" onClick={()=>void restore(item.key)}>Restore</button></div>)}</div>}</div>
      <div className="settings-card"><h3>Data mapping exports</h3><p>Export stable IDs for an external analytics process, warehouse query or connector to map metrics and observed paths back to the visual journey.</p><div className="stack-actions"><button className="button" onClick={()=>downloadPerformanceMap(workspace)}><FileDown size={16}/> Export performance map</button><button className="button" onClick={()=>downloadActualPathMap(workspace)}><FileDown size={16}/> Export actual-path map</button></div></div>
      <div className="settings-card"><h3>Guided onboarding</h3><p>Restart the short product tour for this workspace. It explains journeys, intelligence data, reusable architecture and sharing.</p><button className="button" onClick={()=>updateWorkspace(ws=>({...ws,settings:{...ws.settings,onboardingComplete:false}}))}><GraduationCap size={16}/> Restart product tour</button></div>
      <div className="settings-card data-inventory"><h3>Data inventory</h3><div className="inventory-row"><Database size={15}/><div><strong>{workspace.performanceSnapshots.length} performance snapshot{workspace.performanceSnapshots.length===1?'':'s'}</strong><span>{workspace.performanceSnapshots.map(s=>s.period).join(' · ') || 'None imported'}</span></div></div><div className="inventory-row"><Database size={15}/><div><strong>{workspace.actualPathSnapshots.length} actual-path snapshot{workspace.actualPathSnapshots.length===1?'':'s'}</strong><span>{workspace.actualPathSnapshots.map(s=>s.period).join(' · ') || 'None imported'}</span></div></div><div className="inventory-row"><Database size={15}/><div><strong>{workspace.metricDictionary.length} KPI definitions</strong><span>Editable in Insights & Data.</span></div></div></div>
      <div className="settings-card danger-zone"><h3>Local data</h3><p>Remove the active workspace from this browser. Recovery snapshots remain available until separately cleared.</p><button className="button danger" onClick={()=>{if(window.confirm('Remove local workspace?')) void resetWorkspace();}}><RotateCcw size={16}/> Clear local workspace</button></div>
    </div>
    {pendingImport&&<ImportPreviewDialog imported={pendingImport.imported} preview={pendingImport.preview} onCancel={()=>setPendingImport(null)} onConfirm={applyImport}/>} 
  </section>;
}

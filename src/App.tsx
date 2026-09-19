import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar, type AppView } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AboutView } from './components/AboutView';
import { Onboarding } from './features/workspace/Onboarding';
import { JourneysView } from './features/journeys/JourneysView';
import { JourneyEditor } from './features/journeys/JourneyEditor';
import { TemplatesView } from './features/templates/TemplatesView';
import { MasterView } from './features/journeys/MasterView';
import { ComponentsView } from './features/journeys/ComponentsView';
import { InsightsView } from './features/insights/InsightsView';
import { SettingsView } from './features/workspace/SettingsView';
import { ShareView } from './features/workspace/ShareView';
import { WelcomeTour } from './components/WelcomeTour';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { HelpDrawer } from './components/HelpDrawer';
import { ImportPreviewDialog } from './components/ImportPreviewDialog';
import { useWorkspace } from './store/WorkspaceContext';
import { downloadWorkspace, importPreview, parseStudioDataFile, type StudioImport, type StudioImportPreview } from './lib/files';
import { journeyFromTemplate } from './lib/workspace';
import { ensureMetricDictionary } from './lib/performance';
import type { Journey } from './types/domain';

interface PendingImport { imported: StudioImport; preview: StudioImportPreview }

export default function App() {
  const { workspace, loading, saveState, lastSavedAt, saveError, setWorkspace, updateWorkspace, saveNow } = useWorkspace();
  const [view, setView] = useState<AppView>('journeys');
  const [openJourney, setOpenJourney] = useState<Journey | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function readImport(file?: File) {
    if (!file) return;
    try {
      const imported = await parseStudioDataFile(file);
      setPendingImport({ imported, preview: importPreview(imported) });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Import failed');
    }
  }

  function applyImport(imported: StudioImport) {
    setPendingImport(null);
    if (imported.kind === 'workspace') {
      setWorkspace(imported.workspace);
      setOpenJourney(null);
      setView('journeys');
      return;
    }
    if (imported.kind === 'performance') {
      updateWorkspace(ws => {
        const snapshots = [...ws.performanceSnapshots.filter(snapshot => snapshot.id !== imported.snapshot.id), imported.snapshot];
        return { ...ws, performanceSnapshots: snapshots, metricDictionary: ensureMetricDictionary(ws.metricDictionary, snapshots), settings: { ...ws.settings, activePerformanceSnapshotId: imported.snapshot.id } };
      });
      setView('insights');
      return;
    }
    updateWorkspace(ws => ({ ...ws, actualPathSnapshots: [...ws.actualPathSnapshots.filter(snapshot => snapshot.id !== imported.snapshot.id), imported.snapshot], settings: { ...ws.settings, activeActualPathSnapshotId: imported.snapshot.id } }));
    setView('insights');
  }

  function newJourney() {
    if (!workspace) return;
    const template = workspace.templates[0];
    if (!template) return;
    const name = window.prompt('Journey name', 'New customer journey');
    if (!name) return;
    const journey = journeyFromTemplate(template, name, workspace.organization);
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, journey] }));
    setOpenJourney(journey);
  }

  const commands = useMemo<CommandAction[]>(() => {
    if (!workspace) return [];
    const viewLabels: Array<[AppView, string]> = [['journeys','Journeys'],['master','Master View'],['insights','Insights & Data'],['templates','Templates'],['components','Component Library'],['share','Share & Portfolio'],['settings','Settings'],['about','About']];
    const actions: CommandAction[] = viewLabels.map(([id,label]) => ({ id:`view-${id}`, label:`Go to ${label}`, group:'Navigation', keywords:id, run:()=>{setOpenJourney(null);setView(id);} }));
    actions.unshift({ id:'new-journey', label:'Create new journey', group:'Create', run:newJourney });
    actions.push({ id:'import', label:'Import workspace or data', group:'Workspace', run:()=>inputRef.current?.click() });
    actions.push({ id:'export', label:'Export current workspace', group:'Workspace', run:()=>downloadWorkspace(workspace) });
    if (!openJourney) actions.push({ id:'save-now', label:'Save now', group:'Workspace', shortcut:'Ctrl/⌘ S', run:()=>void saveNow() });
    actions.push({ id:'help', label:'Open contextual help', group:'Help', shortcut:'?', run:()=>setHelpOpen(true) });
    for (const journey of workspace.journeys) actions.push({ id:`journey-${journey.id}`, label:journey.name, group:'Open journey', keywords:`${journey.audience} ${journey.product} ${journey.status}`, run:()=>setOpenJourney(journey) });
    if (openJourney) actions.unshift({ id:'close-journey', label:'Close current journey', group:'Journey editor', run:()=>setOpenJourney(null) });
    return actions;
  }, [workspace, openJourney, saveNow]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editable = target?.matches('input, textarea, select, [contenteditable="true"]');
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); return; }
      if (!editable && event.key === '?') { event.preventDefault(); setHelpOpen(value => !value); return; }
      if (!openJourney && mod && event.key.toLowerCase() === 's') { event.preventDefault(); void saveNow(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openJourney, saveNow]);

  if (loading) return <div className="loading-screen">Loading Famme Journey Studio…</div>;
  if (!workspace) return <Onboarding />;

  const hiddenInput = <input ref={inputRef} hidden type="file" accept=".fjs,.json,application/json" onChange={event => { void readImport(event.target.files?.[0]); event.currentTarget.value=''; }}/>;
  const overlays = <>{hiddenInput}<CommandPalette open={commandOpen} actions={commands} onClose={()=>setCommandOpen(false)}/>{pendingImport && <ImportPreviewDialog imported={pendingImport.imported} preview={pendingImport.preview} onCancel={()=>setPendingImport(null)} onConfirm={applyImport}/>}</>;

  if (openJourney) return <><JourneyEditor journey={workspace.journeys.find(journey => journey.id === openJourney.id) ?? openJourney} onClose={()=>setOpenJourney(null)}/><HelpDrawer view="journeys" open={helpOpen} onClose={()=>setHelpOpen(false)}/>{overlays}</>;

  const titleMap: Record<AppView,string> = { journeys:'Journeys', master:'Master View', insights:'Insights & Data', templates:'Templates', components:'Component Library', share:'Share & Portfolio', settings:'Settings', about:'About' };
  return <div className="app-shell"><Sidebar view={view} onView={setView}/><main className="main-shell"><Topbar title={titleMap[view]} subtitle={`${workspace.organization} · ${workspace.name}`} onNew={view==='journeys'?newJourney:undefined} onExport={()=>downloadWorkspace(workspace)} onImport={()=>inputRef.current?.click()} onCommand={()=>setCommandOpen(true)} onHelp={()=>setHelpOpen(value=>!value)} saveState={saveState} lastSavedAt={lastSavedAt} saveError={saveError}/><div className="main-content">{view==='journeys'&&<JourneysView onOpen={setOpenJourney}/>} {view==='master'&&<MasterView/>} {view==='insights'&&<InsightsView/>} {view==='templates'&&<TemplatesView onOpen={setOpenJourney}/>} {view==='components'&&<ComponentsView/>} {view==='share'&&<ShareView/>} {view==='settings'&&<SettingsView/>} {view==='about'&&<AboutView/>}</div></main><WelcomeTour/><HelpDrawer view={view} open={helpOpen} onClose={()=>setHelpOpen(false)}/>{overlays}</div>;
}

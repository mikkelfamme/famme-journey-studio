import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar, type AppView } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AboutView } from './components/AboutView';
import { Onboarding } from './features/workspace/Onboarding';
import { JourneysView } from './features/journeys/JourneysView';
import { JourneyEditor } from './features/journeys/JourneyEditor';
import { JourneyViewer } from './features/journeys/JourneyViewer';
import { TemplatesView } from './features/templates/TemplatesView';
import { TemplateEditor } from './features/templates/TemplateEditor';
import { MasterView } from './features/journeys/MasterView';
import { ComponentsView } from './features/journeys/ComponentsView';
import { InsightsView } from './features/insights/InsightsView';
import { SettingsView } from './features/workspace/SettingsView';
import { ShareView } from './features/workspace/ShareView';
import { WelcomeTour } from './components/WelcomeTour';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { HelpDrawer } from './components/HelpDrawer';
import { ImportPreviewDialog } from './components/ImportPreviewDialog';
import { UpdateToast } from './components/UpdateToast';
import { useWorkspace } from './store/WorkspaceContext';
import { downloadWorkspace, importPreview, parseStudioDataFile, type StudioImport, type StudioImportPreview } from './lib/files';
import { journeyFromTemplate } from './lib/workspace';
import { ensureMetricDictionary } from './lib/performance';
import type { Journey, JourneyTemplate } from './types/domain';
import { useI18n } from './i18n';

interface PendingImport { imported: StudioImport; preview: StudioImportPreview }
type JourneyOpenState = { journey: Journey; mode: 'edit' | 'view'; nodeId?: string } | null;

export default function App() {
  const { workspace, loading, saveState, lastSavedAt, saveError, setWorkspace, updateWorkspace, saveNow } = useWorkspace();
  const { t } = useI18n();
  const [view, setView] = useState<AppView>('journeys');
  const [openJourney, setOpenJourney] = useState<JourneyOpenState>(null);
  const [openTemplate, setOpenTemplate] = useState<JourneyTemplate | null>(null);
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
      setOpenTemplate(null);
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
    setOpenJourney({ journey, mode: 'edit' });
  }

  const commands = useMemo<CommandAction[]>(() => {
    if (!workspace) return [];
    const viewLabels: Array<[AppView, string]> = [['journeys',t('nav.journeys')],['master',t('nav.master')],['insights',t('nav.insights')],['templates',t('nav.templates')],['components',t('nav.components')],['share',t('nav.share')],['settings',t('nav.settings')],['about',t('nav.about')]];
    const actions: CommandAction[] = viewLabels.map(([id,label]) => ({ id:`view-${id}`, label:`Go to ${label}`, group:'Navigation', keywords:id, run:()=>{setOpenJourney(null);setOpenTemplate(null);setView(id);} }));
    actions.unshift({ id:'new-journey', label:t('topbar.newJourney'), group:'Create', run:newJourney });
    actions.push({ id:'import', label:t('topbar.import'), group:'Workspace', run:()=>inputRef.current?.click() });
    actions.push({ id:'export', label:t('topbar.export'), group:'Workspace', run:()=>downloadWorkspace(workspace) });
    if (!openJourney && !openTemplate) actions.push({ id:'save-now', label:t('settings.saveNow'), group:'Workspace', shortcut:'Ctrl/⌘ S', run:()=>void saveNow() });
    actions.push({ id:'help', label:'Open contextual help', group:'Help', shortcut:'?', run:()=>setHelpOpen(true) });
    for (const journey of workspace.journeys) {
      actions.push({ id:`journey-edit-${journey.id}`, label:`${t('journeys.edit')}: ${journey.name}`, group:'Open journey', keywords:`${journey.audience} ${journey.product} ${journey.status}`, run:()=>setOpenJourney({ journey, mode:'edit' }) });
      actions.push({ id:`journey-view-${journey.id}`, label:`${t('journeys.view')}: ${journey.name}`, group:'Open journey', keywords:`${journey.audience} ${journey.product} ${journey.status}`, run:()=>setOpenJourney({ journey, mode:'view' }) });
      for (const node of journey.nodes) {
        const tracking = node.data.tracking.map(item => `${item.platform} ${item.event} ${item.status}`).join(' ');
        const creatives = node.data.creatives.map(item => `${item.name} ${item.format} ${item.headline ?? ''} ${item.finalUrl ?? ''}`).join(' ');
        actions.push({ id:`node-${journey.id}-${node.id}`, label:`${node.data.label} · ${journey.name}`, group:'Journey content', keywords:`${node.data.type} ${node.data.stage} ${node.data.description ?? ''} ${node.data.url ?? ''} ${tracking} ${creatives}`, run:()=>setOpenJourney({ journey, mode:'view', nodeId:node.id }) });
      }
    }
    for (const template of workspace.templates) {
      actions.push({ id:`template-${template.id}`, label:`Edit template: ${template.name}`, group:'Templates', keywords:`${template.category} ${template.scope} ${template.tags.join(' ')} ${template.author}`, run:()=>setOpenTemplate(template) });
    }
    if (openJourney) actions.unshift({ id:'close-journey', label:'Close current journey', group:'Journey', run:()=>setOpenJourney(null) });
    if (openTemplate) actions.unshift({ id:'close-template', label:'Close template editor', group:'Templates', run:()=>setOpenTemplate(null) });
    return actions;
  }, [workspace, openJourney, openTemplate, saveNow, t]);

  useEffect(() => {
    if (workspace?.settings.language) document.documentElement.lang = workspace.settings.language;
  }, [workspace?.settings.language]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editable = target?.matches('input, textarea, select, [contenteditable="true"]');
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandOpen(true); return; }
      if (!editable && event.key === '?') { event.preventDefault(); setHelpOpen(value => !value); return; }
      if (!openJourney && !openTemplate && mod && event.key.toLowerCase() === 's') { event.preventDefault(); void saveNow(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openJourney, openTemplate, saveNow]);

  if (loading) return <div className="loading-screen">Loading Journey Studio…</div>;
  if (!workspace) return <><Onboarding/><UpdateToast/></>;

  const hiddenInput = <input ref={inputRef} hidden type="file" accept=".fjs,.json,application/json" onChange={event => { void readImport(event.target.files?.[0]); event.currentTarget.value=''; }}/>;
  const overlays = <>{hiddenInput}<CommandPalette open={commandOpen} actions={commands} onClose={()=>setCommandOpen(false)}/>{pendingImport && <ImportPreviewDialog imported={pendingImport.imported} preview={pendingImport.preview} onCancel={()=>setPendingImport(null)} onConfirm={applyImport}/>}</>;

  if (openTemplate) {
    const currentTemplate = workspace.templates.find(template => template.id === openTemplate.id) ?? openTemplate;
    return <><TemplateEditor template={currentTemplate} onClose={()=>setOpenTemplate(null)}/><UpdateToast/>{overlays}</>;
  }

  if (openJourney) {
    const current = workspace.journeys.find(journey => journey.id === openJourney.journey.id) ?? openJourney.journey;
    if (openJourney.mode === 'view') return <><JourneyViewer journey={current} initialSelectedId={openJourney.nodeId} onClose={()=>setOpenJourney(null)} onEdit={()=>setOpenJourney({ journey: current, mode:'edit', nodeId: openJourney.nodeId })}/><UpdateToast/>{overlays}</>;
    return <><JourneyEditor journey={current} initialNodeId={openJourney.nodeId} onClose={()=>setOpenJourney(null)}/><HelpDrawer view="journeys" open={helpOpen} onClose={()=>setHelpOpen(false)}/><UpdateToast/>{overlays}</>;
  }

  const titleMap: Record<AppView,string> = { journeys:t('nav.journeys'), master:t('nav.master'), insights:t('nav.insights'), templates:t('nav.templates'), components:t('nav.components'), share:t('nav.share'), settings:t('nav.settings'), about:t('nav.about') };
  return <div className="app-shell"><Sidebar view={view} onView={setView}/><main className="main-shell"><Topbar title={titleMap[view]} subtitle={`${workspace.organization} · ${workspace.name}`} onNew={view==='journeys'?newJourney:undefined} onExport={()=>downloadWorkspace(workspace)} onImport={()=>inputRef.current?.click()} onCommand={()=>setCommandOpen(true)} onHelp={()=>setHelpOpen(value=>!value)} saveState={saveState} lastSavedAt={lastSavedAt} saveError={saveError}/><div className="main-content">{view==='journeys'&&<JourneysView onEdit={journey=>setOpenJourney({ journey, mode:'edit' })} onView={journey=>setOpenJourney({ journey, mode:'view' })}/>} {view==='master'&&<MasterView/>} {view==='insights'&&<InsightsView/>} {view==='templates'&&<TemplatesView onOpen={journey=>setOpenJourney({ journey, mode:'edit' })} onEditTemplate={template=>setOpenTemplate(template)}/>} {view==='components'&&<ComponentsView/>} {view==='share'&&<ShareView/>} {view==='settings'&&<SettingsView/>} {view==='about'&&<AboutView/>}</div></main><WelcomeTour/><HelpDrawer view={view} open={helpOpen} onClose={()=>setHelpOpen(false)}/><UpdateToast/>{overlays}</div>;
}

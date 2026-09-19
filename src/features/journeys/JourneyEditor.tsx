import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  reconnectEdge,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlignHorizontalJustifyStart, ArrowLeft, BarChart3, Copy, FileText, GitCompareArrows, HeartPulse, Layers3, Redo2, Save, Shapes, Trash2, Undo2, Waypoints } from 'lucide-react';
import type { ComponentDefinition, CrossJourneyLink, FunnelStage, Journey, JourneyNodeData, JourneyNodeType, JourneyVersion } from '../../types/domain';
import { makeId } from '../../lib/ids';
import { generateJourneyPlan } from '../../lib/plan';
import { createJourneyVersion, restoreVersion } from '../../lib/versions';
import { componentFromNode, syncedNodeData } from '../../lib/workspace';
import { useWorkspace } from '../../store/WorkspaceContext';
import { EdgePropertiesPanel } from './EdgePropertiesPanel';
import { HealthPanel } from './HealthPanel';
import { JourneyNodeComponent } from './JourneyNode';
import { NodePalette } from './NodePalette';
import { PropertiesPanel } from './PropertiesPanel';
import { VersionsPanel } from './VersionsPanel';
import { ActualPanel } from './ActualPanel';
import { activeActualSnapshot, pathsForJourney } from '../../lib/actual';
import { activePerformanceSnapshot, mappingQuality, preferredMetrics, recordsForNode } from '../../lib/performance';
import { useHistoryState } from '../../lib/useHistory';

const nodeTypes = { journey: JourneyNodeComponent };
type InspectorMode = 'properties' | 'plan' | 'health' | 'versions' | 'actual';

export function JourneyEditor({ journey, onClose }: { journey: Journey; onClose: () => void }) {
  const { workspace, updateJourney, updateWorkspace } = useWorkspace();
  const draftHistory = useHistoryState<Journey>(structuredClone(journey));
  const draft = draftHistory.value;
  const setDraft = draftHistory.set;
  const setDraftTransient = draftHistory.setTransient;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('properties');
  const [showPerformance, setShowPerformance] = useState(Boolean(workspace?.settings.showPerformanceOverlay));
  const selected = selectedIds.length === 1 ? draft.nodes.find(n => n.id === selectedIds[0]) ?? null : null;
  const selectedEdge = selectedEdgeId ? draft.edges.find(e => e.id === selectedEdgeId) ?? null : null;

  useEffect(() => {
    draftHistory.reset(structuredClone(journey));
    setSelectedIds([]);
    setSelectedEdgeId(null);
  }, [journey.id]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const setter = changes.every(change => change.type === 'select') ? setDraftTransient : setDraft;
    setter(d => ({ ...d, nodes: applyNodeChanges(changes, d.nodes) }));
  }, [setDraft, setDraftTransient]);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const setter = changes.every(change => change.type === 'select') ? setDraftTransient : setDraft;
    setter(d => ({ ...d, edges: applyEdgeChanges(changes, d.edges) }));
  }, [setDraft, setDraftTransient]);
  const onConnect = useCallback((connection: Connection) => setDraft(d => ({ ...d, edges: addEdge({ ...connection, id: makeId('edge'), type: 'smoothstep', data: { label: '', condition: '', signal: '', timing: '', comment: '' } }, d.edges) })), []);
  const onReconnect = useCallback((oldEdge: Edge, connection: Connection) => setDraft(d => ({ ...d, edges: reconnectEdge(oldEdge, connection, d.edges) })), []);
  const onSelectionChange = useCallback((selection: OnSelectionChangeParams) => {
    setSelectedIds(selection.nodes.map(node => node.id));
    setSelectedEdgeId(selection.nodes.length === 0 && selection.edges.length === 1 ? selection.edges[0].id : null);
  }, []);

  function addNode(type: JourneyNodeType, label: string, stage: FunnelStage) {
    const count = draft.nodes.length;
    const id = makeId('node');
    setDraft(d => ({ ...d, nodes: [...d.nodes, { id, type: 'journey', position: { x: 140 + (count % 4) * 220, y: 100 + Math.floor(count / 4) * 150 }, data: { label, type, stage, description: '', tracking: [], creatives: [], annotations: [] } }] }));
    setSelectedIds([id]);
    setSelectedEdgeId(null);
    setInspectorMode('properties');
  }

  function addComponent(component: ComponentDefinition) {
    const count = draft.nodes.length;
    const id = makeId('node');
    setDraft(d => ({ ...d, nodes: [...d.nodes, { id, type: 'journey', position: { x: 160 + (count % 4) * 220, y: 120 + Math.floor(count / 4) * 150 }, data: syncedNodeData(component) }] }));
    setSelectedIds([id]);
    setSelectedEdgeId(null);
    setInspectorMode('properties');
  }

  function updateSelected(data: JourneyNodeData) {
    if (!selected) return;
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => n.id === selected.id ? { ...n, data } : n) }));
  }

  function clearSelection() {
    setSelectedIds([]);
    setSelectedEdgeId(null);
    setDraftTransient(d => ({ ...d, nodes: d.nodes.map(n => n.selected ? { ...n, selected: false } : n), edges: d.edges.map(e => e.selected ? { ...e, selected: false } : e) }));
  }

  function deleteSelection() {
    if (selectedIds.length === 0 && !selectedEdgeId) return;
    if (selectedIds.length === 0 && selectedEdgeId) { setDraft(d => ({ ...d, edges: d.edges.filter(e => e.id !== selectedEdgeId) })); setSelectedEdgeId(null); return; }
    const set = new Set(selectedIds);
    setDraft(d => ({
      ...d,
      nodes: d.nodes.filter(n => !set.has(n.id)),
      edges: d.edges.filter(e => !set.has(e.source) && !set.has(e.target)),
      crossJourneyLinks: d.crossJourneyLinks.filter(link => !set.has(link.sourceNodeId))
    }));
    setSelectedIds([]);
    setSelectedEdgeId(null);
  }

  function duplicateSelection() {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    setDraft(d => {
      const idMap = new Map<string, string>();
      const copies = d.nodes.filter(n => selectedSet.has(n.id)).map(n => {
        const id = makeId('node'); idMap.set(n.id, id);
        return { ...structuredClone(n), id, position: { x: n.position.x + 40, y: n.position.y + 40 }, selected: true };
      });
      const copiedEdges = d.edges.filter(e => selectedSet.has(e.source) && selectedSet.has(e.target)).map(e => ({ ...structuredClone(e), id: makeId('edge'), source: idMap.get(e.source)!, target: idMap.get(e.target)!, selected: false }));
      const unselected = d.nodes.map(n => n.selected ? { ...n, selected: false } : n);
      setSelectedIds(copies.map(n => n.id));
      return { ...d, nodes: [...unselected, ...copies], edges: [...d.edges, ...copiedEdges] };
    });
  }

  function setSelectionStage(stage: FunnelStage) {
    const set = new Set(selectedIds);
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => set.has(n.id) ? { ...n, data: { ...n.data, stage } } : n) }));
  }

  function alignSelectionLeft() {
    if (selectedIds.length < 2) return;
    const set = new Set(selectedIds);
    const xs = draft.nodes.filter(n => set.has(n.id)).map(n => n.position.x);
    const x = Math.min(...xs);
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => set.has(n.id) ? { ...n, position: { ...n.position, x } } : n) }));
  }

  function distributeSelection() {
    if (selectedIds.length < 3) return;
    const set = new Set(selectedIds);
    const nodes = draft.nodes.filter(n => set.has(n.id)).sort((a,b) => a.position.x - b.position.x);
    const min = nodes[0].position.x; const max = nodes[nodes.length - 1].position.x; const gap = (max - min) / (nodes.length - 1);
    const map = new Map(nodes.map((n,i) => [n.id, min + gap * i]));
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => map.has(n.id) ? { ...n, position: { ...n.position, x: map.get(n.id)! } } : n) }));
  }

  function save() { updateJourney(draft); draftHistory.reset(structuredClone(draft)); }

  function saveAsTemplate() {
    if (!workspace) return;
    const name = window.prompt('Template name', draft.name);
    if (!name) return;
    updateWorkspace(ws => ({ ...ws, templates: [...ws.templates, { id: makeId('template'), name, description: draft.description, category: 'Custom', scope: draft.scope, system: false, nodes: structuredClone(draft.nodes.map(n => ({ ...n, selected: false }))), edges: structuredClone(draft.edges.map(e => ({ ...e, selected: false }))), planInputs: structuredClone(draft.planInputs) }] }));
  }

  function saveSelectedAsComponent() {
    if (!selected || !workspace) return;
    const name = window.prompt('Component name', selected.data.label); if (!name) return;
    const description = window.prompt('Component description', selected.data.description ?? '') ?? '';
    const component = componentFromNode(name, description, selected.data);
    updateWorkspace(ws => ({ ...ws, components: [...ws.components, component] }));
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => n.id === selected.id ? { ...n, data: { ...n.data, componentId: component.id, componentSyncedAt: component.updatedAt } } : n) }));
  }

  function updateComponentFromSelected() {
    if (!selected?.data.componentId) return;
    const componentId = selected.data.componentId;
    const stamp = new Date().toISOString();
    updateWorkspace(ws => ({ ...ws, components: ws.components.map(c => c.id === componentId ? { ...c, nodeData: structuredClone({ ...selected.data, annotations: [], componentId: undefined, componentSyncedAt: undefined }), updatedAt: stamp } : c) }));
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => n.id === selected.id ? { ...n, data: { ...n.data, componentSyncedAt: stamp } } : n) }));
  }

  function syncSelectedComponent() {
    if (!selected?.data.componentId || !workspace) return;
    const component = workspace.components.find(c => c.id === selected.data.componentId); if (!component) return;
    setDraft(d => ({ ...d, nodes: d.nodes.map(n => n.id === selected.id ? { ...n, data: { ...syncedNodeData(component), annotations: n.data.annotations } } : n) }));
  }

  function unlinkSelectedComponent() {
    if (!selected) return;
    updateSelected({ ...selected.data, componentId: undefined, componentSyncedAt: undefined });
  }

  function addCrossLink(link: Omit<CrossJourneyLink, 'id' | 'sourceNodeId'>) {
    if (!selected) return;
    setDraft(d => ({ ...d, crossJourneyLinks: [...d.crossJourneyLinks, { ...link, id: makeId('crosslink'), sourceNodeId: selected.id }] }));
  }

  function removeCrossLink(id: string) { setDraft(d => ({ ...d, crossJourneyLinks: d.crossJourneyLinks.filter(link => link.id !== id) })); }

  function saveVersion() {
    const defaultLabel = `v${draft.versions.length + 1}`;
    const label = window.prompt('Version label', defaultLabel); if (!label) return;
    const note = window.prompt('Version note (optional)', '') ?? '';
    setDraft(d => ({ ...d, versions: [...d.versions, createJourneyVersion(d, label, note)] }));
  }

  function restoreJourneyVersion(version: JourneyVersion) {
    if (!window.confirm(`Restore ${version.label}? A new version of the current state is recommended before restoring.`)) return;
    setDraft(d => restoreVersion(d, version));
    clearSelection();
  }

  function deleteVersion(versionId: string) {
    if (!window.confirm('Delete this saved version?')) return;
    setDraft(d => ({ ...d, versions: d.versions.filter(v => v.id !== versionId) }));
  }

  useEffect(() => {
    if (!workspace?.settings.keyboardShortcuts) return;
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 's') { event.preventDefault(); save(); }
      if (mod && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelection(); }
      if (mod && event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); draftHistory.undo(); }
      if ((mod && event.key.toLowerCase() === 'y') || (mod && event.shiftKey && event.key.toLowerCase() === 'z')) { event.preventDefault(); draftHistory.redo(); }
      if ((event.key === 'Delete' || event.key === 'Backspace') && (selectedIds.length || selectedEdgeId)) { event.preventDefault(); deleteSelection(); }
      if (event.key === 'Escape') clearSelection();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [workspace?.settings.keyboardShortcuts, draft, selectedIds, selectedEdgeId, draftHistory.canUndo, draftHistory.canRedo]);

  const plan = useMemo(() => generateJourneyPlan(draft, workspace?.journeys ?? [], workspace ?? undefined), [draft, workspace]);
  const activeSnapshot = workspace ? activePerformanceSnapshot(workspace) : undefined;
  const actualSnapshot = workspace ? activeActualSnapshot(workspace) : undefined;
  const actualPaths = workspace ? pathsForJourney(workspace, draft.id, actualSnapshot) : [];
  const flowNodes = useMemo(() => draft.nodes.map(node => {
    const data: JourneyNodeData = { ...node.data, runtimePerformance: undefined, runtimeActualCount: undefined };
    if (showPerformance && workspace && activeSnapshot) {
      const records = recordsForNode(workspace, draft.id, node.id, activeSnapshot);
      const record = [...records].sort((a,b) => {
        const rank = (q: string) => q === 'direct' ? 2 : q === 'proxy' ? 1 : 0;
        return rank(mappingQuality(workspace,b)) - rank(mappingQuality(workspace,a));
      })[0];
      if (record) data.runtimePerformance = {
        source: record.source,
        quality: mappingQuality(workspace, record),
        metrics: preferredMetrics(workspace, record, 2).map(metric => ({ key: metric.key, label: metric.label, formatted: metric.formatted }))
      };
    }
    if (inspectorMode === 'actual' && actualSnapshot) {
      const count = actualPaths.reduce((sum, path) => sum + path.steps.filter(step => step.nodeId === node.id).length, 0);
      if (count) data.runtimeActualCount = count;
    }
    return { ...node, data };
  }), [draft.nodes, draft.id, showPerformance, workspace, activeSnapshot, actualSnapshot, actualPaths, inspectorMode]);

  function selectHealthNode(nodeId: string) {
    setSelectedIds([nodeId]);
    setSelectedEdgeId(null);
    setDraftTransient(d => ({ ...d, nodes: d.nodes.map(n => ({ ...n, selected: n.id === nodeId })) }));
    setInspectorMode('properties');
  }

  function closeEditor() {
    if (draftHistory.canUndo && !window.confirm('Close this journey without saving the latest editor changes?')) return;
    onClose();
  }

  return (
    <div className="editor-screen">
      <div className="editor-topbar">
        <button className="icon-button" onClick={closeEditor} title="Back"><ArrowLeft size={18} /></button>
        <div className="editor-title"><strong>{draft.name}</strong><span>{draft.status} · {draft.scope} · {selectedIds.length ? `${selectedIds.length} selected` : 'no selection'} {draftHistory.canUndo ? '· unsaved changes' : '· saved'}</span></div>
        <div className="editor-actions">
          <button className="icon-button" onClick={draftHistory.undo} disabled={!draftHistory.canUndo} title="Undo (Ctrl/⌘ Z)" aria-label="Undo"><Undo2 size={16}/></button>
          <button className="icon-button" onClick={draftHistory.redo} disabled={!draftHistory.canRedo} title="Redo (Ctrl/⌘ Y)" aria-label="Redo"><Redo2 size={16}/></button>
          <button className={`button ${inspectorMode === 'plan' ? 'active-button' : ''}`} onClick={() => setInspectorMode('plan')}><FileText size={16} /> Plan</button>
          <button className={`button ${inspectorMode === 'health' ? 'active-button' : ''}`} onClick={() => setInspectorMode('health')}><HeartPulse size={16} /> Health</button>
          <button className={`button ${inspectorMode === 'versions' ? 'active-button' : ''}`} onClick={() => setInspectorMode('versions')}><Layers3 size={16} /> Versions</button>
          <button className={`button ${inspectorMode === 'actual' ? 'active-button' : ''}`} onClick={() => setInspectorMode('actual')}><GitCompareArrows size={16} /> Plan vs Actual</button>
          <button className={`button ${showPerformance ? 'active-button' : ''}`} onClick={() => { const next=!showPerformance; setShowPerformance(next); updateWorkspace(ws=>({...ws,settings:{...ws.settings,showPerformanceOverlay:next}})); }}><BarChart3 size={16} /> Performance</button>
          <button className="button" onClick={saveAsTemplate}><Shapes size={16} /> Template</button>
          <button className="button primary" onClick={save}><Save size={16} /> Save</button>
        </div>
      </div>
      <div className="editor-layout">
        <NodePalette onAdd={addNode} components={workspace?.components ?? []} onAddComponent={addComponent} />
        <div className="canvas-wrap">
          <ReactFlow
            nodes={flowNodes}
            edges={draft.edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onSelectionChange={onSelectionChange}
            onNodeClick={() => { setSelectedEdgeId(null); setInspectorMode('properties'); }}
            onEdgeClick={(_, edge) => { setSelectedIds([]); setSelectedEdgeId(edge.id); setInspectorMode('properties'); }}
            onPaneClick={clearSelection}
            fitView
            snapToGrid={workspace?.settings.snapToGrid}
            snapGrid={[20, 20]}
            selectionOnDrag
            multiSelectionKeyCode="Shift"
            edgesReconnectable
          >
            <Background gap={20} size={1} />
            <Controls />
            {workspace?.settings.showMiniMap && <MiniMap pannable zoomable />}
          </ReactFlow>
          <div className="stage-legend"><span>TOP</span><span>MIDDLE</span><span>BOTTOM</span><span>LIFECYCLE</span></div>
          {selectedIds.length > 1 && <div className="bulk-toolbar">
            <strong>{selectedIds.length} selected</strong>
            <button className="mini-action" onClick={alignSelectionLeft}><AlignHorizontalJustifyStart size={14}/> Align left</button>
            <button className="mini-action" onClick={distributeSelection}><Waypoints size={14}/> Distribute</button>
            <select defaultValue="" onChange={e => { if (e.target.value) setSelectionStage(e.target.value as FunnelStage); e.target.value = ''; }}><option value="">Set stage…</option>{['top','middle','bottom','lifecycle'].map(s => <option key={s} value={s}>{s}</option>)}</select>
            <button className="mini-action" onClick={duplicateSelection}><Copy size={14}/> Duplicate</button>
            <button className="mini-action danger-icon" onClick={deleteSelection}><Trash2 size={14}/> Delete</button>
          </div>}
        </div>
        {inspectorMode === 'plan' ? (
          <aside className="editor-panel plan-panel"><div className="panel-heading">Generated journey plan</div><pre>{plan}</pre></aside>
        ) : inspectorMode === 'health' ? (
          <HealthPanel journey={draft} onSelectNode={selectHealthNode}/>
        ) : inspectorMode === 'versions' ? (
          <VersionsPanel journey={draft} onSaveVersion={saveVersion} onRestore={restoreJourneyVersion} onDelete={deleteVersion}/>
        ) : inspectorMode === 'actual' && workspace ? (
          <ActualPanel journey={draft} workspace={workspace}/>
        ) : selectedEdge ? (
          <EdgePropertiesPanel edge={selectedEdge} onChange={edge => setDraft(d => ({ ...d, edges: d.edges.map(e => e.id === edge.id ? edge : e) }))} onDelete={deleteSelection}/>
        ) : (
          <PropertiesPanel
            data={selected?.data ?? null}
            nodeId={selected?.id}
            currentJourneyId={draft.id}
            journeys={workspace?.journeys ?? []}
            components={workspace?.components ?? []}
            crossLinks={draft.crossJourneyLinks}
            onChange={updateSelected}
            onDelete={deleteSelection}
            onSaveComponent={saveSelectedAsComponent}
            onUpdateComponent={updateComponentFromSelected}
            onSyncComponent={syncSelectedComponent}
            onUnlinkComponent={unlinkSelectedComponent}
            onAddCrossLink={addCrossLink}
            onRemoveCrossLink={removeCrossLink}
          />
        )}
      </div>
    </div>
  );
}

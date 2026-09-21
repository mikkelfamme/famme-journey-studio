import { useCallback, useMemo, useState } from 'react';
import { Background, Controls, MarkerType, ReactFlow, addEdge, applyEdgeChanges, applyNodeChanges, reconnectEdge, type Connection, type Edge, type EdgeChange, type NodeChange, type OnSelectionChangeParams } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AlertTriangle, ArrowLeft, LayoutGrid, Maximize2, Save, Share2, Tag } from 'lucide-react';
import type { ComponentDefinition, FunnelStage, Journey, JourneyNodeData, JourneyNodeType, JourneyTemplate, WorkspaceScope } from '../../types/domain';
import { makeId } from '../../lib/ids';
import { compactStageLayout } from '../../lib/layout';
import { STAGE_NODE_X, isStageMismatch } from '../../lib/stageGeometry';
import { downloadJourneyTemplate } from '../../lib/templateFiles';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useI18n } from '../../i18n';
import { JourneyNodeComponent } from '../journeys/JourneyNode';
import { NodePalette } from '../journeys/NodePalette';
import { PropertiesPanel } from '../journeys/PropertiesPanel';
import { EdgePropertiesPanel } from '../journeys/EdgePropertiesPanel';
import { StageBackdrop } from '../journeys/StageBackdrop';
import type { CanvasViewport } from '../../lib/stageGeometry';
import { componentFromNode, syncedNodeData } from '../../lib/workspace';
import { normalizeJourneyEdgeHandles } from '../../lib/flowHandles';

const nodeTypes = { journey: JourneyNodeComponent };

function asJourney(template: JourneyTemplate): Journey {
  const now = new Date().toISOString();
  return {
    id: `template:${template.id}`,
    name: template.name,
    description: template.description,
    audience: '', product: '', scope: template.scope, status: 'draft', primaryConversion: '', owner: template.author,
    createdAt: template.createdAt || now, updatedAt: template.updatedAt || now,
    nodes: template.nodes, edges: template.edges, planInputs: template.planInputs ?? {}, crossJourneyLinks: [], annotations: [], versions: []
  };
}

export function TemplateEditor({ template, onClose }: { template: JourneyTemplate; onClose: () => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [draft, setDraft] = useState<JourneyTemplate>(() => {
    const initial = structuredClone(template);
    initial.edges = normalizeJourneyEdgeHandles(initial.nodes, initial.edges);
    return initial;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>({ x:0,y:0,zoom:1 });
  const [flowInstance, setFlowInstance] = useState<{ fitView: (o: { padding:number; duration:number; minZoom:number; maxZoom:number }) => void } | null>(null);
  const selected = selectedIds.length === 1 ? draft.nodes.find(node => node.id === selectedIds[0]) ?? null : null;
  const selectedEdge = selectedEdgeId ? draft.edges.find(edge => edge.id === selectedEdgeId) ?? null : null;

  const onNodesChange = useCallback((changes: NodeChange[]) => setDraft(current => ({ ...current, nodes: applyNodeChanges(changes, current.nodes) as JourneyTemplate['nodes'] })), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setDraft(current => ({ ...current, edges: applyEdgeChanges(changes, current.edges) as JourneyTemplate['edges'] })), []);
  const onConnect = useCallback((connection: Connection) => setDraft(current => ({ ...current, edges: addEdge({ ...connection, id: makeId('edge'), type:'smoothstep' }, current.edges) })), []);
  const onReconnect = useCallback((oldEdge: Edge, connection: Connection) => setDraft(current => ({ ...current, edges: reconnectEdge(oldEdge, connection, current.edges) })), []);
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => { setSelectedIds(params.nodes.map(node => node.id)); setSelectedEdgeId(params.edges[0]?.id ?? null); }, []);

  function addNode(type: JourneyNodeType, label: string, stage: FunnelStage) {
    const count = draft.nodes.filter(node => node.data.stage === stage).length;
    setDraft(current => ({ ...current, nodes: [...current.nodes, { id:makeId('node'), type:'journey', position:{ x:STAGE_NODE_X[stage], y:120+count*135 }, data:{ label,type,stage,description:'',tracking:[],creatives:[],annotations:[] } }] }));
  }
  function addComponent(component: ComponentDefinition) {
    const stage = component.nodeData.stage;
    const count = draft.nodes.filter(node => node.data.stage === stage).length;
    setDraft(current => ({ ...current, nodes:[...current.nodes,{ id:makeId('node'), type:'journey', position:{x:STAGE_NODE_X[stage],y:120+count*135}, data:syncedNodeData(component) }] }));
  }
  function updateSelected(data: JourneyNodeData) { if (!selected) return; setDraft(current => ({ ...current, nodes: current.nodes.map(node => node.id===selected.id?{...node,data}:node) })); }
  function deleteSelection() { const ids=new Set(selectedIds); setDraft(current=>({...current,nodes:current.nodes.filter(node=>!ids.has(node.id)),edges:current.edges.filter(edge=>!ids.has(edge.source)&&!ids.has(edge.target)&&edge.id!==selectedEdgeId)})); setSelectedIds([]); setSelectedEdgeId(null); }
  function deleteNode(nodeId: string) {
    setDraft(current => ({ ...current, nodes: current.nodes.filter(node => node.id !== nodeId), edges: current.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId) }));
    setSelectedIds(ids => ids.filter(id => id !== nodeId));
  }
  function duplicateNode(nodeId: string) {
    const original = draft.nodes.find(node => node.id === nodeId);
    if (!original) return;
    const id = makeId('node');
    const copy = { ...structuredClone(original), id, position: { x: original.position.x + 36, y: original.position.y + 36 }, selected: true };
    setDraft(current => ({ ...current, nodes: [...current.nodes.map(node => ({ ...node, selected: false })), copy] }));
    setSelectedIds([id]);
  }

  function saveComponent() { if (!selected) return; const name=window.prompt(t('templateEditor.componentName'), selected.data.label); if(!name)return; const component=componentFromNode(name, selected.data.description??'', selected.data); updateWorkspace(ws=>({...ws,components:[...ws.components,component]})); updateSelected({...selected.data,componentId:component.id,componentSyncedAt:new Date().toISOString()}); }
  function updateComponent() { if(!selected?.data.componentId)return; const componentId=selected.data.componentId; const nodeData=selected.data; updateWorkspace(ws=>({...ws,components:ws.components.map(c=>c.id===componentId?{...componentFromNode(c.name,c.description,nodeData),id:c.id,createdAt:c.createdAt}:c)})); }
  function syncComponent() { if(!selected?.data.componentId||!workspace)return; const c=workspace.components.find(c=>c.id===selected.data.componentId); if(c)updateSelected(syncedNodeData(c)); }
  function unlinkComponent() { if(!selected)return; updateSelected({...selected.data,componentId:undefined,componentSyncedAt:undefined}); }

  function tidy() { const laid=compactStageLayout(asJourney(draft)); setDraft(current=>({...current,nodes:laid.nodes})); window.setTimeout(()=>flowInstance?.fitView({padding:.18,duration:250,minZoom:.4,maxZoom:1.05}),0); }
  function save() { const stamp=new Date().toISOString(); updateWorkspace(ws=>({...ws,templates:ws.templates.map(item=>item.id===draft.id?{...draft,updatedAt:stamp}:item)})); setDraft(current=>({...current,updatedAt:stamp})); }
  function setMeta<K extends keyof JourneyTemplate>(key: K, value: JourneyTemplate[K]) { setDraft(current=>({...current,[key]:value})); }

  const stageMismatchCount = useMemo(() => draft.nodes.filter(node => isStageMismatch(node.data.stage, node.position.x)).length, [draft.nodes]);
  const flowNodes = useMemo(()=>draft.nodes.map(node=>({...node,data:{...node.data,runtimeStageMismatch:isStageMismatch(node.data.stage,node.position.x),runtimeActions:{delete:()=>deleteNode(node.id),duplicate:()=>duplicateNode(node.id)}}})),[draft.nodes]);
  const flowEdges = useMemo(()=>draft.edges.map(edge=>{
    const label=edge.data?.label||edge.data?.signal||edge.data?.condition||undefined;
    return {...edge,animated:true,label,className:[edge.className,'fjs-flow-edge'].filter(Boolean).join(' '),markerEnd:{type:MarkerType.ArrowClosed,width:20,height:20,color:'#687889'},style:{...(edge.style??{}),stroke:'#718194',strokeWidth:1.9},labelStyle:{fill:'#435160',fontSize:10,fontWeight:750},labelBgStyle:{fill:'#ffffff',fillOpacity:.96,stroke:'#d6dde5',strokeWidth:1},labelBgPadding:[6,4] as [number,number],labelBgBorderRadius:8};
  }),[draft.edges]);

  return <div className="editor-screen template-editor-screen">
    <div className="editor-topbar">
      <div className="editor-topbar-left"><button className="icon-button" onClick={onClose}><ArrowLeft size={18}/></button><div className="editor-title"><strong>{draft.name}</strong><span>{t('templateEditor.title')} · {draft.nodes.length} {t('templateEditor.nodes')} · v{draft.version}</span></div></div>
      <div className="editor-actions">{stageMismatchCount>0&&<button className="stage-guardrail-warning" onClick={tidy} title={t('editor.stageMismatchHelp')}><AlertTriangle size={12}/>{stageMismatchCount} {t('editor.stageMismatch')}</button>}<button className="button" onClick={()=>flowInstance?.fitView({padding:.18,duration:250,minZoom:.4,maxZoom:1.05})}><Maximize2 size={15}/> {t('templateEditor.fit')}</button><button className="button" onClick={tidy}><LayoutGrid size={15}/> {t('templateEditor.tidy')}</button><button className="button" onClick={()=>downloadJourneyTemplate(draft)}><Share2 size={15}/> {t('templateEditor.share')}</button><button className="button primary" onClick={save}><Save size={15}/> {t('templateEditor.save')}</button></div>
    </div>
    <div className="editor-layout template-editor-layout">
      <NodePalette onAdd={addNode} components={workspace?.components??[]} onAddComponent={addComponent}/>
      <div className="canvas-wrap no-print">
        <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes} onInit={instance=>{setFlowInstance({fitView:o=>{void instance.fitView(o);}});setCanvasViewport(instance.getViewport());}} onMove={(_,v)=>setCanvasViewport(v)} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onReconnect={onReconnect} onSelectionChange={onSelectionChange} onPaneClick={()=>{setSelectedIds([]);setSelectedEdgeId(null);}} fitView selectionOnDrag={false} panOnDrag={[0]} selectionKeyCode="Shift" multiSelectionKeyCode="Shift" edgesReconnectable snapToGrid={workspace?.settings.snapToGrid} snapGrid={[20,20]}><Background gap={20} size={1}/><Controls/></ReactFlow>
        <StageBackdrop viewport={canvasViewport}/>
      </div>
      {selectedEdge ? <EdgePropertiesPanel edge={selectedEdge} onChange={edge=>setDraft(current=>({...current,edges:current.edges.map(item=>item.id===edge.id?edge:item)}))} onDelete={deleteSelection}/> : selected ? <PropertiesPanel data={selected.data} nodeId={selected.id} currentJourneyId={`template:${draft.id}`} journeys={[]} components={workspace?.components??[]} crossLinks={[]} onChange={updateSelected} onDelete={deleteSelection} onSaveComponent={saveComponent} onUpdateComponent={updateComponent} onSyncComponent={syncComponent} onUnlinkComponent={unlinkComponent} onAddCrossLink={()=>undefined} onRemoveCrossLink={()=>undefined}/> : <aside className="editor-panel properties-panel template-meta-panel"><div className="panel-heading">{t('templateEditor.metadata')}</div><label>{t('templateEditor.name')}<input value={draft.name} onChange={e=>setMeta('name',e.target.value)}/></label><label>{t('templateEditor.description')}<textarea rows={4} value={draft.description} onChange={e=>setMeta('description',e.target.value)}/></label><div className="property-two-col"><label>{t('templateEditor.category')}<input value={draft.category} onChange={e=>setMeta('category',e.target.value)}/></label><label>{t('templateEditor.scope')}<select value={draft.scope} onChange={e=>setMeta('scope',e.target.value as WorkspaceScope)}><option>B2C</option><option>B2B</option><option>Mixed</option></select></label></div><div className="property-two-col"><label>{t('templateEditor.version')}<input value={draft.version} onChange={e=>setMeta('version',e.target.value)}/></label><label>{t('templateEditor.author')}<input value={draft.author} onChange={e=>setMeta('author',e.target.value)}/></label></div><label>{t('templateEditor.tags')}<input value={draft.tags.join(', ')} onChange={e=>setMeta('tags',e.target.value.split(',').map(v=>v.trim()).filter(Boolean))}/></label><div className="template-meta-note"><Tag size={14}/> {t('templateEditor.metaNote')}</div>{!draft.nodes.length&&<div className="template-empty-canvas"><strong>{t('templateEditor.blankTitle')}</strong><span>{t('templateEditor.blankText')}</span></div>}</aside>}
    </div>
  </div>;
}

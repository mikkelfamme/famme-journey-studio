import { useMemo, useState } from 'react';
import { Check, Link2, Plus, RefreshCw, Save, Trash2, Unlink } from 'lucide-react';
import type { AnnotationKind, ComponentDefinition, CrossJourneyLink, CreativeDefinition, FunnelStage, Journey, JourneyNodeData, JourneyNodeType, TrackingDefinition } from '../../types/domain';
import { makeId } from '../../lib/ids';

const platforms = ['GA4', 'Meta Pixel', 'CAPI', 'Google Ads', 'GTM', 'DataLayer', 'CRM', 'BigQuery', 'Manual', 'Other'];
const trackingStatuses: TrackingDefinition['status'][] = ['implemented', 'validate', 'missing', 'planned'];
const annotationKinds: AnnotationKind[] = ['comment', 'decision', 'todo', 'hypothesis'];

interface Props {
  data: JourneyNodeData | null;
  nodeId?: string;
  currentJourneyId: string;
  journeys: Journey[];
  components: ComponentDefinition[];
  crossLinks: CrossJourneyLink[];
  onChange: (data: JourneyNodeData) => void;
  onDelete: () => void;
  onSaveComponent: () => void;
  onUpdateComponent: () => void;
  onSyncComponent: () => void;
  onUnlinkComponent: () => void;
  onAddCrossLink: (link: Omit<CrossJourneyLink, 'id' | 'sourceNodeId'>) => void;
  onRemoveCrossLink: (id: string) => void;
}

export function PropertiesPanel(props: Props) {
  const { data, nodeId, currentJourneyId, journeys, components, crossLinks, onChange, onDelete, onSaveComponent, onUpdateComponent, onSyncComponent, onUnlinkComponent, onAddCrossLink, onRemoveCrossLink } = props;
  const [tab, setTab] = useState<'general' | 'tracking' | 'creative' | 'notes' | 'links'>('general');
  const [targetJourneyId, setTargetJourneyId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [linkLabel, setLinkLabel] = useState('Continue to journey');

  const targetJourney = useMemo(() => journeys.find(j => j.id === targetJourneyId), [journeys, targetJourneyId]);
  if (!data) return <aside className="editor-panel properties-panel empty-panel"><div><strong>Select a node</strong><p>Edit properties, tracking, creatives, notes and cross-journey logic here.</p></div></aside>;

  function updateTracking(id: string, patch: Partial<TrackingDefinition>) {
    onChange({ ...data!, tracking: data!.tracking.map(t => t.id === id ? { ...t, ...patch } : t) });
  }
  function addTracking() {
    onChange({ ...data!, tracking: [...data!.tracking, { id: makeId('tracking'), platform: 'GA4', event: '', status: 'planned', note: '' }] });
  }
  function removeTracking(id: string) { onChange({ ...data!, tracking: data!.tracking.filter(t => t.id !== id) }); }
  function updateCreative(id: string, patch: Partial<CreativeDefinition>) {
    onChange({ ...data!, creatives: data!.creatives.map(c => c.id === id ? { ...c, ...patch } : c) });
  }
  function addCreative() {
    onChange({ ...data!, creatives: [...data!.creatives, { id: makeId('creative'), format: 'Image', name: 'New creative', status: 'draft', message: '', cta: '', finalUrl: '' }] });
  }
  function removeCreative(id: string) { onChange({ ...data!, creatives: data!.creatives.filter(c => c.id !== id) }); }
  function addAnnotation(kind: AnnotationKind) {
    const text = window.prompt(`${kind} text`);
    if (!text) return;
    onChange({ ...data!, annotations: [...data!.annotations, { id: makeId('annotation'), kind, text, createdAt: new Date().toISOString(), done: false }] });
  }
  function addLink() {
    if (!targetJourneyId) return;
    onAddCrossLink({ targetJourneyId, targetNodeId: targetNodeId || undefined, label: linkLabel || 'Continue to journey' });
    setTargetNodeId('');
  }
  const ownLinks = crossLinks.filter(link => link.sourceNodeId === nodeId);
  const component = data.componentId ? components.find(c => c.id === data.componentId) : undefined;

  return (
    <aside className="editor-panel properties-panel">
      <div className="panel-heading">Node inspector</div>
      <div className="inspector-tabs">
        {(['general','tracking','creative','notes','links'] as const).map(id => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{id}</button>)}
      </div>

      {tab === 'general' && <>
        <label>Label<input value={data.label} onChange={e => onChange({ ...data, label: e.target.value })} /></label>
        <label>Type<select value={data.type} onChange={e => onChange({ ...data, type: e.target.value as JourneyNodeType })}>
          {['trigger','need','customerStep','decision','meta','googleAds','landingPage','cta','tracking','conversion','lead','booking','exclusion','crm','note'].map(x => <option key={x} value={x}>{x}</option>)}
        </select></label>
        <label>Funnel stage<select value={data.stage} onChange={e => onChange({ ...data, stage: e.target.value as FunnelStage })}>{['top','middle','bottom','lifecycle'].map(x => <option key={x}>{x}</option>)}</select></label>
        <label>Description<textarea rows={4} value={data.description ?? ''} onChange={e => onChange({ ...data, description: e.target.value })} /></label>
        <label>Customer need<textarea rows={2} value={data.customerNeed ?? ''} onChange={e => onChange({ ...data, customerNeed: e.target.value })} /></label>
        <label>Communication task<textarea rows={2} value={data.communicationTask ?? ''} onChange={e => onChange({ ...data, communicationTask: e.target.value })} /></label>
        <div className="panel-section">
          <div className="panel-section-title">Component Library</div>
          {!component ? <button className="button full" onClick={onSaveComponent}><Save size={14}/> Save node to Library</button> : <div className="stack-actions vertical">
            <div className="library-status"><strong>{component.name}</strong><span>Linked component</span></div>
            <button className="button full" onClick={onSyncComponent}><RefreshCw size={14}/> Sync from Library</button>
            <button className="button full" onClick={onUpdateComponent}><Save size={14}/> Update Library from node</button>
            <button className="button full" onClick={onUnlinkComponent}><Unlink size={14}/> Detach from Library</button>
          </div>}
        </div>
        <button className="button danger full" onClick={onDelete}>Delete selected node(s)</button>
      </>}

      {tab === 'tracking' && <div className="definition-list">
        <button className="button full" onClick={addTracking}><Plus size={14}/> Add tracking definition</button>
        {data.tracking.length === 0 && <p className="muted-small">No tracking definitions attached.</p>}
        {data.tracking.map(item => <div className="definition-card" key={item.id}>
          <div className="definition-card-head"><strong>Tracking</strong><button className="mini-icon danger-icon" onClick={() => removeTracking(item.id)}><Trash2 size={13}/></button></div>
          <label>Platform<select value={item.platform} onChange={e => updateTracking(item.id, { platform: e.target.value })}>{platforms.map(p => <option key={p}>{p}</option>)}</select></label>
          <label>Event / signal<input value={item.event} onChange={e => updateTracking(item.id, { event: e.target.value })}/></label>
          <label>Status<select value={item.status} onChange={e => updateTracking(item.id, { status: e.target.value as TrackingDefinition['status'] })}>{trackingStatuses.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Note<textarea rows={2} value={item.note ?? ''} onChange={e => updateTracking(item.id, { note: e.target.value })}/></label>
        </div>)}
      </div>}

      {tab === 'creative' && <div className="definition-list">
        <button className="button full" onClick={addCreative}><Plus size={14}/> Add creative</button>
        {data.creatives.length === 0 && <p className="muted-small">No creative definitions attached.</p>}
        {data.creatives.map(item => <div className="definition-card" key={item.id}>
          <div className="definition-card-head"><strong>{item.name || 'Creative'}</strong><button className="mini-icon danger-icon" onClick={() => removeCreative(item.id)}><Trash2 size={13}/></button></div>
          <label>Name<input value={item.name} onChange={e => updateCreative(item.id, { name: e.target.value })}/></label>
          <label>Format<input value={item.format} onChange={e => updateCreative(item.id, { format: e.target.value })}/></label>
          <label>Message<textarea rows={2} value={item.message ?? ''} onChange={e => updateCreative(item.id, { message: e.target.value })}/></label>
          <label>Headline<input value={item.headline ?? ''} onChange={e => updateCreative(item.id, { headline: e.target.value })}/></label>
          <label>CTA<input value={item.cta ?? ''} onChange={e => updateCreative(item.id, { cta: e.target.value })}/></label>
          <label>Final URL<input value={item.finalUrl ?? ''} onChange={e => updateCreative(item.id, { finalUrl: e.target.value })}/></label>
          <label>Audience<input value={item.audience ?? ''} onChange={e => updateCreative(item.id, { audience: e.target.value })}/></label>
          <label>Status<select value={item.status ?? 'draft'} onChange={e => updateCreative(item.id, { status: e.target.value as CreativeDefinition['status'] })}>{['draft','ready','live','paused'].map(s => <option key={s}>{s}</option>)}</select></label>
        </div>)}
      </div>}

      {tab === 'notes' && <div className="definition-list">
        <div className="annotation-actions">{annotationKinds.map(kind => <button key={kind} className="button compact" onClick={() => addAnnotation(kind)}><Plus size={12}/>{kind}</button>)}</div>
        {data.annotations.length === 0 && <p className="muted-small">No comments, decisions, TODOs or hypotheses yet.</p>}
        {data.annotations.map(annotation => <div className={`annotation-card annotation-${annotation.kind}`} key={annotation.id}>
          <div className="definition-card-head"><span className="eyebrow-small">{annotation.kind}</span><button className="mini-icon danger-icon" onClick={() => onChange({ ...data, annotations: data.annotations.filter(a => a.id !== annotation.id) })}><Trash2 size={13}/></button></div>
          <p>{annotation.text}</p>
          {annotation.kind === 'todo' && <button className={`button compact ${annotation.done ? 'done' : ''}`} onClick={() => onChange({ ...data, annotations: data.annotations.map(a => a.id === annotation.id ? { ...a, done: !a.done } : a) })}><Check size={12}/>{annotation.done ? 'Done' : 'Mark done'}</button>}
        </div>)}
      </div>}

      {tab === 'links' && <div className="definition-list">
        <div className="panel-section-title">Cross-journey connection</div>
        <label>Target journey<select value={targetJourneyId} onChange={e => { setTargetJourneyId(e.target.value); setTargetNodeId(''); }}><option value="">Choose journey…</option>{journeys.filter(j => j.id !== currentJourneyId).map(j => <option key={j.id} value={j.id}>{j.name}</option>)}</select></label>
        <label>Target node<select value={targetNodeId} onChange={e => setTargetNodeId(e.target.value)} disabled={!targetJourney}><option value="">Journey entry / unspecified</option>{targetJourney?.nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}</select></label>
        <label>Label<input value={linkLabel} onChange={e => setLinkLabel(e.target.value)}/></label>
        <button className="button full" disabled={!targetJourneyId} onClick={addLink}><Link2 size={14}/> Add connection</button>
        {ownLinks.map(link => {
          const target = journeys.find(j => j.id === link.targetJourneyId);
          const node = target?.nodes.find(n => n.id === link.targetNodeId);
          return <div className="definition-card" key={link.id}><div className="definition-card-head"><strong>{link.label}</strong><button className="mini-icon danger-icon" onClick={() => onRemoveCrossLink(link.id)}><Trash2 size={13}/></button></div><p className="muted-small">→ {target?.name ?? 'Missing journey'}{node ? ` / ${node.data.label}` : ''}</p></div>;
        })}
      </div>}
    </aside>
  );
}

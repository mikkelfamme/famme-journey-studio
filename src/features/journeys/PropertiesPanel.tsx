import { useMemo, useState } from 'react';
import { Activity, Check, Image, Link2, Plus, RefreshCw, Save, Settings2, StickyNote, Trash2, Unlink, Upload, X } from 'lucide-react';
import type { AnnotationKind, ComponentDefinition, CreativeDefinition, FunnelStage, Journey, JourneyNodeData, JourneyNodeType, TrackingDefinition, CrossJourneyLink } from '../../types/domain';
import { makeId } from '../../lib/ids';
import { NODE_TYPE_DEFINITIONS, NODE_TYPE_GROUPS, nodeTypeDefinition } from '../../lib/nodeTypes';
import { useI18n } from '../../i18n';

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

type InspectorTab = 'general' | 'tracking' | 'creative' | 'notes' | 'links';

async function imageFileToThumbnail(file: File): Promise<string> {
  if (file.size > 6 * 1024 * 1024) throw new Error('Image is too large. Choose a file below 6 MB.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image.'));
    img.src = dataUrl;
  });
  const maxW = 720;
  const maxH = 440;
  const ratio = Math.min(1, maxW / image.width, maxH / image.height);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is unavailable.');
  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/webp', 0.78);
}

export function PropertiesPanel(props: Props) {
  const { data, nodeId, currentJourneyId, journeys, components, crossLinks, onChange, onDelete, onSaveComponent, onUpdateComponent, onSyncComponent, onUnlinkComponent, onAddCrossLink, onRemoveCrossLink } = props;
  const { t, nodeType, stage } = useI18n();
  const [tab, setTab] = useState<InspectorTab>('general');
  const [targetJourneyId, setTargetJourneyId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [linkLabel, setLinkLabel] = useState('Continue to journey');
  const targetJourney = useMemo(() => journeys.find(j => j.id === targetJourneyId), [journeys, targetJourneyId]);

  if (!data) return <aside className="editor-panel properties-panel empty-panel"><div className="empty-inspector"><div className="empty-inspector-icon"><Settings2 size={18}/></div><strong>{t('inspector.selectNode')}</strong><p>{t('inspector.selectNodeText')}</p><div className="shortcut-hint"><kbd>Shift</kbd><span>multi-select nodes</span></div></div></aside>;

  function updateTracking(id: string, patch: Partial<TrackingDefinition>) { onChange({ ...data!, tracking: data!.tracking.map(item => item.id === id ? { ...item, ...patch } : item) }); }
  function addTracking() { onChange({ ...data!, tracking: [...data!.tracking, { id: makeId('tracking'), platform: 'GA4', event: '', status: 'planned', note: '' }] }); }
  function removeTracking(id: string) { onChange({ ...data!, tracking: data!.tracking.filter(item => item.id !== id) }); }
  function updateCreative(id: string, patch: Partial<CreativeDefinition>) { onChange({ ...data!, creatives: data!.creatives.map(item => item.id === id ? { ...item, ...patch } : item) }); }
  function addCreative() { onChange({ ...data!, creatives: [...data!.creatives, { id: makeId('creative'), format: 'Image', name: 'New creative', status: 'draft', message: '', cta: '', finalUrl: '', imageUrl: '' }] }); }
  function removeCreative(id: string) { onChange({ ...data!, creatives: data!.creatives.filter(item => item.id !== id) }); }
  async function uploadCreativeImage(id: string, file?: File) {
    if (!file) return;
    try { updateCreative(id, { imageDataUrl: await imageFileToThumbnail(file) }); }
    catch (error) { window.alert(error instanceof Error ? error.message : 'Image upload failed'); }
  }
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
  const component = data.componentId ? components.find(item => item.id === data.componentId) : undefined;
  const openTodos = data.annotations.filter(annotation => annotation.kind === 'todo' && !annotation.done).length;
  const tabs: Array<{ id: InspectorTab; label: string; icon: typeof Settings2; count?: number }> = [
    { id: 'general', label: t('inspector.general'), icon: Settings2 },
    { id: 'tracking', label: t('inspector.tracking'), icon: Activity, count: data.tracking.length },
    { id: 'creative', label: t('inspector.creative'), icon: Image, count: data.creatives.length },
    { id: 'notes', label: t('inspector.notes'), icon: StickyNote, count: openTodos || data.annotations.length },
    { id: 'links', label: t('inspector.links'), icon: Link2, count: ownLinks.length }
  ];
  const showNodeUrl = ['landingPage','shopCheckout','cta','meta','googleAds'].includes(data.type);
  const currentTypeDefinition = nodeTypeDefinition(data.type);

  return <aside className="editor-panel properties-panel">
    <div className="inspector-node-header"><div className={`inspector-type-mark node-${data.type}`} /><div><span className="panel-heading">{t('inspector.title')}</span><strong>{data.label || 'Untitled node'}</strong><small>{nodeType(data.type)} · {stage(data.stage)}</small></div></div>
    <div className="inspector-tabs">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} title={item.label}><Icon size={15}/><span>{item.label}</span>{item.count ? <b>{item.count}</b> : null}</button>; })}</div>

    {tab === 'general' && <>
      <label>{t('inspector.label')}<input value={data.label} onChange={event => onChange({ ...data, label: event.target.value })} /></label>
      <div className="property-two-col">
        <label>{t('inspector.type')}<select value={data.type} onChange={event => onChange({ ...data, type: event.target.value as JourneyNodeType })}>{NODE_TYPE_GROUPS.map(group => <optgroup key={group.id} label={t(group.labelKey)}>{NODE_TYPE_DEFINITIONS.filter(item => item.group === group.id).map(item => <option key={item.type} value={item.type}>{nodeType(item.type)}</option>)}</optgroup>)}</select><span className="field-help">{t(currentTypeDefinition.descriptionKey)}</span></label>
        <label>{t('inspector.stage')}<select value={data.stage} onChange={event => onChange({ ...data, stage: event.target.value as FunnelStage })}>{(['top','middle','bottom','lifecycle'] as FunnelStage[]).map(item => <option key={item} value={item}>{stage(item)}</option>)}</select></label>
      </div>
      <label>{t('inspector.description')}<textarea rows={4} value={data.description ?? ''} onChange={event => onChange({ ...data, description: event.target.value })} /></label>
      {showNodeUrl && <label>{t('inspector.url')}<input type="url" placeholder="https://…" value={data.url ?? ''} onChange={event => onChange({ ...data, url: event.target.value })}/><span className="field-help">{t('inspector.urlHelp')}</span></label>}
      <label>{t('inspector.customerNeed')}<textarea rows={3} value={data.customerNeed ?? ''} onChange={event => onChange({ ...data, customerNeed: event.target.value })} /></label>
      <label>{t('inspector.communicationTask')}<textarea rows={3} value={data.communicationTask ?? ''} onChange={event => onChange({ ...data, communicationTask: event.target.value })} /></label>
      <div className="panel-section"><div className="panel-section-title">Component Library</div>{!component ? <button className="button full" onClick={onSaveComponent}><Save size={15}/> Save node to Library</button> : <div className="stack-actions vertical"><div className="library-status"><strong>{component.name}</strong><span>Linked component</span></div><button className="button full" onClick={onSyncComponent}><RefreshCw size={15}/> Sync from Library</button><button className="button full" onClick={onUpdateComponent}><Save size={15}/> Update Library from node</button><button className="button full" onClick={onUnlinkComponent}><Unlink size={15}/> Detach from Library</button></div>}</div>
      <button className="button danger full" onClick={onDelete}>Delete selected node(s)</button>
    </>}

    {tab === 'tracking' && <div className="definition-list large-definition-list">
      <button className="button full definition-add" onClick={addTracking}><Plus size={16}/> {t('tracking.add')}</button>
      {data.tracking.length === 0 && <p className="muted-small">{t('tracking.empty')}</p>}
      {data.tracking.map(item => <div className="definition-card large-definition-card" key={item.id}>
        <div className="definition-card-head"><div><strong>{item.event || 'Tracking signal'}</strong><small>{item.platform}</small></div><button className="mini-icon danger-icon" onClick={() => removeTracking(item.id)}><Trash2 size={14}/></button></div>
        <label>{t('tracking.platform')}<select value={item.platform} onChange={event => updateTracking(item.id, { platform: event.target.value })}>{platforms.map(platform => <option key={platform}>{platform}</option>)}</select></label>
        <label>{t('tracking.event')}<input value={item.event} onChange={event => updateTracking(item.id, { event: event.target.value })}/></label>
        <label>{t('tracking.status')}<select value={item.status} onChange={event => updateTracking(item.id, { status: event.target.value as TrackingDefinition['status'] })}>{trackingStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>{t('tracking.note')}<textarea rows={3} value={item.note ?? ''} onChange={event => updateTracking(item.id, { note: event.target.value })}/></label>
      </div>)}
    </div>}

    {tab === 'creative' && <div className="definition-list large-definition-list">
      <button className="button full definition-add" onClick={addCreative}><Plus size={16}/> {t('creative.add')}</button>
      {data.creatives.length === 0 && <p className="muted-small">{t('creative.empty')}</p>}
      {data.creatives.map(item => {
        const preview = item.imageDataUrl || item.imageUrl;
        return <div className="definition-card large-definition-card creative-definition-card" key={item.id}>
          <div className="definition-card-head"><div><strong>{item.name || 'Creative'}</strong><small>{item.format} · {item.status ?? 'draft'}</small></div><button className="mini-icon danger-icon" onClick={() => removeCreative(item.id)}><Trash2 size={14}/></button></div>
          {preview && <div className="creative-thumb-wrap"><img src={preview} alt={item.name || 'Creative preview'}/><button title={t('creative.removeImage')} onClick={() => updateCreative(item.id, { imageDataUrl: undefined, imageUrl: '' })}><X size={13}/></button></div>}
          <div className="creative-media-row"><label className="upload-button"><Upload size={14}/><span>{t('creative.upload')}</span><input type="file" accept="image/*" onChange={event => { void uploadCreativeImage(item.id, event.target.files?.[0]); event.currentTarget.value=''; }}/></label></div>
          <span className="field-help">{t('creative.uploadHelp')}</span>
          <label>{t('creative.imageUrl')}<input type="url" placeholder="https://…" value={item.imageUrl ?? ''} onChange={event => updateCreative(item.id, { imageUrl: event.target.value })}/></label>
          <label>{t('creative.name')}<input value={item.name} onChange={event => updateCreative(item.id, { name: event.target.value })}/></label>
          <div className="property-two-col"><label>{t('creative.format')}<input value={item.format} onChange={event => updateCreative(item.id, { format: event.target.value })}/></label><label>{t('creative.status')}<select value={item.status ?? 'draft'} onChange={event => updateCreative(item.id, { status: event.target.value as CreativeDefinition['status'] })}>{['draft','ready','live','paused'].map(value => <option key={value}>{value}</option>)}</select></label></div>
          <label>{t('creative.message')}<textarea rows={3} value={item.message ?? ''} onChange={event => updateCreative(item.id, { message: event.target.value })}/></label>
          <label>{t('creative.headline')}<input value={item.headline ?? ''} onChange={event => updateCreative(item.id, { headline: event.target.value })}/></label>
          <label>{t('creative.cta')}<input value={item.cta ?? ''} onChange={event => updateCreative(item.id, { cta: event.target.value })}/></label>
          <label>{t('creative.finalUrl')}<input type="url" value={item.finalUrl ?? ''} onChange={event => updateCreative(item.id, { finalUrl: event.target.value })}/></label>
          <label>{t('creative.audience')}<input value={item.audience ?? ''} onChange={event => updateCreative(item.id, { audience: event.target.value })}/></label>
        </div>;
      })}
    </div>}

    {tab === 'notes' && <div className="definition-list"><div className="annotation-actions">{annotationKinds.map(kind => <button key={kind} className="button compact" onClick={() => addAnnotation(kind)}><Plus size={12}/>{kind}</button>)}</div>{data.annotations.length === 0 && <p className="muted-small">No comments, decisions, TODOs or hypotheses yet.</p>}{data.annotations.map(annotation => <div className={`annotation-card annotation-${annotation.kind}`} key={annotation.id}><div className="definition-card-head"><span className="eyebrow-small">{annotation.kind}</span><button className="mini-icon danger-icon" onClick={() => onChange({ ...data, annotations: data.annotations.filter(item => item.id !== annotation.id) })}><Trash2 size={13}/></button></div><p>{annotation.text}</p>{annotation.kind === 'todo' && <button className={`button compact ${annotation.done ? 'done' : ''}`} onClick={() => onChange({ ...data, annotations: data.annotations.map(item => item.id === annotation.id ? { ...item, done: !item.done } : item) })}><Check size={12}/>{annotation.done ? 'Done' : 'Mark done'}</button>}</div>)}</div>}

    {tab === 'links' && <div className="definition-list"><div className="panel-section-title">Cross-journey connection</div><label>Target journey<select value={targetJourneyId} onChange={event => { setTargetJourneyId(event.target.value); setTargetNodeId(''); }}><option value="">Choose journey…</option>{journeys.filter(item => item.id !== currentJourneyId).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Target node<select value={targetNodeId} onChange={event => setTargetNodeId(event.target.value)} disabled={!targetJourney}><option value="">Journey entry / unspecified</option>{targetJourney?.nodes.map(node => <option key={node.id} value={node.id}>{node.data.label}</option>)}</select></label><label>Label<input value={linkLabel} onChange={event => setLinkLabel(event.target.value)}/></label><button className="button full" disabled={!targetJourneyId} onClick={addLink}><Link2 size={14}/> Add connection</button>{ownLinks.map(link => { const target = journeys.find(item => item.id === link.targetJourneyId); const targetNode = target?.nodes.find(node => node.id === link.targetNodeId); return <div className="definition-card" key={link.id}><div className="definition-card-head"><strong>{link.label}</strong><button className="mini-icon danger-icon" onClick={() => onRemoveCrossLink(link.id)}><Trash2 size={13}/></button></div><p className="muted-small">→ {target?.name ?? 'Missing journey'}{targetNode ? ` / ${targetNode.data.label}` : ''}</p></div>; })}</div>}
  </aside>;
}

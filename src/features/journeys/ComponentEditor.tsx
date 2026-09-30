import { Check, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { AnnotationKind, ComponentDefinition, CreativeDefinition, FunnelStage, JourneyNodeData, JourneyNodeType, NodeBackgroundTone, TrackingDefinition } from '../../types/domain';
import { makeId } from '../../lib/ids';
import { NODE_TYPE_DEFINITIONS, NODE_TYPE_GROUPS, nodeTypeDefinition } from '../../lib/nodeTypes';
import { useI18n } from '../../i18n';

const platforms = ['GA4', 'Meta Pixel', 'CAPI', 'Google Ads', 'ChatGPT Ads', 'GTM', 'DataLayer', 'CRM', 'BigQuery', 'Manual', 'Other'];
const trackingStatuses: TrackingDefinition['status'][] = ['implemented', 'validate', 'missing', 'planned'];
const tones: NodeBackgroundTone[] = ['white', 'green', 'yellow', 'red', 'blue', 'gray'];
const annotationKinds: AnnotationKind[] = ['comment', 'decision', 'todo', 'hypothesis'];

type EditorTab = 'general' | 'tracking' | 'creative' | 'notes';

export function blankComponentData(): JourneyNodeData {
  return { label: 'Ny komponent', type: 'customerStep', stage: 'middle', backgroundTone: 'white', description: '', customerNeed: '', communicationTask: '', channel: '', primaryCta: '', url: '', tracking: [], creatives: [], annotations: [] };
}

export function ComponentEditor({ initial, onCancel, onSave }: { initial?: ComponentDefinition; onCancel: () => void; onSave: (value: { name: string; description: string; nodeData: JourneyNodeData }) => void }) {
  const { t, nodeType, stage } = useI18n();
  const [tab, setTab] = useState<EditorTab>('general');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [data, setData] = useState<JourneyNodeData>(() => structuredClone(initial?.nodeData ?? blankComponentData()));
  const typeDefinition = nodeTypeDefinition(data.type);

  function updateTracking(id: string, patch: Partial<TrackingDefinition>) { setData(current => ({ ...current, tracking: current.tracking.map(item => item.id === id ? { ...item, ...patch } : item) })); }
  function addTracking() { setData(current => ({ ...current, tracking: [...current.tracking, { id: makeId('tracking'), platform: 'GA4', event: '', status: 'planned', note: '' }] })); }
  function removeTracking(id: string) { setData(current => ({ ...current, tracking: current.tracking.filter(item => item.id !== id) })); }
  function updateCreative(id: string, patch: Partial<CreativeDefinition>) { setData(current => ({ ...current, creatives: current.creatives.map(item => item.id === id ? { ...item, ...patch } : item) })); }
  function addCreative() { setData(current => ({ ...current, creatives: [...current.creatives, { id: makeId('creative'), format: 'Image', name: 'New creative', status: 'draft', message: '', headline: '', description: '', cta: '', finalUrl: '', audience: '' }] })); }
  function removeCreative(id: string) { setData(current => ({ ...current, creatives: current.creatives.filter(item => item.id !== id) })); }
  function addAnnotation(kind: AnnotationKind) { setData(current => ({ ...current, annotations: [...current.annotations, { id: makeId('annotation'), kind, text: '', createdAt: new Date().toISOString(), done: false }] })); }

  function submit() {
    const safeName = name.trim() || data.label.trim();
    if (!safeName) { window.alert('Give the component a name.'); return; }
    onSave({ name: safeName, description: description.trim(), nodeData: { ...data, componentId: undefined, componentSyncedAt: undefined } });
  }

  return <div className="component-editor-overlay" role="dialog" aria-modal="true" aria-label={t('components.editorTitle')}>
    <div className="component-editor-modal">
      <header className="component-editor-head"><div><span className="eyebrow-small">{t('components.editorTitle')}</span><h2>{initial ? initial.name : t('components.create')}</h2><p>{t('components.editorHelp')}</p></div><button className="icon-button" onClick={onCancel} aria-label={t('components.cancel')}><X size={16}/></button></header>
      <div className="component-editor-tabs">
        {(['general','tracking','creative','notes'] as EditorTab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item === 'general' ? t('inspector.general') : item === 'tracking' ? t('inspector.tracking') : item === 'creative' ? t('inspector.creative') : t('inspector.notes')}</button>)}
      </div>
      <div className="component-editor-body">
        {tab === 'general' && <>
          <label>Library name<input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. ChatGPT recommendation"/></label>
          <label>Library description<textarea rows={2} value={description} onChange={event => setDescription(event.target.value)}/></label>
          <label>{t('inspector.label')}<input value={data.label} onChange={event => setData({ ...data, label: event.target.value })}/></label>
          <div className="property-two-col">
            <label>{t('inspector.type')}<select value={data.type} onChange={event => setData({ ...data, type: event.target.value as JourneyNodeType })}>{NODE_TYPE_GROUPS.map(group => <optgroup key={group.id} label={t(group.labelKey)}>{NODE_TYPE_DEFINITIONS.filter(item => item.group === group.id).map(item => <option key={item.type} value={item.type}>{nodeType(item.type)}</option>)}</optgroup>)}</select><span className="field-help">{t(typeDefinition.descriptionKey)}</span></label>
            <label>{t('inspector.stage')}<select value={data.stage} onChange={event => setData({ ...data, stage: event.target.value as FunnelStage })}>{(['top','middle','bottom','lifecycle'] as FunnelStage[]).map(item => <option key={item} value={item}>{stage(item)}</option>)}</select></label>
          </div>
          <div className="node-color-field"><div className="node-color-label"><span>{t('inspector.backgroundColor')}</span></div><div className="node-color-swatches">{tones.map(tone => <button type="button" key={tone} className={`node-color-swatch tone-${tone} ${(data.backgroundTone ?? 'white') === tone ? 'selected' : ''}`} onClick={() => setData({ ...data, backgroundTone: tone })}><span className="swatch-dot"/><span>{t(`nodeColor.${tone}`)}</span>{(data.backgroundTone ?? 'white') === tone && <Check size={12}/>}</button>)}</div></div>
          <label>{t('inspector.description')}<textarea rows={3} value={data.description ?? ''} onChange={event => setData({ ...data, description: event.target.value })}/></label>
          <label>{t('inspector.customerNeed')}<textarea rows={2} value={data.customerNeed ?? ''} onChange={event => setData({ ...data, customerNeed: event.target.value })}/></label>
          <label>{t('inspector.communicationTask')}<textarea rows={2} value={data.communicationTask ?? ''} onChange={event => setData({ ...data, communicationTask: event.target.value })}/></label>
          <div className="property-two-col"><label>Channel<input value={data.channel ?? ''} onChange={event => setData({ ...data, channel: event.target.value })}/></label><label>Primary CTA<input value={data.primaryCta ?? ''} onChange={event => setData({ ...data, primaryCta: event.target.value })}/></label></div>
          <label>URL<input type="url" value={data.url ?? ''} onChange={event => setData({ ...data, url: event.target.value })} placeholder="https://…"/></label>
        </>}
        {tab === 'tracking' && <div className="definition-list"><button className="button full" onClick={addTracking}><Plus size={14}/> {t('tracking.add')}</button>{data.tracking.map(item => <div className="definition-card" key={item.id}><div className="definition-card-head"><div><strong>{item.event || 'Tracking signal'}</strong><small>{item.platform}</small></div><button className="mini-icon danger-icon" onClick={() => removeTracking(item.id)}><Trash2 size={14}/></button></div><label>{t('tracking.platform')}<select value={item.platform} onChange={event => updateTracking(item.id, { platform: event.target.value })}>{platforms.map(platform => <option key={platform}>{platform}</option>)}</select></label><label>{t('tracking.event')}<input value={item.event} onChange={event => updateTracking(item.id, { event: event.target.value })}/></label><label>{t('tracking.status')}<select value={item.status} onChange={event => updateTracking(item.id, { status: event.target.value as TrackingDefinition['status'] })}>{trackingStatuses.map(value => <option key={value}>{value}</option>)}</select></label><label>{t('tracking.note')}<textarea rows={2} value={item.note ?? ''} onChange={event => updateTracking(item.id, { note: event.target.value })}/></label></div>)}</div>}
        {tab === 'creative' && <div className="definition-list"><button className="button full" onClick={addCreative}><Plus size={14}/> {t('creative.add')}</button>{data.creatives.map(item => <div className="definition-card" key={item.id}><div className="definition-card-head"><div><strong>{item.name || 'Creative'}</strong><small>{item.format}</small></div><button className="mini-icon danger-icon" onClick={() => removeCreative(item.id)}><Trash2 size={14}/></button></div><label>{t('creative.name')}<input value={item.name} onChange={event => updateCreative(item.id, { name: event.target.value })}/></label><div className="property-two-col"><label>{t('creative.format')}<input value={item.format} onChange={event => updateCreative(item.id, { format: event.target.value })}/></label><label>{t('creative.status')}<select value={item.status ?? 'draft'} onChange={event => updateCreative(item.id, { status: event.target.value as CreativeDefinition['status'] })}>{['draft','ready','live','paused'].map(value => <option key={value}>{value}</option>)}</select></label></div><label>{t('creative.message')}<textarea rows={2} value={item.message ?? ''} onChange={event => updateCreative(item.id, { message: event.target.value })}/></label><label>{t('creative.headline')}<input value={item.headline ?? ''} onChange={event => updateCreative(item.id, { headline: event.target.value })}/></label><label>{t('creative.cta')}<input value={item.cta ?? ''} onChange={event => updateCreative(item.id, { cta: event.target.value })}/></label><label>{t('creative.finalUrl')}<input value={item.finalUrl ?? ''} onChange={event => updateCreative(item.id, { finalUrl: event.target.value })}/></label><label>{t('creative.audience')}<input value={item.audience ?? ''} onChange={event => updateCreative(item.id, { audience: event.target.value })}/></label></div>)}</div>}
        {tab === 'notes' && <div className="definition-list"><div className="annotation-actions">{annotationKinds.map(kind => <button key={kind} className="button compact" onClick={() => addAnnotation(kind)}><Plus size={12}/>{kind}</button>)}</div>{data.annotations.map(item => <div className={`annotation-card annotation-${item.kind}`} key={item.id}><div className="definition-card-head"><span className="eyebrow-small">{item.kind}</span><button className="mini-icon danger-icon" onClick={() => setData({ ...data, annotations: data.annotations.filter(annotation => annotation.id !== item.id) })}><Trash2 size={13}/></button></div><textarea rows={3} value={item.text} onChange={event => setData({ ...data, annotations: data.annotations.map(annotation => annotation.id === item.id ? { ...annotation, text: event.target.value } : annotation) })}/></div>)}</div>}
      </div>
      <footer className="component-editor-foot"><button className="button" onClick={onCancel}>{t('components.cancel')}</button><button className="button primary" onClick={submit}><Save size={14}/>{t('components.save')}</button></footer>
    </div>
  </div>;
}

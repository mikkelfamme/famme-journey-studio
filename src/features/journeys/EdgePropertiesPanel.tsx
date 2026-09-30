import { Trash2 } from 'lucide-react';
import type { JourneyEdge } from '../../types/domain';

export function EdgePropertiesPanel({ edge, onChange, onDelete }: { edge: JourneyEdge; onChange: (edge: JourneyEdge) => void; onDelete: () => void }) {
  const data = edge.data ?? {};
  function update(key: 'label' | 'condition' | 'signal' | 'timing' | 'comment', value: string) {
    onChange({ ...edge, label: key === 'label' ? value : edge.label, data: { ...data, [key]: value } });
  }
  return <aside className="editor-panel properties-panel">
    <div className="panel-heading">Connection properties</div>
    <div className="edge-route">{edge.source} <span>{data.connectionStyle === 'attached' ? '—' : '→'}</span> {edge.target}</div>
    <label>Connection style<select value={data.connectionStyle ?? 'arrow'} onChange={e => onChange({ ...edge, data: { ...data, connectionStyle: e.target.value as 'arrow' | 'attached' } })}><option value="arrow">Flow arrow</option><option value="attached">Direct attachment · no arrow</option></select><span className="field-help">Use direct attachment when two components sit immediately next to each other and should read as one connected block.</span></label>
    <label>Label<input value={data.label ?? ''} onChange={e => update('label', e.target.value)}/></label>
    <label>Condition<input value={data.condition ?? ''} onChange={e => update('condition', e.target.value)} placeholder="e.g. High intent"/></label>
    <label>Signal / event<input value={data.signal ?? ''} onChange={e => update('signal', e.target.value)} placeholder="e.g. cta_click"/></label>
    <label>Timing<input value={data.timing ?? ''} onChange={e => update('timing', e.target.value)} placeholder="e.g. Within 30 days"/></label>
    <label>Comment<textarea rows={4} value={data.comment ?? ''} onChange={e => update('comment', e.target.value)}/></label>
    <p className="muted-small">Incoming connections use the top/left ports; outgoing connections use bottom/right. A port can carry multiple connections. Reconnect an endpoint by dragging it to another handle.</p>
    <button className="button danger full" onClick={onDelete}><Trash2 size={14}/> Delete connection</button>
  </aside>;
}

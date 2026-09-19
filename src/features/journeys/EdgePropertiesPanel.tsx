import { Trash2 } from 'lucide-react';
import type { JourneyEdge } from '../../types/domain';

export function EdgePropertiesPanel({ edge, onChange, onDelete }: { edge: JourneyEdge; onChange: (edge: JourneyEdge) => void; onDelete: () => void }) {
  const data = edge.data ?? {};
  function update(key: 'label' | 'condition' | 'signal' | 'timing' | 'comment', value: string) {
    onChange({ ...edge, label: key === 'label' ? value : edge.label, data: { ...data, [key]: value } });
  }
  return <aside className="editor-panel properties-panel">
    <div className="panel-heading">Connection properties</div>
    <div className="edge-route">{edge.source} <span>→</span> {edge.target}</div>
    <label>Label<input value={data.label ?? ''} onChange={e => update('label', e.target.value)}/></label>
    <label>Condition<input value={data.condition ?? ''} onChange={e => update('condition', e.target.value)} placeholder="e.g. High intent"/></label>
    <label>Signal / event<input value={data.signal ?? ''} onChange={e => update('signal', e.target.value)} placeholder="e.g. cta_click"/></label>
    <label>Timing<input value={data.timing ?? ''} onChange={e => update('timing', e.target.value)} placeholder="e.g. Within 30 days"/></label>
    <label>Comment<textarea rows={4} value={data.comment ?? ''} onChange={e => update('comment', e.target.value)}/></label>
    <p className="muted-small">Drag either edge endpoint to reconnect it to another handle. Nodes expose connection handles on all four sides.</p>
    <button className="button danger full" onClick={onDelete}><Trash2 size={14}/> Delete connection</button>
  </aside>;
}

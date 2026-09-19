import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { JourneyNode } from '../../types/domain';

const labels: Record<string, string> = {
  trigger: 'Trigger', need: 'Need', decision: 'Decision', meta: 'Meta', googleAds: 'Google Ads', landingPage: 'Landing page',
  cta: 'CTA', tracking: 'Tracking', conversion: 'Conversion', lead: 'Lead', booking: 'Booking', exclusion: 'Exclusion', crm: 'CRM / Email', note: 'Note'
};

const handleStyle = { width: 8, height: 8, background: '#fff', border: '1.5px solid #77818e' };

export function JourneyNodeComponent({ data, selected }: NodeProps<JourneyNode>) {
  const openTodos = data.annotations.filter(a => a.kind === 'todo' && !a.done).length;
  return (
    <div className={`journey-node node-${data.type} ${selected ? 'selected' : ''} ${data.componentId ? 'library-linked' : ''}`}>
      <Handle id="target-left" type="target" position={Position.Left} style={{ ...handleStyle, top: '42%' }} />
      <Handle id="source-left" type="source" position={Position.Left} style={{ ...handleStyle, top: '62%' }} />
      <Handle id="target-right" type="target" position={Position.Right} style={{ ...handleStyle, top: '42%' }} />
      <Handle id="source-right" type="source" position={Position.Right} style={{ ...handleStyle, top: '62%' }} />
      <Handle id="target-top" type="target" position={Position.Top} style={{ ...handleStyle, left: '42%' }} />
      <Handle id="source-top" type="source" position={Position.Top} style={{ ...handleStyle, left: '62%' }} />
      <Handle id="target-bottom" type="target" position={Position.Bottom} style={{ ...handleStyle, left: '42%' }} />
      <Handle id="source-bottom" type="source" position={Position.Bottom} style={{ ...handleStyle, left: '62%' }} />
      <div className="node-kicker">{labels[data.type] ?? data.type} · {data.stage}</div>
      <div className="node-title">{data.label}</div>
      {data.description && <div className="node-desc">{data.description}</div>}
      {data.runtimePerformance && <div className={`node-performance quality-${data.runtimePerformance.quality}`}><div><strong>{data.runtimePerformance.quality}</strong><span>{data.runtimePerformance.source}</span></div>{data.runtimePerformance.metrics.map(metric => <div className="node-kpi" key={metric.key}><span>{metric.label}</span><b>{metric.formatted}</b></div>)}</div>}
      {data.runtimeActualCount ? <div className="node-actual-badge">ACTUAL · {data.runtimeActualCount} path occurrence{data.runtimeActualCount === 1 ? '' : 's'}</div> : null}
      <div className="node-meta">
        {data.tracking.length > 0 && <span>{data.tracking.length} tracking</span>}
        {data.creatives.length > 0 && <span>{data.creatives.length} creative</span>}
        {openTodos > 0 && <span>{openTodos} todo</span>}
        {data.componentId && <span>library</span>}
      </div>
    </div>
  );
}

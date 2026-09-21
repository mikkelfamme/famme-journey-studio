import { Handle, NodeToolbar, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, BarChart3, BellRing, Bot, CheckCircle2, CircleDot, Copy, FileText, Flag, GitBranch, Goal, Mail, Megaphone, MousePointerClick, Search, ShieldCheck, ShoppingCart, MapPin, Sparkles, StickyNote, Tag, Trash2, UserRound, Workflow } from 'lucide-react';
import type { JourneyNode } from '../../types/domain';
import { useI18n } from '../../i18n';

const icons = {
  trigger: BellRing,
  need: UserRound,
  audienceSegment: UserRound,
  customerStep: Workflow,
  decision: GitBranch,
  meta: Megaphone,
  googleAds: Search,
  landingPage: FileText,
  shopCheckout: ShoppingCart,
  physicalVisit: MapPin,
  cta: MousePointerClick,
  tracking: BarChart3,
  conversion: Goal,
  lead: Tag,
  booking: CheckCircle2,
  exclusion: ShieldCheck,
  crm: Mail,
  note: StickyNote
} as const;

const handles = [
  // Incoming only: three ports on top, two on left.
  ['target-top-left', 'target', Position.Top, { left: '25%' }],
  ['target-top', 'target', Position.Top, { left: '50%' }],
  ['target-top-right', 'target', Position.Top, { left: '75%' }],
  ['target-left-top', 'target', Position.Left, { top: '35%' }],
  ['target-left-bottom', 'target', Position.Left, { top: '65%' }],

  // Outgoing only: three ports on bottom, two on right. A single port may
  // carry multiple edges, which supports both split and merge flows.
  ['source-bottom-left', 'source', Position.Bottom, { left: '25%' }],
  ['source-bottom', 'source', Position.Bottom, { left: '50%' }],
  ['source-bottom-right', 'source', Position.Bottom, { left: '75%' }],
  ['source-right-top', 'source', Position.Right, { top: '35%' }],
  ['source-right-bottom', 'source', Position.Right, { top: '65%' }]
] as const;

export function JourneyNodeComponent({ data, selected }: NodeProps<JourneyNode>) {
  const { nodeType, stage } = useI18n();
  const openTodos = data.annotations.filter(a => a.kind === 'todo' && !a.done).length;
  const Icon = icons[data.type as keyof typeof icons] ?? CircleDot;
  const hasSignals = data.tracking.length > 0 || data.creatives.length > 0 || openTodos > 0 || Boolean(data.componentId);
  const backgroundTone = data.backgroundTone ?? 'white';

  return (
    <div className={`journey-node node-${data.type} stage-${data.stage} node-tone-${backgroundTone} ${selected ? 'selected' : ''} ${data.componentId ? 'library-linked' : ''}`}>
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10} className="node-quick-toolbar">
        <button type="button" title="Duplicate node" onClick={event => { event.stopPropagation(); data.runtimeActions?.duplicate?.(); }}><Copy size={13}/><span>Duplicate</span></button>
        <button type="button" className="danger" title="Delete node" onClick={event => { event.stopPropagation(); data.runtimeActions?.delete?.(); }}><Trash2 size={13}/><span>Delete</span></button>
      </NodeToolbar>
      {handles.map(([id, type, position, style]) => <Handle key={id} id={id} type={type} position={position} className={`journey-handle ${type}`} style={style}/>) }
      <div className="node-head">
        <div className="node-icon"><Icon size={16}/></div>
        <div className="node-head-copy">
          <div className="node-kicker">{nodeType(data.type)}</div>
          <div className="node-title">{data.label}</div>
        </div>
        <span className={`node-stage stage-pill-${data.stage}`}>{stage(data.stage)}</span>
      </div>
      {data.description && <div className="node-desc">{data.description}</div>}
      {data.runtimePerformance && <div className={`node-performance quality-${data.runtimePerformance.quality}`}><div><strong>{data.runtimePerformance.quality}</strong><span>{data.runtimePerformance.source}</span></div>{data.runtimePerformance.metrics.map(metric => <div className="node-kpi" key={metric.key}><span>{metric.label}</span><b>{metric.formatted}</b></div>)}</div>}
      {data.runtimeActualCount ? <div className="node-actual-badge"><Sparkles size={10}/> Actual · {data.runtimeActualCount} occurrence{data.runtimeActualCount === 1 ? '' : 's'}</div> : null}{data.runtimeStageMismatch ? <div className="node-stage-warning" title="This node is visually outside its assigned funnel stage."><AlertTriangle size={10}/> Stage mismatch</div> : null}
      {hasSignals && <div className="node-signals">
        {data.tracking.length > 0 && <span><BarChart3 size={9}/>{data.tracking.length} tracking</span>}
        {data.creatives.length > 0 && <span><Bot size={9}/>{data.creatives.length} creative</span>}
        {openTodos > 0 && <span><Flag size={9}/>{openTodos} todo</span>}
        {data.componentId && <span><Sparkles size={9}/>library</span>}
      </div>}
    </div>
  );
}

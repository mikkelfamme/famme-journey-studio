import { useMemo } from 'react';
import type { FunnelStage, Journey, JourneyEdge, JourneyNode, JourneyNodeType } from '../../types/domain';
import { useI18n } from '../../i18n';

const STAGES: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];
const STAGE_FILL: Record<FunnelStage, string> = {
  top: '#f2f4ff',
  middle: '#eef6f9',
  bottom: '#eef8f4',
  lifecycle: '#fff7e9'
};
const STAGE_TEXT: Record<FunnelStage, string> = {
  top: '#5262bd',
  middle: '#557184',
  bottom: '#33705b',
  lifecycle: '#89661f'
};
const NODE_ACCENT: Partial<Record<JourneyNodeType, string>> = {
  meta: '#5865d9',
  googleAds: '#4d77cc',
  audienceSegment: '#6d7f93',
  landingPage: '#4c8796',
  shopCheckout: '#4c8796',
  physicalVisit: '#4c8796',
  cta: '#4c8796',
  tracking: '#4c8796',
  conversion: '#2d8067',
  lead: '#2d8067',
  booking: '#2d8067',
  exclusion: '#987027',
  crm: '#987027',
  note: '#a98332'
};

// Keep these close to the on-screen RC7/RC8 node footprint. The print SVG uses
// the journey's saved XYFlow positions directly, so relative spacing is preserved.
const NODE_W = 226;
const NODE_H = 88;
const GRAPH_PAD_X = 90;
const GRAPH_PAD_TOP = 72;
const GRAPH_PAD_BOTTOM = 72;

type Side = 'left' | 'right' | 'top' | 'bottom';

function wrapLabel(label: string, max = 27): string[] {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ['Untitled'];
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function sideFromHandle(handle?: string | null): Side | null {
  if (!handle) return null;
  if (handle.includes('left')) return 'left';
  if (handle.includes('right')) return 'right';
  if (handle.includes('top')) return 'top';
  if (handle.includes('bottom')) return 'bottom';
  return null;
}

function inferSides(source: JourneyNode, target: JourneyNode): [Side, Side] {
  const sx = source.position.x + NODE_W / 2;
  const sy = source.position.y + NODE_H / 2;
  const tx = target.position.x + NODE_W / 2;
  const ty = target.position.y + NODE_H / 2;
  const dx = tx - sx;
  const dy = ty - sy;

  if (Math.abs(dx) >= Math.abs(dy) * 0.8) {
    return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  }
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

function anchor(node: JourneyNode, side: Side) {
  switch (side) {
    case 'left': return { x: node.position.x, y: node.position.y + NODE_H * 0.54 };
    case 'right': return { x: node.position.x + NODE_W, y: node.position.y + NODE_H * 0.54 };
    case 'top': return { x: node.position.x + NODE_W * 0.54, y: node.position.y };
    case 'bottom': return { x: node.position.x + NODE_W * 0.54, y: node.position.y + NODE_H };
  }
}

function orthogonalEdgePath(edge: JourneyEdge, source: JourneyNode, target: JourneyNode) {
  const inferred = inferSides(source, target);
  const sourceSide = sideFromHandle(edge.sourceHandle) ?? inferred[0];
  const targetSide = sideFromHandle(edge.targetHandle) ?? inferred[1];
  const s = anchor(source, sourceSide);
  const t = anchor(target, targetSide);
  const horizontalSource = sourceSide === 'left' || sourceSide === 'right';
  const horizontalTarget = targetSide === 'left' || targetSide === 'right';

  if (horizontalSource && horizontalTarget) {
    const midX = (s.x + t.x) / 2;
    return { d: `M ${s.x} ${s.y} L ${midX} ${s.y} L ${midX} ${t.y} L ${t.x} ${t.y}`, mx: midX, my: (s.y + t.y) / 2 };
  }
  if (!horizontalSource && !horizontalTarget) {
    const midY = (s.y + t.y) / 2;
    return { d: `M ${s.x} ${s.y} L ${s.x} ${midY} L ${t.x} ${midY} L ${t.x} ${t.y}`, mx: (s.x + t.x) / 2, my: midY };
  }

  // Mixed-side links keep a single elbow. This mirrors the visual grammar of
  // XYFlow's smooth-step routing without recalculating the journey layout.
  if (horizontalSource) {
    return { d: `M ${s.x} ${s.y} L ${t.x} ${s.y} L ${t.x} ${t.y}`, mx: t.x, my: s.y };
  }
  return { d: `M ${s.x} ${s.y} L ${s.x} ${t.y} L ${t.x} ${t.y}`, mx: s.x, my: t.y };
}

function boundsForJourney(journey: Journey) {
  if (!journey.nodes.length) return { x: 0, y: 0, width: 1200, height: 520 };
  const minX = Math.min(...journey.nodes.map(node => node.position.x));
  const minY = Math.min(...journey.nodes.map(node => node.position.y));
  const maxX = Math.max(...journey.nodes.map(node => node.position.x + NODE_W));
  const maxY = Math.max(...journey.nodes.map(node => node.position.y + NODE_H));
  return {
    x: minX - GRAPH_PAD_X,
    y: minY - GRAPH_PAD_TOP,
    width: Math.max(980, maxX - minX + GRAPH_PAD_X * 2),
    height: Math.max(430, maxY - minY + GRAPH_PAD_TOP + GRAPH_PAD_BOTTOM)
  };
}

export function JourneyPrintSheet({ journey }: { journey: Journey }) {
  const { t, status, nodeType, stage, language } = useI18n();
  const nodeMap = useMemo(() => new Map(journey.nodes.map(node => [node.id, node])), [journey.nodes]);
  const bounds = useMemo(() => boundsForJourney(journey), [journey]);
  const stageWidth = bounds.width / STAGES.length;
  const detailNodes = journey.nodes.filter(node => {
    const url = node.data.url || node.data.landingPage;
    return Boolean(url || node.data.tracking.length || node.data.creatives.length || node.data.description);
  });

  return <section className="journey-print-sheet print-only">
    <header className="print-report-head">
      <div>
        <div className="print-brand">Journey Studio by Famme</div>
        <h1>{journey.name}</h1>
        <p>{status(journey.status)} · {journey.scope} · {journey.nodes.length} {t('journeys.nodes')} · {journey.edges.length} {t('journeys.connections')}</p>
      </div>
      <div className="print-report-meta"><span>{journey.audience || journey.product || 'Journey architecture'}</span><strong>{new Date().toLocaleDateString(language === 'da' ? 'da-DK' : 'en-GB')}</strong></div>
    </header>

    <div className="print-graph-frame">
      <svg className="print-graph" viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label={`${journey.name} journey diagram`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="fjs-print-arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#718096" />
          </marker>
        </defs>

        {STAGES.map((stageId, index) => {
          const x = bounds.x + stageWidth * index;
          return <g key={stageId}>
            <rect x={x} y={bounds.y} width={stageWidth} height={bounds.height} fill={STAGE_FILL[stageId]} />
            {index > 0 && <line x1={x} x2={x} y1={bounds.y} y2={bounds.y + bounds.height} stroke="#d8e0e7" strokeWidth="1" />}
            <g transform={`translate(${x + 16},${bounds.y + 16})`}>
              <rect x="0" y="0" width="124" height="23" rx="11.5" fill="#ffffff" fillOpacity=".9" stroke="#dfe5ea" />
              <text x="10" y="15" fill={STAGE_TEXT[stageId]} fontSize="9" fontWeight="800" letterSpacing=".7">{t(`stage.${stageId}Long`)}</text>
            </g>
          </g>;
        })}

        {journey.edges.map(edge => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;
          const route = orthogonalEdgePath(edge, source, target);
          const label = edge.data?.label || edge.data?.signal || edge.data?.condition || '';
          return <g key={edge.id}>
            <path
              d={route.d}
              fill="none"
              stroke="#718096"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#fjs-print-arrow)"
            />
            {label && <g>
              <rect x={route.mx - 54} y={route.my - 11} width="108" height="20" rx="8" fill="#fff" stroke="#e1e6eb"/>
              <text x={route.mx} y={route.my + 3} textAnchor="middle" fontSize="9" fill="#697482">{String(label).slice(0, 24)}</text>
            </g>}
          </g>;
        })}

        {journey.nodes.map(node => {
          const accent = NODE_ACCENT[node.data.type] ?? '#6d7f93';
          const lines = wrapLabel(node.data.label);
          const signalBits = [
            node.data.tracking.length ? `${node.data.tracking.length} tracking` : '',
            node.data.creatives.length ? `${node.data.creatives.length} creative` : '',
            (node.data.url || node.data.landingPage) ? 'URL' : ''
          ].filter(Boolean).join(' · ');
          return <g key={node.id} transform={`translate(${node.position.x},${node.position.y})`}>
            <rect width={NODE_W} height={NODE_H} rx="14" fill="#fff" stroke="#d5dce4" strokeWidth="1.2"/>
            <rect width={NODE_W} height="4" rx="2" fill={accent}/>
            <circle cx="22" cy="31" r="11" fill={accent} fillOpacity=".10" />
            <text x="40" y="25" fontSize="7.5" fill="#7b8692" fontWeight="800" letterSpacing=".75">{nodeType(node.data.type).toUpperCase()}</text>
            <text x={NODE_W - 13} y="25" textAnchor="end" fontSize="7.5" fill={STAGE_TEXT[node.data.stage]} fontWeight="800">{stage(node.data.stage).toUpperCase()}</text>
            {lines.map((line, index) => <text key={line + index} x="40" y={44 + index * 15} fontSize="13" fill="#1f2937" fontWeight="760">{line}</text>)}
            {signalBits && <text x="14" y={NODE_H - 9} fontSize="8" fill="#778391">{signalBits}</text>}
          </g>;
        })}
      </svg>
    </div>

    {detailNodes.length > 0 && <section className="print-detail-section">
      <div className="print-section-heading">{t('viewer.details')}</div>
      <div className="print-detail-grid">
        {detailNodes.map(node => {
          const url = node.data.url || node.data.landingPage;
          return <article className="print-detail-card" key={node.id}>
            <div className="print-detail-card-head"><strong>{node.data.label}</strong><span>{nodeType(node.data.type)} · {stage(node.data.stage)}</span></div>
            {node.data.description && <p>{node.data.description}</p>}
            {url && <div className="print-detail-line"><b>URL</b><span>{url}</span></div>}
            {node.data.tracking.length > 0 && <div className="print-detail-line"><b>{t('viewer.tracking')}</b><span>{node.data.tracking.map(item => `${item.platform}: ${item.event || 'Signal'} (${item.status})`).join(' · ')}</span></div>}
            {node.data.creatives.length > 0 && <>
              <div className="print-detail-line"><b>{t('viewer.creatives')}</b><span>{node.data.creatives.map(item => `${item.name || 'Creative'}${item.format ? ` [${item.format}]` : ''}`).join(' · ')}</span></div>
              {node.data.creatives.some(item => item.imageDataUrl || item.imageUrl) && <div className="print-creative-thumbs">{node.data.creatives.filter(item => item.imageDataUrl || item.imageUrl).slice(0, 3).map(item => <figure key={item.id}><img src={item.imageDataUrl || item.imageUrl} alt={item.name || 'Creative preview'}/><figcaption>{item.name || 'Creative'}</figcaption></figure>)}</div>}
            </>}
          </article>;
        })}
      </div>
    </section>}

    <footer className="print-report-footer"><span>Journey Studio by Famme · Designed &amp; developed by Mikkel Famme</span><span>{journey.name}</span></footer>
  </section>;
}

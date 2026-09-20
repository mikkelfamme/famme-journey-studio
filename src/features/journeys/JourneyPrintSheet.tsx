import { useMemo } from 'react';
import type { FunnelStage, Journey, JourneyNode, JourneyNodeType } from '../../types/domain';
import { compactStageLayout } from '../../lib/layout';
import { useI18n } from '../../i18n';

const STAGES: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];
const STAGE_X: Record<FunnelStage, number> = { top: 0, middle: 300, bottom: 600, lifecycle: 900 };
const STAGE_FILL: Record<FunnelStage, string> = {
  top: '#f4f5ff',
  middle: '#f1f7fa',
  bottom: '#f1f8f5',
  lifecycle: '#fff8ec'
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
  landingPage: '#4c8796',
  cta: '#4c8796',
  tracking: '#4c8796',
  conversion: '#2d8067',
  lead: '#2d8067',
  booking: '#2d8067',
  exclusion: '#987027',
  crm: '#987027',
  note: '#a98332'
};

const NODE_W = 220;
const NODE_H = 78;

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

function edgePath(source: JourneyNode, target: JourneyNode) {
  const sx = source.position.x + NODE_W;
  const sy = source.position.y + NODE_H / 2;
  const tx = target.position.x;
  const ty = target.position.y + NODE_H / 2;
  const dx = Math.max(34, Math.abs(tx - sx) * 0.45);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

export function JourneyPrintSheet({ journey }: { journey: Journey }) {
  const { t, status, nodeType, stage, language } = useI18n();
  const printJourney = useMemo(() => compactStageLayout(structuredClone(journey)), [journey]);
  const nodeMap = useMemo(() => new Map(printJourney.nodes.map(node => [node.id, node])), [printJourney.nodes]);
  const maxY = Math.max(240, ...printJourney.nodes.map(node => node.position.y + NODE_H + 60));
  const graphHeight = Math.max(maxY, 440);
  const detailNodes = printJourney.nodes.filter(node => {
    const url = node.data.url || node.data.landingPage;
    return Boolean(url || node.data.tracking.length || node.data.creatives.length || node.data.description);
  });

  return <section className="journey-print-sheet print-only">
    <header className="print-report-head">
      <div>
        <div className="print-brand">Famme Journey Studio</div>
        <h1>{journey.name}</h1>
        <p>{status(journey.status)} · {journey.scope} · {journey.nodes.length} {t('journeys.nodes')} · {journey.edges.length} {t('journeys.connections')}</p>
      </div>
      <div className="print-report-meta"><span>{journey.audience || journey.product || 'Journey architecture'}</span><strong>{new Date().toLocaleDateString(language === 'da' ? 'da-DK' : 'en-GB')}</strong></div>
    </header>

    <div className="print-graph-frame">
      <svg className="print-graph" viewBox={`0 0 1200 ${graphHeight}`} role="img" aria-label={`${journey.name} journey diagram`}>
        <defs>
          <marker id="fjs-print-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#7f8b98" />
          </marker>
        </defs>
        {STAGES.map(stageId => <g key={stageId}>
          <rect x={STAGE_X[stageId]} y="0" width="300" height={graphHeight} fill={STAGE_FILL[stageId]} />
          <line x1={STAGE_X[stageId] + 300} x2={STAGE_X[stageId] + 300} y1="0" y2={graphHeight} stroke="#dde3e9" strokeWidth="1" />
          <text x={STAGE_X[stageId] + 18} y="28" fill={STAGE_TEXT[stageId]} fontSize="12" fontWeight="800" letterSpacing="1">{t(`stage.${stageId}Long`)}</text>
        </g>)}

        {printJourney.edges.map(edge => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;
          const label = edge.data?.label || edge.data?.signal || edge.data?.condition || '';
          const mx = (source.position.x + NODE_W + target.position.x) / 2;
          const my = (source.position.y + target.position.y) / 2 + NODE_H / 2;
          return <g key={edge.id}>
            <path d={edgePath(source, target)} fill="none" stroke="#7f8b98" strokeWidth="1.7" markerEnd="url(#fjs-print-arrow)" />
            {label && <g><rect x={mx - 54} y={my - 11} width="108" height="20" rx="8" fill="#fff" stroke="#e1e6eb"/><text x={mx} y={my + 3} textAnchor="middle" fontSize="9" fill="#697482">{String(label).slice(0, 24)}</text></g>}
          </g>;
        })}

        {printJourney.nodes.map(node => {
          const accent = NODE_ACCENT[node.data.type] ?? '#6d7f93';
          const lines = wrapLabel(node.data.label);
          const signalBits = [
            node.data.tracking.length ? `${node.data.tracking.length} tracking` : '',
            node.data.creatives.length ? `${node.data.creatives.length} creative` : '',
            (node.data.url || node.data.landingPage) ? 'URL' : ''
          ].filter(Boolean).join(' · ');
          return <g key={node.id} transform={`translate(${node.position.x},${node.position.y})`}>
            <rect width={NODE_W} height={NODE_H} rx="12" fill="#fff" stroke="#d5dce4" strokeWidth="1.2"/>
            <rect width={NODE_W} height="4" rx="2" fill={accent}/>
            <text x="14" y="23" fontSize="8" fill="#7b8692" fontWeight="800" letterSpacing=".8">{nodeType(node.data.type).toUpperCase()}</text>
            <text x={NODE_W - 14} y="23" textAnchor="end" fontSize="8" fill={STAGE_TEXT[node.data.stage]} fontWeight="800">{stage(node.data.stage).toUpperCase()}</text>
            {lines.map((line, index) => <text key={line + index} x="14" y={43 + index * 15} fontSize="13" fill="#1f2937" fontWeight="760">{line}</text>)}
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

    <footer className="print-report-footer"><span>Famme Journey Studio · Designed &amp; developed by Mikkel Famme</span><span>{journey.name}</span></footer>
  </section>;
}

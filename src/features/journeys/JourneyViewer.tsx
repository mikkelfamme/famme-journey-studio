import { useEffect, useMemo, useState } from 'react';
import { Background, MarkerType, ReactFlow, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, FileImage, Maximize, Minimize, Pencil, Printer, X } from 'lucide-react';
import type { Journey, JourneyNode } from '../../types/domain';
import { JourneyNodeComponent } from './JourneyNode';
import { JourneyPrintSheet } from './JourneyPrintSheet';
import { StageBackdrop } from './StageBackdrop';
import type { CanvasViewport } from '../../lib/stageGeometry';
import { useI18n } from '../../i18n';
import { downloadJourneyPng, downloadJourneySvg } from '../../lib/journeyImageExport';
import { normalizeJourneyEdgeHandles } from '../../lib/flowHandles';

const nodeTypes = { journey: JourneyNodeComponent };

export function JourneyViewer({ journey, initialSelectedId, onClose, onEdit }: { journey: Journey; initialSelectedId?: string; onClose: () => void; onEdit: () => void }) {
  const { t, status } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [presenting, setPresenting] = useState(false);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>({ x: 0, y: 0, zoom: 1 });
  const selected = useMemo(() => journey.nodes.find(node => node.id === selectedId) ?? null, [journey.nodes, selectedId]);
  const presentationOrder = useMemo(() => [...journey.nodes].sort((a,b) => a.position.x - b.position.x || a.position.y - b.position.y), [journey.nodes]);
  const presentationIndex = selectedId ? presentationOrder.findIndex(node => node.id === selectedId) : -1;
  const nodes = useMemo(() => journey.nodes.map(node => ({
    ...node,
    draggable: false,
    selectable: false,
    focusable: false,
    selected: node.id === selectedId,
    data: { ...node.data, runtimeActions: undefined }
  })), [journey.nodes, selectedId]);
  const edges = useMemo(() => normalizeJourneyEdgeHandles(journey.nodes, journey.edges).map(edge => {
    const label = edge.data?.label || edge.data?.signal || edge.data?.condition || undefined;
    return {
      ...edge,
      selectable: false,
      focusable: false,
      animated: true,
      label,
      className: [edge.className, 'fjs-flow-edge'].filter(Boolean).join(' '),
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: '#687889' },
      style: { ...(edge.style ?? {}), stroke: '#718194', strokeWidth: 1.9 },
      labelStyle: { fill: '#435160', fontSize: 10, fontWeight: 750 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.96, stroke: '#d6dde5', strokeWidth: 1 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 8
    };
  }), [journey.nodes, journey.edges]);
  const onNodeClick: NodeMouseHandler<JourneyNode> = (_, node) => setSelectedId(node.id);
  const nodeUrl = selected?.data.url || (selected?.data.type === 'landingPage' ? selected.data.landingPage : undefined);

  useEffect(() => { if (initialSelectedId) setSelectedId(initialSelectedId); }, [initialSelectedId, journey.id]);
  useEffect(() => { const onFull = () => setPresenting(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', onFull); return () => document.removeEventListener('fullscreenchange', onFull); }, []);
  async function togglePresentation() {
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    if (!selectedId && presentationOrder[0]) setSelectedId(presentationOrder[0].id);
    await document.documentElement.requestFullscreen();
  }
  function stepPresentation(direction: -1 | 1) {
    if (!presentationOrder.length) return;
    const current = presentationIndex >= 0 ? presentationIndex : 0;
    const next = Math.max(0, Math.min(presentationOrder.length - 1, current + direction));
    setSelectedId(presentationOrder[next].id);
  }

  return <div className={`viewer-screen ${presenting ? 'presentation-mode' : ''}` }>
    <header className="viewer-topbar no-print">
      <div className="viewer-topbar-left">
        <button className="icon-button" onClick={onClose} title={t('viewer.back')}><ArrowLeft size={18}/></button>
        <div className="editor-title"><strong>{journey.name}</strong><span>{t('viewer.readOnly')} · {status(journey.status)} · {journey.scope} · {journey.nodes.length} {t('journeys.nodes')}</span></div>
      </div>
      <div className="viewer-topbar-actions">
        {presenting ? <>
          <button className="button" disabled={presentationIndex <= 0} onClick={()=>stepPresentation(-1)}><ChevronLeft size={15}/>{t('viewer.previous')}</button>
          <span className="presentation-progress">{Math.max(0,presentationIndex)+1} / {Math.max(1,presentationOrder.length)}</span>
          <button className="button" disabled={presentationIndex < 0 || presentationIndex >= presentationOrder.length-1} onClick={()=>stepPresentation(1)}>{t('viewer.next')}<ChevronRight size={15}/></button>
          <button className="button primary" onClick={()=>void togglePresentation()}><Minimize size={15}/>{t('viewer.exitPresentation')}</button>
        </> : <>
          <button className="button" onClick={()=>void togglePresentation()}><Maximize size={15}/>{t('viewer.presentation')}</button>
          <button className="button" onClick={()=>downloadJourneySvg(journey)}><FileImage size={15}/> SVG</button>
          <button className="button" onClick={()=>void downloadJourneyPng(journey)}><FileImage size={15}/> PNG</button>
          <button className="button" onClick={() => window.print()}><Printer size={15}/>{t('viewer.print')}</button>
          <button className="button primary" onClick={onEdit}><Pencil size={15}/>{t('viewer.edit')}</button>
        </>}
      </div>
    </header>
    {presenting&&<div className="presentation-hint no-print">{t('viewer.presentationHint')}</div>}
    <div className={`viewer-layout ${selected ? 'details-open' : ''}` }>
      <div className="viewer-canvas canvas-wrap no-print">
        <StageBackdrop viewport={canvasViewport}/>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={instance => setCanvasViewport(instance.getViewport())}
          onMove={(_, viewport) => setCanvasViewport(viewport)}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onPaneClick={() => setSelectedId(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesReconnectable={false}
          elementsSelectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          selectionOnDrag={false}
          fitView
          fitViewOptions={{ padding: 0.18, minZoom: 0.45, maxZoom: 1.05 }}
        >
          <Background gap={20} size={1}/>
        </ReactFlow>
      </div>
      {selected && <aside className="viewer-details no-print">
        <div className="viewer-details-head"><div><span>{t('viewer.details')}</span><strong>{selected.data.label}</strong><small>{selected.data.type} · {selected.data.stage}</small></div><button className="icon-button" onClick={() => setSelectedId(null)}><X size={15}/></button></div>
        {selected.data.description && <p className="viewer-description">{selected.data.description}</p>}
        {nodeUrl && <div className="viewer-link-card"><span>URL</span><a href={nodeUrl} target="_blank" rel="noreferrer">{nodeUrl}<ExternalLink size={13}/></a></div>}
        <section className="viewer-detail-section">
          <h4>{t('viewer.creatives')} <span>{selected.data.creatives.length}</span></h4>
          {selected.data.creatives.length === 0 ? <p className="muted-small">{t('viewer.noMedia')}</p> : selected.data.creatives.map(creative => {
            const image = creative.imageDataUrl || creative.imageUrl;
            return <article className="viewer-creative" key={creative.id}>
              {image && <img src={image} alt={creative.name || 'Creative preview'} loading="lazy"/>}
              <div className="viewer-creative-body"><strong>{creative.name || 'Creative'}</strong><small>{creative.format} · {creative.status ?? 'draft'}</small>{creative.headline && <p>{creative.headline}</p>}{creative.finalUrl && <a href={creative.finalUrl} target="_blank" rel="noreferrer">{t('viewer.openUrl')}<ExternalLink size={12}/></a>}</div>
            </article>;
          })}
        </section>
        <section className="viewer-detail-section">
          <h4>{t('viewer.tracking')} <span>{selected.data.tracking.length}</span></h4>
          {selected.data.tracking.map(item => <div className="viewer-tracking-row" key={item.id}><strong>{item.event || 'Signal'}</strong><span>{item.platform} · {item.status}</span></div>)}
        </section>
      </aside>}
    </div>
    <JourneyPrintSheet journey={journey}/>
  </div>;
}

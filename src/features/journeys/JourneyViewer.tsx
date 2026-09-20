import { useMemo, useState } from 'react';
import { Background, MarkerType, ReactFlow, type NodeMouseHandler } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, ExternalLink, Pencil, Printer, X } from 'lucide-react';
import type { Journey, JourneyNode } from '../../types/domain';
import { JourneyNodeComponent } from './JourneyNode';
import { JourneyPrintSheet } from './JourneyPrintSheet';
import { useI18n } from '../../i18n';

const nodeTypes = { journey: JourneyNodeComponent };

export function JourneyViewer({ journey, onClose, onEdit }: { journey: Journey; onClose: () => void; onEdit: () => void }) {
  const { t, status } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => journey.nodes.find(node => node.id === selectedId) ?? null, [journey.nodes, selectedId]);
  const nodes = useMemo(() => journey.nodes.map(node => ({
    ...node,
    draggable: false,
    selectable: false,
    focusable: false,
    selected: node.id === selectedId,
    data: { ...node.data, runtimeActions: undefined }
  })), [journey.nodes, selectedId]);
  const edges = useMemo(() => journey.edges.map(edge => {
    const label = edge.data?.label || edge.data?.signal || edge.data?.condition || undefined;
    return {
      ...edge,
      selectable: false,
      focusable: false,
      label,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: '#7f8b98' },
      style: { ...(edge.style ?? {}), stroke: '#7f8b98', strokeWidth: 1.7 },
      labelStyle: { fill: '#5f6b78', fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.94, stroke: '#dfe5ea', strokeWidth: 1 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 7
    };
  }), [journey.edges]);
  const onNodeClick: NodeMouseHandler<JourneyNode> = (_, node) => setSelectedId(node.id);
  const nodeUrl = selected?.data.url || (selected?.data.type === 'landingPage' ? selected.data.landingPage : undefined);

  return <div className="viewer-screen">
    <header className="viewer-topbar no-print">
      <div className="viewer-topbar-left">
        <button className="icon-button" onClick={onClose} title={t('viewer.back')}><ArrowLeft size={18}/></button>
        <div className="editor-title"><strong>{journey.name}</strong><span>{t('viewer.readOnly')} · {status(journey.status)} · {journey.scope} · {journey.nodes.length} {t('journeys.nodes')}</span></div>
      </div>
      <div className="viewer-topbar-actions">
        <button className="button" onClick={() => window.print()}><Printer size={15}/>{t('viewer.print')}</button>
        <button className="button primary" onClick={onEdit}><Pencil size={15}/>{t('viewer.edit')}</button>
      </div>
    </header>
    <div className={`viewer-layout ${selected ? 'details-open' : ''}`}>
      <div className="viewer-canvas canvas-wrap no-print">
        <div className="stage-zones" aria-hidden="true">
          <div className="stage-zone stage-zone-top"><span>{t('stage.topLong')}</span></div>
          <div className="stage-zone stage-zone-middle"><span>{t('stage.middleLong')}</span></div>
          <div className="stage-zone stage-zone-bottom"><span>{t('stage.bottomLong')}</span></div>
          <div className="stage-zone stage-zone-lifecycle"><span>{t('stage.lifecycleLong')}</span></div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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

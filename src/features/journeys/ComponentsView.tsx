import { Boxes, RefreshCw, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useI18n } from '../../i18n';

export function ComponentsView() {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t, stage } = useI18n();
  if (!workspace) return null;
  const currentWorkspace = workspace;
  function usage(componentId: string) { return currentWorkspace.journeys.reduce((sum, journey) => sum + journey.nodes.filter(node => node.data.componentId === componentId).length, 0); }
  function syncAll(componentId: string) {
    const component = currentWorkspace.components.find(c => c.id === componentId); if (!component) return;
    const stamp = new Date().toISOString();
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.map(journey => ({ ...journey, nodes: journey.nodes.map(node => node.data.componentId === componentId ? { ...node, data: { ...structuredClone(component.nodeData), annotations: node.data.annotations, componentId, componentSyncedAt: stamp } } : node) })) }));
  }
  function remove(componentId: string) {
    const used = usage(componentId);
    if (!window.confirm(used ? `This component is used ${used} time(s). Delete the Library definition and detach existing nodes?` : 'Delete this component?')) return;
    updateWorkspace(ws => ({ ...ws, components: ws.components.filter(c => c.id !== componentId), journeys: ws.journeys.map(j => ({ ...j, nodes: j.nodes.map(n => n.data.componentId === componentId ? { ...n, data: { ...n.data, componentId: undefined, componentSyncedAt: undefined } } : n) })) }));
  }
  return <section className="content-section"><div className="section-toolbar"><div><h2>{t('components.title')}</h2><p>{t('components.subtitle')}</p></div></div>{currentWorkspace.components.length === 0 ? <div className="empty-state"><Boxes size={32}/><h3>{t('components.empty')}</h3><p>Open a journey, select a node and choose <strong>Save node to Library</strong>. The component can then be inserted and synchronized elsewhere.</p></div> : <div className="card-grid">{currentWorkspace.components.map(c => <article className="journey-card" key={c.id}><div className="card-top"><span className="eyebrow-small">{c.nodeData.type}</span><span className="chip">{usage(c.id)} use{usage(c.id) === 1 ? '' : 's'}</span></div><h3>{c.name}</h3><p>{c.description || c.nodeData.description || 'Reusable journey component.'}</p><div className="metrics-row"><div><strong>{c.nodeData.tracking.length}</strong><span>{t('components.tracking')}</span></div><div><strong>{c.nodeData.creatives.length}</strong><span>{t('components.creatives')}</span></div><div><strong>{stage(c.nodeData.stage)}</strong><span>{t('components.stage')}</span></div></div><div className="card-actions"><button className="button" onClick={() => syncAll(c.id)}><RefreshCw size={14}/> {t('components.syncAll')}</button><button className="icon-button danger-icon" onClick={() => remove(c.id)}><Trash2 size={14}/></button></div></article>)}</div>}</section>;
}

import { useState } from 'react';
import { Copy, Eye, GitBranch, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { journeyFromTemplate } from '../../lib/workspace';
import { makeId } from '../../lib/ids';
import type { Journey, JourneyStatus } from '../../types/domain';
import { useI18n } from '../../i18n';

export function JourneysView({ onEdit, onView }: { onEdit: (journey: Journey) => void; onView: (journey: Journey) => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t, status } = useI18n();
  const [templateId, setTemplateId] = useState(workspace?.templates[0]?.id ?? '');
  const [menuId, setMenuId] = useState<string | null>(null);
  if (!workspace) return null;
  const currentWorkspace = workspace;

  function create() {
    const template = currentWorkspace.templates.find(t => t.id === templateId) ?? currentWorkspace.templates[0];
    if (!template) return;
    const name = window.prompt('Journey name', `New ${template.name}`);
    if (!name) return;
    const journey = journeyFromTemplate(template, name, currentWorkspace.organization);
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, journey] }));
    onEdit(journey);
  }

  function duplicate(journey: Journey) {
    const copy: Journey = structuredClone(journey);
    const idMap = new Map<string, string>();
    copy.id = makeId('journey');
    copy.name = `${journey.name} copy`;
    copy.nodes = copy.nodes.map(n => { const id = makeId('node'); idMap.set(n.id, id); return { ...n, id }; });
    copy.edges = copy.edges.map(e => ({ ...e, id: makeId('edge'), source: idMap.get(e.source)!, target: idMap.get(e.target)! }));
    copy.createdAt = copy.updatedAt = new Date().toISOString();
    copy.status = 'draft';
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, copy] }));
  }

  function remove(id: string) {
    if (!window.confirm('Delete this journey?')) return;
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.filter(j => j.id !== id) }));
  }

  function rename(journey: Journey) {
    const name = window.prompt(t('journeys.rename'), journey.name)?.trim();
    if (!name || name === journey.name) return;
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.map(item => item.id === journey.id ? { ...item, name, updatedAt: new Date().toISOString() } : item) }));
  }

  function setStatus(journey: Journey, next: JourneyStatus) {
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.map(item => item.id === journey.id ? { ...item, status: next, updatedAt: new Date().toISOString() } : item) }));
  }

  return (
    <section className="content-section">
      <div className="section-toolbar">
        <div><h2>{t('journeys.title')}</h2><p>{t('journeys.subtitle')}</p></div>
        <div className="inline-form"><select value={templateId} onChange={e => setTemplateId(e.target.value)}>{currentWorkspace.templates.map(tpl => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}</select><button className="button primary" onClick={create}><Plus size={16}/> {t('journeys.createTemplate')}</button></div>
      </div>
      {currentWorkspace.journeys.length === 0 ? (
        <div className="empty-state"><GitBranch size={32}/><h3>{t('journeys.emptyTitle')}</h3><p>{t('journeys.emptyText')}</p><button className="button primary" onClick={create}>{t('journeys.createFirst')}</button></div>
      ) : (
        <div className="card-grid">
          {currentWorkspace.journeys.map(journey => (
            <article className="journey-card" key={journey.id}>
              <div className="card-top">
                <span className={`status status-${journey.status}`}>{status(journey.status)}</span>
                <div className="journey-card-menu-wrap">
                  <button className="icon-button card-menu-trigger" title={t('journeys.menu')} onClick={() => setMenuId(menuId === journey.id ? null : journey.id)}><MoreHorizontal size={17}/></button>
                  {menuId === journey.id && <div className="journey-card-menu">
                    <button onClick={() => { onView(journey); setMenuId(null); }}><Eye size={14}/>{t('journeys.view')}</button>
                    <button onClick={() => { onEdit(journey); setMenuId(null); }}><Pencil size={14}/>{t('journeys.edit')}</button>
                    <button onClick={() => { rename(journey); setMenuId(null); }}><Pencil size={14}/>{t('journeys.rename')}</button>
                    <div className="menu-divider" />
                    {(['draft','active','paused','archived'] as JourneyStatus[]).map(item => <button key={item} className={journey.status === item ? 'selected' : ''} onClick={() => { setStatus(journey, item); setMenuId(null); }}><span className={`menu-status-dot status-${item}`}/>{status(item)}</button>)}
                    <div className="menu-divider" />
                    <button onClick={() => { duplicate(journey); setMenuId(null); }}><Copy size={14}/>{t('journeys.duplicate')}</button>
                    <button className="danger" onClick={() => { remove(journey.id); setMenuId(null); }}><Trash2 size={14}/>{t('journeys.delete')}</button>
                  </div>}
                </div>
              </div>
              <h3>{journey.name}</h3><p>{journey.description || t('journeys.noDescription')}</p>
              <div className="metrics-row"><div><strong>{journey.nodes.length}</strong><span>{t('journeys.nodes')}</span></div><div><strong>{journey.edges.length}</strong><span>{t('journeys.connections')}</span></div><div><strong>{journey.scope}</strong><span>{t('journeys.scope')}</span></div></div>
              <div className="card-actions journey-card-actions">
                <button className="button" title={t('journeys.openView')} onClick={() => onView(journey)}><Eye size={15}/>{t('journeys.view')}</button>
                <button className="button primary" title={t('journeys.openEdit')} onClick={() => onEdit(journey)}><Pencil size={15}/>{t('journeys.edit')}</button>
                <button className="icon-button" title={t('journeys.duplicate')} onClick={() => duplicate(journey)}><Copy size={16}/></button>
                <button className="icon-button danger-icon" title={t('journeys.delete')} onClick={() => remove(journey.id)}><Trash2 size={16}/></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

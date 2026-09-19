import { Plus, Trash2, Waypoints } from 'lucide-react';
import { journeyFromTemplate } from '../../lib/workspace';
import { useWorkspace } from '../../store/WorkspaceContext';
import type { Journey } from '../../types/domain';

export function TemplatesView({ onOpen }: { onOpen: (journey: Journey) => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  if (!workspace) return null;
  const currentWorkspace = workspace;
  function useTemplate(id: string) {
    const t = currentWorkspace.templates.find(x => x.id === id); if (!t) return;
    const name = window.prompt('Journey name', `New ${t.name}`); if (!name) return;
    const journey = journeyFromTemplate(t, name, currentWorkspace.organization);
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, journey] }));
    onOpen(journey);
  }
  function remove(id: string) { updateWorkspace(ws => ({ ...ws, templates: ws.templates.filter(t => t.system || t.id !== id) })); }
  return <section className="content-section"><div className="section-toolbar"><div><h2>Templates</h2><p>Complete journey archetypes. Creating a journey makes an independent copy.</p></div></div>{currentWorkspace.templates.length===0?<div className="empty-state"><Waypoints size={32}/><h3>No templates available</h3><p>Create or import a workspace with templates before starting from an archetype.</p></div>:<div className="card-grid">{currentWorkspace.templates.map(t => <article className="template-card" key={t.id}><div className="template-icon"><Waypoints size={20}/></div><div className="card-top"><span className="eyebrow-small">{t.system ? 'SYSTEM TEMPLATE' : 'CUSTOM TEMPLATE'}</span><span className="chip">{t.scope}</span></div><h3>{t.name}</h3><p>{t.description}</p><div className="metrics-row"><div><strong>{t.nodes.length}</strong><span>nodes</span></div><div><strong>{t.category}</strong><span>category</span></div></div><div className="card-actions"><button className="button primary" onClick={() => useTemplate(t.id)}><Plus size={16}/> Use template</button>{!t.system && <button className="icon-button danger-icon" onClick={() => remove(t.id)}><Trash2 size={16}/></button>}</div></article>)}</div>}</section>;
}

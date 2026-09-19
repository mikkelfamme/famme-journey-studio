import { useState } from 'react';
import { Copy, GitBranch, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { journeyFromTemplate } from '../../lib/workspace';
import { makeId } from '../../lib/ids';
import type { Journey } from '../../types/domain';

export function JourneysView({ onOpen }: { onOpen: (journey: Journey) => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const [templateId, setTemplateId] = useState(workspace?.templates[0]?.id ?? '');
  if (!workspace) return null;
  const currentWorkspace = workspace;

  function create() {
    const template = currentWorkspace.templates.find(t => t.id === templateId) ?? currentWorkspace.templates[0];
    if (!template) return;
    const name = window.prompt('Journey name', `New ${template.name}`);
    if (!name) return;
    const journey = journeyFromTemplate(template, name, currentWorkspace.organization);
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, journey] }));
    onOpen(journey);
  }

  function duplicate(journey: Journey) {
    const copy: Journey = structuredClone(journey);
    const idMap = new Map<string, string>();
    copy.id = makeId('journey');
    copy.name = `${journey.name} copy`;
    copy.nodes = copy.nodes.map(n => { const id = makeId('node'); idMap.set(n.id, id); return { ...n, id }; });
    copy.edges = copy.edges.map(e => ({ ...e, id: makeId('edge'), source: idMap.get(e.source)!, target: idMap.get(e.target)! }));
    copy.createdAt = copy.updatedAt = new Date().toISOString();
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, copy] }));
  }

  function remove(id: string) {
    if (!window.confirm('Delete this journey?')) return;
    updateWorkspace(ws => ({ ...ws, journeys: ws.journeys.filter(j => j.id !== id) }));
  }

  return (
    <section className="content-section">
      <div className="section-toolbar">
        <div><h2>Customer journeys</h2><p>One data model. Multiple views. Build the planned path and measurement logic together.</p></div>
        <div className="inline-form"><select value={templateId} onChange={e => setTemplateId(e.target.value)}>{currentWorkspace.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select><button className="button primary" onClick={create}><Plus size={16}/> Create from template</button></div>
      </div>
      {currentWorkspace.journeys.length === 0 ? (
        <div className="empty-state"><GitBranch size={32}/><h3>No journeys yet</h3><p>Start from a generic template. The result is an independent journey you can customize.</p><button className="button primary" onClick={create}>Create first journey</button></div>
      ) : (
        <div className="card-grid">
          {currentWorkspace.journeys.map(j => (
            <article className="journey-card" key={j.id}>
              <div className="card-top"><span className={`status status-${j.status}`}>{j.status}</span><MoreHorizontal size={17}/></div>
              <h3>{j.name}</h3><p>{j.description || 'No description yet.'}</p>
              <div className="metrics-row"><div><strong>{j.nodes.length}</strong><span>nodes</span></div><div><strong>{j.edges.length}</strong><span>connections</span></div><div><strong>{j.scope}</strong><span>scope</span></div></div>
              <div className="card-actions"><button className="button primary" onClick={() => onOpen(j)}>Open</button><button className="icon-button" title="Duplicate" onClick={() => duplicate(j)}><Copy size={16}/></button><button className="icon-button danger-icon" title="Delete" onClick={() => remove(j.id)}><Trash2 size={16}/></button></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

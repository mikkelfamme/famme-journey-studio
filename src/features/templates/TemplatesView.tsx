import { FileUp, Plus, Share2, Trash2, Waypoints, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { journeyFromTemplate } from '../../lib/workspace';
import { downloadJourneyTemplate, parseJourneyTemplateFile, templateFromJourney } from '../../lib/templateFiles';
import { useWorkspace } from '../../store/WorkspaceContext';
import type { Journey, WorkspaceScope } from '../../types/domain';
import { useI18n } from '../../i18n';

interface CreateTemplateDraft {
  sourceJourneyId: string;
  name: string;
  description: string;
  category: string;
  scope: WorkspaceScope;
}

export function TemplatesView({ onOpen }: { onOpen: (journey: Journey) => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t: tr } = useI18n();
  const importRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<CreateTemplateDraft>({ sourceJourneyId: '', name: '', description: '', category: 'Custom', scope: 'B2C' });
  if (!workspace) return null;
  const currentWorkspace = workspace;

  function useTemplate(id: string) {
    const template = currentWorkspace.templates.find(item => item.id === id);
    if (!template) return;
    const name = window.prompt(tr('templates.journeyName'), `${tr('templates.newPrefix')} ${template.name}`);
    if (!name) return;
    const journey = journeyFromTemplate(template, name, currentWorkspace.organization);
    updateWorkspace(ws => ({ ...ws, journeys: [...ws.journeys, journey] }));
    onOpen(journey);
  }

  function remove(id: string) {
    updateWorkspace(ws => ({ ...ws, templates: ws.templates.filter(template => template.system || template.id !== id) }));
  }

  function openCreate() {
    const source = currentWorkspace.journeys[0];
    if (!source) {
      setError(tr('templates.createNeedsJourney'));
      setMessage('');
      return;
    }
    setDraft({
      sourceJourneyId: source.id,
      name: `${source.name} template`,
      description: source.description || tr('templates.customDescriptionFallback'),
      category: 'Custom',
      scope: source.scope
    });
    setError('');
    setMessage('');
    setCreateOpen(true);
  }

  function changeSource(id: string) {
    const source = currentWorkspace.journeys.find(journey => journey.id === id);
    if (!source) return;
    setDraft({
      sourceJourneyId: source.id,
      name: `${source.name} template`,
      description: source.description || tr('templates.customDescriptionFallback'),
      category: draft.category || 'Custom',
      scope: source.scope
    });
  }

  function createTemplate() {
    const source = currentWorkspace.journeys.find(journey => journey.id === draft.sourceJourneyId);
    if (!source) return;
    const template = templateFromJourney(source, draft);
    updateWorkspace(ws => ({ ...ws, templates: [...ws.templates, template] }));
    setCreateOpen(false);
    setMessage(tr('templates.created'));
    setError('');
  }

  async function importTemplate(file?: File) {
    if (!file) return;
    try {
      const template = await parseJourneyTemplateFile(file);
      updateWorkspace(ws => ({ ...ws, templates: [...ws.templates, template] }));
      setMessage(`${tr('templates.imported')}: ${template.name}`);
      setError('');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : tr('templates.importError'));
      setMessage('');
    }
  }

  return <section className="content-section">
    <div className="section-toolbar">
      <div><h2>{tr('templates.title')}</h2><p>{tr('templates.subtitle')}</p></div>
      <div className="template-toolbar-actions">
        <button className="button" onClick={() => importRef.current?.click()}><FileUp size={16}/> {tr('templates.import')}</button>
        <button className="button primary" onClick={openCreate}><Plus size={16}/> {tr('templates.create')}</button>
        <input ref={importRef} type="file" accept=".jstemplate,.json,application/json" hidden onChange={event => { void importTemplate(event.target.files?.[0]); event.currentTarget.value = ''; }} />
      </div>
    </div>

    {message && <div className="template-feedback success">{message}</div>}
    {error && <div className="template-feedback error">{error}</div>}

    {currentWorkspace.templates.length === 0
      ? <div className="empty-state"><Waypoints size={32}/><h3>{tr('templates.empty')}</h3><p>{tr('templates.emptyText')}</p></div>
      : <div className="card-grid">{currentWorkspace.templates.map(template => <article className="template-card" key={template.id}>
          <div className="template-icon"><Waypoints size={20}/></div>
          <div className="card-top"><span className="eyebrow-small">{template.system ? tr('templates.system') : tr('templates.custom')}</span><span className="chip">{template.scope}</span></div>
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <div className="metrics-row"><div><strong>{template.nodes.length}</strong><span>{tr('templates.nodes')}</span></div><div><strong>{template.category}</strong><span>{tr('templates.category')}</span></div></div>
          <div className="card-actions template-card-actions">
            <button className="button primary" onClick={() => useTemplate(template.id)}><Plus size={16}/> {tr('templates.use')}</button>
            <button className="button" onClick={() => { downloadJourneyTemplate(template); setMessage(`${tr('templates.shared')}: ${template.name}`); setError(''); }}><Share2 size={16}/> {tr('templates.share')}</button>
            {!template.system && <button className="icon-button danger-icon" title={tr('templates.delete')} onClick={() => remove(template.id)}><Trash2 size={16}/></button>}
          </div>
        </article>)}</div>}

    {createOpen && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
      <div className="modal-card template-create-modal" role="dialog" aria-modal="true" aria-labelledby="create-template-title">
        <div className="modal-header">
          <div className="modal-icon"><Waypoints size={20}/></div>
          <div><h2 id="create-template-title">{tr('templates.createTitle')}</h2><p>{tr('templates.createText')}</p></div>
          <button className="icon-button" onClick={() => setCreateOpen(false)} aria-label={tr('common.close')}><X size={16}/></button>
        </div>
        <div className="form-grid template-create-form">
          <label className="template-source-field">{tr('templates.sourceJourney')}
            <select value={draft.sourceJourneyId} onChange={event => changeSource(event.target.value)}>{currentWorkspace.journeys.map(journey => <option key={journey.id} value={journey.id}>{journey.name}</option>)}</select>
          </label>
          <label>{tr('templates.name')}<input value={draft.name} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))}/></label>
          <label>{tr('templates.categoryLabel')}<input value={draft.category} onChange={event => setDraft(current => ({ ...current, category: event.target.value }))}/></label>
          <label>{tr('templates.scope')}<select value={draft.scope} onChange={event => setDraft(current => ({ ...current, scope: event.target.value as WorkspaceScope }))}><option value="B2C">B2C</option><option value="B2B">B2B</option><option value="Mixed">Mixed</option></select></label>
          <label className="template-description-field">{tr('templates.description')}<textarea rows={4} value={draft.description} onChange={event => setDraft(current => ({ ...current, description: event.target.value }))}/></label>
        </div>
        <div className="template-portable-note"><Share2 size={15}/><span>{tr('templates.portableNote')}</span></div>
        <div className="modal-actions"><button className="button" onClick={() => setCreateOpen(false)}>{tr('common.cancel')}</button><button className="button primary" disabled={!draft.sourceJourneyId || !draft.name.trim()} onClick={createTemplate}><Plus size={16}/> {tr('templates.saveTemplate')}</button></div>
      </div>
    </div>}
  </section>;
}

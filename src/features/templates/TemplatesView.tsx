import { Eye, FileUp, Pencil, Plus, Share2, Tags, Trash2, Waypoints, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { journeyFromTemplate } from '../../lib/workspace';
import { downloadJourneyTemplate, parseJourneyTemplateFile } from '../../lib/templateFiles';
import { createBlankTemplate } from '../../lib/templates';
import { useWorkspace } from '../../store/WorkspaceContext';
import type { Journey, JourneyTemplate, WorkspaceScope } from '../../types/domain';
import { useI18n } from '../../i18n';

interface CreateTemplateDraft {
  name: string;
  description: string;
  category: string;
  scope: WorkspaceScope;
  version: string;
  tags: string;
  author: string;
}

function TemplateMiniPreview({ template }: { template: JourneyTemplate }) {
  const counts = ['top','middle','bottom','lifecycle'].map(stage => template.nodes.filter(node => node.data.stage === stage).length);
  return <div className="template-mini-preview" aria-hidden="true">{counts.map((count,index)=><div key={index}><span>{['TOP','MIDDLE','BOTTOM','LIFECYCLE'][index]}</span><div>{Array.from({length:Math.min(count,7)}).map((_,i)=><i key={i}/>)}</div></div>)}</div>;
}

export function TemplatesView({ onOpen, onEditTemplate }: { onOpen: (journey: Journey) => void; onEditTemplate: (template: JourneyTemplate) => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t: tr } = useI18n();
  const importRef = useRef<HTMLInputElement>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [preview, setPreview] = useState<JourneyTemplate | null>(null);
  const [pendingImport, setPendingImport] = useState<JourneyTemplate | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<CreateTemplateDraft>({ name:'', description:'', category:'Custom', scope:'B2C', version:'1.0.0', tags:'', author:'' });
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
    if (!window.confirm(tr('templates.deleteConfirm'))) return;
    updateWorkspace(ws => ({ ...ws, templates: ws.templates.filter(template => template.id !== id) }));
  }

  function openCreate() {
    setDraft({ name:'', description:'', category:'Custom', scope:currentWorkspace.scope, version:'1.0.0', tags:'', author:currentWorkspace.organization || 'Local author' });
    setError(''); setMessage(''); setCreateOpen(true);
  }

  function createTemplate() {
    if (!draft.name.trim()) return;
    const template = createBlankTemplate({ name:draft.name, description:draft.description, category:draft.category, scope:draft.scope, version:draft.version, tags:draft.tags.split(',').map(v=>v.trim()).filter(Boolean), author:draft.author });
    updateWorkspace(ws => ({ ...ws, templates: [...ws.templates, template] }));
    setCreateOpen(false); setMessage(tr('templates.created')); setError('');
    onEditTemplate(template);
  }

  async function importTemplate(file?: File) {
    if (!file) return;
    try {
      const template = await parseJourneyTemplateFile(file);
      setPendingImport(template);
      setError(''); setMessage('');
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : tr('templates.importError')); setMessage('');
    }
  }

  function confirmImport() {
    if (!pendingImport) return;
    updateWorkspace(ws => ({ ...ws, templates: [...ws.templates, pendingImport] }));
    setMessage(`${tr('templates.imported')}: ${pendingImport.name}`);
    setPendingImport(null);
    setError('');
  }

  return <section className="content-section template-gallery-page">
    <div className="section-toolbar">
      <div><h2>{tr('templates.title')}</h2><p>{tr('templates.subtitle')}</p></div>
      <div className="template-toolbar-actions"><button className="button" onClick={()=>importRef.current?.click()}><FileUp size={16}/> {tr('templates.import')}</button><button className="button primary" onClick={openCreate}><Plus size={16}/> {tr('templates.create')}</button><input ref={importRef} type="file" accept=".jstemplate,.json,application/json" hidden onChange={event=>{void importTemplate(event.target.files?.[0]);event.currentTarget.value='';}}/></div>
    </div>
    <div className="template-community-note"><Waypoints size={17}/><div><strong>{tr('templates.galleryTitle')}</strong><span>{tr('templates.galleryText')}</span></div></div>
    {message&&<div className="template-feedback success">{message}</div>}{error&&<div className="template-feedback error">{error}</div>}
    {currentWorkspace.templates.length===0?<div className="empty-state"><Waypoints size={32}/><h3>{tr('templates.empty')}</h3><p>{tr('templates.emptyText')}</p></div>:<div className="card-grid template-gallery-grid">{currentWorkspace.templates.map(template=><article className="template-card template-gallery-card" key={template.id}>
      <div className="card-top"><span className="eyebrow-small">{template.system?tr('templates.system'):tr('templates.custom')}</span><span className="chip">{template.scope}</span></div>
      <TemplateMiniPreview template={template}/>
      <h3>{template.name}</h3><p>{template.description || tr('templates.blankDescription')}</p>
      <div className="template-meta-line"><span>v{template.version}</span><span>{template.author}</span><span>{template.nodes.length} {tr('templates.nodes')}</span></div>
      {template.tags.length>0&&<div className="template-tags"><Tags size={12}/>{template.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}
      <div className="card-actions template-card-actions"><button className="button primary" onClick={()=>useTemplate(template.id)}><Plus size={15}/> {tr('templates.use')}</button><button className="button" onClick={()=>setPreview(template)}><Eye size={15}/> {tr('templates.preview')}</button><button className="button" onClick={()=>onEditTemplate(template)}><Pencil size={15}/> {tr('templates.edit')}</button><button className="icon-button" title={tr('templates.share')} onClick={()=>{downloadJourneyTemplate(template);setMessage(`${tr('templates.shared')}: ${template.name}`);}}><Share2 size={15}/></button>{!template.system&&<button className="icon-button danger-icon" title={tr('templates.delete')} onClick={()=>remove(template.id)}><Trash2 size={15}/></button>}</div>
    </article>)}</div>}

    {createOpen&&<div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setCreateOpen(false);}}><div className="modal-card template-create-modal" role="dialog" aria-modal="true"><div className="modal-header"><div className="modal-icon"><Waypoints size={20}/></div><div><h2>{tr('templates.createTitle')}</h2><p>{tr('templates.createText')}</p></div><button className="icon-button" onClick={()=>setCreateOpen(false)}><X size={16}/></button></div><div className="form-grid template-create-form"><label>{tr('templates.name')}<input autoFocus value={draft.name} onChange={e=>setDraft(c=>({...c,name:e.target.value}))}/></label><label>{tr('templates.categoryLabel')}<input value={draft.category} onChange={e=>setDraft(c=>({...c,category:e.target.value}))}/></label><label>{tr('templates.scope')}<select value={draft.scope} onChange={e=>setDraft(c=>({...c,scope:e.target.value as WorkspaceScope}))}><option>B2C</option><option>B2B</option><option>Mixed</option></select></label><label>{tr('templates.version')}<input value={draft.version} onChange={e=>setDraft(c=>({...c,version:e.target.value}))}/></label><label>{tr('templates.author')}<input value={draft.author} onChange={e=>setDraft(c=>({...c,author:e.target.value}))}/></label><label>{tr('templates.tags')}<input placeholder="Acquisition, B2C, Ecommerce" value={draft.tags} onChange={e=>setDraft(c=>({...c,tags:e.target.value}))}/></label><label className="template-description-field">{tr('templates.description')}<textarea rows={4} value={draft.description} onChange={e=>setDraft(c=>({...c,description:e.target.value}))}/></label></div><div className="template-portable-note"><Share2 size={15}/><span>{tr('templates.blankNote')}</span></div><div className="modal-actions"><button className="button" onClick={()=>setCreateOpen(false)}>{tr('common.cancel')}</button><button className="button primary" disabled={!draft.name.trim()} onClick={createTemplate}><Plus size={16}/> {tr('templates.saveTemplate')}</button></div></div></div>}

    {preview&&<div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setPreview(null);}}><div className="modal-card template-preview-modal"><div className="modal-header"><div><h2>{preview.name}</h2><p>{preview.description}</p></div><button className="icon-button" onClick={()=>setPreview(null)}><X size={16}/></button></div><div className="template-preview-summary"><TemplateMiniPreview template={preview}/><div><strong>{preview.nodes.length} nodes · {preview.edges.length} connections</strong><span>v{preview.version} · {preview.author}</span></div></div><div className="template-preview-node-list">{preview.nodes.length===0?<div className="empty-state compact"><strong>{tr('templates.blank')}</strong><p>{tr('templates.blankPreview')}</p></div>:preview.nodes.map(node=><div key={node.id}><span className={`stage-dot stage-dot-${node.data.stage}`}/><strong>{node.data.label}</strong><small>{node.data.type} · {node.data.stage}</small></div>)}</div><div className="modal-actions"><button className="button" onClick={()=>downloadJourneyTemplate(preview)}><Share2 size={15}/> {tr('templates.share')}</button><button className="button" onClick={()=>{setPreview(null);onEditTemplate(preview);}}><Pencil size={15}/> {tr('templates.edit')}</button><button className="button primary" onClick={()=>{setPreview(null);useTemplate(preview.id);}}><Plus size={15}/> {tr('templates.use')}</button></div></div></div>}

    {pendingImport&&<div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setPendingImport(null);}}><div className="modal-card template-preview-modal"><div className="modal-header"><div><span className="eyebrow-small">{tr('templates.importPreview')}</span><h2>{pendingImport.name}</h2><p>{pendingImport.description || tr('templates.blankDescription')}</p></div><button className="icon-button" onClick={()=>setPendingImport(null)}><X size={16}/></button></div><div className="template-preview-summary"><TemplateMiniPreview template={pendingImport}/><div><strong>{pendingImport.nodes.length} {tr('templates.nodes')} · {pendingImport.edges.length} {tr('journeys.connections')}</strong><span>v{pendingImport.version} · {pendingImport.author}</span>{pendingImport.tags.length>0&&<div className="template-tags">{pendingImport.tags.map(tag=><span key={tag}>{tag}</span>)}</div>}</div></div><div className="template-preview-node-list">{pendingImport.nodes.length===0?<div className="empty-state compact"><strong>{tr('templates.blank')}</strong><p>{tr('templates.blankPreview')}</p></div>:pendingImport.nodes.map(node=><div key={node.id}><span className={`stage-dot stage-dot-${node.data.stage}`}/><strong>{node.data.label}</strong><small>{node.data.type} · {node.data.stage}</small></div>)}</div><div className="modal-actions"><button className="button" onClick={()=>setPendingImport(null)}>{tr('common.cancel')}</button><button className="button primary" onClick={confirmImport}><FileUp size={15}/> {tr('templates.confirmImport')}</button></div></div></div>}
  </section>;
}

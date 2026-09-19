import { Download, FileArchive, LockKeyhole, Share2 } from 'lucide-react';
import { downloadWorkspace } from '../../lib/files';
import { defaultPortfolioOptions, downloadPortfolioWorkspace, downloadShareWorkspace, type PortfolioOptions } from '../../lib/share';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useState } from 'react';

export function ShareView() {
  const { workspace } = useWorkspace();
  const [options, setOptions] = useState<PortfolioOptions>(defaultPortfolioOptions);
  if (!workspace) return null;
  const toggle = (key: keyof PortfolioOptions) => setOptions(current => ({ ...current, [key]: !current[key] }));

  return <section className="content-section share-page">
    <div className="section-toolbar"><div><h2>Share & portfolio</h2><p>Keep the application generic and portable. Company-specific work lives in workspace files, not in the public codebase.</p></div></div>
    <div className="share-grid">
      <article className="share-card">
        <div className="share-icon"><Share2 size={20}/></div>
        <h3>Share full workspace</h3>
        <p>Export the complete workspace, including journeys, templates, components and imported intelligence data. The recipient opens the file in Famme Journey Studio.</p>
        <button className="button primary" onClick={()=>downloadShareWorkspace(workspace)}><Download size={16}/> Export share workspace</button>
      </article>
      <article className="share-card">
        <div className="share-icon"><LockKeyhole size={20}/></div>
        <h3>Portfolio-safe workspace</h3>
        <p>Create a sanitized copy for portfolio, interviews or external sharing. Your active workspace is never changed.</p>
        <div className="portfolio-options">
          <label className="toggle-row"><span>Remove performance & observed paths</span><input type="checkbox" checked={options.removePerformance} onChange={()=>toggle('removePerformance')}/></label>
          <label className="toggle-row"><span>Hide tracking event details</span><input type="checkbox" checked={options.removeTrackingDetails} onChange={()=>toggle('removeTrackingDetails')}/></label>
          <label className="toggle-row"><span>Generalize paid-media names & creatives</span><input type="checkbox" checked={options.generalizePaidMedia} onChange={()=>toggle('generalizePaidMedia')}/></label>
          <label className="toggle-row"><span>Remove internal notes, TODOs & versions</span><input type="checkbox" checked={options.removeInternalNotes} onChange={()=>toggle('removeInternalNotes')}/></label>
        </div>
        <button className="button primary" onClick={()=>downloadPortfolioWorkspace(workspace,options)}><FileArchive size={16}/> Export portfolio workspace</button>
      </article>
      <article className="share-card">
        <div className="share-icon"><Download size={20}/></div>
        <h3>Standard backup</h3>
        <p>The regular <code>.fjs</code> export is your editable backup and transfer format. It remains JSON under the hood and is versioned independently of the app.</p>
        <button className="button" onClick={()=>downloadWorkspace(workspace)}><Download size={16}/> Export .fjs backup</button>
      </article>
      <article className="share-card">
        <div className="share-icon"><FileArchive size={20}/></div>
        <h3>Legacy migration</h3>
        <p>The importer recognizes the previous single-file Journey Studio workspace structure and converts nodes, edges, tracking, creatives and cross-journey links into the 2.0 model.</p>
        <div className="migration-note"><strong>No manual conversion required.</strong><span>Use Import data from the top bar or Settings and choose the old JSON backup.</span></div>
      </article>
    </div>
  </section>;
}

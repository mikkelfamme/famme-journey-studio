import { useRef, useState } from 'react';
import { ArrowRight, FileUp, MonitorDown, PlayCircle, Sparkles } from 'lucide-react';
import { createWorkspace } from '../../lib/workspace';
import { parseWorkspaceFile } from '../../lib/files';
import { createDemoWorkspace } from '../../lib/demo';
import { useWorkspace } from '../../store/WorkspaceContext';
import { usePwaInstall } from '../../lib/usePwaInstall';
import type { WorkspaceScope } from '../../types/domain';

export function Onboarding() {
  const { setWorkspace } = useWorkspace();
  const { canInstall, install } = usePwaInstall();
  const [organization, setOrganization] = useState('');
  const [workspaceName, setWorkspaceName] = useState('My customer journey architecture');
  const [product, setProduct] = useState('');
  const [scope, setScope] = useState<WorkspaceScope>('B2C');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function create() {
    if (!organization.trim()) { setError('Enter an organization or project name.'); return; }
    setWorkspace(createWorkspace({ name: workspaceName.trim() || 'Journey workspace', organization: organization.trim(), scope, product: product.trim() }));
  }

  async function importFile(file?: File) {
    if (!file) return;
    try { setWorkspace(await parseWorkspaceFile(file)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not import workspace.'); }
  }

  return (
    <main className="onboarding-shell">
      <section className="onboarding-card">
        <div className="eyebrow"><Sparkles size={15} /> FAMME · DIGITAL</div>
        <h1>Famme Journey Studio</h1>
        <p className="lead">Create customer journey architecture, channel plans, measurement logic and observed behavior in one visual workspace.</p>
        {canInstall && <button className="button install-button onboarding-install" onClick={()=>void install()}><MonitorDown size={16}/> Install Famme Journey Studio</button>}
        <div className="onboarding-choice-grid">
          <div className="onboarding-choice primary-choice">
            <h2>Create a workspace</h2>
            <p>Start with a blank, company-neutral workspace and generic templates.</p>
            <div className="form-grid onboarding-form">
              <label>Organization / project<input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Acme Company" /></label>
              <label>Workspace name<input value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} /></label>
              <label>Scope<select value={scope} onChange={e => setScope(e.target.value as WorkspaceScope)}><option>B2C</option><option>B2B</option><option>Mixed</option></select></label>
              <label>Primary product / service<input value={product} onChange={e => setProduct(e.target.value)} placeholder="Tickets, membership, SaaS..." /></label>
            </div>
            {error && <div className="error-box" role="alert">{error}</div>}
            <button className="button primary large" onClick={create}>Create blank workspace <ArrowRight size={17} /></button>
          </div>
          <div className="onboarding-secondary">
            <div className="onboarding-choice">
              <div className="choice-icon"><PlayCircle size={20}/></div>
              <h2>Explore the demo</h2>
              <p>Open a generic sample with synthetic performance and observed-path data. Nothing in the demo is company-specific.</p>
              <button className="button large" onClick={()=>setWorkspace(createDemoWorkspace())}><PlayCircle size={17}/> Open demo workspace</button>
            </div>
            <div className="onboarding-choice">
              <div className="choice-icon"><FileUp size={20}/></div>
              <h2>Import existing work</h2>
              <p>Open a current <code>.fjs</code> file or migrate a workspace exported from the previous single-file prototype.</p>
              <button className="button large" onClick={() => inputRef.current?.click()}><FileUp size={17} /> Import workspace</button>
              <input ref={inputRef} type="file" accept=".fjs,.json,application/json" hidden onChange={e => { importFile(e.target.files?.[0]); e.currentTarget.value=''; }} />
            </div>
          </div>
        </div>
        <div className="privacy-note"><strong>Local-first.</strong> Famme Journey Studio stores workspaces in IndexedDB in your browser. No account or server is required. Workspace files stay under your control unless you choose to share them.</div>
        <footer>Designed &amp; developed by Mikkel Famme</footer>
      </section>
    </main>
  );
}

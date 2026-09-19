import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AppView } from './Sidebar';

const help: Record<AppView, { title: string; intro: string; tips: string[] }> = {
  journeys: { title: 'Journeys', intro: 'Model one customer journey as a connected graph of intent, channels, pages, measurement and outcomes.', tips: ['Create from a template, then make the journey specific.', 'Open a journey to add tracking, creatives, annotations and cross-journey handoffs.', 'Use Shift-click for multi-select in the editor.'] },
  master: { title: 'Master View', intro: 'See the workspace architecture across journeys instead of reviewing each journey in isolation.', tips: ['Use Health findings to locate gaps.', 'Cross-journey links expose lifecycle handoffs and dependencies.', 'Coverage reflects mapped data, not business performance.'] },
  insights: { title: 'Insights & Data', intro: 'Add performance and observed-path snapshots without changing the journey model.', tips: ['Mapping Center documents Direct, Proxy and Unmapped quality.', 'KPI Dictionary gives raw metrics business meaning.', 'Planned vs Actual compares observed behavior with the designed journey.'] },
  templates: { title: 'Templates', intro: 'Templates are full journey archetypes. Using one creates an independent copy.', tips: ['System templates remain generic.', 'Save strong journeys as custom templates.', 'Use Components for reusable nodes that should stay synchronized.'] },
  components: { title: 'Component Library', intro: 'Reusable node definitions keep recurring channel, tracking and creative logic consistent.', tips: ['Save a selected node to the Library from the editor.', 'Sync all linked instances after updating a definition.', 'Detach a node when it should diverge from the shared definition.'] },
  share: { title: 'Share & Portfolio', intro: 'Create portable workspaces for collaboration or sanitized portfolio use.', tips: ['Full share keeps the complete workspace.', 'Portfolio export can strip internal data and notes.', 'Always review a portfolio file before publishing it.'] },
  settings: { title: 'Settings', intro: 'Control workspace identity, editor defaults, recovery, imports and data-map exports.', tips: ['Autosave runs locally in the browser.', 'Recent recovery snapshots can restore accidental changes.', 'Data-map exports provide stable IDs to analytics processes.'] },
  about: { title: 'About', intro: 'Famme Journey Studio combines journey architecture, measurement and observed behavior in one visual model.', tips: ['Designed & developed by Mikkel Famme.', 'Public core contains no company-specific data.', 'Workspaces remain portable through .fjs files.'] }
};

export function HelpDrawer({ view, open, onClose }: { view: AppView; open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  const content = help[view];
  return <aside className="help-drawer" role="dialog" aria-modal="false" aria-labelledby="help-title"><div className="help-header"><div><span className="eyebrow-small">CONTEXT HELP</span><h2 id="help-title">{content.title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close help"><X size={17}/></button></div><p>{content.intro}</p><div className="help-list">{content.tips.map((tip, index) => <div key={tip}><strong>{index + 1}</strong><span>{tip}</span></div>)}</div><div className="help-shortcuts"><h3>Global shortcuts</h3><span><kbd>Ctrl/⌘ K</kbd> Command palette</span><span><kbd>?</kbd> Toggle help</span><span><kbd>Ctrl/⌘ S</kbd> Save now</span></div></aside>;
}

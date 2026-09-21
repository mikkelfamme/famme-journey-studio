import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AppView } from './Sidebar';

const help: Record<AppView, { title: string; intro: string; tips: string[] }> = {
  journeys: { title: 'Journeys', intro: 'Model one customer journey as a connected graph of intent, channels, pages, measurement and outcomes.', tips: ['Create from a template, then make the journey specific.', 'Open a journey to add tracking, creatives, annotations and cross-journey handoffs.', 'Use Shift-click for multi-select in the editor.'] },
  master: { title: 'Master View', intro: 'Use the portfolio view to govern quality, open work, handoffs and data coverage across every journey.', tips: ['HEALTH is automated validation of journey structure, tracking and paid-media setup.', 'TODO counts unfinished node annotations; HANDOFF counts explicit cross-journey links.', '% MAPPED is data coverage in the active performance snapshot, not a performance score. Click the badges for details.'] },
  insights: { title: 'Insights & Data', intro: 'Add a measurable data layer without changing the journey model. Export stable IDs, map external data, then import snapshots.', tips: ['Performance and actual-path maps provide stable journey/node IDs for external analytics flows.', 'Mapping Center documents Direct, Proxy and Unmapped quality; KPI Dictionary gives raw metrics business meaning.', 'Planned vs Actual compares observed behavior with the designed journey. Journey Studio remains local-first and does not require a live backend connection.'] },
  templates: { title: 'Templates', intro: 'Templates are full journey archetypes. Using one creates an independent copy.', tips: ['Create a custom template from any existing journey.', 'Share or import one template at a time with .jstemplate files.', 'Use Components for reusable nodes that should stay synchronized.'] },
  components: { title: 'Component Library', intro: 'Reusable node definitions keep recurring channel, tracking and creative logic consistent.', tips: ['Save a selected node to the Library from the editor.', 'Sync all linked instances after updating a definition.', 'Detach a node when it should diverge from the shared definition.'] },
  share: { title: 'Share & Portfolio', intro: 'Create portable workspaces for collaboration or sanitized portfolio use.', tips: ['Full share keeps the complete workspace.', 'Portfolio export can strip internal data and notes.', 'Always review a portfolio file before publishing it.'] },
  settings: { title: 'Settings', intro: 'Control workspace identity, editor defaults, recovery, imports and data-map exports.', tips: ['Autosave runs locally in the browser.', 'Recent recovery snapshots can restore accidental changes.', 'Data-map exports provide stable IDs to analytics processes.'] },
  about: { title: 'About', intro: 'Journey Studio by Famme combines journey architecture, measurement and observed behavior in one visual model.', tips: ['Designed & developed by Mikkel Famme.', 'Public core contains no company-specific data.', 'Workspaces remain portable through .fjs files.'] }
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

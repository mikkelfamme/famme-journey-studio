import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import type { Journey } from '../../types/domain';
import { validateJourney } from '../../lib/health';

export function HealthPanel({ journey, onSelectNode }: { journey: Journey; onSelectNode: (nodeId: string) => void }) {
  const issues = validateJourney(journey);
  const errors = issues.filter(i => i.severity === 'error').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  return <aside className="editor-panel inspector-special">
    <div className="panel-heading">Journey Health</div>
    <div className={`health-score ${issues.length === 0 ? 'healthy' : ''}`}>
      {issues.length === 0 ? <CheckCircle2 size={22}/> : <TriangleAlert size={22}/>} 
      <div><strong>{issues.length === 0 ? 'Healthy' : `${issues.length} finding${issues.length === 1 ? '' : 's'}`}</strong><span>{errors} error · {warnings} warning</span></div>
    </div>
    {issues.length === 0 && <p className="muted-small">No active validation findings for the current journey structure.</p>}
    <div className="health-list">{issues.map(issue => <button className={`health-item health-${issue.severity}`} key={issue.id} onClick={() => issue.nodeId && onSelectNode(issue.nodeId)} disabled={!issue.nodeId}>
      {issue.severity === 'error' ? <AlertCircle size={14}/> : issue.severity === 'warning' ? <TriangleAlert size={14}/> : <Info size={14}/>}<span><strong>{issue.title}</strong><small>{issue.detail}</small></span>
    </button>)}</div>
  </aside>;
}

import { Activity, CircleCheck, Database, GitBranch, TriangleAlert } from 'lucide-react';
import { validateJourney } from '../../lib/health';
import { detectOpportunities } from '../../lib/opportunities';
import { activePerformanceSnapshot, coverageForJourney, freshnessLabel, snapshotAgeHours } from '../../lib/performance';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useI18n } from '../../i18n';

export function MasterView() {
  const { workspace } = useWorkspace(); const { t, status } = useI18n(); if (!workspace) return null;
  const active = workspace.journeys.filter(j => j.status === 'active').length;
  const trackedNodes = workspace.journeys.flatMap(j => j.nodes).filter(n => n.data.tracking.length > 0).length;
  const totalNodes = workspace.journeys.reduce((s,j) => s+j.nodes.length,0);
  const healthIssues = workspace.journeys.reduce((sum,j) => sum + validateJourney(j).length,0);
  const snapshot = activePerformanceSnapshot(workspace);
  const mappedNodes = workspace.journeys.reduce((sum,j)=>sum+coverageForJourney(workspace,j.id,snapshot).mapped,0);
  const opportunities = detectOpportunities(workspace);
  const freshness = freshnessLabel(snapshotAgeHours(snapshot), workspace.settings.freshnessThresholdHours);
  return <section className="content-section"><div className="section-toolbar"><div><h2>{t('master.title')}</h2><p>{t('master.subtitle')}</p></div></div><div className="summary-grid"><div className="summary-card"><GitBranch/><strong>{workspace.journeys.length}</strong><span>{t('master.journeys')}</span></div><div className="summary-card"><CircleCheck/><strong>{active}</strong><span>{t('master.active')}</span></div><div className="summary-card"><Activity/><strong>{totalNodes ? Math.round(trackedNodes/totalNodes*100) : 0}%</strong><span>{t('master.nodesTracking')}</span></div><div className="summary-card"><Database/><strong>{mappedNodes}</strong><span>{t('master.performance')}</span></div><div className="summary-card"><TriangleAlert/><strong>{healthIssues}</strong><span>{t('master.health')}</span></div><div className={`summary-card freshness-${freshness.status}`}><Activity/><strong>{opportunities.length}</strong><span>Opportunities · data {freshness.label}</span></div></div>{workspace.journeys.length===0?<div className="empty-state"><GitBranch size={32}/><h3>{t('master.empty')}</h3><p>{t('master.emptyText')}</p></div>:<div className="master-list">{workspace.journeys.map(j => { const issues=validateJourney(j); const todos=j.nodes.reduce((sum,n)=>sum+n.data.annotations.filter(a=>a.kind==='todo'&&!a.done).length,0); const coverage=coverageForJourney(workspace,j.id,snapshot); return <div className="master-row" key={j.id}><div><strong>{j.name}</strong><span>{j.scope} · {status(j.status)}</span></div><div className="master-path">{[...j.nodes].sort((a,b)=>a.position.x-b.position.x).slice(0,6).map((n,i)=><span key={n.id}>{i>0 && <em>→</em>}{n.data.label}</span>)}</div><div className="master-badges"><span className={`chip ${issues.length ? 'chip-warn':''}`}>{issues.length} health</span><span className="chip">{todos} todo</span><span className="chip">{j.crossJourneyLinks.length} handoff</span><span className="chip">{coverage.pct}% mapped</span></div></div>})}</div>}</section>;
}

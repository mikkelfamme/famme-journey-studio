import { useState } from 'react';
import { Database, Gauge, GitCompareArrows, RefreshCw, TriangleAlert } from 'lucide-react';
import type { MappingQuality, MetricDefinition } from '../../types/domain';
import { useWorkspace } from '../../store/WorkspaceContext';
import { activeActualSnapshot, compareObservedPath, pathsForJourney } from '../../lib/actual';
import { detectOpportunities } from '../../lib/opportunities';
import {
  activePerformanceSnapshot,
  comparePerformanceSnapshot,
  coverageForJourney,
  ensureMetricDictionary,
  freshnessLabel,
  mappingNote,
  mappingQuality,
  metricDefinition,
  snapshotAgeHours
} from '../../lib/performance';

type InsightsTab = 'overview' | 'mapping' | 'kpis' | 'actual';

export function InsightsView() {
  const { workspace, updateWorkspace } = useWorkspace();
  const [tab, setTab] = useState<InsightsTab>('overview');
  if (!workspace) return null;
  const active = activePerformanceSnapshot(workspace);
  const compare = comparePerformanceSnapshot(workspace);
  const actual = activeActualSnapshot(workspace);
  const opportunities = detectOpportunities(workspace);
  const age = snapshotAgeHours(active);
  const freshness = freshnessLabel(age, workspace.settings.freshnessThresholdHours);
  const mappedRecords = active?.nodeMetrics.filter(record => mappingQuality(workspace, record) !== 'unmapped') ?? [];
  const directRecords = active?.nodeMetrics.filter(record => mappingQuality(workspace, record) === 'direct') ?? [];

  function setActiveSnapshot(id: string) {
    updateWorkspace(ws => ({ ...ws, settings: { ...ws.settings, activePerformanceSnapshotId: id || undefined } }));
  }
  function setCompareSnapshot(id: string) {
    updateWorkspace(ws => ({ ...ws, settings: { ...ws.settings, comparePerformanceSnapshotId: id || undefined } }));
  }
  function setActualSnapshot(id: string) {
    updateWorkspace(ws => ({ ...ws, settings: { ...ws.settings, activeActualPathSnapshotId: id || undefined } }));
  }
  function updateOverride(journeyId: string, nodeId: string, quality: MappingQuality, note: string) {
    updateWorkspace(ws => {
      const rest = ws.mappingOverrides.filter(item => !(item.journeyId === journeyId && item.nodeId === nodeId));
      return { ...ws, mappingOverrides: [...rest, { journeyId, nodeId, quality, note, updatedAt: new Date().toISOString() }] };
    });
  }
  function updateMetric(key: string, patch: Partial<MetricDefinition>) {
    updateWorkspace(ws => ({ ...ws, metricDictionary: ws.metricDictionary.map(metric => metric.key === key ? { ...metric, ...patch } : metric) }));
  }
  function syncDictionary() {
    updateWorkspace(ws => ({ ...ws, metricDictionary: ensureMetricDictionary(ws.metricDictionary, ws.performanceSnapshots) }));
  }

  return <section className="content-section insights-page">
    <div className="section-toolbar">
      <div><h2>Insights & data</h2><p>Performance mapping, metric semantics, data freshness and observed customer paths in one layer.</p></div>
      <div className="inline-form compact-selects">
        <select value={active?.id ?? ''} onChange={e => setActiveSnapshot(e.target.value)}><option value="">No active performance snapshot</option>{workspace.performanceSnapshots.map(snapshot => <option key={snapshot.id} value={snapshot.id}>{snapshot.period}</option>)}</select>
        <select value={compare?.id ?? ''} onChange={e => setCompareSnapshot(e.target.value)}><option value="">No comparison</option>{workspace.performanceSnapshots.filter(snapshot => snapshot.id !== active?.id).map(snapshot => <option key={snapshot.id} value={snapshot.id}>Compare: {snapshot.period}</option>)}</select>
      </div>
    </div>
    <div className="subnav-tabs">
      <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Overview</button>
      <button className={tab === 'mapping' ? 'active' : ''} onClick={() => setTab('mapping')}>Mapping Center</button>
      <button className={tab === 'kpis' ? 'active' : ''} onClick={() => setTab('kpis')}>KPI Dictionary</button>
      <button className={tab === 'actual' ? 'active' : ''} onClick={() => setTab('actual')}>Planned vs Actual</button>
    </div>
    {tab === 'overview' && <>
      <div className="summary-grid insight-summary">
        <div className="summary-card"><Database/><strong>{workspace.performanceSnapshots.length}</strong><span>Performance snapshots</span></div>
        <div className="summary-card"><Database/><strong>{mappedRecords.length}</strong><span>Mapped node records</span></div>
        <div className="summary-card"><Gauge/><strong>{directRecords.length}</strong><span>Direct mappings</span></div>
        <div className={`summary-card freshness-${freshness.status}`}><RefreshCw/><strong>{freshness.label}</strong><span>Active data freshness</span></div>
      </div>
      {!active ? <div className="empty-state"><Database size={30}/><h3>No performance snapshot yet</h3><p>Import a Famme Journey Studio performance snapshot from Settings. Your journey architecture remains usable without data.</p></div> : <>
        <div className="insights-split">
          <div className="settings-card"><h3>Journey coverage</h3><div className="coverage-list">{workspace.journeys.map(journey => { const c = coverageForJourney(workspace, journey.id, active); return <div className="coverage-row" key={journey.id}><div><strong>{journey.name}</strong><span>{c.direct} direct · {c.proxy} proxy · {c.mapped}/{c.total} nodes</span></div><div className="coverage-meter"><i style={{width:`${c.pct}%`}}/><b>{c.pct}%</b></div></div>; })}</div></div>
          <div className="settings-card"><h3>Data sources</h3><div className="source-list">{active.sources.length ? active.sources.map((source, index) => <div className="source-row" key={`${source.name}-${index}`}><Database size={15}/><div><strong>{source.name}</strong><span>{source.note || 'No source note.'}</span></div></div>) : <div className="empty-mini">No sources declared in this snapshot.</div>}</div><div className="data-age"><span>Snapshot generated</span><strong>{new Date(active.generatedAt).toLocaleString()}</strong></div></div>
        </div>
        <div className="settings-card opportunity-panel"><div className="card-heading-row"><div><h3>Opportunities & gaps</h3><p>Rule-based findings from journey architecture, mapping and KPI movement.</p></div><span className="chip">{opportunities.length} findings</span></div>{opportunities.length === 0 ? <div className="empty-mini">No current findings.</div> : <div className="opportunity-list">{opportunities.slice(0,30).map(item => { const journey = workspace.journeys.find(j => j.id === item.journeyId); return <div className={`opportunity-row severity-${item.severity}`} key={item.id}><TriangleAlert size={15}/><div><strong>{item.title}</strong><span>{journey?.name ?? 'Journey'} · {item.detail}</span></div><em>{item.category}</em></div>; })}</div>}</div>
      </>}
    </>}
    {tab === 'mapping' && <div className="settings-card wide-card"><div className="card-heading-row"><div><h3>Mapping Center</h3><p>Document whether each metric mapping is direct, proxy or deliberately unmapped. Overrides live in the workspace, not in the imported snapshot.</p></div><span className="chip">{active?.nodeMetrics.length ?? 0} records</span></div>{!active ? <div className="empty-mini">Choose or import a performance snapshot first.</div> : <div className="mapping-table"><div className="mapping-head"><span>Journey / node</span><span>Source</span><span>Metrics</span><span>Quality</span><span>Governance note</span></div>{active.nodeMetrics.map(record => { const journey = workspace.journeys.find(j => j.id === record.journeyId); const node = journey?.nodes.find(n => n.id === record.nodeId); const quality = mappingQuality(workspace, record); const note = mappingNote(workspace, record); return <div className="mapping-row" key={record.id}><div><strong>{journey?.name ?? 'Unknown journey'}</strong><span>{node?.data.label ?? record.nodeId}</span></div><div>{record.source}</div><div className="metric-key-list">{Object.keys(record.metrics).slice(0,4).map(key => <span key={key}>{metricDefinition(workspace,key).label}</span>)}</div><select value={quality} onChange={e => updateOverride(record.journeyId, record.nodeId, e.target.value as MappingQuality, note)}><option value="direct">Direct</option><option value="proxy">Proxy</option><option value="unmapped">Unmapped</option></select><input value={note} placeholder="Why is this mapping valid?" onChange={e => updateOverride(record.journeyId, record.nodeId, quality, e.target.value)}/></div>; })}</div>}</div>}
    {tab === 'kpis' && <div className="settings-card wide-card"><div className="card-heading-row"><div><h3>KPI Dictionary</h3><p>Give raw metric keys business meaning so comparisons can be interpreted correctly.</p></div><button className="button compact" onClick={syncDictionary}><RefreshCw size={14}/> Discover metrics</button></div><div className="kpi-table"><div className="kpi-head"><span>Key</span><span>Display name</span><span>Unit</span><span>Role</span><span>Direction</span><span>Primary</span></div>{workspace.metricDictionary.map(metric => <div className="kpi-row" key={metric.key}><code>{metric.key}</code><input value={metric.label} onChange={e=>updateMetric(metric.key,{label:e.target.value})}/><select value={metric.unit} onChange={e=>updateMetric(metric.key,{unit:e.target.value as MetricDefinition['unit']})}><option>count</option><option>currency</option><option>percent</option><option>duration</option><option>ratio</option><option>number</option></select><select value={metric.role} onChange={e=>updateMetric(metric.key,{role:e.target.value as MetricDefinition['role']})}><option>acquisition</option><option>engagement</option><option>conversion</option><option>revenue</option><option>efficiency</option><option>quality</option><option>other</option></select><select value={metric.direction} onChange={e=>updateMetric(metric.key,{direction:e.target.value as MetricDefinition['direction']})}><option value="higher">Higher is better</option><option value="lower">Lower is better</option><option value="neutral">Neutral</option></select><label className="tiny-check"><input type="checkbox" checked={Boolean(metric.primary)} onChange={e=>updateMetric(metric.key,{primary:e.target.checked})}/><span>Primary</span></label></div>)}</div></div>}
    {tab === 'actual' && <div className="actual-workspace"><div className="settings-card actual-controls"><h3>Observed paths</h3><label>Actual-path snapshot<select value={actual?.id ?? ''} onChange={e=>setActualSnapshot(e.target.value)}><option value="">No snapshot selected</option>{workspace.actualPathSnapshots.map(snapshot => <option key={snapshot.id} value={snapshot.id}>{snapshot.period} · {snapshot.source}</option>)}</select></label>{actual && <p className="muted-small">Generated {new Date(actual.generatedAt).toLocaleString()} · {actual.journeyPaths.reduce((sum,item)=>sum+item.paths.length,0)} observed paths.</p>}</div>{!actual ? <div className="empty-state"><GitCompareArrows size={30}/><h3>No actual-path data yet</h3><p>Import an actual-path snapshot to compare observed behavior with the journey architecture.</p></div> : <div className="actual-journey-list">{workspace.journeys.map(journey => { const paths = pathsForJourney(workspace, journey.id, actual); const top = [...paths].sort((a,b)=>(b.users??b.sessions??b.count??0)-(a.users??a.sessions??a.count??0))[0]; if (!top) return <article className="actual-card" key={journey.id}><div className="card-heading-row"><div><h3>{journey.name}</h3><p>No observed paths mapped to this journey.</p></div><span className="chip">0 paths</span></div></article>; const comparison = compareObservedPath(journey, top); return <article className="actual-card" key={journey.id}><div className="card-heading-row"><div><h3>{journey.name}</h3><p>{top.label}</p></div><div className="match-score"><strong>{comparison.matchPct}%</strong><span>match</span></div></div><div className="observed-path">{top.steps.map((step,index)=><span key={`${step.nodeId||step.label}-${index}`} className={step.nodeId ? 'mapped-step':'unmapped-step'}>{index>0&&<em>→</em>}{journey.nodes.find(n=>n.id===step.nodeId)?.data.label ?? step.label ?? 'Unknown step'}</span>)}</div><div className="actual-stats"><span>{paths.length} observed paths</span>{typeof top.users==='number'&&<span>{top.users.toLocaleString()} users</span>}{typeof top.sessions==='number'&&<span>{top.sessions.toLocaleString()} sessions</span>}{typeof top.sharePct==='number'&&<span>{top.sharePct.toFixed(1)}% share</span>}<span>{comparison.missingPlanned.length} planned steps missing</span><span>{comparison.unmappedActual.length} unmapped actual steps</span></div></article>; })}</div>}</div>}
  </section>;
}

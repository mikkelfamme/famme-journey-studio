import { useState } from 'react';
import { Database, FileDown, FileUp, Gauge, GitCompareArrows, Info, RefreshCw, TriangleAlert } from 'lucide-react';
import type { MappingQuality, MetricDefinition } from '../../types/domain';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useI18n } from '../../i18n';
import { activeActualSnapshot, compareObservedPath, pathsForJourney } from '../../lib/actual';
import { detectOpportunities } from '../../lib/opportunities';
import { downloadActualPathMap, downloadPerformanceMap } from '../../lib/files';
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

export function InsightsView({ onImport }: { onImport?: () => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [tab, setTab] = useState<InsightsTab>('overview');
  if (!workspace) return null;
  const isDa = workspace.settings.language === 'da';
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
      <div><h2>{t('insights.title')}</h2><p>{t('insights.subtitle')}</p></div>
      <div className="inline-form compact-selects">
        <select value={active?.id ?? ''} onChange={e => setActiveSnapshot(e.target.value)}><option value="">{isDa ? 'Intet aktivt performance-snapshot' : 'No active performance snapshot'}</option>{workspace.performanceSnapshots.map(snapshot => <option key={snapshot.id} value={snapshot.id}>{snapshot.period}</option>)}</select>
        <select value={compare?.id ?? ''} onChange={e => setCompareSnapshot(e.target.value)}><option value="">{isDa ? 'Ingen sammenligning' : 'No comparison'}</option>{workspace.performanceSnapshots.filter(snapshot => snapshot.id !== active?.id).map(snapshot => <option key={snapshot.id} value={snapshot.id}>{isDa ? 'Sammenlign' : 'Compare'}: {snapshot.period}</option>)}</select>
      </div>
    </div>

    <div className="insights-guide">
      <div className="insights-guide-intro"><span className="eyebrow-small">{isDa ? 'DATA → KUNDEREJSE → INDSIGT' : 'DATA → JOURNEY → INSIGHT'}</span><h3>{isDa ? 'Kobl målinger til den kunderejse, du allerede har tegnet' : 'Connect measurements to the journey architecture you already designed'}</h3><p>{isDa ? 'Insights & Data ændrer ikke selve kunderejsen. Siden lægger et datalag ovenpå: performance pr. komponent, kvaliteten af mappingen, KPI-definitioner og observerede kundestier. Dermed kan du skelne mellem den planlagte rejse og det, data faktisk viser.' : 'Insights & Data does not change the journey itself. It adds a data layer: component performance, mapping quality, KPI definitions and observed customer paths, so you can compare the designed journey with what the data actually shows.'}</p></div>
      <div className="data-connection-note"><Info size={16}/><div><strong>{isDa ? 'Sådan er dataforbindelsen bygget nu' : 'How data connection works today'}</strong><span>{isDa ? 'Journey Studio er local-first og har ikke en direkte live-forbindelse til GA4, Google Ads, Meta, BigQuery eller CRM. Eksportér stabile journey/node-ID’er, brug dem i dit eksterne dataflow, og importér derefter et performance- eller actual-path snapshot. Det gør datalaget portabelt uden backend eller login.' : 'Journey Studio is local-first and does not make a direct live connection to GA4, Google Ads, Meta, BigQuery or CRM. Export stable journey/node IDs, use them in your external data flow, then import a performance or actual-path snapshot. This keeps the data layer portable without a backend or login.'}</span></div></div>
      <div className="insights-steps">
        <div><b>1</b><strong>{isDa ? 'Eksportér mapping' : 'Export mapping'}</strong><span>{isDa ? 'Performance-map indeholder stabile journeyId/nodeId og tracking-signaler. Actual-path-map indeholder noder og forbindelser.' : 'The performance map contains stable journeyId/nodeId values and tracking signals. The actual-path map contains nodes and edges.'}</span><div className="step-actions"><button className="button compact" onClick={()=>downloadPerformanceMap(workspace)}><FileDown size={14}/>{isDa ? 'Performance-map' : 'Performance map'}</button><button className="button compact" onClick={()=>downloadActualPathMap(workspace)}><FileDown size={14}/>{isDa ? 'Actual-path-map' : 'Actual-path map'}</button></div></div>
        <div><b>2</b><strong>{isDa ? 'Kobl dine datakilder' : 'Connect your data sources'}</strong><span>{isDa ? 'I fx BigQuery, et script eller andet analytics-flow mappes GA4/Ads/Meta/CRM-målinger til de eksporterede ID’er. Direct bruges ved reel node-match; Proxy ved en dokumenteret indirekte indikator.' : 'In BigQuery, a script or another analytics flow, map GA4/Ads/Meta/CRM measurements to the exported IDs. Use Direct for a true node match and Proxy for a documented indirect indicator.'}</span></div>
        <div><b>3</b><strong>{isDa ? 'Importér snapshot' : 'Import snapshot'}</strong><span>{isDa ? 'Importér JSON som performance-snapshot eller actual-path snapshot. Importen vises altid som preview, før data gemmes lokalt.' : 'Import JSON as a performance snapshot or actual-path snapshot. Every import is previewed before it is stored locally.'}</span>{onImport && <button className="button primary compact" onClick={onImport}><FileUp size={14}/>{isDa ? 'Importér data' : 'Import data'}</button>}</div>
        <div><b>4</b><strong>{isDa ? 'Brug de fire faner' : 'Use the four tabs'}</strong><span>{isDa ? 'Overblik viser coverage og friskhed. Mapping Center validerer Direct/Proxy/Unmapped. KPI-ordbog forklarer metric keys. Planlagt vs. faktisk sammenligner observerede stier med journey-designet.' : 'Overview shows coverage and freshness. Mapping Center validates Direct/Proxy/Unmapped. KPI Dictionary explains metric keys. Planned vs Actual compares observed paths with the journey design.'}</span></div>
      </div>
    </div>

    <div className="subnav-tabs">
      <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>{t('insights.overview')}</button>
      <button className={tab === 'mapping' ? 'active' : ''} onClick={() => setTab('mapping')}>{t('insights.mapping')}</button>
      <button className={tab === 'kpis' ? 'active' : ''} onClick={() => setTab('kpis')}>{t('insights.kpis')}</button>
      <button className={tab === 'actual' ? 'active' : ''} onClick={() => setTab('actual')}>{t('insights.actual')}</button>
    </div>

    {tab === 'overview' && <>
      <div className="summary-grid insight-summary">
        <div className="summary-card"><Database/><strong>{workspace.performanceSnapshots.length}</strong><span>{isDa ? 'Performance-snapshots' : 'Performance snapshots'}</span></div>
        <div className="summary-card"><Database/><strong>{mappedRecords.length}</strong><span>{isDa ? 'Mappede node-records' : 'Mapped node records'}</span></div>
        <div className="summary-card"><Gauge/><strong>{directRecords.length}</strong><span>{isDa ? 'Direct mappings' : 'Direct mappings'}</span></div>
        <div className={`summary-card freshness-${freshness.status}`}><RefreshCw/><strong>{freshness.label}</strong><span>{isDa ? 'Aktiv datafriskhed' : 'Active data freshness'}</span></div>
      </div>
      {!active ? <div className="empty-state"><Database size={30}/><h3>{isDa ? 'Intet performance-snapshot endnu' : 'No performance snapshot yet'}</h3><p>{isDa ? 'Start med at eksportere Performance-map ovenfor, map dine datakilder til journeyId/nodeId og importér derefter et performance-snapshot. Din kunderejsearkitektur kan fortsat bruges uden data.' : 'Start by exporting the Performance map above, map your data sources to journeyId/nodeId, then import a performance snapshot. Your journey architecture remains usable without data.'}</p>{onImport && <button className="button primary" onClick={onImport}><FileUp size={15}/>{isDa ? 'Importér data' : 'Import data'}</button>}</div> : <>
        <div className="insights-split">
          <div className="settings-card"><h3>{isDa ? 'Dækning pr. kunderejse' : 'Journey coverage'}</h3><p>{isDa ? 'Viser hvor mange komponenter i hver kunderejse der har en Direct eller Proxy mapping i det aktive snapshot.' : 'Shows how many components in each journey have a Direct or Proxy mapping in the active snapshot.'}</p><div className="coverage-list">{workspace.journeys.map(journey => { const c = coverageForJourney(workspace, journey.id, active); return <div className="coverage-row" key={journey.id}><div><strong>{journey.name}</strong><span>{c.direct} direct · {c.proxy} proxy · {c.mapped}/{c.total} {isDa ? 'noder' : 'nodes'}</span></div><div className="coverage-meter"><i style={{width:`${c.pct}%`}}/><b>{c.pct}%</b></div></div>; })}</div></div>
          <div className="settings-card"><h3>{isDa ? 'Datakilder' : 'Data sources'}</h3><p>{isDa ? 'De kilder, som det aktive snapshot erklærer, at målingerne kommer fra.' : 'The sources declared by the active snapshot as origins for its measurements.'}</p><div className="source-list">{active.sources.length ? active.sources.map((source, index) => <div className="source-row" key={`${source.name}-${index}`}><Database size={15}/><div><strong>{source.name}</strong><span>{source.note || (isDa ? 'Ingen kildenote.' : 'No source note.')}</span></div></div>) : <div className="empty-mini">{isDa ? 'Ingen kilder deklareret i dette snapshot.' : 'No sources declared in this snapshot.'}</div>}</div><div className="data-age"><span>{isDa ? 'Snapshot genereret' : 'Snapshot generated'}</span><strong>{new Date(active.generatedAt).toLocaleString()}</strong></div></div>
        </div>
        <div className="settings-card opportunity-panel"><div className="card-heading-row"><div><h3>{isDa ? 'Muligheder & gaps' : 'Opportunities & gaps'}</h3><p>{isDa ? 'Regelbaserede fund fra journey-arkitektur, mapping og KPI-bevægelser.' : 'Rule-based findings from journey architecture, mapping and KPI movement.'}</p></div><span className="chip">{opportunities.length} {isDa ? 'fund' : 'findings'}</span></div>{opportunities.length === 0 ? <div className="empty-mini">{isDa ? 'Ingen aktuelle fund.' : 'No current findings.'}</div> : <div className="opportunity-list">{opportunities.slice(0,30).map(item => { const journey = workspace.journeys.find(j => j.id === item.journeyId); return <div className={`opportunity-row severity-${item.severity}`} key={item.id}><TriangleAlert size={15}/><div><strong>{item.title}</strong><span>{journey?.name ?? 'Journey'} · {item.detail}</span></div><em>{item.category}</em></div>; })}</div>}</div>
      </>}
    </>}

    {tab === 'mapping' && <div className="settings-card wide-card"><div className="card-heading-row"><div><h3>Mapping Center</h3><p>{isDa ? 'Dokumentér om hver metric-mapping er Direct, Proxy eller bevidst Unmapped. Overrides gemmes i workspacet og ændrer ikke den importerede snapshot-fil.' : 'Document whether each metric mapping is Direct, Proxy or deliberately Unmapped. Overrides live in the workspace, not in the imported snapshot.'}</p></div><span className="chip">{active?.nodeMetrics.length ?? 0} records</span></div><div className="mapping-legend mapping-legend-inline"><span><b>Direct</b>{isDa ? ' = den målte data svarer direkte til komponenten' : ' = measured data directly represents the component'}</span><span><b>Proxy</b>{isDa ? ' = indirekte, men dokumenteret indikator' : ' = indirect but documented indicator'}</span><span><b>Unmapped</b>{isDa ? ' = ingen godkendt datakobling' : ' = no approved data link'}</span></div>{!active ? <div className="empty-mini">{isDa ? 'Vælg eller importér først et performance-snapshot.' : 'Choose or import a performance snapshot first.'}</div> : <div className="mapping-table"><div className="mapping-head"><span>Journey / node</span><span>Source</span><span>Metrics</span><span>Quality</span><span>Governance note</span></div>{active.nodeMetrics.map(record => { const journey = workspace.journeys.find(j => j.id === record.journeyId); const node = journey?.nodes.find(n => n.id === record.nodeId); const quality = mappingQuality(workspace, record); const note = mappingNote(workspace, record); return <div className="mapping-row" key={record.id}><div><strong>{journey?.name ?? 'Unknown journey'}</strong><span>{node?.data.label ?? record.nodeId}</span></div><div>{record.source}</div><div className="metric-key-list">{Object.keys(record.metrics).slice(0,4).map(key => <span key={key}>{metricDefinition(workspace,key).label}</span>)}</div><select value={quality} onChange={e => updateOverride(record.journeyId, record.nodeId, e.target.value as MappingQuality, note)}><option value="direct">Direct</option><option value="proxy">Proxy</option><option value="unmapped">Unmapped</option></select><input value={note} placeholder={isDa ? 'Hvorfor er denne mapping gyldig?' : 'Why is this mapping valid?'} onChange={e => updateOverride(record.journeyId, record.nodeId, quality, e.target.value)}/></div>; })}</div>}</div>}

    {tab === 'kpis' && <div className="settings-card wide-card"><div className="card-heading-row"><div><h3>{isDa ? 'KPI-ordbog' : 'KPI Dictionary'}</h3><p>{isDa ? 'Giv rå metric keys en fælles forretningsbetydning, enhed og retning, så udviklingen kan fortolkes ens på tværs af snapshots.' : 'Give raw metric keys shared business meaning, unit and direction so comparisons can be interpreted consistently.'}</p></div><button className="button compact" onClick={syncDictionary}><RefreshCw size={14}/>{isDa ? 'Find metrics' : 'Discover metrics'}</button></div><div className="kpi-table"><div className="kpi-head"><span>Key</span><span>Display name</span><span>Unit</span><span>Role</span><span>Direction</span><span>Primary</span></div>{workspace.metricDictionary.map(metric => <div className="kpi-row" key={metric.key}><code>{metric.key}</code><input value={metric.label} onChange={e=>updateMetric(metric.key,{label:e.target.value})}/><select value={metric.unit} onChange={e=>updateMetric(metric.key,{unit:e.target.value as MetricDefinition['unit']})}><option>count</option><option>currency</option><option>percent</option><option>duration</option><option>ratio</option><option>number</option></select><select value={metric.role} onChange={e=>updateMetric(metric.key,{role:e.target.value as MetricDefinition['role']})}><option>acquisition</option><option>engagement</option><option>conversion</option><option>revenue</option><option>efficiency</option><option>quality</option><option>other</option></select><select value={metric.direction} onChange={e=>updateMetric(metric.key,{direction:e.target.value as MetricDefinition['direction']})}><option value="higher">Higher is better</option><option value="lower">Lower is better</option><option value="neutral">Neutral</option></select><label className="tiny-check"><input type="checkbox" checked={Boolean(metric.primary)} onChange={e=>updateMetric(metric.key,{primary:e.target.checked})}/><span>Primary</span></label></div>)}</div></div>}

    {tab === 'actual' && <div className="actual-workspace"><div className="settings-card actual-controls"><h3>{isDa ? 'Observerede stier' : 'Observed paths'}</h3><p>{isDa ? 'Vælg et actual-path snapshot for at sammenligne de observerede sekvenser med den planlagte primære journey-sti.' : 'Choose an actual-path snapshot to compare observed sequences with the planned primary journey path.'}</p><label>{isDa ? 'Actual-path snapshot' : 'Actual-path snapshot'}<select value={actual?.id ?? ''} onChange={e=>setActualSnapshot(e.target.value)}><option value="">{isDa ? 'Intet snapshot valgt' : 'No snapshot selected'}</option>{workspace.actualPathSnapshots.map(snapshot => <option key={snapshot.id} value={snapshot.id}>{snapshot.period} · {snapshot.source}</option>)}</select></label>{actual && <p className="muted-small">{isDa ? 'Genereret' : 'Generated'} {new Date(actual.generatedAt).toLocaleString()} · {actual.journeyPaths.reduce((sum,item)=>sum+item.paths.length,0)} {isDa ? 'observerede stier' : 'observed paths'}.</p>}</div>{!actual ? <div className="empty-state"><GitCompareArrows size={30}/><h3>{isDa ? 'Ingen actual-path data endnu' : 'No actual-path data yet'}</h3><p>{isDa ? 'Eksportér Actual-path-map ovenfor, map de observerede sekvenser til node-ID’er, og importér derefter et actual-path snapshot.' : 'Export the Actual-path map above, map observed sequences to node IDs, then import an actual-path snapshot.'}</p>{onImport && <button className="button primary" onClick={onImport}><FileUp size={15}/>{isDa ? 'Importér data' : 'Import data'}</button>}</div> : <div className="actual-journey-list">{workspace.journeys.map(journey => { const paths = pathsForJourney(workspace, journey.id, actual); const top = [...paths].sort((a,b)=>(b.users??b.sessions??b.count??0)-(a.users??a.sessions??a.count??0))[0]; if (!top) return <article className="actual-card" key={journey.id}><div className="card-heading-row"><div><h3>{journey.name}</h3><p>{isDa ? 'Ingen observerede stier mappet til denne kunderejse.' : 'No observed paths mapped to this journey.'}</p></div><span className="chip">0 paths</span></div></article>; const comparison = compareObservedPath(journey, top); return <article className="actual-card" key={journey.id}><div className="card-heading-row"><div><h3>{journey.name}</h3><p>{top.label}</p></div><div className="match-score"><strong>{comparison.matchPct}%</strong><span>match</span></div></div><div className="observed-path">{top.steps.map((step,index)=><span key={`${step.nodeId||step.label}-${index}`} className={step.nodeId ? 'mapped-step':'unmapped-step'}>{index>0&&<em>→</em>}{journey.nodes.find(n=>n.id===step.nodeId)?.data.label ?? step.label ?? 'Unknown step'}</span>)}</div><div className="actual-stats"><span>{paths.length} observed paths</span>{typeof top.users==='number'&&<span>{top.users.toLocaleString()} users</span>}{typeof top.sessions==='number'&&<span>{top.sessions.toLocaleString()} sessions</span>}{typeof top.sharePct==='number'&&<span>{top.sharePct.toFixed(1)}% share</span>}<span>{comparison.missingPlanned.length} planned steps missing</span><span>{comparison.unmappedActual.length} unmapped actual steps</span></div></article>; })}</div>}</div>}
  </section>;
}

import { useState } from 'react';
import { Activity, BarChart3, CircleCheck, ClipboardList, Database, GitBranch, Info, Link2, TriangleAlert, X } from 'lucide-react';
import { validateJourney } from '../../lib/health';
import { detectOpportunities } from '../../lib/opportunities';
import { activePerformanceSnapshot, coverageForJourney, freshnessLabel, mappingQuality, snapshotAgeHours } from '../../lib/performance';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useI18n } from '../../i18n';

type DetailKind = 'health' | 'todo' | 'handoff' | 'mapped';
interface DetailSelection { journeyId: string; kind: DetailKind }

export function MasterView() {
  const { workspace } = useWorkspace();
  const { t, status } = useI18n();
  const [detail, setDetail] = useState<DetailSelection | null>(null);
  if (!workspace) return null;
  const currentWorkspace = workspace;

  const active = currentWorkspace.journeys.filter(j => j.status === 'active').length;
  const trackedNodes = currentWorkspace.journeys.flatMap(j => j.nodes).filter(n => n.data.tracking.length > 0).length;
  const totalNodes = currentWorkspace.journeys.reduce((s,j) => s+j.nodes.length,0);
  const healthIssues = currentWorkspace.journeys.reduce((sum,j) => sum + validateJourney(j).length,0);
  const snapshot = activePerformanceSnapshot(currentWorkspace);
  const mappedNodes = currentWorkspace.journeys.reduce((sum,j)=>sum+coverageForJourney(currentWorkspace,j.id,snapshot).mapped,0);
  const opportunities = detectOpportunities(currentWorkspace);
  const freshness = freshnessLabel(snapshotAgeHours(snapshot), currentWorkspace.settings.freshnessThresholdHours);
  const language = currentWorkspace.settings.language;
  const isDa = language === 'da';

  const selectedJourney = detail ? currentWorkspace.journeys.find(j => j.id === detail.journeyId) : undefined;

  function detailTitle(kind: DetailKind) {
    if (kind === 'health') return isDa ? 'HEALTH · valideringsfund' : 'HEALTH · validation findings';
    if (kind === 'todo') return isDa ? 'TODO · åbne opgaver' : 'TODO · open tasks';
    if (kind === 'handoff') return isDa ? 'HANDOFF · forbindelser mellem kunderejser' : 'HANDOFF · cross-journey links';
    return isDa ? 'MAPPED · datadækning' : 'MAPPED · data coverage';
  }

  function DetailBody() {
    if (!detail || !selectedJourney) return null;
    if (detail.kind === 'health') {
      const issues = validateJourney(selectedJourney);
      return <div className="master-detail-list">{issues.length === 0 ? <div className="empty-mini">{isDa ? 'Ingen aktive Health-fund. Kunderejsen passerer de automatiske struktur- og trackingchecks.' : 'No active Health findings. The journey passes the automated structure and tracking checks.'}</div> : issues.map(issue => {
        const node = issue.nodeId ? selectedJourney.nodes.find(n => n.id === issue.nodeId) : undefined;
        return <div className={`master-detail-item severity-${issue.severity}`} key={issue.id}><TriangleAlert size={15}/><div><strong>{issue.title}</strong><span>{issue.detail}</span>{node && <small>{isDa ? 'Komponent' : 'Component'}: {node.data.label}</small>}</div><em>{issue.severity}</em></div>;
      })}</div>;
    }
    if (detail.kind === 'todo') {
      const todos = selectedJourney.nodes.flatMap(node => node.data.annotations.filter(annotation => annotation.kind === 'todo' && !annotation.done).map(annotation => ({ annotation, node })));
      return <div className="master-detail-list">{todos.length === 0 ? <div className="empty-mini">{isDa ? 'Ingen åbne TODOs på kunderejsens komponenter.' : 'No open TODOs on journey components.'}</div> : todos.map(({ annotation, node }) => <div className="master-detail-item" key={annotation.id}><ClipboardList size={15}/><div><strong>{node.data.label}</strong><span>{annotation.text}</span><small>{isDa ? 'Oprettet' : 'Created'}: {new Date(annotation.createdAt).toLocaleString()}</small></div></div>)}</div>;
    }
    if (detail.kind === 'handoff') {
      const links = selectedJourney.crossJourneyLinks;
      return <div className="master-detail-list">{links.length === 0 ? <div className="empty-mini">{isDa ? 'Ingen handoffs. Kunderejsen har ingen eksplicitte forbindelser til andre kunderejser.' : 'No handoffs. This journey has no explicit links to another journey.'}</div> : links.map(link => {
        const source = selectedJourney.nodes.find(n => n.id === link.sourceNodeId);
        const targetJourney = currentWorkspace.journeys.find(j => j.id === link.targetJourneyId);
        const target = targetJourney?.nodes.find(n => n.id === link.targetNodeId);
        return <div className="master-detail-item" key={link.id}><Link2 size={15}/><div><strong>{link.label || (isDa ? 'Handoff' : 'Handoff')}</strong><span>{source?.data.label ?? (isDa ? 'Ukendt kilde' : 'Unknown source')} → {targetJourney?.name ?? (isDa ? 'Ukendt kunderejse' : 'Unknown journey')}{target ? ` · ${target.data.label}` : ''}</span>{link.condition && <small>{isDa ? 'Betingelse' : 'Condition'}: {link.condition}</small>}{link.audience && <small>{isDa ? 'Målgruppe' : 'Audience'}: {link.audience}</small>}{link.window && <small>{isDa ? 'Tidsvindue' : 'Window'}: {link.window}</small>}{link.exitRule && <small>{isDa ? 'Exit-regel' : 'Exit rule'}: {link.exitRule}</small>}</div></div>;
      })}</div>;
    }

    const coverage = coverageForJourney(currentWorkspace, selectedJourney.id, snapshot);
    const nodeRows = selectedJourney.nodes.map(node => {
      const records = snapshot?.nodeMetrics.filter(record => record.journeyId === selectedJourney.id && record.nodeId === node.id) ?? [];
      const qualities = records.map(record => mappingQuality(currentWorkspace, record));
      const quality = qualities.includes('direct') ? 'direct' : qualities.includes('proxy') ? 'proxy' : 'unmapped';
      return { node, quality, records };
    });
    return <>
      <div className="master-mapping-summary"><div><strong>{coverage.pct}%</strong><span>{isDa ? 'af kunderejsens komponenter er mappet til det aktive performance-snapshot' : 'of journey components are mapped to the active performance snapshot'}</span></div><div><b>{coverage.direct}</b><span>Direct</span></div><div><b>{coverage.proxy}</b><span>Proxy</span></div><div><b>{Math.max(0, coverage.total - coverage.mapped)}</b><span>Unmapped</span></div></div>
      {!snapshot && <div className="warning-callout"><Info size={16}/><div><strong>{isDa ? 'Intet aktivt performance-snapshot' : 'No active performance snapshot'}</strong><span>{isDa ? 'Importér performance-data i Insights & Data. MAPPED viser først reel datadækning, når et snapshot er valgt.' : 'Import performance data in Insights & Data. MAPPED only shows real coverage when a snapshot is selected.'}</span></div></div>}
      <div className="mapping-legend"><span><b>Direct</b>{isDa ? ' = data matcher komponenten direkte' : ' = data maps directly to the component'}</span><span><b>Proxy</b>{isDa ? ' = en accepteret indirekte indikator' : ' = an accepted indirect indicator'}</span><span><b>Unmapped</b>{isDa ? ' = ingen gyldig datamapping endnu' : ' = no valid data mapping yet'}</span></div>
      <div className="master-detail-list">{nodeRows.map(({ node, quality, records }) => <div className={`master-detail-item mapping-${quality}`} key={node.id}><BarChart3 size={15}/><div><strong>{node.data.label}</strong><span>{records.length ? records.map(r => r.source).filter((value,index,array)=>array.indexOf(value)===index).join(' · ') : (isDa ? 'Ingen performance-record' : 'No performance record')}</span></div><em>{quality}</em></div>)}</div>
    </>;
  }

  return <section className="content-section master-page">
    <div className="section-toolbar"><div><h2>{t('master.title')}</h2><p>{t('master.subtitle')}</p></div></div>

    <div className="master-explainer">
      <div className="master-explainer-copy"><span className="eyebrow-small">{isDa ? 'PORTFØLJEOVERBLIK' : 'PORTFOLIO OVERVIEW'}</span><h3>{isDa ? 'Se kvalitet, arbejde og datadækning på tværs af alle kunderejser' : 'See quality, work and data coverage across every journey'}</h3><p>{isDa ? 'Master View samler kunderejserne i ét styringsbillede. Brug siden til hurtigt at finde strukturelle problemer, åbne opgaver, handoffs mellem kunderejser og hvor stor en del af hver rejse der faktisk er koblet til performance-data.' : 'Master View brings every journey into one governance view. Use it to find structural issues, open work, cross-journey handoffs and how much of each journey is actually linked to performance data.'}</p></div>
      <div className="master-glossary" aria-label={isDa ? 'Forklaring af indikatorer' : 'Indicator glossary'}>
        <div><TriangleAlert size={15}/><strong>HEALTH</strong><span>{isDa ? 'Automatiske fund i struktur, tracking, creatives og konverteringslogik.' : 'Automated findings in structure, tracking, creatives and conversion logic.'}</span></div>
        <div><ClipboardList size={15}/><strong>TODO</strong><span>{isDa ? 'Åbne TODO-annotationer, som er gemt på komponenterne.' : 'Open TODO annotations stored on journey components.'}</span></div>
        <div><Link2 size={15}/><strong>HANDOFF</strong><span>{isDa ? 'Eksplicitte overgange fra denne kunderejse til en anden.' : 'Explicit transitions from this journey to another journey.'}</span></div>
        <div><BarChart3 size={15}/><strong>% MAPPED</strong><span>{isDa ? 'Andelen af komponenter med Direct eller Proxy performance-mapping i aktivt snapshot.' : 'Share of components with Direct or Proxy performance mapping in the active snapshot.'}</span></div>
      </div>
      <p className="master-explainer-hint">{isDa ? 'Klik på HEALTH, TODO, HANDOFF eller % MAPPED på en kunderejse for at se detaljerne.' : 'Click HEALTH, TODO, HANDOFF or % MAPPED on a journey to inspect the details.'}</p>
    </div>

    <div className="summary-grid"><div className="summary-card"><GitBranch/><strong>{currentWorkspace.journeys.length}</strong><span>{t('master.journeys')}</span></div><div className="summary-card"><CircleCheck/><strong>{active}</strong><span>{t('master.active')}</span></div><div className="summary-card"><Activity/><strong>{totalNodes ? Math.round(trackedNodes/totalNodes*100) : 0}%</strong><span>{t('master.nodesTracking')}</span></div><div className="summary-card"><Database/><strong>{mappedNodes}</strong><span>{t('master.performance')}</span></div><div className="summary-card"><TriangleAlert/><strong>{healthIssues}</strong><span>{t('master.health')}</span></div><div className={`summary-card freshness-${freshness.status}`}><Activity/><strong>{opportunities.length}</strong><span>{isDa ? `Muligheder · data ${freshness.label}` : `Opportunities · data ${freshness.label}`}</span></div></div>

    {currentWorkspace.journeys.length===0?<div className="empty-state"><GitBranch size={32}/><h3>{t('master.empty')}</h3><p>{t('master.emptyText')}</p></div>:<div className="master-list">{currentWorkspace.journeys.map(j => { const issues=validateJourney(j); const todos=j.nodes.reduce((sum,n)=>sum+n.data.annotations.filter(a=>a.kind==='todo'&&!a.done).length,0); const coverage=coverageForJourney(currentWorkspace,j.id,snapshot); return <div className="master-row" key={j.id}><div><strong>{j.name}</strong><span>{j.scope} · {status(j.status)}</span></div><div className="master-path">{[...j.nodes].sort((a,b)=>a.position.x-b.position.x).slice(0,6).map((n,i)=><span key={n.id}>{i>0 && <em>→</em>}{n.data.label}</span>)}</div><div className="master-badges"><button className={`chip master-badge-button ${issues.length ? 'chip-warn':''}`} onClick={()=>setDetail({journeyId:j.id,kind:'health'})}>{issues.length} health</button><button className="chip master-badge-button" onClick={()=>setDetail({journeyId:j.id,kind:'todo'})}>{todos} todo</button><button className="chip master-badge-button" onClick={()=>setDetail({journeyId:j.id,kind:'handoff'})}>{j.crossJourneyLinks.length} handoff</button><button className="chip master-badge-button" onClick={()=>setDetail({journeyId:j.id,kind:'mapped'})}>{coverage.pct}% mapped</button></div></div>})}</div>}

    {detail && selectedJourney && <div className="modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setDetail(null);}}><section className="modal-card master-detail-modal" role="dialog" aria-modal="true" aria-labelledby="master-detail-title"><div className="modal-header"><div className="modal-icon">{detail.kind==='health'?<TriangleAlert size={20}/>:detail.kind==='todo'?<ClipboardList size={20}/>:detail.kind==='handoff'?<Link2 size={20}/>:<BarChart3 size={20}/>}</div><div><span className="eyebrow-small">{selectedJourney.name}</span><h2 id="master-detail-title">{detailTitle(detail.kind)}</h2><p>{detail.kind==='health' ? (isDa ? 'Health er Journey Studios automatiske kvalitetstjek. Fund er signaler om ting, der bør valideres — ikke nødvendigvis fejl i forretningen.' : 'Health is Journey Studio’s automated quality check. Findings are signals to validate, not necessarily business errors.') : detail.kind==='todo' ? (isDa ? 'TODO viser uafsluttede arbejdsopgaver, der er knyttet direkte til komponenter i kunderejsen.' : 'TODO shows unfinished work attached directly to journey components.') : detail.kind==='handoff' ? (isDa ? 'Handoffs dokumenterer, hvor en kunde eller et segment fortsætter i en anden kunderejse.' : 'Handoffs document where a customer or segment continues in another journey.') : (isDa ? 'Mapped viser om komponenterne kan kobles til målbare performance-data i det aktive snapshot.' : 'Mapped shows whether components can be linked to measurable performance data in the active snapshot.')}</p></div><button className="icon-button" onClick={()=>setDetail(null)} aria-label={isDa ? 'Luk' : 'Close'}><X size={16}/></button></div><div className="master-detail-content"><DetailBody/></div><div className="modal-actions"><button className="button primary" onClick={()=>setDetail(null)}>{isDa ? 'Luk' : 'Close'}</button></div></section></div>}
  </section>;
}

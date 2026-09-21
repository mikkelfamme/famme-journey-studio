import { useState } from 'react';
import { Check, ClipboardCopy, Database, FileDown, FileUp, Gauge, GitCompareArrows, Info, RefreshCw, TriangleAlert } from 'lucide-react';
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


const performanceAiPromptDa = [
  'Jeg arbejder i Journey Studio by Famme.',
  'Brug den vedhæftede Journey-Studio-performance-map.json som eneste autoritative mapping mellem kunderejser og komponenter.',
  '',
  'Opgave:',
  '1. Brug mine performance-data for perioden [ANGIV PERIODE] fra de filer, jeg har vedhæftet, eller fra de datakilder du har adgang til (fx GA4, Google Ads, Meta, CRM/booking eller BigQuery).',
  '2. Map kun målinger til journeyId og nodeId, som findes i performance-map-filen. Behold ID-værdierne præcis som de står.',
  '3. Brug quality: "direct" kun når målingen direkte repræsenterer komponenten. Brug quality: "proxy" ved en dokumenteret indirekte indikator og forklar hvorfor i mappingNote.',
  '4. Opfind aldrig tal, events, datakilder eller mappings. Hvis en komponent ikke kan mappes forsvarligt, så udelad den fra nodeMetrics.',
  '5. Brug relevante numeriske metrics pr. node, fx impressions, clicks, sessions, cost, conversions, revenue, leads eller andre dokumenterede målinger fra kilden.',
  '6. sources skal beskrive de faktiske datakilder. journeyMetrics må gerne være [].',
  '7. Returnér KUN gyldig JSON uden markdown, kodehegn eller forklarende tekst.',
  '',
  'Output skal følge denne struktur:',
  '{',
  '  "schema": "famme-journey-performance-v1",',
  '  "generatedAt": "<ISO-8601 timestamp>",',
  '  "period": "<YYYY-MM-DD to YYYY-MM-DD>",',
  '  "sources": [{ "name": "<datakilde>", "note": "<kort note>" }],',
  '  "nodeMetrics": [',
  '    {',
  '      "journeyId": "<eksakt journeyId fra map>",',
  '      "nodeId": "<eksakt nodeId fra map>",',
  '      "source": "<datakilde>",',
  '      "quality": "direct",',
  '      "mappingNote": "<hvorfor mappingen er gyldig>",',
  '      "metrics": { "impressions": 0, "clicks": 0 }',
  '    }',
  '  ],',
  '  "journeyMetrics": []',
  '}',
  '',
  'Gem eller returnér resultatet som Journey-Studio-performance-snapshot.json. Det er DEN fil, jeg bagefter skal importere i Journey Studio — ikke performance-map-filen.'
].join('\n');

const performanceAiPromptEn = [
  'I work in Journey Studio by Famme.',
  'Use the attached Journey-Studio-performance-map.json as the only authoritative mapping between journeys and components.',
  '',
  'Task:',
  '1. Use my performance data for [SPECIFY PERIOD] from the files I attach or from connected data sources you can access (for example GA4, Google Ads, Meta, CRM/booking or BigQuery).',
  '2. Map measurements only to journeyId and nodeId values that exist in the performance map. Preserve the IDs exactly.',
  '3. Use quality: "direct" only when the measurement directly represents the component. Use quality: "proxy" for a documented indirect indicator and explain it in mappingNote.',
  '4. Never invent numbers, events, sources or mappings. If a component cannot be mapped reliably, omit it from nodeMetrics.',
  '5. Use relevant numeric metrics per node, for example impressions, clicks, sessions, cost, conversions, revenue, leads or other documented source metrics.',
  '6. sources must describe the real data sources. journeyMetrics may be [].',
  '7. Return ONLY valid JSON with no markdown, code fences or explanatory text.',
  '',
  'Output structure:',
  '{',
  '  "schema": "famme-journey-performance-v1",',
  '  "generatedAt": "<ISO-8601 timestamp>",',
  '  "period": "<YYYY-MM-DD to YYYY-MM-DD>",',
  '  "sources": [{ "name": "<data source>", "note": "<short note>" }],',
  '  "nodeMetrics": [{ "journeyId": "<exact journeyId>", "nodeId": "<exact nodeId>", "source": "<source>", "quality": "direct", "mappingNote": "<why valid>", "metrics": { "impressions": 0, "clicks": 0 } }],',
  '  "journeyMetrics": []',
  '}',
  '',
  'Save or return the result as Journey-Studio-performance-snapshot.json. This is the file I will import into Journey Studio — not the performance-map file.'
].join('\n');

const actualPathAiPromptDa = [
  'Jeg arbejder i Journey Studio by Famme.',
  'Brug den vedhæftede Journey-Studio-actual-path-map.json som eneste autoritative reference for journeyId, nodeId og den planlagte journey-struktur.',
  '',
  'Opgave:',
  '1. Brug observerede kundesti-/eventdata for perioden [ANGIV PERIODE] fra de filer, jeg har vedhæftet, eller fra de datakilder du har adgang til (fx GA4/BigQuery eventsekvenser, shop, CRM eller andet path-data).',
  '2. Byg faktiske observerede sekvenser. Du må IKKE antage, at brugerne følger den planlagte rækkefølge i actual-path-map-filen.',
  '3. Map et observeret trin til nodeId kun når matchningen er dokumenterbar. Behold journeyId og nodeId præcis som i map-filen.',
  '4. Hvis et observeret trin ikke findes i den planlagte journey, så behold det som { "label": "..." } uden nodeId. Opfind ikke et nodeId.',
  '5. Brug count, users, sessions og/eller sharePct når de kan beregnes fra de faktiske data. Opfind aldrig volumen eller andele.',
  '6. Returnér KUN gyldig JSON uden markdown, kodehegn eller forklarende tekst.',
  '',
  'Output skal følge denne struktur:',
  '{',
  '  "schema": "famme-journey-actual-paths-v1",',
  '  "generatedAt": "<ISO-8601 timestamp>",',
  '  "period": "<YYYY-MM-DD to YYYY-MM-DD>",',
  '  "source": "<beskrivelse af datakilden>",',
  '  "journeyPaths": [',
  '    {',
  '      "journeyId": "<eksakt journeyId fra map>",',
  '      "paths": [',
  '        {',
  '          "label": "<kort navn på observeret sti>",',
  '          "users": 0,',
  '          "sharePct": 0,',
  '          "steps": [{ "nodeId": "<eksakt nodeId>" }, { "label": "<observeret men ikke mappet trin>" }]',
  '        }',
  '      ]',
  '    }',
  '  ]',
  '}',
  '',
  'Gem eller returnér resultatet som Journey-Studio-actual-path-snapshot.json. Det er DEN fil, jeg bagefter skal importere i Journey Studio — ikke actual-path-map-filen.'
].join('\n');

const actualPathAiPromptEn = [
  'I work in Journey Studio by Famme.',
  'Use the attached Journey-Studio-actual-path-map.json as the only authoritative reference for journeyId, nodeId and the planned journey structure.',
  '',
  'Task:',
  '1. Use observed customer-path/event data for [SPECIFY PERIOD] from attached files or connected data sources you can access (for example GA4/BigQuery event sequences, shop, CRM or other path data).',
  '2. Build real observed sequences. Do NOT assume users follow the planned order in the actual-path map.',
  '3. Map an observed step to nodeId only when the match is supportable. Preserve journeyId and nodeId exactly as supplied.',
  '4. If an observed step is not represented in the planned journey, keep it as { "label": "..." } without nodeId. Never invent a nodeId.',
  '5. Use count, users, sessions and/or sharePct when they can be calculated from real data. Never invent volume or shares.',
  '6. Return ONLY valid JSON with no markdown, code fences or explanatory text.',
  '',
  'Output structure:',
  '{',
  '  "schema": "famme-journey-actual-paths-v1",',
  '  "generatedAt": "<ISO-8601 timestamp>",',
  '  "period": "<YYYY-MM-DD to YYYY-MM-DD>",',
  '  "source": "<description of data source>",',
  '  "journeyPaths": [{ "journeyId": "<exact journeyId>", "paths": [{ "label": "<observed path>", "users": 0, "sharePct": 0, "steps": [{ "nodeId": "<exact nodeId>" }, { "label": "<observed unmapped step>" }] }] }]',
  '}',
  '',
  'Save or return the result as Journey-Studio-actual-path-snapshot.json. This is the file I will import into Journey Studio — not the actual-path-map file.'
].join('\n');

export function InsightsView({ onImport }: { onImport?: () => void }) {
  const { workspace, updateWorkspace } = useWorkspace();
  const { t } = useI18n();
  const [tab, setTab] = useState<InsightsTab>('overview');
  const [copiedPrompt, setCopiedPrompt] = useState<'performance' | 'actual' | null>(null);
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
  async function copyAiPrompt(kind: 'performance' | 'actual') {
    const text = kind === 'performance' ? (isDa ? performanceAiPromptDa : performanceAiPromptEn) : (isDa ? actualPathAiPromptDa : actualPathAiPromptEn);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompt(kind);
      window.setTimeout(() => setCopiedPrompt(current => current === kind ? null : current), 1800);
    } catch {
      setCopiedPrompt(null);
    }
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
      <div className="insights-guide-intro"><span className="eyebrow-small">{isDa ? 'DATA → AI → SNAPSHOT → INDSIGT' : 'DATA → AI → SNAPSHOT → INSIGHT'}</span><h3>{isDa ? 'Fra rå data til noget Journey Studio kan læse' : 'From raw data to something Journey Studio can read'}</h3><p>{isDa ? 'Journey Studio importerer ikke rå GA4-, Google Ads-, Meta- eller CRM-filer direkte. Først downloader du en mapping-fil fra Journey Studio. Derefter giver du mapping-filen og dine måledata til din AI, som laver en færdig snapshot-JSON. Det er snapshot-filen — ikke mapping-filen — du importerer tilbage i Journey Studio.' : 'Journey Studio does not import raw GA4, Google Ads, Meta or CRM files directly. First download a mapping file from Journey Studio. Then give the mapping file plus your measurement data to your AI, which creates a finished snapshot JSON. The snapshot file — not the mapping file — is what you import back into Journey Studio.'}</p></div>
      <div className="data-connection-note"><Info size={16}/><div><strong>{isDa ? 'Hvad skal du helt konkret uploade til din AI?' : 'What exactly should you upload to your AI?'}</strong><span>{isDa ? 'Upload 1) den relevante mapping-fil fra Journey Studio og 2) de data, du vil koble på for samme periode. Hvis din AI allerede har adgang til datakilderne via connectors/plugins, kan punkt 2 erstattes af en besked om at bruge de forbundne kilder. Brug derefter den færdige prompt nedenfor.' : 'Upload 1) the relevant mapping file from Journey Studio and 2) the data you want to connect for the same period. If your AI already has access to the sources through connectors/plugins, item 2 can be replaced by an instruction to use those connected sources. Then use the ready-made prompt below.'}</span></div></div>

      <div className="insights-steps insights-steps-three">
        <div><b>1</b><strong>{isDa ? 'Download mapping-filen' : 'Download the mapping file'}</strong><span>{isDa ? 'Vælg Performance-map til KPI’er pr. komponent eller Actual-path-map til observerede kundestier.' : 'Choose Performance map for component KPIs or Actual-path map for observed customer paths.'}</span></div>
        <div><b>2</b><strong>{isDa ? 'Send map + data + prompt til din AI' : 'Send map + data + prompt to your AI'}</strong><span>{isDa ? 'AI’en bruger Journey Studios ID’er til at omsætte dine rå data til det korrekte snapshot-format. Brug Copy prompt nedenfor.' : 'The AI uses Journey Studio IDs to transform your raw data into the correct snapshot format. Use Copy prompt below.'}</span></div>
        <div><b>3</b><strong>{isDa ? 'Importér AI’ens snapshot' : 'Import the AI snapshot'}</strong><span>{isDa ? 'AI’en skal returnere en JSON-snapshotfil. Importér den via Importér data. Journey Studio viser et preview, før den gemmes lokalt.' : 'The AI should return a JSON snapshot file. Import it through Import data. Journey Studio previews it before local storage.'}</span></div>
      </div>

      <div className="ai-data-workflows">
        <article className="ai-workflow-card">
          <div className="ai-workflow-heading"><div><span className="workflow-kicker">PERFORMANCE</span><h4>{isDa ? 'Mål performance på komponenterne' : 'Measure component performance'}</h4><p>{isDa ? 'Brug denne, når du vil have fx impressions, clicks, sessions, cost, conversions, revenue eller leads ind på de enkelte komponenter.' : 'Use this when you want metrics such as impressions, clicks, sessions, cost, conversions, revenue or leads on individual components.'}</p></div><button className="button compact" onClick={()=>downloadPerformanceMap(workspace)}><FileDown size={14}/>{isDa ? 'Download Performance-map' : 'Download Performance map'}</button></div>
          <div className="ai-upload-list"><strong>{isDa ? 'Upload/sendt til din AI' : 'Upload/send to your AI'}</strong><ol><li><code>Journey-Studio-performance-map.json</code><span>{isDa ? 'Downloades med knappen ovenfor. Indeholder journeyId, nodeId og tracking-signaler.' : 'Downloaded above. Contains journeyId, nodeId and tracking signals.'}</span></li><li><strong>{isDa ? 'Dine måledata for samme periode' : 'Your measurement data for the same period'}</strong><span>{isDa ? 'Fx CSV/JSON fra GA4, Google Ads, Meta, CRM/booking eller BigQuery — eller bed AI’en bruge de datakilder, den allerede har adgang til.' : 'For example CSV/JSON from GA4, Google Ads, Meta, CRM/booking or BigQuery — or ask the AI to use sources it already has access to.'}</span></li></ol></div>
          <div className="ai-output-target"><span>{isDa ? 'AI’en skal returnere' : 'AI should return'}</span><code>Journey-Studio-performance-snapshot.json</code><em>schema: famme-journey-performance-v1</em></div>
          <details className="ai-prompt-details"><summary>{isDa ? 'Vis færdig AI-prompt' : 'Show ready-made AI prompt'}</summary><div className="ai-prompt-toolbar"><span>{isDa ? 'Kopiér prompten og send den sammen med filerne ovenfor.' : 'Copy the prompt and send it together with the files above.'}</span><button className="button compact" onClick={()=>copyAiPrompt('performance')}>{copiedPrompt === 'performance' ? <Check size={14}/> : <ClipboardCopy size={14}/>} {copiedPrompt === 'performance' ? (isDa ? 'Kopieret' : 'Copied') : (isDa ? 'Kopiér prompt' : 'Copy prompt')}</button></div><pre>{isDa ? performanceAiPromptDa : performanceAiPromptEn}</pre></details>
        </article>

        <article className="ai-workflow-card">
          <div className="ai-workflow-heading"><div><span className="workflow-kicker">ACTUAL PATH</span><h4>{isDa ? 'Sammenlign planlagt rejse med faktisk adfærd' : 'Compare planned journey with actual behavior'}</h4><p>{isDa ? 'Brug denne, når du har sekvens-/eventdata og vil se hvilke stier kunderne faktisk tager gennem rejsen.' : 'Use this when you have sequence/event data and want to see the paths customers actually take through the journey.'}</p></div><button className="button compact" onClick={()=>downloadActualPathMap(workspace)}><FileDown size={14}/>{isDa ? 'Download Actual-path-map' : 'Download Actual-path map'}</button></div>
          <div className="ai-upload-list"><strong>{isDa ? 'Upload/sendt til din AI' : 'Upload/send to your AI'}</strong><ol><li><code>Journey-Studio-actual-path-map.json</code><span>{isDa ? 'Downloades med knappen ovenfor. Indeholder journeyId, nodeId og den planlagte forbindelsesstruktur.' : 'Downloaded above. Contains journeyId, nodeId and the planned connection structure.'}</span></li><li><strong>{isDa ? 'Observerede path-/eventdata for samme periode' : 'Observed path/event data for the same period'}</strong><span>{isDa ? 'Fx GA4/BigQuery eventsekvenser, shop-sessioner eller anden data, der faktisk kan vise rækkefølgen af handlinger. En almindelig totalsrapport er ikke nok til actual paths.' : 'For example GA4/BigQuery event sequences, shop sessions or other data that can actually show action order. A simple totals report is not enough for actual paths.'}</span></li></ol></div>
          <div className="ai-output-target"><span>{isDa ? 'AI’en skal returnere' : 'AI should return'}</span><code>Journey-Studio-actual-path-snapshot.json</code><em>schema: famme-journey-actual-paths-v1</em></div>
          <details className="ai-prompt-details"><summary>{isDa ? 'Vis færdig AI-prompt' : 'Show ready-made AI prompt'}</summary><div className="ai-prompt-toolbar"><span>{isDa ? 'Kopiér prompten og send den sammen med filerne ovenfor.' : 'Copy the prompt and send it together with the files above.'}</span><button className="button compact" onClick={()=>copyAiPrompt('actual')}>{copiedPrompt === 'actual' ? <Check size={14}/> : <ClipboardCopy size={14}/>} {copiedPrompt === 'actual' ? (isDa ? 'Kopieret' : 'Copied') : (isDa ? 'Kopiér prompt' : 'Copy prompt')}</button></div><pre>{isDa ? actualPathAiPromptDa : actualPathAiPromptEn}</pre></details>
        </article>
      </div>

      <div className="snapshot-import-callout"><div><FileUp size={17}/><div><strong>{isDa ? 'Når AI’en er færdig' : 'When the AI is finished'}</strong><span>{isDa ? 'Download AI’ens JSON-snapshotfil. Du skal ikke importere Performance-map eller Actual-path-map tilbage i Journey Studio; de er kun referencefiler til AI/dataflowet.' : 'Download the JSON snapshot produced by the AI. Do not import the Performance map or Actual-path map back into Journey Studio; they are reference files only for the AI/data flow.'}</span></div></div>{onImport && <button className="button primary" onClick={onImport}><FileUp size={15}/>{isDa ? 'Importér snapshot-data' : 'Import snapshot data'}</button>}</div>

      <div className="insights-use-note"><strong>{isDa ? 'Efter importen' : 'After import'}</strong><span>{isDa ? 'Overblik viser datadækning og friskhed. Mapping Center viser Direct/Proxy/Unmapped og lader dig dokumentere mappings. KPI-ordbog giver metric keys en fælles betydning. Planlagt vs. faktisk viser de observerede stier mod dit journey-design.' : 'Overview shows data coverage and freshness. Mapping Center shows Direct/Proxy/Unmapped and lets you document mappings. KPI Dictionary gives metric keys shared meaning. Planned vs Actual compares observed paths with your journey design.'}</span></div>
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

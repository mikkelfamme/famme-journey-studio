import type {
  MappingQuality,
  MetricDefinition,
  NodePerformanceRecord,
  PerformanceSnapshot,
  Workspace
} from '../types/domain';
import { makeId } from './ids';

const DEFAULT_METRICS: MetricDefinition[] = [
  { key: 'impressions', label: 'Impressions', unit: 'count', role: 'acquisition', direction: 'higher', decimals: 0 },
  { key: 'clicks', label: 'Clicks', unit: 'count', role: 'acquisition', direction: 'higher', decimals: 0 },
  { key: 'ctrPct', label: 'CTR', unit: 'percent', role: 'efficiency', direction: 'higher', decimals: 1 },
  { key: 'cost', label: 'Cost', unit: 'currency', role: 'efficiency', direction: 'lower', currency: 'DKK', decimals: 0 },
  { key: 'costDKK', label: 'Cost', unit: 'currency', role: 'efficiency', direction: 'lower', currency: 'DKK', decimals: 0 },
  { key: 'avgCpc', label: 'Avg. CPC', unit: 'currency', role: 'efficiency', direction: 'lower', currency: 'DKK', decimals: 2 },
  { key: 'avgCpcDKK', label: 'Avg. CPC', unit: 'currency', role: 'efficiency', direction: 'lower', currency: 'DKK', decimals: 2 },
  { key: 'conversions', label: 'Conversions', unit: 'count', role: 'conversion', direction: 'higher', decimals: 0, primary: true },
  { key: 'purchases', label: 'Purchases', unit: 'count', role: 'conversion', direction: 'higher', decimals: 0, primary: true },
  { key: 'revenue', label: 'Revenue', unit: 'currency', role: 'revenue', direction: 'higher', currency: 'DKK', decimals: 0, primary: true },
  { key: 'revenueDKK', label: 'Revenue', unit: 'currency', role: 'revenue', direction: 'higher', currency: 'DKK', decimals: 0, primary: true },
  { key: 'users', label: 'Users', unit: 'count', role: 'engagement', direction: 'higher', decimals: 0 },
  { key: 'sessions', label: 'Sessions', unit: 'count', role: 'engagement', direction: 'higher', decimals: 0 },
  { key: 'pageViews', label: 'Page views', unit: 'count', role: 'engagement', direction: 'higher', decimals: 0 }
];

export function defaultMetricDictionary(): MetricDefinition[] {
  return structuredClone(DEFAULT_METRICS);
}

export function humanizeMetricKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/ D K K\b/g, ' DKK')
    .replace(/ Pct\b/g, ' %');
}

export function inferredMetricDefinition(key: string): MetricDefinition {
  const lower = key.toLowerCase();
  const percent = lower.includes('pct') || lower.includes('percent') || lower.includes('rate') || lower.includes('ctr');
  const currency = lower.includes('dkk') || lower.includes('revenue') || lower.includes('cost') || lower.includes('cpc') || lower.includes('cpa') || lower.includes('value');
  const lowerIsBetter = lower.includes('cost') || lower.includes('cpc') || lower.includes('cpa') || lower.includes('bounce');
  const conversion = lower.includes('purchase') || lower.includes('conversion') || lower.includes('lead') || lower.includes('booking');
  const revenue = lower.includes('revenue') || lower.includes('value');
  return {
    key,
    label: humanizeMetricKey(key),
    unit: percent ? 'percent' : currency ? 'currency' : 'count',
    role: revenue ? 'revenue' : conversion ? 'conversion' : lowerIsBetter ? 'efficiency' : 'other',
    direction: lowerIsBetter ? 'lower' : 'higher',
    currency: currency ? 'DKK' : undefined,
    decimals: percent ? 1 : currency && (lower.includes('cpc') || lower.includes('cpa')) ? 2 : 0
  };
}

export function ensureMetricDictionary(existing: MetricDefinition[], snapshots: PerformanceSnapshot[]): MetricDefinition[] {
  const map = new Map(existing.map(metric => [metric.key, metric]));
  for (const def of DEFAULT_METRICS) if (!map.has(def.key)) map.set(def.key, structuredClone(def));
  for (const snapshot of snapshots) {
    for (const record of snapshot.nodeMetrics) {
      for (const key of Object.keys(record.metrics)) if (!map.has(key)) map.set(key, inferredMetricDefinition(key));
    }
  }
  return [...map.values()];
}

export function metricDefinition(workspace: Workspace, key: string): MetricDefinition {
  return workspace.metricDictionary.find(metric => metric.key === key) ?? inferredMetricDefinition(key);
}

export function formatMetric(value: number, definition: MetricDefinition): string {
  const decimals = definition.decimals ?? 0;
  if (definition.unit === 'percent') return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value)}%`;
  if (definition.unit === 'currency') {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: definition.currency || 'DKK', maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(value);
  }
  if (definition.unit === 'duration') return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(value)}s`;
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: decimals }).format(value);
}

export function performanceSnapshotById(workspace: Workspace, id?: string): PerformanceSnapshot | undefined {
  if (!workspace.performanceSnapshots.length) return undefined;
  if (id) return workspace.performanceSnapshots.find(snapshot => snapshot.id === id);
  return [...workspace.performanceSnapshots].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

export function activePerformanceSnapshot(workspace: Workspace): PerformanceSnapshot | undefined {
  return performanceSnapshotById(workspace, workspace.settings.activePerformanceSnapshotId);
}

export function comparePerformanceSnapshot(workspace: Workspace): PerformanceSnapshot | undefined {
  return performanceSnapshotById(workspace, workspace.settings.comparePerformanceSnapshotId);
}

export function mappingQuality(workspace: Workspace, record: NodePerformanceRecord): MappingQuality {
  return workspace.mappingOverrides.find(override => override.journeyId === record.journeyId && override.nodeId === record.nodeId)?.quality ?? record.quality;
}

export function mappingNote(workspace: Workspace, record: NodePerformanceRecord): string {
  const override = workspace.mappingOverrides.find(item => item.journeyId === record.journeyId && item.nodeId === record.nodeId);
  return override?.note || record.mappingNote || '';
}

export function recordsForNode(workspace: Workspace, journeyId: string, nodeId: string, snapshot?: PerformanceSnapshot): NodePerformanceRecord[] {
  const active = snapshot ?? activePerformanceSnapshot(workspace);
  return active?.nodeMetrics.filter(record => record.journeyId === journeyId && record.nodeId === nodeId) ?? [];
}

export function coverageForJourney(workspace: Workspace, journeyId: string, snapshot?: PerformanceSnapshot) {
  const journey = workspace.journeys.find(item => item.id === journeyId);
  const active = snapshot ?? activePerformanceSnapshot(workspace);
  const records = active?.nodeMetrics.filter(record => record.journeyId === journeyId) ?? [];
  const mapped = new Set(records.filter(record => mappingQuality(workspace, record) !== 'unmapped').map(record => record.nodeId));
  const direct = new Set(records.filter(record => mappingQuality(workspace, record) === 'direct').map(record => record.nodeId));
  const proxy = new Set(records.filter(record => mappingQuality(workspace, record) === 'proxy').map(record => record.nodeId));
  const total = journey?.nodes.length ?? 0;
  return { total, mapped: mapped.size, direct: direct.size, proxy: proxy.size, pct: total ? Math.round(mapped.size / total * 100) : 0 };
}

export function preferredMetrics(workspace: Workspace, record: NodePerformanceRecord, limit = 2) {
  const entries = Object.entries(record.metrics);
  const score = (key: string) => {
    const definition = metricDefinition(workspace, key);
    return (definition.primary ? 100 : 0) + (definition.role === 'conversion' ? 30 : 0) + (definition.role === 'revenue' ? 25 : 0) + (definition.role === 'efficiency' ? 10 : 0);
  };
  return entries.sort(([a], [b]) => score(b) - score(a)).slice(0, limit).map(([key, value]) => {
    const definition = metricDefinition(workspace, key);
    return { key, label: definition.label, value, formatted: formatMetric(value, definition) };
  });
}

export function metricDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous) * 100;
}

export function snapshotAgeHours(snapshot: PerformanceSnapshot | undefined): number | null {
  if (!snapshot) return null;
  const timestamp = Date.parse(snapshot.generatedAt);
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, (Date.now() - timestamp) / 36e5);
}

export function freshnessLabel(hours: number | null, threshold: number): { label: string; status: 'fresh' | 'stale' | 'unknown' } {
  if (hours === null) return { label: 'Unknown', status: 'unknown' };
  if (hours <= threshold) return { label: hours < 1 ? '<1h ago' : `${Math.round(hours)}h ago`, status: 'fresh' };
  const days = hours / 24;
  return { label: days >= 1 ? `${Math.round(days)}d ago` : `${Math.round(hours)}h ago`, status: 'stale' };
}

export function normalizePerformanceSnapshot(raw: Partial<PerformanceSnapshot> & { nodeMetrics?: Array<Partial<NodePerformanceRecord>> }): PerformanceSnapshot {
  if (raw.schema !== 'famme-journey-performance-v1' || !Array.isArray(raw.nodeMetrics)) throw new Error('Not a valid Journey Studio by Famme performance snapshot.');
  return {
    schema: 'famme-journey-performance-v1',
    id: raw.id || makeId('performance'),
    generatedAt: raw.generatedAt || new Date().toISOString(),
    period: raw.period || 'Unspecified period',
    sources: Array.isArray(raw.sources) ? raw.sources.map(source => ({ ...source, name: source.name || 'Data source' })) : [],
    nodeMetrics: raw.nodeMetrics.map(record => ({
      id: record.id || makeId('metric'),
      journeyId: String(record.journeyId || ''),
      nodeId: String(record.nodeId || ''),
      source: String(record.source || 'Unknown source'),
      quality: (record.quality === 'direct' || record.quality === 'proxy' || record.quality === 'unmapped') ? record.quality : 'proxy',
      mappingNote: record.mappingNote || '',
      metrics: Object.fromEntries(Object.entries(record.metrics || {}).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)))
    })),
    journeyMetrics: Array.isArray(raw.journeyMetrics) ? raw.journeyMetrics.map(item => ({ ...item, journeyId: String(item.journeyId || '') })) : []
  };
}

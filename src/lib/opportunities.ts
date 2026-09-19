import type { Journey, Workspace } from '../types/domain';
import { validateJourney } from './health';
import { activePerformanceSnapshot, comparePerformanceSnapshot, mappingQuality, metricDefinition, metricDelta, recordsForNode, snapshotAgeHours } from './performance';

export type OpportunitySeverity = 'high' | 'medium' | 'low';
export interface Opportunity {
  id: string;
  severity: OpportunitySeverity;
  journeyId: string;
  nodeId?: string;
  title: string;
  detail: string;
  category: 'measurement' | 'performance' | 'creative' | 'governance';
}

function healthOpportunities(journey: Journey): Opportunity[] {
  return validateJourney(journey).map(issue => ({
    id: `health-${journey.id}-${issue.id}`,
    severity: issue.severity === 'error' ? 'high' : issue.severity === 'warning' ? 'medium' : 'low',
    journeyId: journey.id,
    nodeId: issue.nodeId,
    title: issue.title,
    detail: issue.detail,
    category: issue.title.toLowerCase().includes('creative') ? 'creative' : 'governance'
  }));
}

export function detectOpportunities(workspace: Workspace): Opportunity[] {
  const items: Opportunity[] = workspace.journeys.flatMap(healthOpportunities);
  const active = activePerformanceSnapshot(workspace);
  const compare = comparePerformanceSnapshot(workspace);

  for (const journey of workspace.journeys) {
    for (const node of journey.nodes) {
      if (!['meta', 'googleAds', 'conversion', 'lead', 'booking', 'cta'].includes(node.data.type)) continue;
      const records = recordsForNode(workspace, journey.id, node.id, active);
      if (active && records.length === 0) {
        items.push({ id: `unmapped-${journey.id}-${node.id}`, severity: node.data.type === 'conversion' ? 'high' : 'medium', journeyId: journey.id, nodeId: node.id, title: 'No performance mapping', detail: `${node.data.label} has no metric record in the active snapshot.`, category: 'measurement' });
      } else if (records.some(record => mappingQuality(workspace, record) === 'proxy') && node.data.type === 'conversion') {
        items.push({ id: `proxy-conversion-${journey.id}-${node.id}`, severity: 'medium', journeyId: journey.id, nodeId: node.id, title: 'Conversion uses proxy data', detail: `${node.data.label} is mapped as a proxy rather than a direct conversion measurement.`, category: 'measurement' });
      }
    }
  }

  if (active && compare) {
    for (const current of active.nodeMetrics) {
      const previous = compare.nodeMetrics.find(record => record.journeyId === current.journeyId && record.nodeId === current.nodeId && record.source === current.source);
      if (!previous) continue;
      for (const [key, value] of Object.entries(current.metrics)) {
        const before = previous.metrics[key];
        if (typeof before !== 'number') continue;
        const definition = metricDefinition(workspace, key);
        if (definition.direction === 'neutral') continue;
        const delta = metricDelta(value, before);
        if (delta === null || Math.abs(delta) < 5) continue;
        const worse = definition.direction === 'higher' ? delta < 0 : delta > 0;
        if (worse) items.push({ id: `kpi-${current.journeyId}-${current.nodeId}-${key}`, severity: Math.abs(delta) >= 20 ? 'high' : 'medium', journeyId: current.journeyId, nodeId: current.nodeId, title: `${definition.label} moved in the wrong direction`, detail: `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% versus the comparison snapshot.`, category: 'performance' });
      }
    }
  }

  const age = snapshotAgeHours(active);
  if (active && age !== null && age > workspace.settings.freshnessThresholdHours) {
    for (const journey of workspace.journeys.slice(0, 1)) items.push({ id: 'stale-data', severity: 'medium', journeyId: journey.id, title: 'Performance data is stale', detail: `The active snapshot is ${Math.round(age)} hours old. Freshness threshold is ${workspace.settings.freshnessThresholdHours} hours.`, category: 'measurement' });
  }
  return items;
}

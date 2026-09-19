import type { Journey, JourneyNode } from '../types/domain';

export type HealthSeverity = 'error' | 'warning' | 'info';
export interface HealthIssue {
  id: string;
  severity: HealthSeverity;
  title: string;
  detail: string;
  nodeId?: string;
}

function predecessors(journey: Journey, nodeId: string): JourneyNode[] {
  const ids = journey.edges.filter(edge => edge.target === nodeId).map(edge => edge.source);
  return journey.nodes.filter(node => ids.includes(node.id));
}

function successors(journey: Journey, nodeId: string): JourneyNode[] {
  const ids = journey.edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
  return journey.nodes.filter(node => ids.includes(node.id));
}

export function validateJourney(journey: Journey): HealthIssue[] {
  const issues: HealthIssue[] = [];
  const connected = new Set(journey.edges.flatMap(edge => [edge.source, edge.target]));

  journey.nodes.forEach(node => {
    const data = node.data;
    if (data.type === 'conversion' && data.tracking.length === 0) {
      issues.push({ id: `conversion-tracking-${node.id}`, severity: 'error', title: 'Conversion without tracking', detail: `${data.label} has no tracking definition.`, nodeId: node.id });
    }
    if (data.type === 'cta' && !predecessors(journey, node.id).some(n => n.data.type === 'landingPage')) {
      issues.push({ id: `cta-lp-${node.id}`, severity: 'warning', title: 'CTA without landing-page predecessor', detail: `${data.label} is not directly connected from a landing page.`, nodeId: node.id });
    }
    if (['meta', 'googleAds'].includes(data.type)) {
      if (data.creatives.length === 0) issues.push({ id: `paid-creative-${node.id}`, severity: 'warning', title: 'Paid node without creative', detail: `${data.label} has no creative definition.`, nodeId: node.id });
      if (data.creatives.length > 0 && data.creatives.every(c => !c.finalUrl)) issues.push({ id: `paid-url-${node.id}`, severity: 'warning', title: 'Paid node without final URL', detail: `${data.label} has creatives, but none has a final URL.`, nodeId: node.id });
    }
    if (data.tracking.some(t => ['missing', 'validate'].includes(t.status))) {
      issues.push({ id: `tracking-status-${node.id}`, severity: 'warning', title: 'Tracking requires attention', detail: `${data.label} contains missing or unvalidated tracking.`, nodeId: node.id });
    }
    if (journey.nodes.length > 1 && !connected.has(node.id)) {
      issues.push({ id: `isolated-${node.id}`, severity: 'warning', title: 'Isolated node', detail: `${data.label} is not connected to the journey graph.`, nodeId: node.id });
    }
    if (data.type === 'conversion' && !successors(journey, node.id).some(n => n.data.type === 'exclusion')) {
      issues.push({ id: `conversion-exclusion-${node.id}`, severity: 'info', title: 'No direct post-conversion exclusion', detail: `${data.label} does not lead directly to an exclusion node.`, nodeId: node.id });
    }
  });

  if (!journey.primaryConversion.trim()) issues.push({ id: 'primary-conversion', severity: 'warning', title: 'Primary conversion not defined', detail: 'Define the primary business conversion for this journey.' });
  return issues;
}

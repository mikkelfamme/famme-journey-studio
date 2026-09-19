import type { ActualPathSnapshot, PerformanceSnapshot, Workspace } from '../types/domain';
import { makeId } from './ids';
import { createWorkspace, journeyFromTemplate } from './workspace';
import { ensureMetricDictionary } from './performance';

function findNodeId(workspace: Workspace, journeyId: string, type: string, fallback = 0): string {
  const journey = workspace.journeys.find(item => item.id === journeyId);
  return journey?.nodes.find(node => node.data.type === type)?.id ?? journey?.nodes[fallback]?.id ?? '';
}

export function createDemoWorkspace(): Workspace {
  const workspace = createWorkspace({
    name: 'Product demo workspace',
    organization: 'Northstar Demo',
    scope: 'Mixed',
    product: 'Tickets & membership'
  });
  const purchaseTemplate = workspace.templates.find(template => template.name === 'B2C purchase journey') ?? workspace.templates[0];
  const membershipTemplate = workspace.templates.find(template => template.name === 'Membership / subscription') ?? workspace.templates[0];
  if (!purchaseTemplate || !membershipTemplate) return workspace;

  const purchase = journeyFromTemplate(purchaseTemplate, 'City experience purchase', workspace.organization);
  purchase.status = 'active';
  purchase.audience = 'People actively looking for a local experience';
  purchase.product = 'Day ticket';
  purchase.owner = 'Growth team';
  purchase.primaryConversion = 'Purchase';
  purchase.planInputs = {
    objective: 'Turn active intent into a completed ticket purchase.',
    primaryMessage: 'Make the experience relevant, concrete and easy to buy.',
    successCriteria: 'Qualified traffic progresses from intent to purchase with measurable handoffs.',
    dependencies: 'Landing page quality, checkout availability and complete purchase tracking.'
  };
  const paidNode = purchase.nodes.find(node => node.data.type === 'googleAds');
  if (paidNode) {
    paidNode.data.label = 'Search intent';
    paidNode.data.tracking = [{ id: makeId('tracking'), platform: 'Google Ads', event: 'click', status: 'implemented', note: 'Synthetic demo setup.' }];
    paidNode.data.creatives = [{ id: makeId('creative'), format: 'Search', name: 'Intent ad', headline: 'Plan your city experience', cta: 'Book now', finalUrl: 'https://example.com/tickets', status: 'live', message: 'Synthetic demo creative.' }];
  }
  const purchaseNode = purchase.nodes.find(node => node.data.type === 'conversion');
  if (purchaseNode) purchaseNode.data.tracking = [{ id: makeId('tracking'), platform: 'GA4', event: 'purchase', status: 'implemented', note: 'Synthetic demo event.' }];

  const membership = journeyFromTemplate(membershipTemplate, 'Membership acquisition', workspace.organization);
  membership.status = 'active';
  membership.audience = 'Repeat visitors and high-intent prospects';
  membership.product = 'Membership';
  membership.owner = 'CRM & growth';
  membership.primaryConversion = 'Membership purchase';
  membership.planInputs = {
    objective: 'Convert repeat intent into an ongoing membership relationship.',
    primaryMessage: 'Show the recurring value of membership.',
    successCriteria: 'Research and comparison lead to membership purchase and lifecycle onboarding.',
    dependencies: 'Value proposition, membership tracking and CRM onboarding.'
  };
  const membershipConversion = membership.nodes.find(node => node.data.type === 'conversion');
  if (membershipConversion) membershipConversion.data.tracking = [{ id: makeId('tracking'), platform: 'GA4', event: 'membership_purchase', status: 'implemented', note: 'Synthetic demo event.' }];

  workspace.journeys = [purchase, membership];
  const generatedAt = new Date().toISOString();
  const performance: PerformanceSnapshot = {
    schema: 'famme-journey-performance-v1',
    id: makeId('performance'),
    generatedAt,
    period: 'Synthetic demo period',
    sources: [{ name: 'Synthetic analytics', generatedAt, note: 'Illustrative data bundled only in the generic demo workspace.' }],
    nodeMetrics: [
      {
        id: makeId('metric'),
        journeyId: purchase.id,
        nodeId: findNodeId({ ...workspace, journeys: [purchase, membership] }, purchase.id, 'googleAds'),
        source: 'Synthetic paid media',
        quality: 'direct',
        mappingNote: 'Direct demo mapping.',
        metrics: { impressions: 48000, clicks: 6200, ctrPct: 12.9, costDKK: 18400, avgCpcDKK: 2.97 }
      },
      {
        id: makeId('metric'),
        journeyId: purchase.id,
        nodeId: findNodeId({ ...workspace, journeys: [purchase, membership] }, purchase.id, 'conversion'),
        source: 'Synthetic analytics',
        quality: 'direct',
        mappingNote: 'Direct demo purchase mapping.',
        metrics: { purchases: 742, revenueDKK: 286000 }
      },
      {
        id: makeId('metric'),
        journeyId: membership.id,
        nodeId: findNodeId({ ...workspace, journeys: [purchase, membership] }, membership.id, 'conversion'),
        source: 'Synthetic analytics',
        quality: 'direct',
        mappingNote: 'Direct demo membership mapping.',
        metrics: { conversions: 184, revenueDKK: 138000 }
      }
    ],
    journeyMetrics: []
  };

  const actual: ActualPathSnapshot = {
    schema: 'famme-journey-actual-paths-v1',
    id: makeId('actual'),
    generatedAt,
    period: 'Synthetic demo period',
    source: 'Synthetic observed paths',
    journeyPaths: [
      {
        journeyId: purchase.id,
        paths: [{
          id: makeId('path'),
          label: 'Search → landing page → CTA → purchase',
          users: 510,
          sharePct: 68.7,
          steps: purchase.nodes
            .filter(node => ['googleAds','landingPage','cta','conversion'].includes(node.data.type))
            .map(node => ({ nodeId: node.id, label: node.data.label }))
        }]
      }
    ]
  };

  workspace.performanceSnapshots = [performance];
  workspace.actualPathSnapshots = [actual];
  workspace.metricDictionary = ensureMetricDictionary(workspace.metricDictionary, workspace.performanceSnapshots);
  workspace.settings.activePerformanceSnapshotId = performance.id;
  workspace.settings.activeActualPathSnapshotId = actual.id;
  workspace.settings.demoWorkspace = true;
  workspace.settings.onboardingComplete = false;
  return workspace;
}

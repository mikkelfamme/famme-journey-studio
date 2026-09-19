import { describe, expect, it } from 'vitest';
import { looksLikeLegacyWorkspace, migrateLegacyWorkspace } from './legacy';

const legacy = {
  id: 'legacy-workspace',
  name: 'Legacy Journey Studio',
  groups: [{ id: 'g1', name: 'Group' }],
  journeys: [{
    id: 'legacy-journey',
    name: 'Legacy purchase',
    scope: 'B2C',
    status: 'Active',
    nodes: [
      { id: 'n1', type: 'trigger', x: 10, y: 20, data: { title: 'Need', funnelStage: 'top', creatives: [] } },
      { id: 'n2', type: 'google-ads', x: 250, y: 20, data: { title: 'Search', funnelStage: 'top', creatives: [{ title: 'Ad V1', format: 'Search', finalUrl: 'https://example.com' }] } },
      { id: 'n3', type: 'conversion', x: 500, y: 20, data: { title: 'Purchase', funnelStage: 'bottom', creatives: [] } }
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2', label: 'Intent' }, { id: 'e2', source: 'n2', target: 'n3' }],
    tracking: [{ id: 't1', nodeId: 'n3', platform: 'GA4', event: 'purchase', status: 'implemented', parameters: ['transaction_id'] }]
  }],
  crossConnections: []
};

describe('legacy workspace migration', () => {
  it('detects and converts the single-file workspace model', () => {
    expect(looksLikeLegacyWorkspace(legacy)).toBe(true);
    const workspace = migrateLegacyWorkspace(legacy);
    expect(workspace.schema).toBe('famme-journey-studio-workspace-v2');
    expect(workspace.journeys).toHaveLength(1);
    const journey = workspace.journeys[0];
    expect(journey.status).toBe('active');
    expect(journey.nodes[1].data.type).toBe('googleAds');
    expect(journey.nodes[2].data.tracking[0].event).toBe('purchase');
    expect(journey.nodes[1].data.creatives[0].name).toBe('Ad V1');
  });
});

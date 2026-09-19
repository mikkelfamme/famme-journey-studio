import { describe, expect, it } from 'vitest';
import { importPreview } from './files';
import { legacyMigrationReport, migrateLegacyWorkspaceWithReport } from './legacy';
import { createPortfolioWorkspace, defaultPortfolioOptions } from './share';

const legacy = {
  id: 'legacy-beta2',
  name: 'Legacy workspace',
  groups: [{ id: 'group-1' }],
  journeys: [{
    id: 'j1',
    name: 'Lead journey',
    nodes: [
      { id: 'n1', type: 'google-ads', x: 10, y: 10, data: { title: 'Search', funnelStage: 'top', creatives: [{ name: 'Campaign A', format: 'Search', finalUrl: 'https://example.com' }] } },
      { id: 'n2', type: 'lead', x: 200, y: 10, data: { title: 'Lead', funnelStage: 'bottom' } }
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    tracking: [{ id: 't1', nodeId: 'n2', platform: 'GA4', event: 'generate_lead', status: 'implemented' }]
  }],
  crossConnections: []
};

describe('beta 2 release flow', () => {
  it('reports migration contents before replacing a workspace', () => {
    const report = legacyMigrationReport(legacy);
    expect(report.journeys).toBe(1);
    expect(report.nodes).toBe(2);
    expect(report.tracking).toBe(1);
    const migrated = migrateLegacyWorkspaceWithReport(legacy);
    const preview = importPreview({ kind: 'workspace', source: 'legacy', workspace: migrated.workspace, migrationReport: migrated.report });
    expect(preview.replacesWorkspace).toBe(true);
    expect(preview.migrationReport?.nodes).toBe(2);
  });

  it('can migrate and then sanitize the workspace without mutating the source', () => {
    const migrated = migrateLegacyWorkspaceWithReport(legacy).workspace;
    const sourceName = migrated.journeys[0].nodes[0].data.creatives[0].name;
    const portfolio = createPortfolioWorkspace(migrated, defaultPortfolioOptions);
    expect(migrated.journeys[0].nodes[0].data.creatives[0].name).toBe(sourceName);
    expect(portfolio.performanceSnapshots).toHaveLength(0);
    expect(portfolio.actualPathSnapshots).toHaveLength(0);
  });
});

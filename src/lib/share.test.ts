import { describe, expect, it } from 'vitest';
import { createDemoWorkspace } from './demo';
import { createPortfolioWorkspace, defaultPortfolioOptions } from './share';

describe('portfolio export', () => {
  it('removes intelligence data and sensitive working details by default', () => {
    const source = createDemoWorkspace();
    source.journeys[0].annotations.push({ id: 'todo', kind: 'todo', text: 'Internal task', createdAt: new Date().toISOString(), done: false });
    const portfolio = createPortfolioWorkspace(source, defaultPortfolioOptions);
    expect(portfolio.performanceSnapshots).toHaveLength(0);
    expect(portfolio.actualPathSnapshots).toHaveLength(0);
    expect(portfolio.journeys[0].annotations).toHaveLength(0);
    const paid = portfolio.journeys[0].nodes.find(node => node.data.type === 'googleAds');
    expect(paid?.data.label).toBe('Paid search');
    expect(paid?.data.tracking[0]?.event).toMatch(/Measurement signal/);
  });
});

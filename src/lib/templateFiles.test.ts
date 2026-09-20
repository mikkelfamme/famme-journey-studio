import { describe, expect, it } from 'vitest';
import { parseJourneyTemplateData, serializeJourneyTemplate, templateFromJourney } from './templateFiles';
import { createBlankTemplate } from './templates';
import type { Journey } from '../types/domain';

const journey: Journey = {
  id: 'journey-1', name: 'Example journey', description: 'Example', audience: '', product: '', scope: 'B2C', status: 'draft', primaryConversion: 'Purchase', owner: '',
  createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z',
  nodes: [{ id: 'n1', type: 'journey', position: { x: 10, y: 20 }, data: { label: 'Landing', type: 'landingPage', stage: 'middle', description: '', tracking: [], creatives: [], annotations: [] } }],
  edges: [], planInputs: { objective: 'Convert' }, crossJourneyLinks: [], annotations: [], versions: []
};

describe('portable journey templates', () => {
  it('creates a completely blank custom template from metadata', () => {
    const template = createBlankTemplate({ name: 'Blank template', description: 'Build it yourself', category: 'Custom', scope: 'B2C', version: '1.2.0', tags: ['Acquisition'], author: 'Example' });
    expect(template.system).toBe(false);
    expect(template.nodes).toHaveLength(0);
    expect(template.edges).toHaveLength(0);
    expect(template.version).toBe('1.2.0');
    expect(template.tags).toEqual(['Acquisition']);
  });

  it('can still convert an existing journey when using Save as template from the editor', () => {
    const template = templateFromJourney(journey, { name: 'My template', description: 'Reusable', category: 'Acquisition', scope: 'B2C' });
    expect(template.nodes).toHaveLength(1);
  });

  it('round-trips metadata and assigns a new local id', () => {
    const template = createBlankTemplate({ name: 'My template', description: 'Reusable', category: 'Acquisition', scope: 'B2C', version: '2.3.0', tags: ['B2C','Acquisition'], author: 'Example author' });
    const parsed = parseJourneyTemplateData(JSON.parse(serializeJourneyTemplate(template)));
    expect(parsed.name).toBe(template.name);
    expect(parsed.id).not.toBe(template.id);
    expect(parsed.system).toBe(false);
    expect(parsed.version).toBe('2.3.0');
    expect(parsed.tags).toEqual(['B2C','Acquisition']);
    expect(parsed.author).toBe('Example author');
  });
});

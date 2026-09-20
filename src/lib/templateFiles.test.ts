import { describe, expect, it } from 'vitest';
import { parseJourneyTemplateData, serializeJourneyTemplate, templateFromJourney } from './templateFiles';
import type { Journey } from '../types/domain';

const journey: Journey = {
  id: 'journey-1', name: 'Example journey', description: 'Example', audience: '', product: '', scope: 'B2C', status: 'draft', primaryConversion: 'Purchase', owner: '',
  createdAt: '2026-09-20T00:00:00.000Z', updatedAt: '2026-09-20T00:00:00.000Z',
  nodes: [{ id: 'n1', type: 'journey', position: { x: 10, y: 20 }, data: { label: 'Landing', type: 'landingPage', stage: 'middle', description: '', tracking: [], creatives: [], annotations: [] } }],
  edges: [], planInputs: { objective: 'Convert' }, crossJourneyLinks: [], annotations: [], versions: []
};

describe('portable journey templates', () => {
  it('creates a custom template from an existing journey', () => {
    const template = templateFromJourney(journey, { name: 'My template', description: 'Reusable', category: 'Acquisition', scope: 'B2C' });
    expect(template.system).toBe(false);
    expect(template.name).toBe('My template');
    expect(template.nodes).toHaveLength(1);
  });

  it('round-trips a shared template and assigns a new local id', () => {
    const template = templateFromJourney(journey, { name: 'My template', description: 'Reusable', category: 'Acquisition', scope: 'B2C' });
    const parsed = parseJourneyTemplateData(JSON.parse(serializeJourneyTemplate(template)));
    expect(parsed.name).toBe(template.name);
    expect(parsed.id).not.toBe(template.id);
    expect(parsed.system).toBe(false);
  });
});

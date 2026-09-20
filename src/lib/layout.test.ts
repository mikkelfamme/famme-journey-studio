import { describe, expect, it } from 'vitest';
import type { Journey, JourneyNode } from '../types/domain';
import { compactStageLayout, traceConnectedPath } from './layout';

function node(id: string, stage: JourneyNode['data']['stage']): JourneyNode {
  return {
    id,
    type: 'journey',
    position: { x: 0, y: 0 },
    data: { label: id, type: 'customerStep', stage, tracking: [], creatives: [], annotations: [] }
  };
}

const journey = {
  id: 'journey-test',
  name: 'Test',
  description: '',
  audience: '',
  product: '',
  scope: 'B2C',
  status: 'draft',
  primaryConversion: '',
  owner: '',
  createdAt: '',
  updatedAt: '',
  nodes: [node('a', 'top'), node('b', 'top'), node('c', 'middle'), node('d', 'bottom'), node('e', 'lifecycle')],
  edges: [
    { id: 'ab', source: 'a', target: 'b' },
    { id: 'bc', source: 'b', target: 'c' },
    { id: 'cd', source: 'c', target: 'd' },
    { id: 'de', source: 'd', target: 'e' }
  ],
  planInputs: {},
  crossJourneyLinks: [],
  annotations: [],
  versions: []
} satisfies Journey;

describe('compact journey layout', () => {
  it('places funnel stages in distinct columns with non-overlapping rows', () => {
    const laidOut = compactStageLayout(journey);
    const a = laidOut.nodes.find(item => item.id === 'a')!;
    const b = laidOut.nodes.find(item => item.id === 'b')!;
    const c = laidOut.nodes.find(item => item.id === 'c')!;
    const d = laidOut.nodes.find(item => item.id === 'd')!;
    const e = laidOut.nodes.find(item => item.id === 'e')!;

    expect(a.position.x).toBeLessThan(c.position.x);
    expect(c.position.x).toBeLessThan(d.position.x);
    expect(d.position.x).toBeLessThan(e.position.x);
    expect(Math.abs(b.position.y - a.position.y)).toBeGreaterThanOrEqual(120);
  });

  it('traces both upstream and downstream architecture from a selected node', () => {
    const traced = traceConnectedPath(journey.nodes, journey.edges, 'c');
    expect(traced.activeNodes.size).toBe(5);
    expect(traced.activeEdges.size).toBe(4);
  });
});

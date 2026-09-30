import { describe, expect, it } from 'vitest';
import type { Journey, JourneyNode } from '../types/domain';
import { changeFunnelOrientation, compactStageLayout, traceConnectedPath } from './layout';

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



  it('can rotate the funnel into vertical stage rows and back again', () => {
    const vertical = changeFunnelOrientation(journey, 'vertical');
    const a = vertical.nodes.find(item => item.id === 'a')!;
    const c = vertical.nodes.find(item => item.id === 'c')!;
    const d = vertical.nodes.find(item => item.id === 'd')!;
    const e = vertical.nodes.find(item => item.id === 'e')!;
    expect(vertical.layoutOrientation).toBe('vertical');
    expect(a.position.y).toBeLessThan(c.position.y);
    expect(c.position.y).toBeLessThan(d.position.y);
    expect(d.position.y).toBeLessThan(e.position.y);

    const horizontal = changeFunnelOrientation(vertical, 'horizontal');
    const ah = horizontal.nodes.find(item => item.id === 'a')!;
    const ch = horizontal.nodes.find(item => item.id === 'c')!;
    expect(horizontal.layoutOrientation).toBe('horizontal');
    expect(ah.position.x).toBeLessThan(ch.position.x);
  });

  it('traces both upstream and downstream architecture from a selected node', () => {
    const traced = traceConnectedPath(journey.nodes, journey.edges, 'c');
    expect(traced.activeNodes.size).toBe(5);
    expect(traced.activeEdges.size).toBe(4);
  });
});

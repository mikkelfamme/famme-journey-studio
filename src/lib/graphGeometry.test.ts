import { describe, expect, it } from 'vitest';
import type { JourneyEdge, JourneyNode } from '../types/domain';
import { edgeLaneMap, orthogonalEdgeRoute, orthogonalRouteFromAnchors, sideFromHandle } from './graphGeometry';

function node(id: string, x: number, y: number): JourneyNode {
  return { id, type: 'journey', position: { x, y }, data: { label: id, type: 'customerStep', stage: 'middle', tracking: [], creatives: [], annotations: [] } };
}

describe('orthogonal journey routing', () => {
  it('reads the actual node side from compound handle ids', () => {
    expect(sideFromHandle('target-top-left')).toBe('top');
    expect(sideFromHandle('source-bottom-left')).toBe('bottom');
    expect(sideFromHandle('target-left-top')).toBe('left');
    expect(sideFromHandle('source-right-bottom')).toBe('right');
  });

  it('approaches a top target vertically so the arrow points directly into the node', () => {
    const route = orthogonalRouteFromAnchors(
      { x: 100, y: 120 },
      { x: 300, y: 260 },
      'right',
      'top',
      0
    );
    const beforeTarget = route.points.at(-2)!;
    const target = route.points.at(-1)!;
    expect(beforeTarget.x).toBe(target.x);
    expect(beforeTarget.y).toBeLessThan(target.y);
  });

  it('approaches a left target horizontally so the arrow points directly into the node', () => {
    const route = orthogonalRouteFromAnchors(
      { x: 120, y: 80 },
      { x: 360, y: 220 },
      'bottom',
      'left',
      0
    );
    const beforeTarget = route.points.at(-2)!;
    const target = route.points.at(-1)!;
    expect(beforeTarget.y).toBe(target.y);
    expect(beforeTarget.x).toBeLessThan(target.x);
  });

  it('chooses separate lanes for parallel overlapping corridors when geometry is available', () => {
    const nodes = [node('a', 0, 0), node('b', 0, 140), node('c', 460, 70)];
    const edges: JourneyEdge[] = [
      { id: 'ac', source: 'a', target: 'c', sourceHandle: 'source-right-bottom', targetHandle: 'target-left-top' },
      { id: 'bc', source: 'b', target: 'c', sourceHandle: 'source-right-top', targetHandle: 'target-left-bottom' }
    ];
    const lanes = edgeLaneMap(edges, nodes);
    expect(lanes.size).toBe(2);
    const routeA = orthogonalEdgeRoute(edges[0], nodes[0], nodes[2], lanes.get('ac') ?? 0);
    const routeB = orthogonalEdgeRoute(edges[1], nodes[1], nodes[2], lanes.get('bc') ?? 0);
    expect(routeA.d).not.toBe(routeB.d);
  });
});

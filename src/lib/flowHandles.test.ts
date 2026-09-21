import { describe, expect, it } from 'vitest';
import type { JourneyEdge, JourneyNode } from '../types/domain';
import { normalizeJourneyEdgeHandles, SOURCE_HANDLE_IDS, TARGET_HANDLE_IDS } from './flowHandles';

function node(id: string, x: number, y: number): JourneyNode {
  return { id, type: 'journey', position: { x, y }, data: { label: id, type: 'customerStep', stage: 'middle', tracking: [], creatives: [], annotations: [] } };
}

function edge(id: string, source: string, target: string, sourceHandle?: string, targetHandle?: string): JourneyEdge {
  return { id, source, target, sourceHandle, targetHandle };
}

describe('directional journey handles', () => {
  it('assigns only allowed outgoing and incoming handles', () => {
    const nodes = [node('a', 0, 0), node('b', 420, 20), node('c', 10, 320)];
    const edges = normalizeJourneyEdgeHandles(nodes, [edge('ab', 'a', 'b'), edge('ac', 'a', 'c')]);
    for (const item of edges) {
      expect(SOURCE_HANDLE_IDS).toContain(item.sourceHandle);
      expect(TARGET_HANDLE_IDS).toContain(item.targetHandle);
    }
  });

  it('migrates legacy source-left/top and target-right/bottom handles', () => {
    const nodes = [node('a', 0, 0), node('b', 420, 20)];
    const [item] = normalizeJourneyEdgeHandles(nodes, [edge('ab', 'a', 'b', 'source-left', 'target-right')]);
    expect(SOURCE_HANDLE_IDS).toContain(item.sourceHandle);
    expect(TARGET_HANDLE_IDS).toContain(item.targetHandle);
    expect(item.sourceHandle).not.toBe('source-left');
    expect(item.targetHandle).not.toBe('target-right');
  });

  it('permits split and merge by assigning every edge independently', () => {
    const nodes = [node('a', 0, 100), node('b', 420, 20), node('c', 420, 220), node('d', 840, 100)];
    const edges = normalizeJourneyEdgeHandles(nodes, [
      edge('ab', 'a', 'b'),
      edge('ac', 'a', 'c'),
      edge('bd', 'b', 'd'),
      edge('cd', 'c', 'd')
    ]);
    expect(edges.filter(item => item.source === 'a')).toHaveLength(2);
    expect(edges.filter(item => item.target === 'd')).toHaveLength(2);
  });
});

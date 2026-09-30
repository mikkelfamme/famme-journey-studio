import { describe, expect, it } from 'vitest';
import type { JourneyEdge, JourneyNode } from '../types/domain';
import { ALL_HANDLE_IDS, normalizeJourneyEdgeHandles, redistributeJourneyEdgeHandles } from './flowHandles';

function node(id: string, x: number, y: number): JourneyNode {
  return { id, type: 'journey', position: { x, y }, data: { label: id, type: 'customerStep', stage: 'middle', tracking: [], creatives: [], annotations: [] } };
}

function edge(id: string, source: string, target: string, sourceHandle?: string, targetHandle?: string): JourneyEdge {
  return { id, source, target, sourceHandle, targetHandle };
}

describe('bidirectional journey handles', () => {
  it('assigns valid physical handles to both edge ends', () => {
    const nodes = [node('a', 0, 0), node('b', 420, 20), node('c', 10, 320)];
    const edges = normalizeJourneyEdgeHandles(nodes, [edge('ab', 'a', 'b'), edge('ac', 'a', 'c')]);
    for (const item of edges) {
      expect(ALL_HANDLE_IDS).toContain(item.sourceHandle);
      expect(ALL_HANDLE_IDS).toContain(item.targetHandle);
    }
  });

  it('preserves opposite-role physical handles and migrates generic legacy side handles', () => {
    const nodes = [node('a', 0, 0), node('b', 420, 20)];
    const [manual] = normalizeJourneyEdgeHandles(nodes, [edge('manual', 'a', 'b', 'target-top-left', 'source-bottom-right')]);
    expect(manual.sourceHandle).toBe('target-top-left');
    expect(manual.targetHandle).toBe('source-bottom-right');

    const [legacy] = normalizeJourneyEdgeHandles(nodes, [edge('legacy', 'a', 'b', 'source-left', 'target-right')]);
    expect(ALL_HANDLE_IDS).toContain(legacy.sourceHandle);
    expect(ALL_HANDLE_IDS).toContain(legacy.targetHandle);
    expect(legacy.sourceHandle).not.toBe('source-left');
    expect(legacy.targetHandle).not.toBe('target-right');
  });

  it('allows every historical physical port to act as either source or target', () => {
    const nodes = [node('a', 0, 0), node('b', 420, 20)];
    for (const handle of ALL_HANDLE_IDS) {
      const [asSource] = normalizeJourneyEdgeHandles(nodes, [edge(`s-${handle}`, 'a', 'b', handle, 'target-left-top')]);
      expect(asSource.sourceHandle).toBe(handle);
      const [asTarget] = normalizeJourneyEdgeHandles(nodes, [edge(`t-${handle}`, 'a', 'b', 'source-right-top', handle)]);
      expect(asTarget.targetHandle).toBe(handle);
    }
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

  it('uses distinct physical target ports before reusing one during Tidy/export routing', () => {
    const nodes = [
      node('a', 0, 0), node('b', 0, 120), node('c', 0, 240), node('d', 0, 360), node('target', 480, 220)
    ];
    const edges = redistributeJourneyEdgeHandles(nodes, [
      edge('at', 'a', 'target'), edge('bt', 'b', 'target'), edge('ct', 'c', 'target'), edge('dt', 'd', 'target')
    ]);
    expect(new Set(edges.map(item => item.targetHandle)).size).toBe(4);
  });

});

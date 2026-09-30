import type { Journey, JourneyEdge, JourneyNode, FunnelOrientation, FunnelStage } from '../types/domain';
import { STAGE_NODE_X, STAGE_NODE_Y, STAGE_ORDER } from './stageGeometry';
import { redistributeJourneyEdgeHandles } from './flowHandles';
import { nodeSize } from './graphGeometry';

const STAGES: FunnelStage[] = STAGE_ORDER;
const STAGE_X = STAGE_NODE_X;
const ROW_GAP = 176;
const TOP_OFFSET = 110;

function edgeMaps(edges: JourneyEdge[]) {
  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge.source]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  }
  return { incoming, outgoing };
}

function depthMap(nodes: JourneyNode[], edges: JourneyEdge[]) {
  const depth = new Map(nodes.map(node => [node.id, 0]));
  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    for (const edge of edges) {
      const sourceDepth = depth.get(edge.source) ?? 0;
      const targetDepth = depth.get(edge.target) ?? 0;
      const candidate = Math.min(nodes.length, sourceDepth + 1);
      if (candidate > targetDepth) {
        depth.set(edge.target, candidate);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return depth;
}

export function compactStageLayout(journey: Journey): Journey {
  if (journey.nodes.length === 0) return journey;
  const orientation: FunnelOrientation = journey.layoutOrientation ?? 'horizontal';
  const depth = depthMap(journey.nodes, journey.edges);
  const stageGroups = new Map<FunnelStage, JourneyNode[]>();

  for (const stage of STAGES) {
    const group = journey.nodes
      .filter(node => node.data.stage === stage)
      .sort((a, b) => {
        const primaryDelta = orientation === 'vertical' ? a.position.x - b.position.x : a.position.y - b.position.y;
        if (Math.abs(primaryDelta) > 8) return primaryDelta;
        const depthDelta = (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0);
        if (depthDelta) return depthDelta;
        return a.data.label.localeCompare(b.data.label);
      });
    stageGroups.set(stage, group);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const stage of STAGES) {
    const group = stageGroups.get(stage) ?? [];
    if (orientation === 'horizontal') {
      const firstDesired = group.length ? Math.max(TOP_OFFSET, Math.round(group[0].position.y / 10) * 10) : TOP_OFFSET;
      let cursorY = firstDesired;
      for (const node of group) {
        const size = nodeSize(node);
        const desiredY = Math.max(TOP_OFFSET, Math.round(node.position.y / 10) * 10);
        const y = Math.max(desiredY, cursorY);
        positions.set(node.id, { x: STAGE_X[stage], y });
        cursorY = y + Math.max(size.height, 96) + 70;
      }
    } else {
      const firstDesired = group.length ? Math.max(TOP_OFFSET, Math.round(group[0].position.x / 10) * 10) : TOP_OFFSET;
      let cursorX = firstDesired;
      for (const node of group) {
        const size = nodeSize(node);
        const desiredX = Math.max(TOP_OFFSET, Math.round(node.position.x / 10) * 10);
        const x = Math.max(desiredX, cursorX);
        positions.set(node.id, { x, y: STAGE_NODE_Y[stage] });
        cursorX = x + Math.max(size.width, 138) + 70;
      }
    }
  }

  const nextNodes = journey.nodes.map(node => ({ ...node, position: positions.get(node.id) ?? node.position }));
  const nextEdges = redistributeJourneyEdgeHandles(nextNodes, journey.edges);
  return { ...journey, nodes: nextNodes, edges: nextEdges };
}

export function changeFunnelOrientation(journey: Journey, orientation: FunnelOrientation): Journey {
  const current: FunnelOrientation = journey.layoutOrientation ?? 'horizontal';
  if (current === orientation) return journey;
  const groups = new Map<FunnelStage, JourneyNode[]>();
  for (const stage of STAGES) groups.set(stage, journey.nodes.filter(node => node.data.stage === stage));
  const nextNodes = journey.nodes.map(node => {
    const group = groups.get(node.data.stage) ?? [];
    if (orientation === 'vertical') {
      const minY = group.length ? Math.min(...group.map(n => n.position.y)) : node.position.y;
      return { ...node, position: { x: TOP_OFFSET + Math.max(0, node.position.y - minY), y: STAGE_NODE_Y[node.data.stage] } };
    }
    const minX = group.length ? Math.min(...group.map(n => n.position.x)) : node.position.x;
    return { ...node, position: { x: STAGE_NODE_X[node.data.stage], y: TOP_OFFSET + Math.max(0, node.position.x - minX) } };
  });
  const next: Journey = { ...journey, layoutOrientation: orientation, nodes: nextNodes };
  return compactStageLayout({ ...next, edges: redistributeJourneyEdgeHandles(nextNodes, journey.edges) });
}

export function traceConnectedPath(nodes: JourneyNode[], edges: JourneyEdge[], startId: string) {
  const nodeIds = new Set(nodes.map(node => node.id));
  const activeNodes = new Set<string>([startId]);
  const activeEdges = new Set<string>();
  const forward = new Map<string, JourneyEdge[]>();
  const backward = new Map<string, JourneyEdge[]>();

  for (const edge of edges) {
    forward.set(edge.source, [...(forward.get(edge.source) ?? []), edge]);
    backward.set(edge.target, [...(backward.get(edge.target) ?? []), edge]);
  }

  const visit = (seed: string, map: Map<string, JourneyEdge[]>, direction: 'forward' | 'backward') => {
    const queue = [seed];
    const seen = new Set<string>([seed]);
    while (queue.length) {
      const current = queue.shift()!;
      for (const edge of map.get(current) ?? []) {
        const next = direction === 'forward' ? edge.target : edge.source;
        if (!nodeIds.has(next)) continue;
        activeEdges.add(edge.id);
        activeNodes.add(next);
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
  };

  visit(startId, forward, 'forward');
  visit(startId, backward, 'backward');
  return { activeNodes, activeEdges };
}

import type { Journey, JourneyEdge, JourneyNode, FunnelStage } from '../types/domain';

const STAGES: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];
const STAGE_X: Record<FunnelStage, number> = { top: 80, middle: 380, bottom: 680, lifecycle: 980 };
const ROW_GAP = 136;
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
  const depth = depthMap(journey.nodes, journey.edges);
  const { incoming } = edgeMaps(journey.edges);
  const nodeById = new Map(journey.nodes.map(node => [node.id, node]));
  const stageGroups = new Map<FunnelStage, JourneyNode[]>();

  for (const stage of STAGES) {
    stageGroups.set(stage, journey.nodes.filter(node => node.data.stage === stage));
  }

  const positions = new Map<string, { x: number; y: number }>();
  const maxRows = Math.max(1, ...STAGES.map(stage => stageGroups.get(stage)?.length ?? 0));

  for (const stage of STAGES) {
    const group = [...(stageGroups.get(stage) ?? [])];
    group.sort((a, b) => {
      const aParents = incoming.get(a.id) ?? [];
      const bParents = incoming.get(b.id) ?? [];
      const parentScore = (parents: string[]) => {
        if (!parents.length) return Number.POSITIVE_INFINITY;
        const ys = parents.map(id => positions.get(id)?.y).filter((value): value is number => typeof value === 'number');
        return ys.length ? ys.reduce((sum, value) => sum + value, 0) / ys.length : Number.POSITIVE_INFINITY;
      };
      const aParent = parentScore(aParents);
      const bParent = parentScore(bParents);
      if (aParent !== bParent) return aParent - bParent;
      const depthDelta = (depth.get(a.id) ?? 0) - (depth.get(b.id) ?? 0);
      if (depthDelta) return depthDelta;
      const yDelta = a.position.y - b.position.y;
      if (Math.abs(yDelta) > 1) return yDelta;
      return a.data.label.localeCompare(b.data.label);
    });

    const offset = TOP_OFFSET + Math.max(0, (maxRows - group.length) * ROW_GAP * 0.28);
    let previousY = Number.NEGATIVE_INFINITY;
    group.forEach((node, index) => {
      const relatedParents = (incoming.get(node.id) ?? []).map(id => positions.get(id)?.y).filter((value): value is number => typeof value === 'number');
      const naturalY = offset + index * ROW_GAP;
      const parentY = relatedParents.length ? relatedParents.reduce((sum, value) => sum + value, 0) / relatedParents.length : naturalY;
      const blendedY = relatedParents.length ? naturalY * 0.7 + parentY * 0.3 : naturalY;
      const spacedY = index === 0 ? blendedY : Math.max(blendedY, previousY + ROW_GAP);
      const y = Math.round(spacedY / 10) * 10;
      previousY = y;
      positions.set(node.id, { x: STAGE_X[stage], y });
    });
  }

  const nextNodes = journey.nodes.map(node => ({ ...node, position: positions.get(node.id) ?? node.position }));
  return { ...journey, nodes: nextNodes };
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

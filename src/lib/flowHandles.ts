import type { JourneyEdge, JourneyNode } from '../types/domain';

/**
 * Journey Studio connection grammar (RC12.8+)
 *
 * Incoming connections:
 * - 3 ports on the top
 * - 2 ports on the left
 *
 * Outgoing connections:
 * - 3 ports on the bottom
 * - 2 ports on the right
 *
 * A port may be used by more than one edge. That makes fan-out (1 -> many)
 * and fan-in (many -> 1) possible without introducing artificial journey nodes.
 */
export const TARGET_HANDLE_IDS = [
  'target-top-left',
  'target-top',
  'target-top-right',
  'target-left-top',
  'target-left-bottom'
] as const;

export const SOURCE_HANDLE_IDS = [
  'source-bottom-left',
  'source-bottom',
  'source-bottom-right',
  'source-right-top',
  'source-right-bottom'
] as const;

const targetHandles = new Set<string>(TARGET_HANDLE_IDS);
const sourceHandles = new Set<string>(SOURCE_HANDLE_IDS);

const NODE_W = 226;
const NODE_H = 88;

function center(node: JourneyNode) {
  return { x: node.position.x + NODE_W / 2, y: node.position.y + NODE_H / 2 };
}

function nearestSourceHandle(source: JourneyNode, target: JourneyNode) {
  const s = center(source);
  const t = center(target);
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.8;

  if (horizontal) return dy < 0 ? 'source-right-top' : 'source-right-bottom';
  if (dx < -NODE_W * 0.16) return 'source-bottom-left';
  if (dx > NODE_W * 0.16) return 'source-bottom-right';
  return 'source-bottom';
}

function nearestTargetHandle(source: JourneyNode, target: JourneyNode) {
  const s = center(source);
  const t = center(target);
  const dx = s.x - t.x;
  const dy = s.y - t.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.8;

  if (horizontal) return dy < 0 ? 'target-left-top' : 'target-left-bottom';
  if (dx < -NODE_W * 0.16) return 'target-top-left';
  if (dx > NODE_W * 0.16) return 'target-top-right';
  return 'target-top';
}

function normalizeLegacySourceHandle(handle: string | null | undefined, source: JourneyNode, target: JourneyNode) {
  if (handle && sourceHandles.has(handle)) return handle;

  // RC12.7 and earlier exposed source handles on all four sides. Preserve old
  // journey files by translating them into the new directional grammar.
  if (handle === 'source-right') return center(target).y < center(source).y ? 'source-right-top' : 'source-right-bottom';
  if (handle === 'source-bottom') return nearestSourceHandle(source, target).startsWith('source-bottom') ? nearestSourceHandle(source, target) : 'source-bottom';
  if (handle === 'source-left' || handle === 'source-top') return nearestSourceHandle(source, target);

  return nearestSourceHandle(source, target);
}

function normalizeLegacyTargetHandle(handle: string | null | undefined, source: JourneyNode, target: JourneyNode) {
  if (handle && targetHandles.has(handle)) return handle;

  if (handle === 'target-left') return center(source).y < center(target).y ? 'target-left-top' : 'target-left-bottom';
  if (handle === 'target-top') return nearestTargetHandle(source, target).startsWith('target-top') ? nearestTargetHandle(source, target) : 'target-top';
  if (handle === 'target-right' || handle === 'target-bottom') return nearestTargetHandle(source, target);

  return nearestTargetHandle(source, target);
}

export function normalizeJourneyEdgeHandles(nodes: JourneyNode[], edges: JourneyEdge[]): JourneyEdge[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return edges.map(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return edge;
    return {
      ...edge,
      sourceHandle: normalizeLegacySourceHandle(edge.sourceHandle, source, target),
      targetHandle: normalizeLegacyTargetHandle(edge.targetHandle, source, target)
    };
  });
}

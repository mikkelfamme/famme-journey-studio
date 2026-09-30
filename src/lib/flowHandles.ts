import type { JourneyEdge, JourneyNode } from '../types/domain';
import { nodeCenter, nodeSize } from './graphGeometry';

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

function center(node: JourneyNode) { return nodeCenter(node); }

function nearestSourceHandle(source: JourneyNode, target: JourneyNode) {
  const s = center(source);
  const t = center(target);
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.8;

  if (horizontal) return dy < 0 ? 'source-right-top' : 'source-right-bottom';
  if (dx < -nodeSize(source).width * 0.16) return 'source-bottom-left';
  if (dx > nodeSize(source).width * 0.16) return 'source-bottom-right';
  return 'source-bottom';
}

function nearestTargetHandle(source: JourneyNode, target: JourneyNode) {
  const s = center(source);
  const t = center(target);
  const dx = s.x - t.x;
  const dy = s.y - t.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy) * 0.8;

  if (horizontal) return dy < 0 ? 'target-left-top' : 'target-left-bottom';
  if (dx < -nodeSize(target).width * 0.16) return 'target-top-left';
  if (dx > nodeSize(target).width * 0.16) return 'target-top-right';
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

/**
 * Reassign handles after an automatic tidy operation so sibling routes do not
 * all leave/enter through the same port. Manual layouts keep their saved ports;
 * this function is intentionally only used by Tidy.
 */
export function redistributeJourneyEdgeHandles(nodes: JourneyNode[], edges: JourneyEdge[]): JourneyEdge[] {
  const normalized = normalizeJourneyEdgeHandles(nodes, edges);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const next = normalized.map(edge => ({ ...edge }));

  const outgoing = new Map<string, JourneyEdge[]>();
  const incoming = new Map<string, JourneyEdge[]>();
  for (const edge of next) {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
  }

  for (const [sourceId, group] of outgoing) {
    const source = nodeMap.get(sourceId); if (!source) continue;
    const s = center(source);
    const ordered = [...group].sort((a, b) => (center(nodeMap.get(a.target) ?? source).y - center(nodeMap.get(b.target) ?? source).y));
    const mostlyRight = ordered.filter(edge => center(nodeMap.get(edge.target) ?? source).x >= s.x).length >= Math.ceil(ordered.length / 2);
    ordered.forEach((edge, index) => {
      if (mostlyRight) edge.sourceHandle = index % 2 === 0 ? 'source-right-top' : 'source-right-bottom';
      else edge.sourceHandle = ['source-bottom-left','source-bottom','source-bottom-right'][index % 3];
    });
  }

  for (const [targetId, group] of incoming) {
    const target = nodeMap.get(targetId); if (!target) continue;
    const t = center(target);
    const ordered = [...group].sort((a, b) => (center(nodeMap.get(a.source) ?? target).y - center(nodeMap.get(b.source) ?? target).y));
    const mostlyLeft = ordered.filter(edge => center(nodeMap.get(edge.source) ?? target).x <= t.x).length >= Math.ceil(ordered.length / 2);
    ordered.forEach((edge, index) => {
      if (mostlyLeft) edge.targetHandle = index % 2 === 0 ? 'target-left-top' : 'target-left-bottom';
      else edge.targetHandle = ['target-top-left','target-top','target-top-right'][index % 3];
    });
  }
  return next;
}

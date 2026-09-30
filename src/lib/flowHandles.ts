import type { JourneyEdge, JourneyNode } from '../types/domain';
import { nodeAnchor, nodeCenter, nodeSize, sideFromHandle, type FlowSide } from './graphGeometry';

/**
 * Journey Studio connection grammar (RC12.14+)
 *
 * Every visible connection point is bidirectional:
 * - 3 ports on top
 * - 2 ports on left
 * - 3 ports on bottom
 * - 2 ports on right
 *
 * The historical target-/source-prefixed IDs are intentionally retained so old
 * .fjs/.jsjourney/.jstemplate files keep working. In the editor,
 * ConnectionMode.Loose lets every one of these physical ports both start and
 * receive a connection. A port may also carry multiple edges for split/merge.
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

export const ALL_HANDLE_IDS = [...TARGET_HANDLE_IDS, ...SOURCE_HANDLE_IDS] as const;
const allHandles = new Set<string>(ALL_HANDLE_IDS);

function center(node: JourneyNode) { return nodeCenter(node); }

function handleSide(handle: string): FlowSide {
  return sideFromHandle(handle) ?? 'right';
}

function distanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function facingSide(node: JourneyNode, other: JourneyNode): FlowSide {
  const here = center(node);
  const there = center(other);
  const dx = there.x - here.x;
  const dy = there.y - here.y;
  if (Math.abs(dx) >= Math.abs(dy) * 0.8) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

function nearestHandle(node: JourneyNode, other: JourneyNode) {
  const otherCenter = center(other);
  const preferredSide = facingSide(node, other);
  return [...ALL_HANDLE_IDS].sort((a, b) => {
    const sidePenaltyA = handleSide(a) === preferredSide ? 0 : 1;
    const sidePenaltyB = handleSide(b) === preferredSide ? 0 : 1;
    if (sidePenaltyA !== sidePenaltyB) return sidePenaltyA - sidePenaltyB;
    const anchorA = nodeAnchor(node, handleSide(a), a);
    const anchorB = nodeAnchor(node, handleSide(b), b);
    return distanceSquared(anchorA, otherCenter) - distanceSquared(anchorB, otherCenter);
  })[0];
}

function normalizeLegacyHandle(handle: string | null | undefined, node: JourneyNode, other: JourneyNode) {
  // RC12.14 accepts all ten historical physical ports for either end of an edge.
  if (handle && allHandles.has(handle)) return handle;

  // Very old files used one generic handle per side. Translate those to the
  // nearest current physical port on the requested side when possible.
  const requestedSide: FlowSide | null = handle?.includes('top') ? 'top'
    : handle?.includes('bottom') ? 'bottom'
    : handle?.includes('left') ? 'left'
    : handle?.includes('right') ? 'right'
    : null;

  if (requestedSide) {
    const candidates = ALL_HANDLE_IDS.filter(id => handleSide(id) === requestedSide);
    const otherCenter = center(other);
    return [...candidates].sort((a, b) => {
      const anchorA = nodeAnchor(node, requestedSide, a);
      const anchorB = nodeAnchor(node, requestedSide, b);
      return distanceSquared(anchorA, otherCenter) - distanceSquared(anchorB, otherCenter);
    })[0] ?? nearestHandle(node, other);
  }

  return nearestHandle(node, other);
}

export function normalizeJourneyEdgeHandles(nodes: JourneyNode[], edges: JourneyEdge[]): JourneyEdge[] {
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  return edges.map(edge => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) return edge;
    return {
      ...edge,
      sourceHandle: normalizeLegacyHandle(edge.sourceHandle, source, target),
      targetHandle: normalizeLegacyHandle(edge.targetHandle, target, source)
    };
  });
}

function chooseHandle(node: JourneyNode, other: JourneyNode, usage: Map<string, number>) {
  const preferredSide = facingSide(node, other);
  const otherCenter = center(other);
  return [...ALL_HANDLE_IDS].sort((a, b) => {
    const useA = usage.get(a) ?? 0;
    const useB = usage.get(b) ?? 0;
    // Prefer unused physical ports before reusing one, so parallel routes get
    // visually separate entry/exit points during Tidy and static export.
    if (useA !== useB) return useA - useB;
    const sidePenaltyA = handleSide(a) === preferredSide ? 0 : 1;
    const sidePenaltyB = handleSide(b) === preferredSide ? 0 : 1;
    if (sidePenaltyA !== sidePenaltyB) return sidePenaltyA - sidePenaltyB;
    const anchorA = nodeAnchor(node, handleSide(a), a);
    const anchorB = nodeAnchor(node, handleSide(b), b);
    return distanceSquared(anchorA, otherCenter) - distanceSquared(anchorB, otherCenter);
  })[0];
}

/**
 * Reassign handles after automatic layout/static export to spread sibling
 * routes over the ten available physical ports. Because every port is now
 * bidirectional, both source and target endpoints may use any side.
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
    const source = nodeMap.get(sourceId);
    if (!source) continue;
    const usage = new Map<string, number>();
    const ordered = [...group].sort((a, b) => {
      const aTarget = nodeMap.get(a.target);
      const bTarget = nodeMap.get(b.target);
      if (!aTarget || !bTarget) return a.id.localeCompare(b.id);
      return center(aTarget).y - center(bTarget).y || center(aTarget).x - center(bTarget).x || a.id.localeCompare(b.id);
    });
    for (const edge of ordered) {
      const target = nodeMap.get(edge.target);
      if (!target) continue;
      const handle = chooseHandle(source, target, usage);
      edge.sourceHandle = handle;
      usage.set(handle, (usage.get(handle) ?? 0) + 1);
    }
  }

  for (const [targetId, group] of incoming) {
    const target = nodeMap.get(targetId);
    if (!target) continue;
    const usage = new Map<string, number>();
    const ordered = [...group].sort((a, b) => {
      const aSource = nodeMap.get(a.source);
      const bSource = nodeMap.get(b.source);
      if (!aSource || !bSource) return a.id.localeCompare(b.id);
      return center(aSource).y - center(bSource).y || center(aSource).x - center(bSource).x || a.id.localeCompare(b.id);
    });
    for (const edge of ordered) {
      const source = nodeMap.get(edge.source);
      if (!source) continue;
      const handle = chooseHandle(target, source, usage);
      edge.targetHandle = handle;
      usage.set(handle, (usage.get(handle) ?? 0) + 1);
    }
  }
  return next;
}

import type { JourneyEdge, JourneyNode } from '../types/domain';
import { nodeAnchor, nodeCenter, nodeSize, type FlowSide } from './graphGeometry';

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

function sourceHandleSide(handle: string): FlowSide {
  return handle.includes('right') ? 'right' : 'bottom';
}

function targetHandleSide(handle: string): FlowSide {
  return handle.includes('left') ? 'left' : 'top';
}

function distanceSquared(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function chooseSourceHandle(source: JourneyNode, target: JourneyNode, usage: Map<string, number>) {
  const sourceBounds = nodeSize(source);
  const targetCenter = center(target);
  const preferredSide: FlowSide = targetCenter.x >= source.position.x + sourceBounds.width * 0.7 ? 'right' : 'bottom';
  return [...SOURCE_HANDLE_IDS].sort((a, b) => {
    const useA = usage.get(a) ?? 0;
    const useB = usage.get(b) ?? 0;
    if (useA !== useB) return useA - useB;
    const sidePenaltyA = sourceHandleSide(a) === preferredSide ? 0 : 1;
    const sidePenaltyB = sourceHandleSide(b) === preferredSide ? 0 : 1;
    if (sidePenaltyA !== sidePenaltyB) return sidePenaltyA - sidePenaltyB;
    const anchorA = nodeAnchor(source, sourceHandleSide(a), a);
    const anchorB = nodeAnchor(source, sourceHandleSide(b), b);
    return distanceSquared(anchorA, targetCenter) - distanceSquared(anchorB, targetCenter);
  })[0];
}

function chooseTargetHandle(source: JourneyNode, target: JourneyNode, usage: Map<string, number>) {
  const sourceCenter = center(source);
  const targetBounds = nodeSize(target);
  const sourceClearlyAbove = sourceCenter.y < target.position.y - 18;
  const preferredSide: FlowSide = sourceClearlyAbove ? 'top' : 'left';
  return [...TARGET_HANDLE_IDS].sort((a, b) => {
    const useA = usage.get(a) ?? 0;
    const useB = usage.get(b) ?? 0;
    if (useA !== useB) return useA - useB;
    const sidePenaltyA = targetHandleSide(a) === preferredSide ? 0 : 1;
    const sidePenaltyB = targetHandleSide(b) === preferredSide ? 0 : 1;
    if (sidePenaltyA !== sidePenaltyB) return sidePenaltyA - sidePenaltyB;
    const anchorA = nodeAnchor(target, targetHandleSide(a), a);
    const anchorB = nodeAnchor(target, targetHandleSide(b), b);
    const verticalPenaltyA = sourceCenter.y > target.position.y + targetBounds.height && targetHandleSide(a) === 'top' ? 25000 : 0;
    const verticalPenaltyB = sourceCenter.y > target.position.y + targetBounds.height && targetHandleSide(b) === 'top' ? 25000 : 0;
    return distanceSquared(anchorA, sourceCenter) + verticalPenaltyA - distanceSquared(anchorB, sourceCenter) - verticalPenaltyB;
  })[0];
}

/**
 * Reassign handles after an automatic tidy operation so sibling routes do not
 * all leave/enter through the same port. Manual layouts keep their saved ports;
 * this function is intentionally used by Tidy and by static exports where
 * overlapping arrows are more damaging than preserving a duplicated port.
 *
 * RC12.12 uses all five available ports before reusing one. Ports are selected
 * by geometric proximity, so an upper-left source naturally favours a top port
 * while a source level with the target favours a left port.
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
      const handle = chooseSourceHandle(source, target, usage);
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
      const handle = chooseTargetHandle(source, target, usage);
      edge.targetHandle = handle;
      usage.set(handle, (usage.get(handle) ?? 0) + 1);
    }
  }
  return next;
}

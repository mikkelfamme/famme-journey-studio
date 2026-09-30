import type { JourneyEdge, JourneyNode } from '../types/domain';

export type FlowSide = 'left' | 'right' | 'top' | 'bottom';

export const STANDARD_NODE_W = 252;
export const STANDARD_NODE_H = 96;
export const TRACKING_POINT_W = 138;
export const TRACKING_POINT_H = 48;

export function nodeSize(node: JourneyNode) {
  const fallback = node.data.type === 'trackingPoint'
    ? { width: TRACKING_POINT_W, height: TRACKING_POINT_H }
    : { width: STANDARD_NODE_W, height: STANDARD_NODE_H };
  const measured = node.measured;
  return {
    width: measured?.width && measured.width > 0 ? measured.width : fallback.width,
    height: measured?.height && measured.height > 0 ? measured.height : fallback.height
  };
}

export function nodeCenter(node: JourneyNode) {
  const size = nodeSize(node);
  return { x: node.position.x + size.width / 2, y: node.position.y + size.height / 2 };
}

export function sideFromHandle(handle?: string | null): FlowSide | null {
  if (!handle) return null;
  if (handle.includes('left')) return 'left';
  if (handle.includes('right')) return 'right';
  if (handle.includes('top')) return 'top';
  if (handle.includes('bottom')) return 'bottom';
  return null;
}

export function inferSides(source: JourneyNode, target: JourneyNode): [FlowSide, FlowSide] {
  const s = nodeCenter(source);
  const t = nodeCenter(target);
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  if (Math.abs(dx) >= Math.abs(dy) * 0.8) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

export function nodeAnchor(node: JourneyNode, side: FlowSide, handle?: string | null) {
  const { width, height } = nodeSize(node);
  if (handle === 'target-top-left' || handle === 'source-bottom-left') return { x: node.position.x + width * 0.25, y: side === 'top' ? node.position.y : node.position.y + height };
  if (handle === 'target-top-right' || handle === 'source-bottom-right') return { x: node.position.x + width * 0.75, y: side === 'top' ? node.position.y : node.position.y + height };
  if (handle === 'target-top' || handle === 'source-bottom') return { x: node.position.x + width * 0.5, y: side === 'top' ? node.position.y : node.position.y + height };
  if (handle === 'target-left-top' || handle === 'source-right-top') return { x: side === 'left' ? node.position.x : node.position.x + width, y: node.position.y + height * 0.35 };
  if (handle === 'target-left-bottom' || handle === 'source-right-bottom') return { x: side === 'left' ? node.position.x : node.position.x + width, y: node.position.y + height * 0.65 };
  switch (side) {
    case 'left': return { x: node.position.x, y: node.position.y + height * 0.5 };
    case 'right': return { x: node.position.x + width, y: node.position.y + height * 0.5 };
    case 'top': return { x: node.position.x + width * 0.5, y: node.position.y };
    case 'bottom': return { x: node.position.x + width * 0.5, y: node.position.y + height };
  }
}

export interface OrthogonalRoute {
  d: string;
  mx: number;
  my: number;
}

export function edgeLaneMap(edges: JourneyEdge[]) {
  const result = new Map<string, number>();
  const sourceGroups = new Map<string, JourneyEdge[]>();
  for (const edge of edges) {
    const key = `${edge.source}:${edge.sourceHandle ?? ''}`;
    sourceGroups.set(key, [...(sourceGroups.get(key) ?? []), edge]);
  }
  for (const group of sourceGroups.values()) {
    const ordered = [...group].sort((a, b) => `${a.target}:${a.targetHandle ?? ''}`.localeCompare(`${b.target}:${b.targetHandle ?? ''}`));
    const center = (ordered.length - 1) / 2;
    ordered.forEach((edge, index) => result.set(edge.id, index - center));
  }
  return result;
}

export function orthogonalEdgeRoute(edge: JourneyEdge, source: JourneyNode, target: JourneyNode, lane = 0): OrthogonalRoute {
  const inferred = inferSides(source, target);
  const sourceSide = sideFromHandle(edge.sourceHandle) ?? inferred[0];
  const targetSide = sideFromHandle(edge.targetHandle) ?? inferred[1];
  const s = nodeAnchor(source, sourceSide, edge.sourceHandle);
  const t = nodeAnchor(target, targetSide, edge.targetHandle);
  const horizontalSource = sourceSide === 'left' || sourceSide === 'right';
  const horizontalTarget = targetSide === 'left' || targetSide === 'right';
  const laneOffset = lane * 18;

  if (horizontalSource && horizontalTarget) {
    const midX = (s.x + t.x) / 2 + laneOffset;
    return { d: `M ${s.x} ${s.y} L ${midX} ${s.y} L ${midX} ${t.y} L ${t.x} ${t.y}`, mx: midX, my: (s.y + t.y) / 2 };
  }
  if (!horizontalSource && !horizontalTarget) {
    const midY = (s.y + t.y) / 2 + laneOffset;
    return { d: `M ${s.x} ${s.y} L ${s.x} ${midY} L ${t.x} ${midY} L ${t.x} ${t.y}`, mx: (s.x + t.x) / 2, my: midY };
  }

  if (horizontalSource) {
    const elbowX = t.x + laneOffset;
    return { d: `M ${s.x} ${s.y} L ${elbowX} ${s.y} L ${elbowX} ${t.y} L ${t.x} ${t.y}`, mx: elbowX, my: s.y };
  }
  const elbowY = t.y + laneOffset;
  return { d: `M ${s.x} ${s.y} L ${s.x} ${elbowY} L ${t.x} ${elbowY} L ${t.x} ${t.y}`, mx: s.x, my: elbowY };
}

export function areNodesAdjacent(source: JourneyNode, target: JourneyNode, threshold = 30) {
  const s = nodeSize(source);
  const t = nodeSize(target);
  const sx2 = source.position.x + s.width;
  const sy2 = source.position.y + s.height;
  const tx2 = target.position.x + t.width;
  const ty2 = target.position.y + t.height;
  const overlapY = Math.min(sy2, ty2) - Math.max(source.position.y, target.position.y);
  const overlapX = Math.min(sx2, tx2) - Math.max(source.position.x, target.position.x);
  const horizontalGap = Math.min(Math.abs(target.position.x - sx2), Math.abs(source.position.x - tx2));
  const verticalGap = Math.min(Math.abs(target.position.y - sy2), Math.abs(source.position.y - ty2));
  return (overlapY > 12 && horizontalGap <= threshold) || (overlapX > 12 && verticalGap <= threshold);
}

export function journeyBounds(nodes: JourneyNode[], padX = 90, padTop = 72, padBottom = 72) {
  if (!nodes.length) return { x: 0, y: 0, width: 1200, height: 520, minX: 0, minY: 0, maxX: 1200, maxY: 520 };
  const minX = Math.min(...nodes.map(node => node.position.x));
  const minY = Math.min(...nodes.map(node => node.position.y));
  const maxX = Math.max(...nodes.map(node => node.position.x + nodeSize(node).width));
  const maxY = Math.max(...nodes.map(node => node.position.y + nodeSize(node).height));
  return {
    x: minX - padX,
    y: minY - padTop,
    width: Math.max(980, maxX - minX + padX * 2),
    height: Math.max(430, maxY - minY + padTop + padBottom),
    minX: minX - padX,
    minY: minY - padTop,
    maxX: maxX + padX,
    maxY: maxY + padBottom
  };
}

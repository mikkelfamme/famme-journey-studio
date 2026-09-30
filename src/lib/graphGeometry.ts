import type { JourneyEdge, JourneyNode } from '../types/domain';

export type FlowSide = 'left' | 'right' | 'top' | 'bottom';

export const STANDARD_NODE_W = 252;
export const STANDARD_NODE_H = 96;
export const TRACKING_POINT_W = 138;
export const TRACKING_POINT_H = 48;
const ROUTE_STUB = 24;
const ROUTE_LANE_GAP = 18;
const ROUTE_MIN_PARALLEL_GAP = 10;

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
  // Handle ids contain both a side and a position qualifier (for example
  // target-top-left). The first side after target/source is the actual node
  // edge; the trailing word only describes where along that edge the port sits.
  if (handle.startsWith('target-top') || handle.startsWith('source-top')) return 'top';
  if (handle.startsWith('target-left') || handle.startsWith('source-left')) return 'left';
  if (handle.startsWith('target-right') || handle.startsWith('source-right')) return 'right';
  if (handle.startsWith('target-bottom') || handle.startsWith('source-bottom')) return 'bottom';
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

export interface RoutePoint { x: number; y: number }

export interface OrthogonalRoute {
  d: string;
  mx: number;
  my: number;
  points: RoutePoint[];
}

function outwardVector(side: FlowSide) {
  switch (side) {
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
  }
}

function samePoint(a: RoutePoint, b: RoutePoint) {
  return Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
}

function compressRoutePoints(points: RoutePoint[]) {
  const compact: RoutePoint[] = [];
  for (const point of points) {
    if (!compact.length || !samePoint(compact[compact.length - 1], point)) compact.push(point);
  }
  let index = 1;
  while (index < compact.length - 1) {
    const a = compact[index - 1];
    const b = compact[index];
    const c = compact[index + 1];
    const collinear = (Math.abs(a.x - b.x) < 0.01 && Math.abs(b.x - c.x) < 0.01)
      || (Math.abs(a.y - b.y) < 0.01 && Math.abs(b.y - c.y) < 0.01);
    const between = b.x >= Math.min(a.x, c.x) - 0.01 && b.x <= Math.max(a.x, c.x) + 0.01
      && b.y >= Math.min(a.y, c.y) - 0.01 && b.y <= Math.max(a.y, c.y) + 0.01;
    if (collinear && between) compact.splice(index, 1);
    else index += 1;
  }
  return compact;
}

function routeLabelPoint(points: RoutePoint[]) {
  let best = { length: -1, x: points[0]?.x ?? 0, y: points[0]?.y ?? 0 };
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const length = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (length > best.length) best = { length, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  return { x: best.x, y: best.y };
}

/**
 * Build an orthogonal route that respects both endpoint directions.
 * The first segment always leaves the source in the source-handle direction,
 * and the final segment always approaches the target perpendicular to the
 * target edge. This is especially important for mixed right->top and
 * bottom->left connections, where the old renderer could draw an arrowhead
 * sideways across a top port (or vertically across a left port).
 */
export function orthogonalRouteFromAnchors(
  source: RoutePoint,
  target: RoutePoint,
  sourceSide: FlowSide,
  targetSide: FlowSide,
  lane = 0
): OrthogonalRoute {
  const sourceVector = outwardVector(sourceSide);
  const targetVector = outwardVector(targetSide);
  const sourceStub = { x: source.x + sourceVector.x * ROUTE_STUB, y: source.y + sourceVector.y * ROUTE_STUB };
  const targetStub = { x: target.x + targetVector.x * ROUTE_STUB, y: target.y + targetVector.y * ROUTE_STUB };
  const laneOffset = lane * ROUTE_LANE_GAP;
  const sourceHorizontal = sourceSide === 'left' || sourceSide === 'right';
  const targetHorizontal = targetSide === 'left' || targetSide === 'right';
  let raw: RoutePoint[];

  if (sourceHorizontal && targetHorizontal) {
    const midX = (sourceStub.x + targetStub.x) / 2 + laneOffset;
    raw = [source, sourceStub, { x: midX, y: sourceStub.y }, { x: midX, y: targetStub.y }, targetStub, target];
  } else if (!sourceHorizontal && !targetHorizontal) {
    const midY = (sourceStub.y + targetStub.y) / 2 + laneOffset;
    raw = [source, sourceStub, { x: sourceStub.x, y: midY }, { x: targetStub.x, y: midY }, targetStub, target];
  } else if (sourceHorizontal) {
    // Mixed horizontal -> vertical. Keep the final segment vertical so a top
    // target receives a downward-pointing arrow directly into the component.
    const corridorX = targetStub.x + laneOffset;
    raw = [source, sourceStub, { x: corridorX, y: sourceStub.y }, { x: corridorX, y: targetStub.y }, targetStub, target];
  } else {
    // Mixed vertical -> horizontal. Keep the final segment horizontal so a
    // left target receives a right-pointing arrow directly into the component.
    const corridorY = targetStub.y + laneOffset;
    raw = [source, sourceStub, { x: sourceStub.x, y: corridorY }, { x: targetStub.x, y: corridorY }, targetStub, target];
  }

  const points = compressRoutePoints(raw);
  const label = routeLabelPoint(points);
  return {
    d: points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '),
    mx: label.x,
    my: label.y,
    points
  };
}

function routeSegments(route: OrthogonalRoute) {
  return route.points.slice(0, -1).map((a, index) => ({ a, b: route.points[index + 1] }));
}

function overlapLength(a1: number, a2: number, b1: number, b2: number) {
  return Math.max(0, Math.min(Math.max(a1, a2), Math.max(b1, b2)) - Math.max(Math.min(a1, a2), Math.min(b1, b2)));
}

/**
 * Penalise overlapping or near-overlapping parallel route segments. Crossings
 * are deliberately not penalised: a clean crossing is easier to read than two
 * paths rendered directly on top of one another.
 */
function parallelOverlapScore(route: OrthogonalRoute, used: OrthogonalRoute[]) {
  let score = 0;
  const nextSegments = routeSegments(route);
  for (const next of nextSegments) {
    const nextHorizontal = Math.abs(next.a.y - next.b.y) < 0.01;
    const nextVertical = Math.abs(next.a.x - next.b.x) < 0.01;
    if (!nextHorizontal && !nextVertical) continue;
    for (const previousRoute of used) {
      for (const previous of routeSegments(previousRoute)) {
        if (nextHorizontal && Math.abs(previous.a.y - previous.b.y) < 0.01) {
          const overlap = overlapLength(next.a.x, next.b.x, previous.a.x, previous.b.x);
          if (!overlap) continue;
          const gap = Math.abs(next.a.y - previous.a.y);
          if (gap < 0.5) score += overlap * 100;
          else if (gap < ROUTE_MIN_PARALLEL_GAP) score += overlap * (ROUTE_MIN_PARALLEL_GAP - gap) * 3;
        }
        if (nextVertical && Math.abs(previous.a.x - previous.b.x) < 0.01) {
          const overlap = overlapLength(next.a.y, next.b.y, previous.a.y, previous.b.y);
          if (!overlap) continue;
          const gap = Math.abs(next.a.x - previous.a.x);
          if (gap < 0.5) score += overlap * 100;
          else if (gap < ROUTE_MIN_PARALLEL_GAP) score += overlap * (ROUTE_MIN_PARALLEL_GAP - gap) * 3;
        }
      }
    }
  }
  return score;
}

function fallbackLaneMap(edges: JourneyEdge[]) {
  const result = new Map<string, number>();
  const sourceGroups = new Map<string, JourneyEdge[]>();
  const targetGroups = new Map<string, JourneyEdge[]>();
  for (const edge of edges) {
    const sourceKey = `${edge.source}:${edge.sourceHandle ?? ''}`;
    const targetKey = `${edge.target}:${edge.targetHandle ?? ''}`;
    sourceGroups.set(sourceKey, [...(sourceGroups.get(sourceKey) ?? []), edge]);
    targetGroups.set(targetKey, [...(targetGroups.get(targetKey) ?? []), edge]);
  }
  const laneScore = new Map<string, number>();
  const apply = (groups: Map<string, JourneyEdge[]>, weight: number) => {
    for (const group of groups.values()) {
      const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));
      const center = (ordered.length - 1) / 2;
      ordered.forEach((edge, index) => laneScore.set(edge.id, (laneScore.get(edge.id) ?? 0) + (index - center) * weight));
    }
  };
  apply(sourceGroups, 1);
  apply(targetGroups, 1);
  for (const edge of edges) result.set(edge.id, Math.round(laneScore.get(edge.id) ?? 0));
  return result;
}

/**
 * Assign route lanes. With node geometry available, lanes are chosen by
 * testing several candidate corridors and selecting the one with the least
 * parallel overlap with routes already placed. This keeps print/SVG/PNG and
 * the canvas readable while still allowing paths to cross when necessary.
 */
export function edgeLaneMap(edges: JourneyEdge[], nodes?: JourneyNode[]) {
  if (!nodes?.length) return fallbackLaneMap(edges);
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const result = new Map<string, number>();
  const usedRoutes: OrthogonalRoute[] = [];
  const candidates = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5];

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source || !target) { result.set(edge.id, 0); continue; }
    let bestLane = 0;
    let bestRoute = orthogonalEdgeRoute(edge, source, target, 0);
    let bestScore = parallelOverlapScore(bestRoute, usedRoutes);
    for (const lane of candidates.slice(1)) {
      const route = orthogonalEdgeRoute(edge, source, target, lane);
      const score = parallelOverlapScore(route, usedRoutes) + Math.abs(lane) * 0.01;
      if (score < bestScore) {
        bestScore = score;
        bestLane = lane;
        bestRoute = route;
        if (score < 0.05) break;
      }
    }
    result.set(edge.id, bestLane);
    usedRoutes.push(bestRoute);
  }
  return result;
}

export function orthogonalEdgeRoute(edge: JourneyEdge, source: JourneyNode, target: JourneyNode, lane = 0): OrthogonalRoute {
  const inferred = inferSides(source, target);
  const sourceSide = sideFromHandle(edge.sourceHandle) ?? inferred[0];
  const targetSide = sideFromHandle(edge.targetHandle) ?? inferred[1];
  const s = nodeAnchor(source, sourceSide, edge.sourceHandle);
  const t = nodeAnchor(target, targetSide, edge.targetHandle);
  return orthogonalRouteFromAnchors(s, t, sourceSide, targetSide, lane);
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

import type { FunnelOrientation, FunnelStage } from '../types/domain';

export type CanvasViewport = { x: number; y: number; zoom: number };

export const STAGE_ORDER: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];
export const STAGE_NODE_X: Record<FunnelStage, number> = {
  top: 80,
  middle: 380,
  bottom: 680,
  lifecycle: 980
};
export const STAGE_NODE_Y: Record<FunnelStage, number> = {
  top: 80,
  middle: 310,
  bottom: 540,
  lifecycle: 770
};

const NODE_VISUAL_WIDTH = 252;
const NODE_VISUAL_HEIGHT = 96;
const centerX = (stage: FunnelStage) => STAGE_NODE_X[stage] + NODE_VISUAL_WIDTH / 2;
const centerY = (stage: FunnelStage) => STAGE_NODE_Y[stage] + NODE_VISUAL_HEIGHT / 2;

export const STAGE_WORLD_BOUNDARIES = [
  (centerX('top') + centerX('middle')) / 2,
  (centerX('middle') + centerX('bottom')) / 2,
  (centerX('bottom') + centerX('lifecycle')) / 2
] as const;
export const STAGE_WORLD_BOUNDARIES_VERTICAL = [
  (centerY('top') + centerY('middle')) / 2,
  (centerY('middle') + centerY('bottom')) / 2,
  (centerY('bottom') + centerY('lifecycle')) / 2
] as const;

export function stageScreenBoundaries(viewport: CanvasViewport, orientation: FunnelOrientation = 'horizontal') {
  const boundaries = orientation === 'vertical' ? STAGE_WORLD_BOUNDARIES_VERTICAL : STAGE_WORLD_BOUNDARIES;
  return boundaries.map(value => orientation === 'vertical' ? viewport.y + value * viewport.zoom : viewport.x + value * viewport.zoom) as [number, number, number];
}

export function stageForWorldX(x: number): FunnelStage {
  if (x < STAGE_WORLD_BOUNDARIES[0]) return 'top';
  if (x < STAGE_WORLD_BOUNDARIES[1]) return 'middle';
  if (x < STAGE_WORLD_BOUNDARIES[2]) return 'bottom';
  return 'lifecycle';
}

export function stageForWorldPoint(position: { x: number; y: number }, orientation: FunnelOrientation = 'horizontal'): FunnelStage {
  if (orientation === 'horizontal') return stageForWorldX(position.x + NODE_VISUAL_WIDTH / 2);
  const y = position.y + NODE_VISUAL_HEIGHT / 2;
  if (y < STAGE_WORLD_BOUNDARIES_VERTICAL[0]) return 'top';
  if (y < STAGE_WORLD_BOUNDARIES_VERTICAL[1]) return 'middle';
  if (y < STAGE_WORLD_BOUNDARIES_VERTICAL[2]) return 'bottom';
  return 'lifecycle';
}

export function isStageMismatch(stage: FunnelStage, position: number | { x: number; y: number }, orientation: FunnelOrientation = 'horizontal', tolerance = 70) {
  const point = typeof position === 'number' ? { x: position, y: STAGE_NODE_Y[stage] } : position;
  const index = STAGE_ORDER.indexOf(stage);
  const boundaries = orientation === 'vertical' ? STAGE_WORLD_BOUNDARIES_VERTICAL : STAGE_WORLD_BOUNDARIES;
  const axis = orientation === 'vertical' ? point.y + NODE_VISUAL_HEIGHT / 2 : point.x + NODE_VISUAL_WIDTH / 2;
  const left = index === 0 ? Number.NEGATIVE_INFINITY : boundaries[index - 1] + tolerance;
  const right = index === STAGE_ORDER.length - 1 ? Number.POSITIVE_INFINITY : boundaries[index] - tolerance;
  return axis < left || axis > right;
}

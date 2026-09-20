import type { FunnelStage } from '../types/domain';

export type CanvasViewport = { x: number; y: number; zoom: number };

export const STAGE_ORDER: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];
export const STAGE_NODE_X: Record<FunnelStage, number> = {
  top: 80,
  middle: 380,
  bottom: 680,
  lifecycle: 980
};

// Journey nodes are 252px wide in the polished editor. Boundaries sit halfway
// between the visual centres of the stage columns so the stage backdrop stays
// aligned with the same world coordinates as the nodes while zooming/panning.
const NODE_VISUAL_WIDTH = 252;
const center = (stage: FunnelStage) => STAGE_NODE_X[stage] + NODE_VISUAL_WIDTH / 2;

export const STAGE_WORLD_BOUNDARIES = [
  (center('top') + center('middle')) / 2,
  (center('middle') + center('bottom')) / 2,
  (center('bottom') + center('lifecycle')) / 2
] as const;

export function stageScreenBoundaries(viewport: CanvasViewport) {
  return STAGE_WORLD_BOUNDARIES.map(value => viewport.x + value * viewport.zoom) as [number, number, number];
}

export function stageForWorldX(x: number): FunnelStage {
  if (x < STAGE_WORLD_BOUNDARIES[0]) return 'top';
  if (x < STAGE_WORLD_BOUNDARIES[1]) return 'middle';
  if (x < STAGE_WORLD_BOUNDARIES[2]) return 'bottom';
  return 'lifecycle';
}

export function isStageMismatch(stage: FunnelStage, x: number, tolerance = 70) {
  const index = STAGE_ORDER.indexOf(stage);
  const left = index === 0 ? Number.NEGATIVE_INFINITY : STAGE_WORLD_BOUNDARIES[index - 1] + tolerance;
  const right = index === STAGE_ORDER.length - 1 ? Number.POSITIVE_INFINITY : STAGE_WORLD_BOUNDARIES[index] - tolerance;
  const centerX = x + 126;
  return centerX < left || centerX > right;
}

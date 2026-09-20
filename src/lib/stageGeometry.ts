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

import { describe, expect, it } from 'vitest';
import { STAGE_WORLD_BOUNDARIES, stageScreenBoundaries } from './stageGeometry';

describe('stage backdrop geometry', () => {
  it('tracks horizontal pan and zoom in the same coordinate system as journey nodes', () => {
    const viewport = { x: 120, y: -40, zoom: 1.5 };
    const result = stageScreenBoundaries(viewport);
    expect(result).toEqual(STAGE_WORLD_BOUNDARIES.map(value => 120 + value * 1.5));
  });

  it('keeps stage boundaries ordered while zooming out', () => {
    const [topMiddle, middleBottom, bottomLifecycle] = stageScreenBoundaries({ x: -240, y: 0, zoom: 0.5 });
    expect(topMiddle).toBeLessThan(middleBottom);
    expect(middleBottom).toBeLessThan(bottomLifecycle);
  });
});

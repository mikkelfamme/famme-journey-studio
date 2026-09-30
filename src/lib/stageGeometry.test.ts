import { describe, expect, it } from 'vitest';
import { STAGE_NODE_X, STAGE_NODE_Y, STAGE_WORLD_BOUNDARIES, isStageMismatch, stageForWorldX, stageForWorldPoint, stageScreenBoundaries } from './stageGeometry';

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

  it('detects a node that is visually placed in the wrong stage', () => {
    expect(isStageMismatch('top', STAGE_NODE_X.top)).toBe(false);
    expect(isStageMismatch('top', STAGE_NODE_X.bottom)).toBe(true);
    expect(stageForWorldX(STAGE_NODE_X.lifecycle + 126)).toBe('lifecycle');
  });

  it('supports vertical funnel stage geometry', () => {
    expect(isStageMismatch('top', { x: 100, y: STAGE_NODE_Y.top }, 'vertical')).toBe(false);
    expect(isStageMismatch('top', { x: 100, y: STAGE_NODE_Y.bottom }, 'vertical')).toBe(true);
    expect(stageForWorldPoint({ x: 120, y: STAGE_NODE_Y.lifecycle }, 'vertical')).toBe('lifecycle');
    const [b1, b2, b3] = stageScreenBoundaries({ x: 0, y: 10, zoom: 2 }, 'vertical');
    expect(b1).toBeLessThan(b2);
    expect(b2).toBeLessThan(b3);
  });
});

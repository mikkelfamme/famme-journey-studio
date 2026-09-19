import { describe, expect, it } from 'vitest';
import { createDemoWorkspace } from './demo';

describe('public demo workspace', () => {
  it('contains generic synthetic data and activates the guided tour', () => {
    const workspace = createDemoWorkspace();
    expect(workspace.settings.demoWorkspace).toBe(true);
    expect(workspace.settings.onboardingComplete).toBe(false);
    expect(workspace.journeys.length).toBeGreaterThanOrEqual(2);
    expect(workspace.performanceSnapshots).toHaveLength(1);
    expect(workspace.performanceSnapshots[0].sources[0].name).toContain('Synthetic');
    expect(workspace.organization).toBe('Northstar Demo');
    expect(workspace.performanceSnapshots[0].period).toContain('Synthetic');
  });
});

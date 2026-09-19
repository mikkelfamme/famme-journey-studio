import { describe, expect, it } from 'vitest';
import { importPreview, parseStudioDataFile } from './files';
import { createWorkspace } from './workspace';

function jsonFile(value: unknown, name = 'data.json') {
  return new File([JSON.stringify(value)], name, { type: 'application/json' });
}

describe('file import classification and preview', () => {
  it('previews a current workspace as destructive before applying it', async () => {
    const workspace = createWorkspace({ name: 'Portable workspace', organization: 'Example', scope: 'B2C', product: 'Product' });
    const imported = await parseStudioDataFile(jsonFile(workspace, 'workspace.fjs'));
    expect(imported.kind).toBe('workspace');
    const preview = importPreview(imported);
    expect(preview.replacesWorkspace).toBe(true);
    expect(preview.rows.some(row => row.label === 'Journeys')).toBe(true);
  });

  it('previews performance data as additive', async () => {
    const imported = await parseStudioDataFile(jsonFile({
      schema: 'famme-journey-performance-v1',
      id: 'perf-1',
      generatedAt: '2026-09-19T12:00:00Z',
      period: 'September 2026',
      sources: [{ name: 'Analytics' }],
      nodeMetrics: [],
      journeyMetrics: []
    }));
    expect(imported.kind).toBe('performance');
    const preview = importPreview(imported);
    expect(preview.replacesWorkspace).toBe(false);
    expect(preview.title).toContain('performance');
  });
});

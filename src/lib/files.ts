import type { ActualPathSnapshot, PerformanceSnapshot, Workspace } from '../types/domain';
import { normalizeActualPathSnapshot } from './actual';
import { normalizeWorkspace } from './migrate';
import { normalizePerformanceSnapshot } from './performance';
import { looksLikeLegacyWorkspace, migrateLegacyWorkspaceWithReport, type LegacyMigrationReport, type LegacyWorkspaceLike } from './legacy';

export type StudioImport =
  | { kind: 'workspace'; workspace: Workspace; source: 'current' | 'legacy'; migrationReport?: LegacyMigrationReport }
  | { kind: 'performance'; snapshot: PerformanceSnapshot }
  | { kind: 'actual'; snapshot: ActualPathSnapshot };

export interface StudioImportPreview {
  title: string;
  subtitle: string;
  kind: StudioImport['kind'];
  replacesWorkspace: boolean;
  rows: Array<{ label: string; value: string }>;
  warnings: string[];
  migrationReport?: LegacyMigrationReport;
}

function downloadText(text: string, filename: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadWorkspace(workspace: Workspace) {
  const payload = JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2);
  const safe = workspace.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'workspace';
  downloadText(payload, `${safe}.fjs`);
}

export async function parseWorkspaceFile(file: File): Promise<Workspace> {
  const imported = await parseStudioDataFile(file);
  if (imported.kind !== 'workspace') throw new Error('This file contains data for an existing workspace, not a workspace backup.');
  return imported.workspace;
}

export async function parseStudioDataFile(file: File): Promise<StudioImport> {
  const data = JSON.parse(await file.text()) as Record<string, unknown>;
  if (data.schema === 'famme-journey-studio-workspace-v2' && Array.isArray(data.journeys)) {
    return { kind: 'workspace', source: 'current', workspace: normalizeWorkspace(data as unknown as Workspace) };
  }
  if (looksLikeLegacyWorkspace(data as unknown)) {
    const migrated = migrateLegacyWorkspaceWithReport(data as unknown as LegacyWorkspaceLike);
    return { kind: 'workspace', source: 'legacy', workspace: migrated.workspace, migrationReport: migrated.report };
  }
  const schema = typeof data.schema === 'string' ? data.schema : '';
  if ((schema === 'famme-journey-performance-v1' || /-journey-performance-v1$/i.test(schema)) && Array.isArray(data.nodeMetrics)) {
    return { kind: 'performance', snapshot: normalizePerformanceSnapshot({ ...(data as unknown as Partial<PerformanceSnapshot>), schema: 'famme-journey-performance-v1' }) };
  }
  if ((schema === 'famme-journey-actual-paths-v1' || /-journey-actual-paths-v1$/i.test(schema)) && Array.isArray(data.journeyPaths)) {
    return { kind: 'actual', snapshot: normalizeActualPathSnapshot({ ...(data as unknown as Partial<ActualPathSnapshot>), schema: 'famme-journey-actual-paths-v1' }) };
  }
  throw new Error('Unknown Journey Studio by Famme file type. Expected a current or legacy workspace, performance snapshot or actual-path snapshot.');
}

export function importPreview(imported: StudioImport): StudioImportPreview {
  if (imported.kind === 'workspace') {
    const tracking = imported.workspace.journeys.reduce((sum, journey) => sum + journey.nodes.reduce((nodeSum, node) => nodeSum + node.data.tracking.length, 0), 0);
    const creatives = imported.workspace.journeys.reduce((sum, journey) => sum + journey.nodes.reduce((nodeSum, node) => nodeSum + node.data.creatives.length, 0), 0);
    const rows = [
      { label: 'Organization', value: imported.workspace.organization || 'Not set' },
      { label: 'Journeys', value: String(imported.workspace.journeys.length) },
      { label: 'Nodes', value: String(imported.workspace.journeys.reduce((sum, journey) => sum + journey.nodes.length, 0)) },
      { label: 'Tracking definitions', value: String(tracking) },
      { label: 'Creatives', value: String(creatives) },
      { label: 'Performance snapshots', value: String(imported.workspace.performanceSnapshots.length) },
      { label: 'Actual-path snapshots', value: String(imported.workspace.actualPathSnapshots.length) }
    ];
    if (imported.migrationReport) rows.push({ label: 'Items needing review', value: String(imported.migrationReport.reviewItems) });
    return {
      title: imported.source === 'legacy' ? 'Migrate legacy workspace' : 'Import workspace',
      subtitle: imported.source === 'legacy' ? `Convert "${imported.workspace.name}" to the 2.0 workspace model.` : `Replace the current workspace with "${imported.workspace.name}".`,
      kind: 'workspace',
      replacesWorkspace: true,
      rows,
      warnings: imported.migrationReport?.warnings ?? [],
      migrationReport: imported.migrationReport
    };
  }
  if (imported.kind === 'performance') {
    return {
      title: 'Import performance snapshot',
      subtitle: `Add ${imported.snapshot.period} without changing the journey architecture.`,
      kind: 'performance',
      replacesWorkspace: false,
      rows: [
        { label: 'Period', value: imported.snapshot.period },
        { label: 'Node mappings', value: String(imported.snapshot.nodeMetrics.length) },
        { label: 'Sources', value: String(imported.snapshot.sources.length) },
        { label: 'Generated', value: new Date(imported.snapshot.generatedAt).toLocaleString() }
      ],
      warnings: []
    };
  }
  return {
    title: 'Import actual-path snapshot',
    subtitle: `Add observed customer paths for ${imported.snapshot.period}.`,
    kind: 'actual',
    replacesWorkspace: false,
    rows: [
      { label: 'Period', value: imported.snapshot.period },
      { label: 'Source', value: imported.snapshot.source },
      { label: 'Journeys with paths', value: String(imported.snapshot.journeyPaths.length) },
      { label: 'Observed paths', value: String(imported.snapshot.journeyPaths.reduce((sum, item) => sum + item.paths.length, 0)) }
    ],
    warnings: []
  };
}

export function downloadPerformanceMap(workspace: Workspace) {
  const payload = {
    schema: 'famme-journey-performance-map-v1',
    generatedAt: new Date().toISOString(),
    workspaceId: workspace.id,
    journeys: workspace.journeys.map(journey => ({
      journeyId: journey.id,
      journeyName: journey.name,
      nodes: journey.nodes.map(node => ({ nodeId: node.id, label: node.data.label, type: node.data.type, tracking: node.data.tracking.map(t => ({ platform: t.platform, event: t.event })) }))
    }))
  };
  downloadText(JSON.stringify(payload, null, 2), 'Journey-Studio-performance-map.json');
}

export function downloadActualPathMap(workspace: Workspace) {
  const payload = {
    schema: 'famme-journey-actual-path-map-v1',
    generatedAt: new Date().toISOString(),
    workspaceId: workspace.id,
    journeys: workspace.journeys.map(journey => ({
      journeyId: journey.id,
      journeyName: journey.name,
      nodes: journey.nodes.map(node => ({ nodeId: node.id, label: node.data.label, type: node.data.type })),
      edges: journey.edges.map(edge => ({ source: edge.source, target: edge.target, label: edge.data?.label || '' }))
    }))
  };
  downloadText(JSON.stringify(payload, null, 2), 'Journey-Studio-actual-path-map.json');
}

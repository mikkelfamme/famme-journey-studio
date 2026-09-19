import type { ActualPathSnapshot, Journey, ObservedPath, Workspace } from '../types/domain';
import { makeId } from './ids';

export function activeActualSnapshot(workspace: Workspace): ActualPathSnapshot | undefined {
  const id = workspace.settings.activeActualPathSnapshotId;
  if (id) return workspace.actualPathSnapshots.find(snapshot => snapshot.id === id);
  return [...workspace.actualPathSnapshots].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

export function pathsForJourney(workspace: Workspace, journeyId: string, snapshot?: ActualPathSnapshot): ObservedPath[] {
  const active = snapshot ?? activeActualSnapshot(workspace);
  return active?.journeyPaths.find(item => item.journeyId === journeyId)?.paths ?? [];
}

export function plannedPrimaryPath(journey: Journey): string[] {
  if (!journey.nodes.length) return [];
  const incoming = new Map(journey.nodes.map(node => [node.id, 0]));
  journey.edges.forEach(edge => incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1));
  const candidates = journey.nodes.filter(node => (incoming.get(node.id) || 0) === 0).sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  let current = candidates[0] ?? [...journey.nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)[0];
  const path: string[] = [];
  const seen = new Set<string>();
  while (current && !seen.has(current.id)) {
    path.push(current.id); seen.add(current.id);
    const nextIds = journey.edges.filter(edge => edge.source === current.id).map(edge => edge.target);
    current = journey.nodes.filter(node => nextIds.includes(node.id) && !seen.has(node.id)).sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)[0];
  }
  return path;
}

export function compareObservedPath(journey: Journey, path: ObservedPath) {
  const planned = plannedPrimaryPath(journey);
  const observedNodeIds = path.steps.map(step => step.nodeId).filter((id): id is string => Boolean(id));
  const plannedSet = new Set(planned);
  const observedSet = new Set(observedNodeIds);
  const matched = planned.filter(id => observedSet.has(id));
  const missingPlanned = planned.filter(id => !observedSet.has(id));
  const unmappedActual = path.steps.filter(step => !step.nodeId || !plannedSet.has(step.nodeId));
  let orderMatches = 0;
  let lastIndex = -1;
  for (const id of observedNodeIds) {
    const idx = planned.indexOf(id);
    if (idx >= lastIndex && idx >= 0) { orderMatches += 1; lastIndex = idx; }
  }
  const denominator = Math.max(planned.length, observedNodeIds.length, 1);
  const matchPct = Math.round(((matched.length + orderMatches) / 2) / denominator * 100);
  return { planned, observedNodeIds, matchPct, missingPlanned, unmappedActual };
}

export function normalizeActualPathSnapshot(raw: Partial<ActualPathSnapshot>): ActualPathSnapshot {
  if (raw.schema !== 'famme-journey-actual-paths-v1' || !Array.isArray(raw.journeyPaths)) throw new Error('Not a valid Famme Journey Studio actual-path snapshot.');
  return {
    schema: 'famme-journey-actual-paths-v1',
    id: raw.id || makeId('actual'),
    generatedAt: raw.generatedAt || new Date().toISOString(),
    period: raw.period || 'Unspecified period',
    source: raw.source || 'Observed journey data',
    journeyPaths: raw.journeyPaths.map(item => ({
      journeyId: String(item.journeyId || ''),
      paths: Array.isArray(item.paths) ? item.paths.map(path => ({
        id: path.id || makeId('path'),
        label: path.label || 'Observed path',
        count: typeof path.count === 'number' ? path.count : undefined,
        users: typeof path.users === 'number' ? path.users : undefined,
        sessions: typeof path.sessions === 'number' ? path.sessions : undefined,
        sharePct: typeof path.sharePct === 'number' ? path.sharePct : undefined,
        steps: Array.isArray(path.steps) ? path.steps.map(step => ({ nodeId: step.nodeId || undefined, label: step.label || undefined })) : []
      })) : []
    }))
  };
}

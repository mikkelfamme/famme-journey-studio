import type { Journey, JourneyVersion, JourneyVersionSnapshot } from '../types/domain';
import { makeId } from './ids';

export function snapshotJourney(journey: Journey): JourneyVersionSnapshot {
  return structuredClone({
    name: journey.name,
    description: journey.description,
    audience: journey.audience,
    product: journey.product,
    scope: journey.scope,
    status: journey.status,
    primaryConversion: journey.primaryConversion,
    owner: journey.owner,
    nodes: journey.nodes,
    edges: journey.edges,
    planInputs: journey.planInputs,
    crossJourneyLinks: journey.crossJourneyLinks,
    annotations: journey.annotations
  });
}

export function createJourneyVersion(journey: Journey, label: string, note = ''): JourneyVersion {
  return { id: makeId('version'), label, note, createdAt: new Date().toISOString(), snapshot: snapshotJourney(journey) };
}

export function restoreVersion(journey: Journey, version: JourneyVersion): Journey {
  return {
    ...journey,
    ...structuredClone(version.snapshot),
    versions: journey.versions,
    updatedAt: new Date().toISOString()
  };
}

export interface VersionDiff {
  addedNodes: string[];
  removedNodes: string[];
  changedNodes: string[];
  edgeDelta: number;
  trackingDelta: number;
  creativeDelta: number;
}

export function diffVersion(journey: Journey, version: JourneyVersion): VersionDiff {
  const oldNodes = new Map(version.snapshot.nodes.map(node => [node.id, node]));
  const currentNodes = new Map(journey.nodes.map(node => [node.id, node]));
  const addedNodes = journey.nodes.filter(node => !oldNodes.has(node.id)).map(node => node.data.label);
  const removedNodes = version.snapshot.nodes.filter(node => !currentNodes.has(node.id)).map(node => node.data.label);
  const changedNodes = journey.nodes.filter(node => {
    const old = oldNodes.get(node.id);
    if (!old) return false;
    return JSON.stringify({ data: node.data, position: node.position }) !== JSON.stringify({ data: old.data, position: old.position });
  }).map(node => node.data.label);
  const count = (nodes: typeof journey.nodes, key: 'tracking' | 'creatives') => nodes.reduce((sum, node) => sum + node.data[key].length, 0);
  return {
    addedNodes,
    removedNodes,
    changedNodes,
    edgeDelta: journey.edges.length - version.snapshot.edges.length,
    trackingDelta: count(journey.nodes, 'tracking') - count(version.snapshot.nodes, 'tracking'),
    creativeDelta: count(journey.nodes, 'creatives') - count(version.snapshot.nodes, 'creatives')
  };
}

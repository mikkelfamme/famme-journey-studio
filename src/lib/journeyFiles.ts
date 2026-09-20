import type { Journey } from '../types/domain';
import { makeId } from './ids';

export const JOURNEY_FILE_SCHEMA = 'journey-studio-journey-v1' as const;

export interface JourneyFile {
  schema: typeof JOURNEY_FILE_SCHEMA;
  version: '1.0';
  exportedAt: string;
  product: 'Journey Studio by Famme';
  journey: Journey;
}

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'journey';
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function serializeJourney(journey: Journey) {
  const payload: JourneyFile = {
    schema: JOURNEY_FILE_SCHEMA,
    version: '1.0',
    exportedAt: new Date().toISOString(),
    product: 'Journey Studio by Famme',
    journey: structuredClone(journey)
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJourney(journey: Journey) {
  downloadText(serializeJourney(journey), `${safeName(journey.name)}.jsjourney`);
}

export function parseJourneyData(raw: unknown): Journey {
  if (!raw || typeof raw !== 'object') throw new Error('The selected file is not a Journey Studio journey.');
  const record = raw as Record<string, unknown>;
  if (record.schema !== JOURNEY_FILE_SCHEMA) throw new Error('Unknown journey file format. Expected journey-studio-journey-v1.');
  const journey = record.journey as Journey | undefined;
  if (!journey || typeof journey.name !== 'string' || !Array.isArray(journey.nodes) || !Array.isArray(journey.edges)) throw new Error('The journey payload is incomplete.');

  const idMap = new Map<string, string>();
  const timestamp = new Date().toISOString();
  const nodes = structuredClone(journey.nodes).map(node => {
    const id = makeId('node');
    idMap.set(node.id, id);
    return { ...node, id, selected: false, data: { ...node.data, runtimePerformance: undefined, runtimeActualCount: undefined, runtimeActions: undefined, runtimeStageMismatch: undefined } };
  });
  const edges = structuredClone(journey.edges).map(edge => ({ ...edge, id: makeId('edge'), source: idMap.get(edge.source) ?? edge.source, target: idMap.get(edge.target) ?? edge.target, selected: false }));
  return {
    ...structuredClone(journey),
    id: makeId('journey'),
    name: `${journey.name} (imported)`,
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes,
    edges,
    crossJourneyLinks: [],
    versions: []
  };
}

export async function parseJourneyFile(file: File): Promise<Journey> {
  let raw: unknown;
  try { raw = JSON.parse(await file.text()); }
  catch { throw new Error('The journey file is not valid JSON.'); }
  return parseJourneyData(raw);
}

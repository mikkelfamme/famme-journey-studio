import type { Journey, JourneyTemplate, WorkspaceScope } from '../types/domain';
import { makeId } from './ids';

export const TEMPLATE_FILE_SCHEMA = 'journey-studio-template-v1' as const;

export interface JourneyTemplateFile {
  schema: typeof TEMPLATE_FILE_SCHEMA;
  version: '1.0';
  exportedAt: string;
  product: 'Journey Studio by Famme';
  template: JourneyTemplate;
}

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'journey-template';
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

export function templateFromJourney(
  journey: Journey,
  input: { name: string; description: string; category: string; scope: WorkspaceScope }
): JourneyTemplate {
  return {
    id: makeId('template'),
    name: input.name.trim() || journey.name,
    description: input.description.trim() || journey.description,
    category: input.category.trim() || 'Custom',
    scope: input.scope,
    system: false,
    nodes: structuredClone(journey.nodes).map(node => ({ ...node, selected: false })),
    edges: structuredClone(journey.edges).map(edge => ({ ...edge, selected: false })),
    planInputs: structuredClone(journey.planInputs)
  };
}

export function serializeJourneyTemplate(template: JourneyTemplate): string {
  const payload: JourneyTemplateFile = {
    schema: TEMPLATE_FILE_SCHEMA,
    version: '1.0',
    exportedAt: new Date().toISOString(),
    product: 'Journey Studio by Famme',
    template: structuredClone(template)
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJourneyTemplate(template: JourneyTemplate) {
  downloadText(serializeJourneyTemplate(template), `${safeName(template.name)}.jstemplate`);
}

export function parseJourneyTemplateData(raw: unknown): JourneyTemplate {
  if (!raw || typeof raw !== 'object') throw new Error('The selected file is not a Journey Studio template.');
  const record = raw as Record<string, unknown>;
  if (record.schema !== TEMPLATE_FILE_SCHEMA) throw new Error('Unknown template file format. Expected journey-studio-template-v1.');
  const template = record.template as JourneyTemplate | undefined;
  if (!template || typeof template !== 'object') throw new Error('The template payload is missing.');
  if (typeof template.name !== 'string' || !template.name.trim()) throw new Error('The template needs a name.');
  if (typeof template.description !== 'string' || typeof template.category !== 'string') throw new Error('The template metadata is incomplete.');
  if (!['B2C', 'B2B', 'Mixed'].includes(template.scope)) throw new Error('The template scope is invalid.');
  if (!Array.isArray(template.nodes) || !Array.isArray(template.edges)) throw new Error('The template nodes or connections are missing.');

  const nodeIds = new Set<string>();
  for (const node of template.nodes) {
    if (!node || typeof node.id !== 'string' || !node.data || typeof node.data.label !== 'string' || typeof node.data.type !== 'string' || typeof node.data.stage !== 'string') {
      throw new Error('The template contains an invalid component.');
    }
    nodeIds.add(node.id);
  }
  for (const edge of template.edges) {
    if (!edge || typeof edge.id !== 'string' || typeof edge.source !== 'string' || typeof edge.target !== 'string' || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error('The template contains an invalid connection.');
    }
  }

  return {
    ...structuredClone(template),
    id: makeId('template'),
    system: false,
    nodes: structuredClone(template.nodes).map(node => ({ ...node, selected: false })),
    edges: structuredClone(template.edges).map(edge => ({ ...edge, selected: false }))
  };
}

export async function parseJourneyTemplateFile(file: File): Promise<JourneyTemplate> {
  let raw: unknown;
  try { raw = JSON.parse(await file.text()); }
  catch { throw new Error('The template file is not valid JSON.'); }
  return parseJourneyTemplateData(raw);
}

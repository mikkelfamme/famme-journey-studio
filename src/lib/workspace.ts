import type { ComponentDefinition, Journey, JourneyNodeData, JourneyTemplate, Workspace, WorkspaceScope } from '../types/domain';
import { defaultMetricDictionary } from './performance';
import { makeId } from './ids';
import { systemTemplates } from './templates';
import { normalizeWorkspace } from './migrate';

const now = () => new Date().toISOString();

export function createWorkspace(input: { name: string; organization: string; scope: WorkspaceScope; product: string }): Workspace {
  const timestamp = now();
  return normalizeWorkspace({
    schema: 'famme-journey-studio-workspace-v2',
    version: '2.0',
    id: makeId('workspace'),
    name: input.name,
    organization: input.organization,
    scope: input.scope,
    product: input.product,
    createdAt: timestamp,
    updatedAt: timestamp,
    author: 'Mikkel Famme',
    journeys: [],
    templates: structuredClone(systemTemplates),
    components: [],
    performanceSnapshots: [],
    metricDictionary: defaultMetricDictionary(),
    mappingOverrides: [],
    actualPathSnapshots: [],
    settings: { defaultView: 'journeys', showMiniMap: true, snapToGrid: true, keyboardShortcuts: true, showPerformanceOverlay: true, freshnessThresholdHours: 48, onboardingComplete: false, demoWorkspace: false, language: 'en' }
  });
}


export function createBlankJourney(...args: unknown[]): Journey {
  const timestamp = now();
  const allowedScopes: WorkspaceScope[] = ['B2C', 'B2B', 'Mixed'];

  let name = 'Untitled journey';
  let scope: WorkspaceScope = 'B2C';
  let organization = '';
  let product = '';
  let description = '';

  const first = args[0];
  if (typeof first === 'object' && first !== null) {
    const input = first as Record<string, unknown>;
    if (typeof input.name === 'string' && input.name.trim()) name = input.name.trim();
    if (typeof input.scope === 'string' && allowedScopes.includes(input.scope as WorkspaceScope)) scope = input.scope as WorkspaceScope;
    if (typeof input.organization === 'string') organization = input.organization;
    if (typeof input.product === 'string') product = input.product;
    if (typeof input.description === 'string') description = input.description;
  } else {
    if (typeof first === 'string' && first.trim()) name = first.trim();
    for (const arg of args.slice(1)) {
      if (typeof arg !== 'string') continue;
      if (allowedScopes.includes(arg as WorkspaceScope)) {
        scope = arg as WorkspaceScope;
      } else if (!organization) {
        organization = arg;
      } else if (!product) {
        product = arg;
      }
    }
  }

  return {
    id: makeId('journey'),
    name,
    description,
    audience: '',
    product,
    scope,
    status: 'draft',
    primaryConversion: 'Purchase / primary conversion',
    owner: '',
    layoutOrientation: 'horizontal',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: [],
    edges: [],
    planInputs: { objective: organization ? `Create a coherent journey for ${organization}.` : '' },
    crossJourneyLinks: [],
    annotations: [],
    versions: []
  };
}

export function journeyFromTemplate(t: JourneyTemplate, name: string, organization = ''): Journey {
  const timestamp = now();
  const idMap = new Map<string, string>();
  const nodes = structuredClone(t.nodes).map(n => {
    const id = makeId('node');
    idMap.set(n.id, id);
    return { ...n, id, selected: false, data: { ...n.data, tracking: structuredClone(n.data.tracking), creatives: structuredClone(n.data.creatives), annotations: structuredClone(n.data.annotations ?? []) } };
  });
  const edges = structuredClone(t.edges).map(e => ({ ...e, id: makeId('edge'), source: idMap.get(e.source)!, target: idMap.get(e.target)!, selected: false }));
  return {
    id: makeId('journey'),
    name,
    description: t.description,
    audience: '',
    product: '',
    scope: t.scope,
    status: 'draft',
    primaryConversion: 'Purchase / primary conversion',
    owner: '',
    layoutOrientation: t.layoutOrientation ?? 'horizontal',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes,
    edges,
    planInputs: t.planInputs ? structuredClone(t.planInputs) : { objective: organization ? `Create a coherent journey for ${organization}.` : '' },
    crossJourneyLinks: [],
    annotations: [],
    versions: []
  };
}

export function componentFromNode(name: string, description: string, data: JourneyNodeData): ComponentDefinition {
  const timestamp = now();
  return {
    id: makeId('component'),
    name,
    description,
    nodeData: structuredClone({ ...data, annotations: [], componentId: undefined, componentSyncedAt: undefined }),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function syncedNodeData(component: ComponentDefinition): JourneyNodeData {
  return structuredClone({ ...component.nodeData, annotations: [], componentId: component.id, componentSyncedAt: now() });
}

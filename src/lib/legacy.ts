import type {
  CreativeDefinition,
  CrossJourneyLink,
  FunnelStage,
  Journey,
  JourneyEdge,
  JourneyNode,
  JourneyNodeData,
  JourneyNodeType,
  TrackingDefinition,
  Workspace,
  WorkspaceScope
} from '../types/domain';
import { makeId } from './ids';
import { createWorkspace } from './workspace';
import { normalizeWorkspace } from './migrate';
import { normalizePerformanceSnapshot } from './performance';
import { normalizeActualPathSnapshot } from './actual';

interface LegacyTracking {
  id?: string;
  nodeId?: string;
  platform?: string;
  event?: string;
  status?: string;
  parameters?: string[];
  note?: string;
}

interface LegacyCreative {
  id?: string;
  title?: string;
  name?: string;
  format?: string;
  message?: string;
  hook?: string;
  headlines?: string;
  descriptions?: string;
  cta?: string;
  finalUrl?: string;
  audience?: string;
  status?: string;
  note?: string;
}

interface LegacyNode {
  id?: string;
  type?: string;
  x?: number;
  y?: number;
  position?: { x?: number; y?: number };
  data?: Record<string, unknown>;
}

interface LegacyEdge {
  id?: string;
  source?: string;
  target?: string;
  label?: string;
  condition?: string;
  signal?: string;
  event?: string;
  timeRule?: string;
  timing?: string;
  comment?: string;
  animated?: boolean;
  sourceHandle?: string;
  targetHandle?: string;
}

interface LegacyJourney {
  id?: string;
  name?: string;
  description?: string;
  audience?: string;
  product?: string;
  owner?: string;
  status?: string;
  scope?: string;
  primaryConversion?: string;
  nodes?: LegacyNode[];
  edges?: LegacyEdge[];
  tracking?: LegacyTracking[];
}

interface LegacyCrossConnection {
  id?: string;
  sourceJourney?: string;
  sourceNode?: string | null;
  targetJourney?: string;
  targetNode?: string | null;
  label?: string;
  condition?: string;
}

export interface LegacyWorkspaceLike {
  id?: string;
  name?: string;
  organization?: string;
  groups?: unknown[];
  journeys?: LegacyJourney[];
  crossConnections?: LegacyCrossConnection[];
  settings?: Record<string, unknown>;
  performanceSnapshots?: unknown[];
  actualPathSnapshots?: unknown[];
  mappingOverrides?: unknown[];
  metricDictionary?: unknown[];
}

const stageValues: FunnelStage[] = ['top', 'middle', 'bottom', 'lifecycle'];

function normalizeScope(value: unknown): WorkspaceScope {
  const text = String(value ?? '').toUpperCase();
  if (text === 'B2B') return 'B2B';
  if (text === 'MIXED') return 'Mixed';
  return 'B2C';
}

function normalizeStatus(value: unknown): Journey['status'] {
  switch (String(value ?? '').toLowerCase()) {
    case 'active': return 'active';
    case 'paused': return 'paused';
    case 'archived': return 'archived';
    default: return 'draft';
  }
}

function normalizeStage(value: unknown): FunnelStage {
  const stage = String(value ?? '').toLowerCase() as FunnelStage;
  return stageValues.includes(stage) ? stage : 'middle';
}

function normalizeType(value: unknown): JourneyNodeType {
  const key = String(value ?? '').toLowerCase();
  const map: Record<string, JourneyNodeType> = {
    'customer-step': 'customerStep',
    customerstep: 'customerStep',
    trigger: 'trigger',
    need: 'need',
    decision: 'decision',
    meta: 'meta',
    'google-ads': 'googleAds',
    googleads: 'googleAds',
    'landing-page': 'landingPage',
    landingpage: 'landingPage',
    cta: 'cta',
    tracking: 'tracking',
    conversion: 'conversion',
    lead: 'lead',
    booking: 'booking',
    exclusion: 'exclusion',
    'crm-email': 'crm',
    crm: 'crm',
    note: 'note'
  };
  return map[key] ?? 'note';
}

function normalizeTrackingStatus(value: unknown): TrackingDefinition['status'] {
  const status = String(value ?? '').toLowerCase();
  if (status === 'implemented' || status === 'validate' || status === 'missing' || status === 'planned') return status;
  return 'planned';
}

function convertTracking(item: LegacyTracking): TrackingDefinition {
  const parameters = Array.isArray(item.parameters) && item.parameters.length ? `Parameters: ${item.parameters.join(', ')}` : '';
  return {
    id: item.id || makeId('tracking'),
    platform: item.platform || 'Other',
    event: item.event || '',
    status: normalizeTrackingStatus(item.status),
    note: [item.note, parameters].filter(Boolean).join(' · ')
  };
}

function convertCreative(item: LegacyCreative): CreativeDefinition {
  const status = String(item.status ?? '').toLowerCase();
  return {
    id: item.id || makeId('creative'),
    name: item.name || item.title || 'Imported creative',
    format: item.format || 'Other',
    message: item.message || item.hook || '',
    headline: item.headlines || '',
    description: item.descriptions || item.note || '',
    cta: item.cta || '',
    finalUrl: item.finalUrl || '',
    audience: item.audience || '',
    status: status === 'ready' || status === 'live' || status === 'paused' ? status : 'draft'
  };
}

function nodeTrackingMap(journey: LegacyJourney): Map<string, TrackingDefinition[]> {
  const map = new Map<string, TrackingDefinition[]>();
  for (const item of journey.tracking ?? []) {
    if (!item.nodeId) continue;
    const list = map.get(item.nodeId) ?? [];
    list.push(convertTracking(item));
    map.set(item.nodeId, list);
  }
  return map;
}

function convertNode(node: LegacyNode, trackingByNode: Map<string, TrackingDefinition[]>): JourneyNode {
  const raw = node.data ?? {};
  const id = node.id || makeId('node');
  const embeddedTracking = Array.isArray(raw.tracking) ? (raw.tracking as LegacyTracking[]).map(convertTracking) : [];
  const creatives = Array.isArray(raw.creatives) ? (raw.creatives as LegacyCreative[]).map(convertCreative) : [];
  const data: JourneyNodeData = {
    label: String(raw.title ?? raw.label ?? 'Imported step'),
    type: normalizeType(node.type ?? raw.type),
    stage: normalizeStage(raw.funnelStage ?? raw.stage),
    description: String(raw.description ?? ''),
    customerNeed: String(raw.customerNeed ?? ''),
    communicationTask: String(raw.communicationTask ?? ''),
    channel: String(raw.channel ?? ''),
    primaryCta: String(raw.primaryCta ?? ''),
    landingPage: String(raw.landingPage ?? ''),
    tracking: [...(trackingByNode.get(id) ?? []), ...embeddedTracking],
    creatives,
    annotations: []
  };
  return {
    id,
    type: 'journey',
    position: {
      x: Number(node.position?.x ?? node.x ?? 80),
      y: Number(node.position?.y ?? node.y ?? 120)
    },
    data
  };
}

function convertEdge(edge: LegacyEdge): JourneyEdge | null {
  if (!edge.source || !edge.target) return null;
  return {
    id: edge.id || makeId('edge'),
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: Boolean(edge.animated),
    data: {
      label: edge.label || '',
      condition: edge.condition || '',
      signal: edge.signal || edge.event || '',
      timing: edge.timing || edge.timeRule || '',
      comment: edge.comment || ''
    }
  };
}

function conversionCandidate(journey: Journey): string | undefined {
  return journey.nodes.find(node => node.data.type === 'conversion')?.id
    ?? journey.nodes.find(node => node.data.type === 'booking')?.id
    ?? journey.nodes[journey.nodes.length - 1]?.id;
}

function convertJourney(raw: LegacyJourney): Journey {
  const timestamp = new Date().toISOString();
  const trackingByNode = nodeTrackingMap(raw);
  return {
    id: raw.id || makeId('journey'),
    name: raw.name || 'Imported journey',
    description: raw.description || '',
    audience: raw.audience || '',
    product: raw.product || '',
    scope: normalizeScope(raw.scope),
    status: normalizeStatus(raw.status),
    primaryConversion: raw.primaryConversion || 'Primary conversion',
    owner: raw.owner || '',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: (raw.nodes ?? []).map(node => convertNode(node, trackingByNode)),
    edges: (raw.edges ?? []).map(convertEdge).filter((edge): edge is JourneyEdge => Boolean(edge)),
    planInputs: {},
    crossJourneyLinks: [],
    annotations: [{
      id: makeId('annotation'),
      kind: 'decision',
      text: 'Imported from the legacy single-file Journey Studio workspace.',
      createdAt: timestamp,
      done: false
    }],
    versions: []
  };
}

function attachCrossConnections(journeys: Journey[], links: LegacyCrossConnection[]): Journey[] {
  const byId = new Map(journeys.map(journey => [journey.id, journey]));
  for (const link of links) {
    if (!link.sourceJourney || !link.targetJourney) continue;
    const source = byId.get(link.sourceJourney);
    if (!source) continue;
    const sourceNodeId = link.sourceNode || conversionCandidate(source);
    if (!sourceNodeId) continue;
    const crossLink: CrossJourneyLink = {
      id: link.id || makeId('crosslink'),
      sourceNodeId,
      targetJourneyId: link.targetJourney,
      targetNodeId: link.targetNode || undefined,
      label: link.label || 'Continue to journey',
      condition: link.condition || ''
    };
    source.crossJourneyLinks.push(crossLink);
  }
  return journeys;
}

export function looksLikeLegacyWorkspace(data: unknown): data is LegacyWorkspaceLike {
  if (!data || typeof data !== 'object') return false;
  const record = data as Record<string, unknown>;
  return Array.isArray(record.journeys)
    && record.schema !== 'famme-journey-studio-workspace-v2'
    && (Array.isArray(record.groups) || Array.isArray(record.crossConnections) || (record.journeys as unknown[]).some(item => Boolean(item && typeof item === 'object' && Array.isArray((item as { nodes?: unknown[] }).nodes) && ((item as { nodes?: Array<{ x?: unknown; y?: unknown }> }).nodes ?? []).some(node => typeof node?.x === 'number' || typeof node?.y === 'number'))));
}

export function migrateLegacyWorkspace(data: LegacyWorkspaceLike): Workspace {
  const organization = data.organization || 'Imported organization';
  const base = createWorkspace({
    name: data.name ? `${data.name} · migrated` : 'Imported Journey Studio workspace',
    organization,
    scope: 'Mixed',
    product: ''
  });
  const journeys = attachCrossConnections((data.journeys ?? []).map(convertJourney), data.crossConnections ?? []);
  const performanceSnapshots = (data.performanceSnapshots ?? []).flatMap(raw => {
    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { nodeMetrics?: unknown[] }).nodeMetrics)) return [];
    try { return [normalizePerformanceSnapshot({ ...(raw as Record<string, unknown>), schema: 'famme-journey-performance-v1' } as never)]; } catch { return []; }
  });
  const actualPathSnapshots = (data.actualPathSnapshots ?? []).flatMap(raw => {
    if (!raw || typeof raw !== 'object' || !Array.isArray((raw as { journeyPaths?: unknown[] }).journeyPaths)) return [];
    try { return [normalizeActualPathSnapshot({ ...(raw as Record<string, unknown>), schema: 'famme-journey-actual-paths-v1' } as never)]; } catch { return []; }
  });
  return normalizeWorkspace({
    ...base,
    id: data.id || base.id,
    journeys,
    performanceSnapshots,
    actualPathSnapshots,
    settings: {
      ...base.settings,
      showMiniMap: Boolean(data.settings?.showMinimap ?? base.settings.showMiniMap),
      snapToGrid: true,
      onboardingComplete: false
    }
  });
}

export interface LegacyMigrationReport {
  source: 'legacy-single-file';
  journeys: number;
  nodes: number;
  edges: number;
  tracking: number;
  creatives: number;
  crossJourneyLinks: number;
  performanceSnapshots: number;
  actualPathSnapshots: number;
  reviewItems: number;
  warnings: string[];
}

export function legacyMigrationReport(data: LegacyWorkspaceLike): LegacyMigrationReport {
  const journeys = data.journeys ?? [];
  let nodes = 0;
  let edges = 0;
  let tracking = 0;
  let creatives = 0;
  let reviewItems = 0;
  const warnings: string[] = [];
  const journeyIds = new Set(journeys.map(journey => journey.id).filter(Boolean));

  for (const journey of journeys) {
    const journeyNodes = journey.nodes ?? [];
    const nodeIds = new Set(journeyNodes.map(node => node.id).filter(Boolean));
    nodes += journeyNodes.length;
    edges += (journey.edges ?? []).length;
    tracking += (journey.tracking ?? []).length;
    if (!journey.name?.trim()) { reviewItems += 1; warnings.push('A journey had no name and received a fallback name.'); }
    for (const node of journeyNodes) {
      const data = node.data ?? {};
      const title = String(data.title ?? data.label ?? '').trim();
      if (!title) { reviewItems += 1; warnings.push(`Journey ${journey.name || journey.id || 'unknown'} contains a node without a label.`); }
      const rawCreatives = Array.isArray(data.creatives) ? data.creatives as LegacyCreative[] : [];
      creatives += rawCreatives.length;
    }
    for (const edge of journey.edges ?? []) {
      if (!edge.source || !edge.target || !nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        reviewItems += 1;
        warnings.push(`Journey ${journey.name || journey.id || 'unknown'} contains a connection that needs review.`);
      }
    }
  }

  let crossJourneyLinks = 0;
  for (const link of data.crossConnections ?? []) {
    if (link.sourceJourney && link.targetJourney && journeyIds.has(link.sourceJourney) && journeyIds.has(link.targetJourney)) crossJourneyLinks += 1;
    else {
      reviewItems += 1;
      warnings.push('A cross-journey connection could not be matched to both journeys.');
    }
  }

  return {
    source: 'legacy-single-file',
    journeys: journeys.length,
    nodes,
    edges,
    tracking,
    creatives,
    crossJourneyLinks,
    performanceSnapshots: Array.isArray(data.performanceSnapshots) ? data.performanceSnapshots.length : 0,
    actualPathSnapshots: Array.isArray(data.actualPathSnapshots) ? data.actualPathSnapshots.length : 0,
    reviewItems,
    warnings: [...new Set(warnings)].slice(0, 12)
  };
}

export function migrateLegacyWorkspaceWithReport(data: LegacyWorkspaceLike): { workspace: Workspace; report: LegacyMigrationReport } {
  return { workspace: migrateLegacyWorkspace(data), report: legacyMigrationReport(data) };
}

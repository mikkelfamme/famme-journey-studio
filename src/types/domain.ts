import type { Edge, Node } from '@xyflow/react';

export type WorkspaceScope = 'B2C' | 'B2B' | 'Mixed';
export type JourneyStatus = 'draft' | 'active' | 'paused' | 'archived';
export type FunnelStage = 'top' | 'middle' | 'bottom' | 'lifecycle';
export type AnnotationKind = 'comment' | 'decision' | 'todo' | 'hypothesis';
export type JourneyNodeType =
  | 'trigger'
  | 'need'
  | 'customerStep'
  | 'decision'
  | 'meta'
  | 'googleAds'
  | 'landingPage'
  | 'cta'
  | 'tracking'
  | 'conversion'
  | 'lead'
  | 'booking'
  | 'exclusion'
  | 'crm'
  | 'note';

export type MappingQuality = 'direct' | 'proxy' | 'unmapped';
export type MetricUnit = 'count' | 'currency' | 'percent' | 'duration' | 'ratio' | 'number';
export type MetricRole = 'acquisition' | 'engagement' | 'conversion' | 'revenue' | 'efficiency' | 'quality' | 'other';
export type MetricDirection = 'higher' | 'lower' | 'neutral';

export interface TrackingDefinition {
  id: string;
  platform: string;
  event: string;
  status: 'implemented' | 'validate' | 'missing' | 'planned';
  note?: string;
}

export interface CreativeDefinition {
  id: string;
  format: string;
  name: string;
  imageUrl?: string;
  imageDataUrl?: string;
  message?: string;
  headline?: string;
  description?: string;
  cta?: string;
  finalUrl?: string;
  audience?: string;
  status?: 'draft' | 'ready' | 'live' | 'paused';
}

export interface Annotation {
  id: string;
  kind: AnnotationKind;
  text: string;
  done?: boolean;
  createdAt: string;
}

export interface RuntimePerformanceSummary {
  source: string;
  quality: MappingQuality;
  metrics: Array<{ key: string; label: string; formatted: string }>;
}

export interface JourneyNodeData extends Record<string, unknown> {
  label: string;
  type: JourneyNodeType;
  stage: FunnelStage;
  description?: string;
  customerNeed?: string;
  communicationTask?: string;
  channel?: string;
  primaryCta?: string;
  landingPage?: string;
  url?: string;
  tracking: TrackingDefinition[];
  creatives: CreativeDefinition[];
  annotations: Annotation[];
  componentId?: string;
  componentSyncedAt?: string;
  runtimePerformance?: RuntimePerformanceSummary;
  runtimeActualCount?: number;
  runtimeActions?: { duplicate?: () => void; delete?: () => void };
}

export type JourneyNode = Node<JourneyNodeData, 'journey'>;
export interface JourneyEdgeData extends Record<string, unknown> {
  label?: string;
  condition?: string;
  signal?: string;
  timing?: string;
  comment?: string;
}
export type JourneyEdge = Edge<JourneyEdgeData>;

export interface JourneyPlanInputs {
  objective?: string;
  primaryMessage?: string;
  successCriteria?: string;
  dependencies?: string;
}

export interface CrossJourneyLink {
  id: string;
  sourceNodeId: string;
  targetJourneyId: string;
  targetNodeId?: string;
  label: string;
  condition?: string;
  audience?: string;
  window?: string;
  exitRule?: string;
}

export interface JourneyVersionSnapshot {
  name: string;
  description: string;
  audience: string;
  product: string;
  scope: WorkspaceScope;
  status: JourneyStatus;
  primaryConversion: string;
  owner: string;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  planInputs: JourneyPlanInputs;
  crossJourneyLinks: CrossJourneyLink[];
  annotations: Annotation[];
}

export interface JourneyVersion {
  id: string;
  label: string;
  note?: string;
  createdAt: string;
  snapshot: JourneyVersionSnapshot;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  audience: string;
  product: string;
  scope: WorkspaceScope;
  status: JourneyStatus;
  primaryConversion: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  planInputs: JourneyPlanInputs;
  crossJourneyLinks: CrossJourneyLink[];
  annotations: Annotation[];
  versions: JourneyVersion[];
}

export interface JourneyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  scope: WorkspaceScope;
  system: boolean;
  nodes: JourneyNode[];
  edges: JourneyEdge[];
  planInputs?: JourneyPlanInputs;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  description: string;
  nodeData: JourneyNodeData;
  createdAt: string;
  updatedAt: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  unit: MetricUnit;
  role: MetricRole;
  direction: MetricDirection;
  currency?: string;
  decimals?: number;
  primary?: boolean;
  description?: string;
}

export interface PerformanceSource {
  id?: string;
  name: string;
  generatedAt?: string;
  note?: string;
}

export interface NodePerformanceRecord {
  id: string;
  journeyId: string;
  nodeId: string;
  source: string;
  quality: MappingQuality;
  mappingNote?: string;
  metrics: Record<string, number>;
}

export interface JourneyPerformanceSummary {
  journeyId: string;
  mappedNodes?: number;
  note?: string;
  metrics?: Record<string, number>;
}

export interface PerformanceSnapshot {
  schema: 'famme-journey-performance-v1';
  id: string;
  generatedAt: string;
  period: string;
  sources: PerformanceSource[];
  nodeMetrics: NodePerformanceRecord[];
  journeyMetrics: JourneyPerformanceSummary[];
}

export interface MappingOverride {
  journeyId: string;
  nodeId: string;
  quality: MappingQuality;
  note?: string;
  updatedAt: string;
}

export interface ActualPathStep {
  nodeId?: string;
  label?: string;
}

export interface ObservedPath {
  id: string;
  label: string;
  count?: number;
  users?: number;
  sessions?: number;
  sharePct?: number;
  steps: ActualPathStep[];
}

export interface JourneyActualPaths {
  journeyId: string;
  paths: ObservedPath[];
}

export interface ActualPathSnapshot {
  schema: 'famme-journey-actual-paths-v1';
  id: string;
  generatedAt: string;
  period: string;
  source: string;
  journeyPaths: JourneyActualPaths[];
}

export type AppLanguage = 'en' | 'da';

export interface WorkspaceSettings {
  defaultView: 'journeys' | 'master' | 'templates';
  showMiniMap: boolean;
  snapToGrid: boolean;
  keyboardShortcuts: boolean;
  showPerformanceOverlay: boolean;
  activePerformanceSnapshotId?: string;
  comparePerformanceSnapshotId?: string;
  activeActualPathSnapshotId?: string;
  freshnessThresholdHours: number;
  onboardingComplete: boolean;
  demoWorkspace: boolean;
  language: AppLanguage;
}

export interface Workspace {
  schema: 'famme-journey-studio-workspace-v2';
  version: '2.0';
  id: string;
  name: string;
  organization: string;
  scope: WorkspaceScope;
  product: string;
  createdAt: string;
  updatedAt: string;
  author: 'Mikkel Famme';
  journeys: Journey[];
  templates: JourneyTemplate[];
  components: ComponentDefinition[];
  performanceSnapshots: PerformanceSnapshot[];
  metricDictionary: MetricDefinition[];
  mappingOverrides: MappingOverride[];
  actualPathSnapshots: ActualPathSnapshot[];
  settings: WorkspaceSettings;
}

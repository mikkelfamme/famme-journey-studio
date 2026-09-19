import type { Annotation, ComponentDefinition, Journey, JourneyNodeData, Workspace } from '../types/domain';
import { defaultMetricDictionary, ensureMetricDictionary } from './performance';

const now = () => new Date().toISOString();

function normalizeNodeData(data: JourneyNodeData): JourneyNodeData {
  const { runtimePerformance: _runtimePerformance, runtimeActualCount: _runtimeActualCount, ...persisted } = data as JourneyNodeData;
  return {
    ...persisted,
    tracking: Array.isArray(data.tracking) ? data.tracking : [],
    creatives: Array.isArray(data.creatives) ? data.creatives : [],
    annotations: Array.isArray(data.annotations) ? data.annotations : []
  } as JourneyNodeData;
}

function normalizeJourney(journey: Journey): Journey {
  return {
    ...journey,
    nodes: (journey.nodes ?? []).map(node => ({ ...node, data: normalizeNodeData(node.data) })),
    edges: journey.edges ?? [],
    planInputs: journey.planInputs ?? {},
    crossJourneyLinks: Array.isArray(journey.crossJourneyLinks) ? journey.crossJourneyLinks : [],
    annotations: Array.isArray(journey.annotations) ? journey.annotations : [],
    versions: Array.isArray(journey.versions) ? journey.versions : []
  };
}

function normalizeComponent(raw: ComponentDefinition & { node?: { data?: JourneyNodeData } }): ComponentDefinition {
  const nodeData = raw.nodeData ?? raw.node?.data;
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    nodeData: normalizeNodeData(nodeData ?? ({ label: raw.name, type: 'note', stage: 'middle', tracking: [], creatives: [], annotations: [] } as JourneyNodeData)),
    createdAt: raw.createdAt ?? now(),
    updatedAt: raw.updatedAt ?? now()
  };
}

export function normalizeWorkspace(workspace: Workspace): Workspace {
  const performanceSnapshots = Array.isArray(workspace.performanceSnapshots) ? workspace.performanceSnapshots : [];
  const dictionary = ensureMetricDictionary(Array.isArray(workspace.metricDictionary) ? workspace.metricDictionary : defaultMetricDictionary(), performanceSnapshots);
  return {
    ...workspace,
    author: 'Mikkel Famme',
    journeys: Array.isArray(workspace.journeys) ? workspace.journeys.map(normalizeJourney) : [],
    templates: Array.isArray(workspace.templates)
      ? workspace.templates.map(template => ({
          ...template,
          nodes: (template.nodes ?? []).map(node => ({ ...node, data: normalizeNodeData(node.data) })),
          edges: template.edges ?? []
        }))
      : [],
    components: Array.isArray(workspace.components) ? workspace.components.map(c => normalizeComponent(c as ComponentDefinition & { node?: { data?: JourneyNodeData } })) : [],
    performanceSnapshots,
    metricDictionary: dictionary,
    mappingOverrides: Array.isArray(workspace.mappingOverrides) ? workspace.mappingOverrides : [],
    actualPathSnapshots: Array.isArray(workspace.actualPathSnapshots) ? workspace.actualPathSnapshots : [],
    settings: {
      defaultView: workspace.settings?.defaultView ?? 'journeys',
      showMiniMap: workspace.settings?.showMiniMap ?? true,
      snapToGrid: workspace.settings?.snapToGrid ?? true,
      keyboardShortcuts: workspace.settings?.keyboardShortcuts ?? true,
      showPerformanceOverlay: workspace.settings?.showPerformanceOverlay ?? true,
      activePerformanceSnapshotId: workspace.settings?.activePerformanceSnapshotId,
      comparePerformanceSnapshotId: workspace.settings?.comparePerformanceSnapshotId,
      activeActualPathSnapshotId: workspace.settings?.activeActualPathSnapshotId,
      freshnessThresholdHours: workspace.settings?.freshnessThresholdHours ?? 48,
      onboardingComplete: workspace.settings?.onboardingComplete ?? true,
      demoWorkspace: workspace.settings?.demoWorkspace ?? false
    }
  };
}

export function newAnnotation(kind: Annotation['kind'], text: string): Annotation {
  return { id: crypto.randomUUID(), kind, text, createdAt: now(), done: false };
}

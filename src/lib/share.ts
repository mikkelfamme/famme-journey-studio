import type { CreativeDefinition, JourneyNode, Workspace } from '../types/domain';
import { normalizeWorkspace } from './migrate';

export interface PortfolioOptions {
  removePerformance: boolean;
  removeTrackingDetails: boolean;
  generalizePaidMedia: boolean;
  removeInternalNotes: boolean;
}

export const defaultPortfolioOptions: PortfolioOptions = {
  removePerformance: true,
  removeTrackingDetails: true,
  generalizePaidMedia: true,
  removeInternalNotes: true
};

function safeName(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'workspace';
}

function downloadBlob(text: string, filename: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function genericCreative(creative: CreativeDefinition, index: number): CreativeDefinition {
  return {
    ...creative,
    name: `Paid media creative ${index + 1}`,
    message: creative.message ? 'Creative message withheld in portfolio export.' : '',
    headline: creative.headline ? 'Creative headline withheld' : '',
    description: creative.description ? 'Creative description withheld.' : '',
    finalUrl: creative.finalUrl ? 'https://example.com/' : '',
    audience: creative.audience ? 'Audience definition withheld' : ''
  };
}

function sanitizeNode(node: JourneyNode, options: PortfolioOptions): JourneyNode {
  const data = structuredClone(node.data);
  if (options.removeTrackingDetails) {
    data.tracking = data.tracking.map((tracking, index) => ({
      ...tracking,
      id: tracking.id,
      platform: tracking.platform,
      event: `Measurement signal ${index + 1}`,
      note: ''
    }));
  }
  if (options.generalizePaidMedia && (data.type === 'meta' || data.type === 'googleAds')) {
    data.label = data.type === 'meta' ? 'Paid social' : 'Paid search';
    data.description = data.description ? 'Paid media activation step.' : '';
    data.creatives = data.creatives.map(genericCreative);
  }
  if (options.removeInternalNotes) data.annotations = [];
  return { ...node, data };
}

export function createPortfolioWorkspace(workspace: Workspace, options: PortfolioOptions = defaultPortfolioOptions): Workspace {
  const copy = structuredClone(workspace);
  copy.id = `${copy.id}-portfolio`;
  copy.name = `${copy.name} · Portfolio`;
  copy.updatedAt = new Date().toISOString();
  copy.journeys = copy.journeys.map(journey => ({
    ...journey,
    owner: options.removeInternalNotes ? '' : journey.owner,
    nodes: journey.nodes.map(node => sanitizeNode(node, options)),
    annotations: options.removeInternalNotes ? [] : journey.annotations,
    versions: options.removeInternalNotes ? [] : journey.versions,
    crossJourneyLinks: journey.crossJourneyLinks.map(link => ({ ...link }))
  }));
  copy.components = copy.components.map(component => ({
    ...component,
    nodeData: sanitizeNode({ id: 'portfolio-component', type: 'journey', position: { x: 0, y: 0 }, data: component.nodeData }, options).data
  }));
  if (options.removePerformance) {
    copy.performanceSnapshots = [];
    copy.actualPathSnapshots = [];
    copy.mappingOverrides = [];
    copy.settings.activePerformanceSnapshotId = undefined;
    copy.settings.comparePerformanceSnapshotId = undefined;
    copy.settings.activeActualPathSnapshotId = undefined;
  }
  copy.settings.demoWorkspace = false;
  copy.settings.onboardingComplete = true;
  return normalizeWorkspace(copy);
}

export function downloadShareWorkspace(workspace: Workspace) {
  const payload = JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2);
  downloadBlob(payload, `Journey-Studio-${safeName(workspace.organization || workspace.name)}-share.fjs`);
}

export function downloadPortfolioWorkspace(workspace: Workspace, options: PortfolioOptions) {
  const portfolio = createPortfolioWorkspace(workspace, options);
  downloadBlob(JSON.stringify(portfolio, null, 2), `Journey-Studio-${safeName(workspace.organization || workspace.name)}-portfolio.fjs`);
}

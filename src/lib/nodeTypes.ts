import type { FunnelStage, JourneyNodeType } from '../types/domain';

export type NodeTypeGroup = 'customer' | 'channels' | 'experience' | 'outcomes' | 'lifecycle';

export interface NodeTypeDefinition {
  type: JourneyNodeType;
  labelKey: string;
  descriptionKey: string;
  defaultStage: FunnelStage;
  group: NodeTypeGroup;
}

export const NODE_TYPE_DEFINITIONS: NodeTypeDefinition[] = [
  { type: 'trigger', labelKey: 'node.trigger', descriptionKey: 'nodeDesc.trigger', defaultStage: 'top', group: 'customer' },
  { type: 'need', labelKey: 'node.need', descriptionKey: 'nodeDesc.need', defaultStage: 'top', group: 'customer' },
  { type: 'audienceSegment', labelKey: 'node.audienceSegment', descriptionKey: 'nodeDesc.audienceSegment', defaultStage: 'top', group: 'customer' },
  { type: 'customerStep', labelKey: 'node.customerStep', descriptionKey: 'nodeDesc.customerStep', defaultStage: 'middle', group: 'customer' },
  { type: 'decision', labelKey: 'node.decision', descriptionKey: 'nodeDesc.decision', defaultStage: 'middle', group: 'customer' },
  { type: 'meta', labelKey: 'node.meta', descriptionKey: 'nodeDesc.meta', defaultStage: 'top', group: 'channels' },
  { type: 'googleAds', labelKey: 'node.googleAds', descriptionKey: 'nodeDesc.googleAds', defaultStage: 'top', group: 'channels' },
  { type: 'landingPage', labelKey: 'node.landingPage', descriptionKey: 'nodeDesc.landingPage', defaultStage: 'middle', group: 'experience' },
  { type: 'shopCheckout', labelKey: 'node.shopCheckout', descriptionKey: 'nodeDesc.shopCheckout', defaultStage: 'bottom', group: 'experience' },
  { type: 'physicalVisit', labelKey: 'node.physicalVisit', descriptionKey: 'nodeDesc.physicalVisit', defaultStage: 'middle', group: 'experience' },
  { type: 'cta', labelKey: 'node.cta', descriptionKey: 'nodeDesc.cta', defaultStage: 'bottom', group: 'experience' },
  { type: 'tracking', labelKey: 'node.tracking', descriptionKey: 'nodeDesc.tracking', defaultStage: 'bottom', group: 'experience' },
  { type: 'conversion', labelKey: 'node.conversion', descriptionKey: 'nodeDesc.conversion', defaultStage: 'bottom', group: 'outcomes' },
  { type: 'lead', labelKey: 'node.lead', descriptionKey: 'nodeDesc.lead', defaultStage: 'bottom', group: 'outcomes' },
  { type: 'booking', labelKey: 'node.booking', descriptionKey: 'nodeDesc.booking', defaultStage: 'bottom', group: 'outcomes' },
  { type: 'exclusion', labelKey: 'node.exclusion', descriptionKey: 'nodeDesc.exclusion', defaultStage: 'lifecycle', group: 'lifecycle' },
  { type: 'crm', labelKey: 'node.crm', descriptionKey: 'nodeDesc.crm', defaultStage: 'lifecycle', group: 'lifecycle' },
  { type: 'note', labelKey: 'node.note', descriptionKey: 'nodeDesc.note', defaultStage: 'middle', group: 'lifecycle' }
];

export const NODE_TYPE_GROUPS: Array<{ id: NodeTypeGroup; labelKey: string }> = [
  { id: 'customer', labelKey: 'palette.customer' },
  { id: 'channels', labelKey: 'palette.channels' },
  { id: 'experience', labelKey: 'palette.experience' },
  { id: 'outcomes', labelKey: 'palette.outcomes' },
  { id: 'lifecycle', labelKey: 'palette.lifecycle' }
];

export function nodeTypeDefinition(type: JourneyNodeType) {
  return NODE_TYPE_DEFINITIONS.find(item => item.type === type) ?? NODE_TYPE_DEFINITIONS[NODE_TYPE_DEFINITIONS.length - 1];
}

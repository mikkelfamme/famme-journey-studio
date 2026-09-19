import type { JourneyEdge, JourneyNode, JourneyTemplate, JourneyNodeType, FunnelStage } from '../types/domain';
import { makeId } from './ids';

function node(label: string, type: JourneyNodeType, stage: FunnelStage, x: number, y: number): JourneyNode {
  return {
    id: makeId('node'),
    type: 'journey',
    position: { x, y },
    data: { label, type, stage, description: '', tracking: [], creatives: [], annotations: [] }
  };
}

function connect(nodes: JourneyNode[]): JourneyEdge[] {
  return nodes.slice(0, -1).map((n, index) => ({
    id: makeId('edge'),
    source: n.id,
    target: nodes[index + 1].id,
    type: 'smoothstep'
  }));
}

function template(name: string, description: string, category: string, scope: 'B2C' | 'B2B' | 'Mixed', specs: Array<[string, JourneyNodeType, FunnelStage]>): JourneyTemplate {
  const nodes = specs.map((s, i) => node(s[0], s[1], s[2], 80 + i * 230, 120 + (i % 2) * 40));
  return {
    id: makeId('template'),
    name,
    description,
    category,
    scope,
    system: true,
    nodes,
    edges: connect(nodes)
  };
}

export const systemTemplates: JourneyTemplate[] = [
  template(
    'B2C purchase journey',
    'A generic acquisition-to-purchase structure for consumer journeys.',
    'Acquisition',
    'B2C',
    [
      ['Need / trigger', 'trigger', 'top'],
      ['Paid or organic discovery', 'googleAds', 'top'],
      ['Relevant landing page', 'landingPage', 'middle'],
      ['Consideration', 'decision', 'middle'],
      ['Primary CTA', 'cta', 'bottom'],
      ['Purchase', 'conversion', 'bottom'],
      ['Post-purchase / exclusion', 'exclusion', 'lifecycle']
    ]
  ),
  template(
    'Membership / subscription',
    'A reusable membership journey with direct purchase and lifecycle handoff.',
    'Membership',
    'B2C',
    [
      ['Awareness', 'trigger', 'top'],
      ['Membership research', 'landingPage', 'middle'],
      ['Value comparison', 'decision', 'middle'],
      ['Join / subscribe', 'cta', 'bottom'],
      ['Membership purchase', 'conversion', 'bottom'],
      ['Active member', 'crm', 'lifecycle']
    ]
  ),
  template(
    'B2B lead to sale',
    'A generic B2B path from active need through lead qualification and booking.',
    'Lead generation',
    'B2B',
    [
      ['Business need', 'need', 'top'],
      ['Search / discovery', 'googleAds', 'top'],
      ['Research offer', 'landingPage', 'middle'],
      ['Qualified enquiry', 'lead', 'bottom'],
      ['Sales dialogue', 'crm', 'bottom'],
      ['Booking / sale', 'booking', 'bottom'],
      ['Retention', 'crm', 'lifecycle']
    ]
  ),
  template(
    'Event conversion',
    'A generic event journey from awareness to registration or ticket purchase.',
    'Events',
    'B2C',
    [
      ['Event awareness', 'trigger', 'top'],
      ['Paid / owned promotion', 'meta', 'top'],
      ['Event details', 'landingPage', 'middle'],
      ['Availability / decision', 'decision', 'middle'],
      ['Register / buy', 'cta', 'bottom'],
      ['Conversion', 'conversion', 'bottom'],
      ['Confirmation', 'crm', 'lifecycle']
    ]
  )
];

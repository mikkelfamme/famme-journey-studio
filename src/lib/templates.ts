import type { JourneyEdge, JourneyNode, JourneyTemplate, JourneyNodeType, FunnelStage, WorkspaceScope } from '../types/domain';
import { makeId } from './ids';

const now = () => new Date().toISOString();

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

function template(name: string, description: string, category: string, scope: WorkspaceScope, tags: string[], specs: Array<[string, JourneyNodeType, FunnelStage]>): JourneyTemplate {
  const nodes = specs.map((s, i) => node(s[0], s[1], s[2], 80 + i * 230, 120 + (i % 2) * 40));
  const timestamp = now();
  return {
    id: makeId('template'),
    name,
    description,
    category,
    scope,
    system: true,
    version: '1.0.0',
    tags,
    author: 'Journey Studio by Famme',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes,
    edges: connect(nodes)
  };
}

export function createBlankTemplate(input: { name: string; description: string; category: string; scope: WorkspaceScope; version?: string; tags?: string[]; author?: string }): JourneyTemplate {
  const timestamp = now();
  return {
    id: makeId('template'),
    name: input.name.trim() || 'Untitled template',
    description: input.description.trim(),
    category: input.category.trim() || 'Custom',
    scope: input.scope,
    system: false,
    version: input.version?.trim() || '1.0.0',
    tags: (input.tags ?? []).map(tag => tag.trim()).filter(Boolean),
    author: input.author?.trim() || 'Local author',
    createdAt: timestamp,
    updatedAt: timestamp,
    nodes: [],
    edges: [],
    planInputs: {}
  };
}

export const systemTemplates: JourneyTemplate[] = [
  template('B2C purchase journey','A generic acquisition-to-purchase structure for consumer journeys.','Acquisition','B2C',['B2C','Acquisition','Purchase'],[
    ['Need / trigger','trigger','top'],['Paid or organic discovery','googleAds','top'],['Relevant landing page','landingPage','middle'],['Consideration','decision','middle'],['Primary CTA','cta','bottom'],['Purchase','conversion','bottom'],['Post-purchase / exclusion','exclusion','lifecycle']
  ]),
  template('Membership / subscription','A reusable membership journey with direct purchase and lifecycle handoff.','Membership','B2C',['B2C','Membership','Subscription'],[
    ['Awareness','trigger','top'],['Membership research','landingPage','middle'],['Value comparison','decision','middle'],['Join / subscribe','cta','bottom'],['Membership purchase','conversion','bottom'],['Active member','crm','lifecycle']
  ]),
  template('B2B lead to sale','A generic B2B path from active need through lead qualification and booking.','Lead generation','B2B',['B2B','Lead generation','Sales'],[
    ['Business need','need','top'],['Search / discovery','googleAds','top'],['Research offer','landingPage','middle'],['Qualified enquiry','lead','bottom'],['Sales dialogue','crm','bottom'],['Booking / sale','booking','bottom'],['Retention','crm','lifecycle']
  ]),
  template('Event conversion','A generic event journey from awareness to registration or ticket purchase.','Events','B2C',['Events','Registration','Ticketing'],[
    ['Event awareness','trigger','top'],['Paid / owned promotion','meta','top'],['Event details','landingPage','middle'],['Availability / decision','decision','middle'],['Register / buy','cta','bottom'],['Conversion','conversion','bottom'],['Confirmation','crm','lifecycle']
  ])
];

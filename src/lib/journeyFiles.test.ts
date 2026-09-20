import { describe, expect, it } from 'vitest';
import { parseJourneyData, serializeJourney } from './journeyFiles';
import type { Journey } from '../types/domain';

const journey: Journey = {
  id:'journey-a',name:'Shared journey',description:'Example',audience:'',product:'',scope:'B2C',status:'active',primaryConversion:'Purchase',owner:'',createdAt:'2026-09-20T00:00:00Z',updatedAt:'2026-09-20T00:00:00Z',
  nodes:[{id:'node-a',type:'journey',position:{x:80,y:120},data:{label:'Purchase',type:'conversion',stage:'bottom',tracking:[],creatives:[],annotations:[]}}],edges:[],planInputs:{},crossJourneyLinks:[],annotations:[],versions:[]
};

describe('portable single journeys',()=>{
  it('imports as an independent draft with fresh ids',()=>{
    const parsed=parseJourneyData(JSON.parse(serializeJourney(journey)));
    expect(parsed.id).not.toBe(journey.id);
    expect(parsed.nodes[0].id).not.toBe(journey.nodes[0].id);
    expect(parsed.status).toBe('draft');
    expect(parsed.name).toContain('Shared journey');
  });
});

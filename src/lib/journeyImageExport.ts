import type { FunnelStage, Journey, JourneyNodeType, NodeBackgroundTone } from '../types/domain';
import { STAGE_WORLD_BOUNDARIES, STAGE_WORLD_BOUNDARIES_VERTICAL } from './stageGeometry';
import { edgeLaneMap, journeyBounds, nodeSize, orthogonalEdgeRoute } from './graphGeometry';
import { redistributeJourneyEdgeHandles } from './flowHandles';

const PADDING = 90;
const STAGES: FunnelStage[] = ['top','middle','bottom','lifecycle'];
const STAGE_FILL: Record<FunnelStage,string> = { top:'#eef1ff', middle:'#edf6f9', bottom:'#edf8f3', lifecycle:'#fff7e9' };
const STAGE_LABEL: Record<FunnelStage,string> = { top:'TOP · DISCOVERY', middle:'MIDDLE · CONSIDERATION', bottom:'BOTTOM · ACTION', lifecycle:'LIFECYCLE' };
const NODE_FILL: Record<NodeBackgroundTone,string> = { white:'#ffffff', green:'#edf8f2', yellow:'#fff8dc', red:'#fff0ef', blue:'#eef4ff', gray:'#f1f3f5' };
const NODE_ACCENT: Partial<Record<JourneyNodeType,string>> = { meta:'#5865d9', googleAds:'#4d77cc', chatgpt:'#7357c7', landingPage:'#4c8796', shopCheckout:'#4c8796', physicalVisit:'#4c8796', cta:'#4c8796', tracking:'#4c8796', trackingPoint:'#4c8796', conversion:'#2d8067', lead:'#2d8067', booking:'#2d8067', exclusion:'#987027', crm:'#987027', note:'#a98332' };

function esc(value: string) { return value.replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]!)); }
function wrap(value: string, max = 28) {
  const words = value.trim().split(/\s+/); const lines:string[]=[]; let line='';
  for (const word of words) { const next=line?`${line} ${word}`:word; if (next.length>max && line) { lines.push(line); line=word; } else line=next; }
  if (line) lines.push(line); return lines.slice(0,2);
}

export function journeySvg(journey: Journey) {
  const b = journeyBounds(journey.nodes, PADDING, PADDING, PADDING);
  const nodeMap = new Map(journey.nodes.map(n => [n.id,n]));
  const edges = redistributeJourneyEdgeHandles(journey.nodes, journey.edges);
  const lanes = edgeLaneMap(edges, journey.nodes);
  const edgeSvg = edges.map(edge => {
    const s=nodeMap.get(edge.source), t=nodeMap.get(edge.target); if(!s||!t)return'';
    const route=orthogonalEdgeRoute(edge,s,t,lanes.get(edge.id) ?? 0);
    const attached=edge.data?.connectionStyle === 'attached';
    const label=edge.data?.label || edge.data?.signal || edge.data?.condition || '';
    return `<g><path d="${route.d}" fill="none" stroke="#718096" stroke-width="${attached ? 2.6 : 2}" stroke-linecap="round" stroke-linejoin="round" ${attached ? '' : 'marker-end="url(#arrow)"'}/>${label ? `<rect x="${route.mx-54}" y="${route.my-11}" width="108" height="20" rx="8" fill="#fff" stroke="#e1e6eb"/><text x="${route.mx}" y="${route.my+3}" text-anchor="middle" font-size="9" fill="#697482">${esc(String(label).slice(0,24))}</text>` : ''}</g>`;
  }).join('');
  const nodes=journey.nodes.map(node=>{
    const size=nodeSize(node); const compact=node.data.type==='trackingPoint'; const accent=NODE_ACCENT[node.data.type] ?? '#6d7f93'; const fill=NODE_FILL[node.data.backgroundTone ?? 'white']; const lines=wrap(node.data.label, compact ? 18 : 28);
    if (compact) return `<g transform="translate(${node.position.x},${node.position.y})"><rect width="${size.width}" height="${size.height}" rx="13" fill="${fill}" stroke="#cfd7df"/><rect width="4" height="${size.height}" rx="2" fill="${accent}"/><circle cx="19" cy="${size.height/2}" r="8" fill="${accent}" fill-opacity=".10"/><text x="34" y="${size.height/2+4}" font-size="11" font-weight="750" fill="#26313d">${esc(lines[0] ?? 'Tracking')}</text></g>`;
    return `<g transform="translate(${node.position.x},${node.position.y})"><rect width="${size.width}" height="${size.height}" rx="16" fill="${fill}" stroke="#d5dce4"/><rect width="${size.width}" height="4" rx="2" fill="${accent}"/><text x="18" y="27" font-size="9" font-weight="800" fill="#75808e">${esc(node.data.type.toUpperCase())}</text>${lines.map((line,i)=>`<text x="18" y="${54+i*18}" font-size="15" font-weight="750" fill="#18212e">${esc(line)}</text>`).join('')}<text x="${size.width-18}" y="27" text-anchor="end" font-size="9" font-weight="800" fill="#6b7582">${esc(node.data.stage.toUpperCase())}</text></g>`;
  }).join('');
  const vertical=(journey.layoutOrientation ?? 'horizontal')==='vertical';
  const boundaries=vertical?[b.minY,...STAGE_WORLD_BOUNDARIES_VERTICAL,b.maxY]:[b.minX,...STAGE_WORLD_BOUNDARIES,b.maxX];
  const stageRects=STAGES.map((stage,index)=>{if(vertical){const top=Math.max(b.minY,boundaries[index]);const bottom=Math.min(b.maxY,boundaries[index+1]);if(bottom<=top)return'';return `<g><rect x="${b.minX}" y="${top}" width="${b.width}" height="${bottom-top}" fill="${STAGE_FILL[stage]}"/><text x="${b.minX+18}" y="${top+28}" font-size="11" font-weight="800" fill="#52606d">${STAGE_LABEL[stage]}</text></g>`;}const left=Math.max(b.minX,boundaries[index]);const right=Math.min(b.maxX,boundaries[index+1]);if(right<=left)return'';return `<g><rect x="${left}" y="${b.minY}" width="${right-left}" height="${b.height}" fill="${STAGE_FILL[stage]}"/><text x="${left+18}" y="${b.minY+28}" font-size="11" font-weight="800" fill="#52606d">${STAGE_LABEL[stage]}</text></g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${b.minY} ${b.width} ${b.height}" width="${Math.round(b.width)}" height="${Math.round(b.height)}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#718096"/></marker></defs>${stageRects}${edgeSvg}${nodes}</svg>`;
}
function safeName(value:string){return value.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'journey';}
export function downloadJourneySvg(journey: Journey) {
  const blob=new Blob([journeySvg(journey)],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${safeName(journey.name)}.svg`; a.click(); URL.revokeObjectURL(url);
}
export async function downloadJourneyPng(journey: Journey) {
  const svg=journeySvg(journey); const blob=new Blob([svg],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob);
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not render image.'));i.src=url;});
  const max=3600; const scale=Math.min(2, max/Math.max(img.width,img.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale)); const ctx=canvas.getContext('2d'); if(!ctx)throw new Error('Canvas unavailable.'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url);
  const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG export failed.')),'image/png'));
  const pngUrl=URL.createObjectURL(png); const a=document.createElement('a'); a.href=pngUrl; a.download=`${safeName(journey.name)}.png`; a.click(); URL.revokeObjectURL(pngUrl);
}

import type { FunnelStage, Journey, JourneyNode, JourneyEdge } from '../types/domain';
import { STAGE_WORLD_BOUNDARIES } from './stageGeometry';

const NODE_W = 252;
const NODE_H = 108;
const PADDING = 90;
const STAGES: FunnelStage[] = ['top','middle','bottom','lifecycle'];
const STAGE_FILL: Record<FunnelStage,string> = { top:'#eef1ff', middle:'#edf6f9', bottom:'#edf8f3', lifecycle:'#fff7e9' };
const STAGE_LABEL: Record<FunnelStage,string> = { top:'TOP · DISCOVERY', middle:'MIDDLE · CONSIDERATION', bottom:'BOTTOM · ACTION', lifecycle:'LIFECYCLE' };

function esc(value: string) { return value.replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]!)); }
function wrap(value: string, max = 28) {
  const words = value.trim().split(/\s+/); const lines:string[]=[]; let line='';
  for (const word of words) { const next=line?`${line} ${word}`:word; if (next.length>max && line) { lines.push(line); line=word; } else line=next; }
  if (line) lines.push(line); return lines.slice(0,2);
}
function bounds(journey: Journey) {
  if (!journey.nodes.length) return { minX:0,minY:0,maxX:1200,maxY:700,width:1200,height:700 };
  const minX=Math.min(...journey.nodes.map(n=>n.position.x))-PADDING;
  const minY=Math.min(...journey.nodes.map(n=>n.position.y))-PADDING;
  const maxX=Math.max(...journey.nodes.map(n=>n.position.x+NODE_W))+PADDING;
  const maxY=Math.max(...journey.nodes.map(n=>n.position.y+NODE_H))+PADDING;
  return { minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY };
}
function edgePath(edge: JourneyEdge, source: JourneyNode, target: JourneyNode) {
  const sx=source.position.x+NODE_W, sy=source.position.y+NODE_H/2;
  const tx=target.position.x, ty=target.position.y+NODE_H/2;
  const mx=(sx+tx)/2;
  return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`;
}
export function journeySvg(journey: Journey) {
  const b=bounds(journey); const nodeMap=new Map(journey.nodes.map(n=>[n.id,n]));
  const edges=journey.edges.map(edge=>{const s=nodeMap.get(edge.source),t=nodeMap.get(edge.target); if(!s||!t)return'';return `<path d="${edgePath(edge,s,t)}" fill="none" stroke="#718096" stroke-width="2" marker-end="url(#arrow)"/>`;}).join('');
  const nodes=journey.nodes.map(node=>{const lines=wrap(node.data.label);return `<g transform="translate(${node.position.x},${node.position.y})"><rect width="${NODE_W}" height="${NODE_H}" rx="16" fill="#fff" stroke="#d5dce4"/><rect width="${NODE_W}" height="4" rx="2" fill="#596b86"/><text x="18" y="27" font-size="9" font-weight="800" fill="#75808e">${esc(node.data.type.toUpperCase())}</text>${lines.map((line,i)=>`<text x="18" y="${54+i*18}" font-size="15" font-weight="750" fill="#18212e">${esc(line)}</text>`).join('')}<text x="${NODE_W-18}" y="27" text-anchor="end" font-size="9" font-weight="800" fill="#6b7582">${esc(node.data.stage.toUpperCase())}</text></g>`;}).join('');
  const boundaries=[b.minX,...STAGE_WORLD_BOUNDARIES,b.maxX];
  const stageRects=STAGES.map((stage,index)=>{const left=Math.max(b.minX,boundaries[index]);const right=Math.min(b.maxX,boundaries[index+1]);if(right<=left)return'';return `<g><rect x="${left}" y="${b.minY}" width="${right-left}" height="${b.height}" fill="${STAGE_FILL[stage]}"/><text x="${left+18}" y="${b.minY+28}" font-size="11" font-weight="800" fill="#52606d">${STAGE_LABEL[stage]}</text></g>`;}).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX} ${b.minY} ${b.width} ${b.height}" width="${Math.round(b.width)}" height="${Math.round(b.height)}"><defs><marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#718096"/></marker></defs>${stageRects}${edges}${nodes}</svg>`;
}
function safeName(value:string){return value.trim().replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'')||'journey';}
export function downloadJourneySvg(journey: Journey) {
  const blob=new Blob([journeySvg(journey)],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`${safeName(journey.name)}.svg`; a.click(); URL.revokeObjectURL(url);
}
export async function downloadJourneyPng(journey: Journey) {
  const svg=journeySvg(journey); const blob=new Blob([svg],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob);
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not render image.'));i.src=url;});
  const max=2800; const scale=Math.min(2, max/Math.max(img.width,img.height)); const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale)); const ctx=canvas.getContext('2d'); if(!ctx)throw new Error('Canvas unavailable.'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url);
  const png=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG export failed.')),'image/png'));
  const pngUrl=URL.createObjectURL(png); const a=document.createElement('a'); a.href=pngUrl; a.download=`${safeName(journey.name)}.png`; a.click(); URL.revokeObjectURL(pngUrl);
}

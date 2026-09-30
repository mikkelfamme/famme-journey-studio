import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { JourneyEdge } from '../../types/domain';

export function JourneyEdgeComponent({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data, selected }: EdgeProps<JourneyEdge>) {
  const lane = typeof data?.routeLane === 'number' ? data.routeLane : 0;
  const laneOffset = lane * 18;
  const sourceHorizontal = sourcePosition === 'left' || sourcePosition === 'right';
  const targetHorizontal = targetPosition === 'left' || targetPosition === 'right';
  let d = '';
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  if (sourceHorizontal && targetHorizontal) {
    const midX = (sourceX + targetX) / 2 + laneOffset;
    d = `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    labelX = midX;
  } else if (!sourceHorizontal && !targetHorizontal) {
    const midY = (sourceY + targetY) / 2 + laneOffset;
    d = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
    labelY = midY;
  } else if (sourceHorizontal) {
    const elbowX = targetX + laneOffset;
    d = `M ${sourceX} ${sourceY} L ${elbowX} ${sourceY} L ${elbowX} ${targetY} L ${targetX} ${targetY}`;
    labelX = elbowX;
    labelY = sourceY;
  } else {
    const elbowY = targetY + laneOffset;
    d = `M ${sourceX} ${sourceY} L ${sourceX} ${elbowY} L ${targetX} ${elbowY} L ${targetX} ${targetY}`;
    labelX = sourceX;
    labelY = elbowY;
  }

  const label = data?.label || data?.signal || data?.condition || '';
  const attached = data?.connectionStyle === 'attached';
  return <>
    <BaseEdge id={id} path={d} markerEnd={attached ? undefined : markerEnd} style={{ ...style, strokeWidth: attached ? 2.6 : style?.strokeWidth }} />
    {label && <EdgeLabelRenderer><div className={`fjs-edge-label ${selected ? 'selected' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}>{String(label)}</div></EdgeLabelRenderer>}
  </>;
}

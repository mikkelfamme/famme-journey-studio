import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { JourneyEdge } from '../../types/domain';
import { orthogonalRouteFromAnchors, type FlowSide } from '../../lib/graphGeometry';

function asFlowSide(value: unknown): FlowSide {
  return value === 'left' || value === 'right' || value === 'top' || value === 'bottom' ? value : 'right';
}

export function JourneyEdgeComponent({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, data, selected }: EdgeProps<JourneyEdge>) {
  const lane = typeof data?.routeLane === 'number' ? data.routeLane : 0;
  const route = orthogonalRouteFromAnchors(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    asFlowSide(sourcePosition),
    asFlowSide(targetPosition),
    lane
  );

  const label = data?.label || data?.signal || data?.condition || '';
  const attached = data?.connectionStyle === 'attached';
  return <>
    <BaseEdge id={id} path={route.d} markerEnd={attached ? undefined : markerEnd} style={{ ...style, strokeWidth: attached ? 2.6 : style?.strokeWidth }} />
    {label && <EdgeLabelRenderer><div className={`fjs-edge-label ${selected ? 'selected' : ''}`} style={{ transform: `translate(-50%, -50%) translate(${route.mx}px,${route.my}px)` }}>{String(label)}</div></EdgeLabelRenderer>}
  </>;
}

import type { Journey, Workspace } from '../types/domain';
import { activeActualSnapshot, compareObservedPath, pathsForJourney } from './actual';
import { activePerformanceSnapshot, coverageForJourney } from './performance';

export function generateJourneyPlan(journey: Journey, allJourneys: Journey[] = [], workspace?: Workspace): string {
  const ordered = [...journey.nodes].sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
  const channels = [...new Set(ordered.filter(n => ['meta', 'googleAds'].includes(n.data.type)).map(n => n.data.type === 'meta' ? 'Meta' : 'Google Ads'))];
  const tracked = ordered.filter(n => n.data.tracking.length > 0).length;
  const creativeCount = ordered.reduce((sum, n) => sum + n.data.creatives.length, 0);
  const todoCount = ordered.reduce((sum, n) => sum + n.data.annotations.filter(a => a.kind === 'todo' && !a.done).length, 0);
  const flow = ordered.map(n => n.data.label).join(' → ');
  const links = journey.crossJourneyLinks.map(link => {
    const source = journey.nodes.find(n => n.id === link.sourceNodeId)?.data.label ?? 'Journey node';
    const targetJourney = allJourneys.find(j => j.id === link.targetJourneyId);
    const targetNode = targetJourney?.nodes.find(n => n.id === link.targetNodeId)?.data.label;
    return `${source} → ${targetJourney?.name ?? 'Unknown journey'}${targetNode ? ` / ${targetNode}` : ''} (${link.label})`;
  });
  const performance = workspace ? activePerformanceSnapshot(workspace) : undefined;
  const coverage = workspace ? coverageForJourney(workspace, journey.id, performance) : undefined;
  const actualSnapshot = workspace ? activeActualSnapshot(workspace) : undefined;
  const actualPaths = workspace ? pathsForJourney(workspace, journey.id, actualSnapshot) : [];
  const topPath = [...actualPaths].sort((a,b)=>(b.users??b.sessions??b.count??0)-(a.users??a.sessions??a.count??0))[0];
  const actualComparison = topPath ? compareObservedPath(journey, topPath) : undefined;
  const lines = [
    `# ${journey.name}`,
    '',
    journey.planInputs.objective ? `## Objective\n${journey.planInputs.objective}` : '',
    `## Journey\n${flow || 'No nodes added yet.'}`,
    `## Audience and scope\n${journey.audience || 'Audience not defined yet.'} Scope: ${journey.scope}.`,
    `## Channels\n${channels.length ? channels.join(', ') : 'No paid channel nodes selected yet.'}`,
    `## Conversion\nPrimary conversion: ${journey.primaryConversion || 'Not defined'}.`,
    `## Measurement\n${tracked} of ${journey.nodes.length} nodes currently contain tracking definitions. ${creativeCount} creative asset definition(s) are attached.`,
    coverage && performance ? `## Performance coverage\n${coverage.mapped} of ${coverage.total} nodes are mapped in ${performance.period}: ${coverage.direct} direct and ${coverage.proxy} proxy.` : '',
    actualComparison && actualSnapshot ? `## Planned vs Actual\n${actualPaths.length} observed path(s) are mapped for ${actualSnapshot.period}. The top observed path matches ${actualComparison.matchPct}% of the planned primary path, with ${actualComparison.missingPlanned.length} planned step(s) missing and ${actualComparison.unmappedActual.length} observed step(s) not mapped to the plan.` : '',
    links.length ? `## Cross-journey handoffs\n${links.map(x => `- ${x}`).join('\n')}` : '',
    todoCount ? `## Open work\n${todoCount} open TODO${todoCount === 1 ? '' : 's'} are attached to journey nodes.` : '',
    journey.planInputs.primaryMessage ? `## Primary message\n${journey.planInputs.primaryMessage}` : '',
    journey.planInputs.successCriteria ? `## Success criteria\n${journey.planInputs.successCriteria}` : '',
    journey.planInputs.dependencies ? `## Dependencies\n${journey.planInputs.dependencies}` : ''
  ];
  return lines.filter(Boolean).join('\n\n');
}

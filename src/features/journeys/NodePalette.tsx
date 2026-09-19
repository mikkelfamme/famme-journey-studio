import { Boxes } from 'lucide-react';
import type { ComponentDefinition, FunnelStage, JourneyNodeType } from '../../types/domain';

const items: Array<{ type: JourneyNodeType; label: string; stage: FunnelStage }> = [
  { type: 'trigger', label: 'Trigger', stage: 'top' },
  { type: 'need', label: 'Customer need', stage: 'top' },
  { type: 'customerStep', label: 'Customer step', stage: 'middle' },
  { type: 'meta', label: 'Meta', stage: 'top' },
  { type: 'googleAds', label: 'Google Ads', stage: 'top' },
  { type: 'landingPage', label: 'Landing page', stage: 'middle' },
  { type: 'decision', label: 'Decision', stage: 'middle' },
  { type: 'cta', label: 'CTA', stage: 'bottom' },
  { type: 'conversion', label: 'Conversion', stage: 'bottom' },
  { type: 'lead', label: 'Lead', stage: 'bottom' },
  { type: 'booking', label: 'Booking', stage: 'bottom' },
  { type: 'exclusion', label: 'Exclusion', stage: 'lifecycle' },
  { type: 'crm', label: 'CRM / Email', stage: 'lifecycle' },
  { type: 'tracking', label: 'Tracking signal', stage: 'bottom' },
  { type: 'note', label: 'Note', stage: 'middle' }
];

export function NodePalette({ onAdd, components, onAddComponent }: { onAdd: (type: JourneyNodeType, label: string, stage: FunnelStage) => void; components: ComponentDefinition[]; onAddComponent: (component: ComponentDefinition) => void }) {
  return (
    <aside className="editor-panel palette-panel">
      <div className="panel-heading">Add components</div>
      <div className="palette-list">
        {items.map(item => <button key={item.type} onClick={() => onAdd(item.type, item.label, item.stage)}>{item.label}<small>{item.stage}</small></button>)}
      </div>
      {components.length > 0 && <>
        <div className="panel-heading palette-library-heading"><Boxes size={12}/> Library</div>
        <div className="palette-list library-palette">
          {components.map(component => <button key={component.id} onClick={() => onAddComponent(component)}>{component.name}<small>{component.nodeData.type}</small></button>)}
        </div>
      </>}
    </aside>
  );
}

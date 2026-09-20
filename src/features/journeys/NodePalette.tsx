import { useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Flag, Layers3, LifeBuoy, Megaphone, Search, ShoppingCart, UserRound } from 'lucide-react';
import type { ComponentDefinition, FunnelStage, JourneyNodeType } from '../../types/domain';

type PaletteGroup = 'customer' | 'channels' | 'experience' | 'outcomes' | 'lifecycle';

type PaletteItem = { type: JourneyNodeType; label: string; stage: FunnelStage; group: PaletteGroup };

const items: PaletteItem[] = [
  { type: 'trigger', label: 'Trigger', stage: 'top', group: 'customer' },
  { type: 'need', label: 'Customer need', stage: 'top', group: 'customer' },
  { type: 'customerStep', label: 'Customer step', stage: 'middle', group: 'customer' },
  { type: 'decision', label: 'Decision', stage: 'middle', group: 'customer' },
  { type: 'meta', label: 'Meta', stage: 'top', group: 'channels' },
  { type: 'googleAds', label: 'Google Ads', stage: 'top', group: 'channels' },
  { type: 'landingPage', label: 'Landing page', stage: 'middle', group: 'experience' },
  { type: 'cta', label: 'CTA', stage: 'bottom', group: 'experience' },
  { type: 'tracking', label: 'Tracking signal', stage: 'bottom', group: 'experience' },
  { type: 'conversion', label: 'Conversion', stage: 'bottom', group: 'outcomes' },
  { type: 'lead', label: 'Lead', stage: 'bottom', group: 'outcomes' },
  { type: 'booking', label: 'Booking', stage: 'bottom', group: 'outcomes' },
  { type: 'exclusion', label: 'Exclusion', stage: 'lifecycle', group: 'lifecycle' },
  { type: 'crm', label: 'CRM / Email', stage: 'lifecycle', group: 'lifecycle' },
  { type: 'note', label: 'Note', stage: 'middle', group: 'lifecycle' }
];

const groups: Array<{ id: PaletteGroup; label: string; icon: typeof UserRound }> = [
  { id: 'customer', label: 'Customer', icon: UserRound },
  { id: 'channels', label: 'Channels', icon: Megaphone },
  { id: 'experience', label: 'Experience', icon: Layers3 },
  { id: 'outcomes', label: 'Outcomes', icon: ShoppingCart },
  { id: 'lifecycle', label: 'Lifecycle & ops', icon: LifeBuoy }
];

export function NodePalette({ onAdd, components, onAddComponent }: { onAdd: (type: JourneyNodeType, label: string, stage: FunnelStage) => void; components: ComponentDefinition[]; onAddComponent: (component: ComponentDefinition) => void }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const needle = query.trim().toLowerCase();
  const filteredItems = useMemo(() => needle ? items.filter(item => `${item.label} ${item.type} ${item.stage}`.toLowerCase().includes(needle)) : items, [needle]);
  const filteredComponents = useMemo(() => needle ? components.filter(component => `${component.name} ${component.description} ${component.nodeData.type}`.toLowerCase().includes(needle)) : components, [components, needle]);

  const toggle = (id: string) => setCollapsed(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <aside className="editor-panel palette-panel">
      <div className="palette-header">
        <div><span className="panel-heading">Add to journey</span><strong>Components</strong></div>
        <span className="palette-count">{items.length + components.length}</span>
      </div>
      <label className="palette-search" aria-label="Search components">
        <Search size={14}/>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search components…" />
      </label>

      <div className="palette-groups">
        {groups.map(group => {
          const groupItems = filteredItems.filter(item => item.group === group.id);
          if (groupItems.length === 0) return null;
          const Icon = group.icon;
          const isCollapsed = !needle && collapsed.has(group.id);
          return <section className={`palette-group ${isCollapsed ? 'collapsed' : ''}`} key={group.id}>
            <button type="button" className="palette-group-title" onClick={() => toggle(group.id)} aria-expanded={!isCollapsed}>
              <Icon size={13}/><span>{group.label}</span><small>{groupItems.length}</small>{isCollapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>} 
            </button>
            {!isCollapsed && <div className="palette-list">
              {groupItems.map(item => <button key={item.type} onClick={() => onAdd(item.type, item.label, item.stage)}>
                <span>{item.label}</span><small>{item.stage}</small>
              </button>)}
            </div>}
          </section>;
        })}
      </div>

      {components.length > 0 && <section className={`palette-group palette-library ${collapsed.has('library') && !needle ? 'collapsed' : ''}`}>
        <button type="button" className="palette-group-title" onClick={() => toggle('library')} aria-expanded={!collapsed.has('library')}>
          <Boxes size={13}/><span>Library</span><small>{filteredComponents.length}</small>{collapsed.has('library') && !needle ? <ChevronRight size={12}/> : <ChevronDown size={12}/>} 
        </button>
        {(!collapsed.has('library') || needle) && <div className="palette-list library-palette">
          {filteredComponents.map(component => <button key={component.id} onClick={() => onAddComponent(component)}><span>{component.name}</span><small>{component.nodeData.type}</small></button>)}
          {filteredComponents.length === 0 && <div className="palette-empty"><Flag size={14}/><span>No library matches</span></div>}
        </div>}
      </section>}
    </aside>
  );
}

import { useMemo, useState } from 'react';
import { Boxes, ChevronDown, ChevronRight, Flag, Layers3, LifeBuoy, Megaphone, Search, ShoppingCart, UserRound } from 'lucide-react';
import type { ComponentDefinition, FunnelStage, JourneyNodeType } from '../../types/domain';
import { NODE_TYPE_DEFINITIONS, NODE_TYPE_GROUPS, type NodeTypeGroup } from '../../lib/nodeTypes';
import { useI18n } from '../../i18n';

type PaletteGroup = NodeTypeGroup;
type PaletteItem = { type: JourneyNodeType; key: string; descriptionKey: string; stage: FunnelStage; group: PaletteGroup };

const items: PaletteItem[] = NODE_TYPE_DEFINITIONS.map(item => ({
  type: item.type,
  key: item.labelKey,
  descriptionKey: item.descriptionKey,
  stage: item.defaultStage,
  group: item.group
}));

const groupIcons: Record<PaletteGroup, typeof UserRound> = {
  customer: UserRound,
  channels: Megaphone,
  experience: Layers3,
  outcomes: ShoppingCart,
  lifecycle: LifeBuoy
};

const groups = NODE_TYPE_GROUPS.map(group => ({ ...group, key: group.labelKey, icon: groupIcons[group.id] }));

export function NodePalette({ onAdd, components, onAddComponent }: { onAdd: (type: JourneyNodeType, label: string, stage: FunnelStage) => void; components: ComponentDefinition[]; onAddComponent: (component: ComponentDefinition) => void }) {
  const { t, stage } = useI18n();
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const needle = query.trim().toLowerCase();
  const filteredItems = useMemo(() => needle ? items.filter(item => `${t(item.key)} ${item.type} ${stage(item.stage)}`.toLowerCase().includes(needle)) : items, [needle, t, stage]);
  const filteredComponents = useMemo(() => needle ? components.filter(component => `${component.name} ${component.description} ${component.nodeData.type}`.toLowerCase().includes(needle)) : components, [components, needle]);

  const toggle = (id: string) => setCollapsed(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  return (
    <aside className="editor-panel palette-panel">
      <div className="palette-header"><div><span className="panel-heading">{t('palette.add')}</span><strong>{t('palette.components')}</strong></div><span className="palette-count">{items.length + components.length}</span></div>
      <label className="palette-search" aria-label={t('palette.search')}><Search size={14}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('palette.search')} /></label>
      <div className="palette-groups">
        {groups.map(group => {
          const groupItems = filteredItems.filter(item => item.group === group.id);
          if (groupItems.length === 0) return null;
          const Icon = group.icon;
          const isCollapsed = !needle && collapsed.has(group.id);
          return <section className={`palette-group ${isCollapsed ? 'collapsed' : ''}`} key={group.id}>
            <button type="button" className="palette-group-title" onClick={() => toggle(group.id)} aria-expanded={!isCollapsed}><Icon size={13}/><span>{t(group.key)}</span><small>{groupItems.length}</small>{isCollapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}</button>
            {!isCollapsed && <div className="palette-list">{groupItems.map(item => <button key={item.type} title={t(item.descriptionKey)} onClick={() => onAdd(item.type, t(item.key), item.stage)}><span>{t(item.key)}</span><small>{stage(item.stage)}</small></button>)}</div>}
          </section>;
        })}
      </div>
      {components.length > 0 && <section className={`palette-group palette-library ${collapsed.has('library') && !needle ? 'collapsed' : ''}`}>
        <button type="button" className="palette-group-title" onClick={() => toggle('library')} aria-expanded={!collapsed.has('library')}><Boxes size={13}/><span>{t('palette.library')}</span><small>{filteredComponents.length}</small>{collapsed.has('library') && !needle ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}</button>
        {(!collapsed.has('library') || needle) && <div className="palette-list library-palette">{filteredComponents.map(component => <button key={component.id} onClick={() => onAddComponent(component)}><span>{component.name}</span><small>{component.nodeData.type}</small></button>)}{filteredComponents.length === 0 && <div className="palette-empty"><Flag size={14}/><span>No library matches</span></div>}</div>}
      </section>}
    </aside>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../i18n';

export interface CommandAction {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  shortcut?: string;
  run: () => void;
}

export function CommandPalette({ open, actions, onClose }: { open: boolean; actions: CommandAction[]; onClose: () => void }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions.slice(0, 60);
    return actions.filter(action => `${action.label} ${action.group} ${action.keywords ?? ''}`.toLowerCase().includes(needle)).slice(0, 80);
  }, [actions, query]);
  useEffect(() => { if (active >= filtered.length) setActive(0); }, [filtered.length, active]);
  if (!open) return null;
  function execute(index: number) {
    const action = filtered[index];
    if (!action) return;
    onClose();
    action.run();
  }
  return <div className="modal-backdrop command-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette"><div className="command-search"><Search size={18}/><input ref={inputRef} value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} placeholder={t('command.search')} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setActive(value => Math.min(filtered.length - 1, value + 1)); } if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(0, value - 1)); } if (event.key === 'Enter') { event.preventDefault(); execute(active); } if (event.key === 'Escape') onClose(); }}/><button className="icon-button" onClick={onClose} aria-label="Close command palette"><X size={16}/></button></div><div className="command-results">{filtered.length === 0 ? <div className="command-empty">No matching command.</div> : filtered.map((action, index) => <button key={action.id} className={`command-row ${index === active ? 'active' : ''}`} onMouseEnter={() => setActive(index)} onClick={() => execute(index)}><div><strong>{action.label}</strong><span>{action.group}</span></div>{action.shortcut && <kbd>{action.shortcut}</kbd>}</button>)}</div><div className="command-footer"><span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span></div></section></div>;
}

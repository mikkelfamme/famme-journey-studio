import { BarChart3, Boxes, FileText, GitBranch, LayoutDashboard, Settings, Share2, Sparkles, Waypoints } from 'lucide-react';
import { APP_VERSION } from '../lib/appMeta';

export type AppView = 'journeys' | 'master' | 'insights' | 'templates' | 'components' | 'share' | 'settings' | 'about';

const items: Array<{ id: AppView; label: string; icon: typeof GitBranch }> = [
  { id: 'journeys', label: 'Journeys', icon: GitBranch },
  { id: 'master', label: 'Master View', icon: LayoutDashboard },
  { id: 'insights', label: 'Insights & Data', icon: BarChart3 },
  { id: 'templates', label: 'Templates', icon: Waypoints },
  { id: 'components', label: 'Components', icon: Boxes },
  { id: 'share', label: 'Share & Portfolio', icon: Share2 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'about', label: 'About & Updates', icon: FileText }
];

export function Sidebar({ view, onView }: { view: AppView; onView: (view: AppView) => void }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">F</div>
        <div>
          <div className="brand-title">Famme</div>
          <div className="brand-subtitle">Journey Studio</div>
        </div>
      </div>
      <nav className="nav-list">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => onView(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <Sparkles size={14} />
        <span>{APP_VERSION}</span>
      </div>
    </aside>
  );
}

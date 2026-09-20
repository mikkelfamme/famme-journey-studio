import { BarChart3, Boxes, FileText, GitBranch, LayoutDashboard, Settings, Share2, Sparkles, Waypoints } from 'lucide-react';
import { APP_VERSION } from '../lib/appMeta';
import { useI18n } from '../i18n';

export type AppView = 'journeys' | 'master' | 'insights' | 'templates' | 'components' | 'share' | 'settings' | 'about';

const items: Array<{ id: AppView; key: string; icon: typeof GitBranch }> = [
  { id: 'journeys', key: 'nav.journeys', icon: GitBranch },
  { id: 'master', key: 'nav.master', icon: LayoutDashboard },
  { id: 'insights', key: 'nav.insights', icon: BarChart3 },
  { id: 'templates', key: 'nav.templates', icon: Waypoints },
  { id: 'components', key: 'nav.components', icon: Boxes },
  { id: 'share', key: 'nav.share', icon: Share2 },
  { id: 'settings', key: 'nav.settings', icon: Settings },
  { id: 'about', key: 'nav.about', icon: FileText }
];

export function Sidebar({ view, onView }: { view: AppView; onView: (view: AppView) => void }) {
  const { t } = useI18n();
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">JS</div>
        <div>
          <div className="brand-title">Journey Studio</div>
          <div className="brand-subtitle">by Famme</div>
        </div>
      </div>
      <nav className="nav-list">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => onView(item.id)}>
              <Icon size={18} />
              <span>{t(item.key)}</span>
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

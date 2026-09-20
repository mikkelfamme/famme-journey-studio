import { CheckCircle2, CloudOff, DownloadCloud, Github, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import { APP_AUTHOR, APP_BRAND, APP_NAME, APP_RELEASE_DATE, APP_RELEASE_NOTES, APP_VERSION } from '../lib/appMeta';

export function AboutView() {
  return <section className="content-section about-page">
    <div className="about-hero about-hero-polished">
      <div className="about-hero-copy">
        <div className="eyebrow">{APP_BRAND}</div>
        <h2>{APP_NAME}</h2>
        <p>Map the customer journey, channel architecture, tracking and observed behavior in one calm, local-first workspace.</p>
        <div className="about-meta-row"><span><Sparkles size={13}/> {APP_VERSION}</span><span><ShieldCheck size={13}/> Local-first</span><span><CloudOff size={13}/> Offline capable</span></div>
      </div>
      <div className="about-version-orb"><span>JS</span><strong>2.0</strong></div>
    </div>

    <div className="about-feature-grid">
      <article><div className="about-feature-icon"><Layers3 size={18}/></div><h3>One journey model</h3><p>Design customer flows, reusable components, measurement logic and cross-journey handoffs without splitting the architecture across separate tools.</p></article>
      <article><div className="about-feature-icon"><ShieldCheck size={18}/></div><h3>Local by default</h3><p>Workspace data stays in IndexedDB on the device unless the user explicitly exports or shares a portable <code>.fjs</code> file.</p></article>
      <article><div className="about-feature-icon"><DownloadCloud size={18}/></div><h3>Installable PWA</h3><p>Use the browser version or install the app when device policy allows it. Updates are delivered through the same public GitHub Pages release.</p></article>
      <article><div className="about-feature-icon"><Github size={18}/></div><h3>Public core</h3><p>The application code is designed for public distribution. Company-specific work belongs in portable workspaces, not in the product core.</p></article>
    </div>

    <div className="release-panel">
      <div className="release-panel-head"><div><span className="eyebrow-small">Product updates</span><h3>What changed</h3></div><div className="release-current"><CheckCircle2 size={15}/><span>Current · {APP_VERSION}</span></div></div>
      <div className="release-timeline">
        {APP_RELEASE_NOTES.map((release, index) => <article className="release-entry" key={release.version}>
          <div className={`release-dot ${index === 0 ? 'current' : ''}`}/>
          <div className="release-entry-body"><div className="release-entry-title"><strong>{release.version}</strong><span>{release.title}</span></div><ul>{release.items.map(item=><li key={item}>{item}</li>)}</ul></div>
        </article>)}
      </div>
    </div>

    <div className="about-footer-line"><span>Designed &amp; developed by <strong>{APP_AUTHOR}</strong></span><span>Release {APP_RELEASE_DATE} · MIT licensed public codebase</span></div>
  </section>;
}

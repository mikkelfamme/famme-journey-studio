import { APP_AUTHOR, APP_BRAND, APP_NAME, APP_VERSION } from '../lib/appMeta';

export function AboutView() {
  return <section className="content-section about-page">
    <div className="about-hero"><div className="eyebrow">{APP_BRAND}</div><h2>{APP_NAME}</h2><p>Visual customer journey architecture, channel planning, reusable components, measurement governance and observed behavior in one local-first workspace.</p></div>
    <div className="about-grid">
      <div><h3>Why it exists</h3><p>Customer journeys often end up split across presentations, ad platforms, analytics, tracking plans and disconnected diagrams. Journey Studio treats the journey itself as the shared data model.</p></div>
      <div><h3>Release Candidate architecture</h3><p>React + TypeScript + Vite + XYFlow + IndexedDB + PWA. The Release Candidate combines the visual editor, intelligence layer, sharing, recovery, migration and public distribution foundation.</p></div>
      <div><h3>Installable and portable</h3><p>Use it directly in a modern browser or install it as a PWA when the browser and device policy allow it. Workspaces remain portable as <code>.fjs</code> files, so the app does not require an account or hosted database.</p></div>
      <div><h3>Privacy model</h3><p>The public app has no backend or telemetry. Workspace data is stored locally in IndexedDB unless the user explicitly exports or shares a file.</p></div>
      <div><h3>Public distribution</h3><p>The repository is prepared for GitHub Pages. A push to <code>main</code> runs typecheck, tests and a production build before the Pages artifact is deployed.</p></div>
      <div><h3>Product identity</h3><p><strong>Designed &amp; developed by {APP_AUTHOR}.</strong><br/>MIT licensed for the public codebase.</p></div>
    </div>
    <div className="install-note"><strong>Install as an app</strong><span>When your browser offers installation, use the “Install app” control in the top bar. If installation is unavailable, the browser version remains fully usable.</span></div>
    <div className="version-box"><strong>{APP_NAME} {APP_VERSION}</strong><span>Public-safe core · no company-specific data bundled</span></div>
  </section>;
}

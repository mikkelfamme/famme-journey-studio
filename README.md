# Famme Journey Studio

**Visual customer journey architecture, channel planning, measurement design and observed-path analysis.**  
Designed & developed by **Mikkel Famme**.

> Current release: `2.0.0-rc.2`

Famme Journey Studio is a local-first application for modelling customer journeys as structured data rather than static diagrams. The public core is company-neutral: customer-specific journeys, campaign names, analytics and internal notes live in portable workspace/snapshot files rather than in the repository.

## Release Candidate 1

### Product foundation
- React + TypeScript + Vite
- XYFlow visual journey editor
- IndexedDB local persistence and rolling recovery snapshots
- installable PWA configuration with 192px/512px app icons
- blank workspaces and generic templates
- portable `.fjs` workspaces
- generic synthetic demo workspace
- guided first-run product tour

### Journey authoring
- four-sided node handles and reconnectable annotated edges
- multi-select, alignment, distribution and keyboard shortcuts
- tracking and creative definitions
- reusable Component Library with linked synchronization
- annotations, TODOs, decisions and hypotheses
- cross-journey handoffs
- Journey Health validation
- embedded versions, diff and restore
- generated journey plans
- editor undo/redo and unsaved-change warning

### Intelligence layer
- performance snapshots linked to stable journey/node IDs
- KPI Dictionary and metric semantics
- direct / proxy / unmapped mapping governance
- performance overlays on journey nodes
- active/comparison periods and freshness monitoring
- rule-based Opportunity & Gap Detection
- observed-path snapshots
- Planned vs Actual comparison
- performance and actual-path mapping exports

### Reliability and portability
- autosave state and manual save-now
- local recovery snapshots and render-crash recovery mode
- non-destructive import preview
- automatic migration from the previous single-file workspace format
- global command palette and contextual help
- full share and portfolio-safe exports
- public-safe onboarding and demo data

### Public distribution
- GitHub Actions CI gate
- GitHub Pages PWA deployment workflow
- tag-based production build artifact workflow
- native PWA install prompt surfaced inside the app when supported
- offline status indicator
- privacy, security, support and publishing documentation
- public issue and pull-request templates

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run typecheck
npm test
npm run build
npm run check:release
```

## Production PWA

```bash
npm run build
npm run preview
```

The production application is generated in `dist/`. The repository includes a GitHub Pages workflow that runs typecheck, tests and build before deployment.

## Publish on GitHub Pages

See [`docs/PUBLISHING.md`](docs/PUBLISHING.md). The repository uses relative Vite asset paths and does not require a hardcoded GitHub username or repository path.

## Install as an app

After a successful production deployment, supported browsers may offer Famme Journey Studio as an installable PWA. When available, the app surfaces an **Install app** button in the top bar. See [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

Installation can still be restricted by browser, operating-system or organization policy. Browser use remains the baseline distribution method.

## Workspace and data formats

```text
famme-journey-studio-workspace-v2
famme-journey-performance-v1
famme-journey-actual-paths-v1
```

The importer also recognizes the previous single-file Journey Studio workspace structure and migrates it to the 2.0 model.

Documentation:
- [`docs/QUICKSTART.md`](docs/QUICKSTART.md)
- [`docs/DATA-FORMATS.md`](docs/DATA-FORMATS.md)
- [`docs/MIGRATION.md`](docs/MIGRATION.md)
- [`docs/SHARING.md`](docs/SHARING.md)
- [`docs/RECOVERY.md`](docs/RECOVERY.md)
- [`docs/PUBLISHING.md`](docs/PUBLISHING.md)
- [`docs/INSTALLATION.md`](docs/INSTALLATION.md)

## Data-model principle

```text
PLANNED JOURNEY
      |
      +-- tracking / creatives / governance
      +-- reusable components
      +-- performance snapshots
      +-- KPI semantics
      +-- observed paths
      +-- Planned vs Actual
```

The journey architecture remains canonical. Imported performance and observed behavior are linked layers and never overwrite the plan.

## Distribution strategy

1. **Web / PWA** — primary public distribution.
2. **GitHub Pages** — hosted application and public demo.
3. **Portable `.fjs` files** — collaboration without a server account.
4. **Tauri desktop** — later Windows/macOS packaging around the same React core.

## Privacy

The public core has no backend, account system or telemetry. The active workspace is stored in the browser's IndexedDB. Nothing is uploaded by Famme Journey Studio itself. Sharing happens only when the user explicitly exports or sends a workspace/data file. See [`PRIVACY.md`](PRIVACY.md).

## Security

Do not upload confidential workspaces, credentials or company-sensitive data to public issues. See [`SECURITY.md`](SECURITY.md).

## License

MIT © 2026 Mikkel Famme

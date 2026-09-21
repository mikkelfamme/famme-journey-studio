## 2.0.0-rc.12.7

### Clearer component types
- Renames the node inspector field from **Type** to **Component type**.
- Groups component types by Customer, Channels, Experience, Outcomes and Lifecycle.
- Adds contextual help explaining what the selected component type means.
- Adds Audience / segment, Shop / checkout and Physical visit as new backwards-compatible node types.
- Adds icons, palette support, print styling and legacy normalization for the new types.

## 2.0.0-rc.12.6

### Real Windows desktop shortcut helper
- Replaces the browser app-manager guide with a real per-user Windows helper flow.
- Adds a one-time `Install-Journey-Studio-Helper.vbs` installer that uses HKCU/LocalAppData only and requires no administrator rights or PowerShell.
- Registers `journeystudio-helper://create-shortcut`, allowing Settings > Create desktop shortcut to call the helper directly.
- The helper locates the installed Journey Studio PWA shortcut in the Windows Start menu, copies it to the desktop as `Journey Studio.lnk`, and applies the JS icon.
- Includes a ZIP fallback for environments that block direct `.vbs` downloads.

## 2.0.0-rc.12.5

### Premium animated journey flow
- Restored subtle directional animation to journey connections in Editor, Template Editor and View mode.
- Increased line and arrowhead contrast so the journey path remains readable across stage backgrounds.
- Added stronger hover, selected and active-path states plus clearer edge labels.
- Respects the operating system reduced-motion preference.

## 2.0.0-rc.12.4

- Desktop shortcut flow is browser-aware instead of Edge-specific.
- Detects Chrome, Edge, Brave, Opera, Vivaldi, Chromium and generic browser fallbacks.
- Adds a universal Windows `shell:AppsFolder` fallback independent of browser choice.
- Removes the Edge-only launch action and never downloads fake Internet Shortcut files.


## 2.0.0-rc.12.2

- Re-established Journey Studio as a fresh PWA identity to avoid stale F-branded Windows app shortcuts.
- Versioned JS icon assets and a new manifest filename prevent old Chromium icon caches from being reused.
- Added App installation guidance and a real PWA install action in Settings.
- Clarified that downloaded `.url` / `.download` files are Internet Shortcuts, not Journey Studio installations.
## 2.0.0-rc.12.1 — Blank templates & JS shortcut icon

- All new custom templates start completely empty: 0 nodes and 0 connections.
- Journey Editor template creation no longer copies the current journey into a template.
- PWA manifest and HTML now reference new JS-branded icon filenames to bypass stale F icon caches.

## 2.0.0-rc.12 — Template Studio, sharing & presentation

- New custom templates start completely blank and are designed in a dedicated Template Editor.
- Adds Edit and Preview actions for both system and custom templates.
- Adds template metadata: semantic version, tags, author, created/updated timestamps.
- Adds a Template Gallery, import preview and repository-level `/templates` contribution folder.
- Adds portable single-journey `.jsjourney` export/import.
- Adds SVG and PNG journey export plus fullscreen Presentation Mode with node-by-node navigation.
- Extends the Command Palette into cross-workspace content search for nodes, tracking, creatives and URLs.
- Adds visual stage guardrails for nodes placed outside their assigned funnel stage.

## 2.0.0-rc.11 — Journey Studio identity & portable templates

- Renames the product to **Journey Studio by Famme** while the installed PWA/shortcut is simply **Journey Studio**.
- Replaces the F app mark with a JS mark across the product and PWA icon assets.
- Adds custom templates created from any existing journey.
- Adds single-template export/share as `.jstemplate` and single-template import into another workspace.
- Keeps template sharing independent from full workspace sharing.

## 2.0.0-rc.10 — Stage backdrop visibility hotfix

- Restores visible Top / Middle / Bottom / Lifecycle stage colours in both Editor and View.
- Keeps the stage backdrop synchronised with the React Flow viewport while zooming and panning.
- Makes React Flow canvas layers transparent so the stage backdrop remains visible behind nodes and edges.
- Darkens creative/TODO/count badges for better readability.
- Fixes the React Flow instance TypeScript build regression introduced in RC9.

## 2.0.0-rc.9 — Zoom-aligned stage backdrop

- Funnel stage colors now follow the same horizontal pan/zoom transform as journey nodes.
- Stage boundaries stay aligned with Top, Middle, Bottom and Lifecycle while zooming.
- Stage labels remain screen-readable while their horizontal position follows the canvas.
- Creative and TODO badges use darker, higher-contrast text.

## 2.0.0-rc.8 — Print fidelity

- Print/PDF preserves the saved journey layout instead of applying a separate compact layout.
- Orthogonal print connections respect saved source/target handles and use subtle arrowheads.
- Stage zones, node positions and relative spacing stay visually faithful to Edit/View.
- Editor-only controls remain excluded from print output.

## 2.0.0-rc.7 — Locked read-only viewer

- View mode is now fully locked: no node dragging, viewport panning, zoom gestures, reconnecting or selection dragging.
- Funnel stage backgrounds remain fixed and nodes can no longer be visually moved between stages in View.
- Read-only connection handles stay in the DOM but are invisible, so arrows render correctly without edit affordances.
- Node details open as an overlay and no longer resize the journey canvas.
- The stray selection/interaction artifact is suppressed in View mode.

## 2.0.0-rc.6 — Presentation & read-only view

- Rebuilt Print / Save PDF around a dedicated, page-optimized journey rendering.
- Print output now includes stage zones, arrows, edge labels and a compact details appendix.
- View mode is strictly read-only and no longer allows node movement or selection-box behavior.
- View connections now show stronger arrowheads and optional labels/conditions/signals.
- View node cards retain tracking/creative badges while the detail panel exposes full definitions and active URLs.

## 2.0.0-rc.5 — View mode, media & localization

- Canvas drag pans by default; Shift is reserved for multi-select.
- Larger journey nodes, tracking forms and creative cards.
- Stronger funnel-stage backgrounds for Top, Middle, Bottom and Lifecycle.
- Journey cards now support View, Edit, Rename, status changes, Duplicate and Delete.
- Dedicated read-only View mode with clickable node URLs and creative previews.
- Print / Save as PDF restored for journey viewing and editor output.
- Landing-page and paid-media nodes can store clickable URLs.
- Creative definitions support image URL or locally resized thumbnail uploads.
- English remains the default UI language; Danish is selectable in Settings.
- Locale JSON files live under `src/i18n/locales` for community editing on GitHub.

# Changelog

## 2.0.0-rc.3 — Journey Editor polish

- Redesigned journey nodes with clearer hierarchy, type icons, stage pills and subtler handles.
- Searchable and grouped component palette.
- Collapsible component palette and inspector.
- Refined editor toolbar, saved/unsaved state, edge styling and selection UI.
- Upgraded node inspector tabs, field layout and empty state.

## 2.0.0-rc.2 — Polish & updates

- Premium visual refresh across the public PWA and journey editor.
- In-app PWA update prompt with explicit **Update now** action.
- Offline-ready confirmation.
- About & Updates release timeline.
- GitHub tag release workflow and update/rollback documentation.


## 2.0.0-rc.2

### Added
- in-product PWA install prompt when supported by the browser
- offline status indicator
- 192px, 512px and maskable PWA icons
- GitHub publishing and installation documentation
- privacy, security and support policies
- public issue and pull-request templates
- tag-triggered production build artifact workflow
- public release checklist

### Changed
- GitHub Pages actions aligned with current official workflow versions
- release metadata and About page now identify RC2
- public distribution documentation consolidated around GitHub Pages/PWA

### Validation note
RC2 still requires a clean online GitHub Actions run before it should be treated as a production release.

## 2.0.0-beta.2

### Added
- autosave status and manual save-now action
- rolling local recovery snapshots
- crash recovery screen
- import preview for all supported data types
- explicit legacy migration reports
- global command palette
- contextual help drawer
- journey editor undo/redo
- unsaved-change warning when leaving the journey editor
- recovery and quick-start documentation
- Beta 2 integration tests

### Changed
- imports are now parsed and previewed before application
- workspace replacement is explicitly distinguished from additive snapshot imports
- editor selection-only changes no longer create undo history entries
- public product copy now identifies the current release as Beta 2

### Validation note
A dependency-backed `npm install` could not complete in the build environment because registry access timed out. The repository therefore relies on the included GitHub Actions workflow for the clean online dependency/type/test/build gate before public deployment.

## 2.0.0-beta.1
- public distribution layer
- legacy migration
- synthetic demo workspace
- guided onboarding
- share and portfolio exports
- initial automated tests and CI workflow

## 2.0.0-rc.4 — Editor UX & compact flow

- Added compact stage-aware Tidy Layout and Fit Journey controls.
- Added subtle funnel stage zones across the canvas.
- Added selected-node path highlighting with muted unrelated nodes and connections.
- Auto-collapses the properties inspector when nothing is selected.
- Simplified the top toolbar by grouping Plan, Health, Versions, Actual and Performance under Review.
- Enlarged and strengthened node typography while reducing canvas/grid noise.
- Added selected-node quick actions for duplicate and delete.
- Minimap now appears only on larger journeys.

## 2.0.0-rc.12.3
- Restored an explicit Create desktop shortcut action in Settings.
- Removed fake shortcut downloads from the shortcut workflow; Windows/Edge now owns creation of the real installed-app shortcut.
- Added a guided Edge Apps shortcut flow with clipboard fallback.

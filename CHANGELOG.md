# Changelog

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

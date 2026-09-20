# Famme Journey Studio 2.0.0-rc.2

RC2 is the visual-polish and update-management release candidate.

## Product experience

- Refined visual system with calmer surfaces, stronger hierarchy and a more premium Scandinavian SaaS feel.
- Improved sidebar, top bar, cards, forms, empty states, onboarding and responsive behavior.
- Journey editor polish: clearer canvas, elevated nodes, improved selection states, cleaner panels and controls.
- New About & Updates experience with version timeline and product identity.

## Updates and release management

- PWA changed from silent auto-update to an explicit update prompt.
- Installed users see **New version ready** and can select **Update now**.
- Offline-ready confirmation after the service worker caches the application.
- Version shown from the shared app metadata source.
- GitHub tag release workflow creates source and built-PWA release artifacts.
- Added `docs/UPDATES.md` with versioning, deployment and rollback guidance.
- IndexedDB upgraded with a dedicated migration-backup store for future schema changes.

## Validation in this build environment

- 55 TypeScript/TSX files syntax-transpiled successfully.
- All relative imports resolve.
- GitHub workflow YAML parses successfully.
- Public core contains no company-specific workspace data.

The full dependency-backed build remains gated by GitHub Actions, which is the canonical production build environment for the public repository.

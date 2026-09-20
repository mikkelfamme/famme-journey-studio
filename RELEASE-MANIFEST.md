# Release manifest — 2.0.0-rc.2

## Release goal
Prepare the source tree for its first public GitHub Pages / installable PWA deployment.

## Included release surfaces
- React/TypeScript application source
- generic demo only; no company-specific workspace bundled
- GitHub CI quality gate
- GitHub Pages deployment workflow
- tag-triggered production build artifact workflow
- PWA manifest and 192px/512px icons
- in-product install prompt and offline indicator
- public privacy/security/support documentation
- public issue and pull-request templates
- explicit public-release checklist

## Required online gate
The current generation environment cannot reach the npm registry reliably. The release is therefore not considered production-validated until GitHub Actions successfully completes dependency installation, typecheck, tests, Vite build and Pages deployment.

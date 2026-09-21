# Release manifest — 2.0.0-rc.12.8

## Release goal
Make journey flow direction unambiguous and support clean branch/merge structures without introducing artificial nodes.

## Included release surfaces
- React/TypeScript application source
- 10 directional connection ports per journey node
- automatic legacy/missing-handle normalization
- split/fan-out and merge/fan-in connection support
- updated Print/PDF connection anchoring
- existing RC12.7 component-type improvements
- existing Windows desktop-shortcut helper
- GitHub CI quality gate
- GitHub Pages deployment workflow
- PWA manifest and JS app icons

## Compatibility
- Existing `.fjs`, `.jstemplate` and `.jsjourney` schemas are unchanged.
- Existing IndexedDB/database keys are unchanged.
- Legacy handle IDs and handle-less edges are normalized at load/import time.

## Connection grammar
- Incoming: top x3, left x2.
- Outgoing: bottom x3, right x2.
- Multiple edges may share the same port to create visual split/merge flows.

## Required online gate
Run the normal GitHub Actions TypeScript/test/Vite build before treating this release as deployed.

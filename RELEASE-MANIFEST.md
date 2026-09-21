# Release manifest — 2.0.0-rc.12.9

## Release goal
Add purposeful, readable per-node background colors without changing the journey data model or sacrificing text/icon contrast.

## Included release surfaces
- React/TypeScript application source
- per-node background color control in the General inspector
- White, Green, Yellow, Red, Blue and Gray soft tint presets
- Editor, Template Editor, View/Presentation and Print/PDF rendering support
- existing RC12.8 directional connection ports and split/merge support
- existing RC12.7 component-type improvements
- existing Windows desktop-shortcut helper
- GitHub CI quality gate
- GitHub Pages deployment workflow
- PWA manifest and JS app icons

## Compatibility
- Existing `.fjs`, `.jstemplate` and `.jsjourney` schemas are unchanged.
- Existing IndexedDB/database keys are unchanged.
- `backgroundTone` is optional. Existing nodes therefore remain white automatically.
- Component Library nodes preserve the selected background tone because node data is stored with the component.

## Background presets
- White — neutral/default
- Green — positive/approved/desired state
- Yellow — attention/review
- Red — blocker/risk/problem
- Blue — emphasis/information
- Gray — secondary/supporting step

## Required online gate
Run the normal GitHub Actions TypeScript/test/Vite build before treating this release as deployed.

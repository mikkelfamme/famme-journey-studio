# Release manifest — 2.0.0-rc.12.10.1

## Release goal
Hotfix the RC12.10 TypeScript build failure while preserving the Master View governance details and Insights & Data onboarding unchanged.

## Included release surfaces
- React/TypeScript application source
- Master View governance explainer
- clickable HEALTH / TODO / HANDOFF / % MAPPED details
- Insights & Data onboarding and local-first data-flow guide
- direct Performance-map and Actual-path-map exports from Insights
- direct Import Data access from Insights using the existing preview/import workflow
- updated contextual help
- existing RC12.9 node background colors
- existing RC12.8 directional split/merge ports
- existing RC12.7 component-type improvements
- existing Windows desktop-shortcut helper
- GitHub CI and Pages deployment workflows

## Compatibility
- Existing `.fjs`, `.jstemplate` and `.jsjourney` schemas are unchanged.
- Existing IndexedDB/database keys are unchanged.
- Existing performance and actual-path snapshot schemas are unchanged.
- No migration is required.

## Master View definitions
- HEALTH — automated validation findings for journey structure, tracking, paid nodes and conversion logic.
- TODO — unfinished TODO annotations attached to journey components.
- HANDOFF — explicit cross-journey links.
- % MAPPED — share of journey nodes with Direct or Proxy mappings in the active performance snapshot.

## Insights data model
Journey Studio remains local-first. External analytics sources are mapped outside the app using stable journey/node IDs exported by Journey Studio, then imported as performance or actual-path snapshots.

## Required online gate
Run the normal GitHub Actions TypeScript/test/Vite build before treating this release as deployed.

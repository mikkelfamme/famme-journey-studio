# Release manifest — 2.0.0-rc.12.10.2

## Release goal
Make the local-first data workflow operational for non-technical users by showing exactly what to download, what to give an AI, which prompt to use, and which generated file to import.

## Included release surfaces
- RC12.10.1 Master View build hotfix
- RC12.10 Master View governance details and Insights onboarding
- explicit Performance workflow: mapping file + measurement data + copyable AI prompt + snapshot import
- explicit Actual Path workflow: mapping file + sequence/path data + copyable AI prompt + snapshot import
- exact snapshot schema guidance and no-invention rules
- existing component colors, directional split/merge ports and component-type improvements

## Compatibility
- Existing `.fjs`, `.jstemplate` and `.jsjourney` schemas are unchanged.
- Existing IndexedDB/database keys are unchanged.
- Performance and actual-path snapshot schemas are unchanged.
- Mapping export schemas are unchanged.
- No migration is required.

## Required online gate
Run the normal GitHub Actions TypeScript/test/Vite build before treating this release as deployed.

# Release manifest — 2.0.0-rc.12.14

Source baseline: Journey Studio by Famme 2.0.0-rc.12.13.1.

Primary RC12.14 change:
- all ten physical node ports are bidirectional
- top, left, bottom and right ports can each start or receive an arrow
- loose XYFlow connection mode is used in Journey Editor, Template Editor and Viewer
- saved opposite-role handles are preserved rather than normalized away
- Tidy/export routing can distribute both endpoints across all ten ports
- historical handle IDs are retained for backwards compatibility


Schemas preserved:
- famme-journey-studio-workspace-v2
- journey-studio-journey-v1
- journey-studio-template-v1
- famme-journey-performance-v1
- famme-journey-actual-paths-v1

- Hotfix: restores `createBlankJourney` export required by JourneysView variants.

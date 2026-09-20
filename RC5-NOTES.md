# Famme Journey Studio 2.0.0-rc.5

RC5 focuses on day-to-day usability and shareable presentation of customer journeys.

## Highlights
- Background dragging pans the canvas instead of moving multi-selected nodes.
- Read-only View mode separates presentation from editing.
- URLs and ad/creative thumbnails are visible and clickable in View mode.
- Print / Save as PDF is available again.
- Journey cards have real action menus, rename and explicit journey status.
- Tracking and creative editing is larger and easier to read.
- Funnel-stage color zones are more visible.
- English/Danish localization uses editable JSON locale files.

## Localization
English is the default. Danish can be selected per workspace in Settings. Translation source files are `src/i18n/locales/en.json` and `src/i18n/locales/da.json`, making wording changes easy to contribute through GitHub. User-created content is never auto-translated.

## Media storage
Uploaded creative images are resized in-browser before being stored as a thumbnail in the local workspace. This keeps portable `.fjs` files reasonably small while retaining visual previews.

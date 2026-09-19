# Famme Journey Studio 2.0.0-beta.2

Beta 2 is the release-hardening milestone before public GitHub/PWA publication.

## Added

- Local autosave state: Saving / Saved / Error.
- Debounced IndexedDB persistence plus save-on-background.
- Rolling local recovery snapshots (last 5 saved states).
- Recovery UI and crash recovery fallback.
- Import preview for current workspaces, legacy workspaces, performance snapshots and actual-path snapshots.
- Legacy migration report with counts and review warnings before import.
- Global command palette (`Ctrl/Cmd + K`) with navigation, workspace actions and journey search.
- Contextual help drawer (`?`).
- Journey editor undo/redo (`Ctrl/Cmd + Z`, `Ctrl/Cmd + Y` or `Shift + Cmd/Ctrl + Z`).
- Clearer empty states for architecture views.
- Beta 2 integration tests covering migration preview and portfolio sanitization.
- `npm run check:release` release gate.

## Recovery model

The active workspace is stored in IndexedDB. Before a newer workspace state replaces the active state, the previous saved state is retained as a recovery snapshot. The five newest recovery snapshots are kept locally. Recovery data is local to the browser profile and is not included in public source code.

## Import safety

Selecting a file no longer immediately mutates the workspace. The file is parsed and classified first. A preview describes what will be imported and whether the active workspace will be replaced. Legacy files include a migration report and review warnings before confirmation.

## Public-release direction

Beta 2 intentionally focuses on reliability and user confidence rather than adding another analytics module. The next milestone is repository publication, dependency-backed CI validation, GitHub Pages deployment and PWA install verification.

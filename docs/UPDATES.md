# Updating Famme Journey Studio

Famme Journey Studio is distributed as a PWA from GitHub Pages. End users do not run npm, PowerShell or installers.

## Release flow

1. Make changes in source.
2. Commit changes to a non-production branch when possible.
3. Let CI run typecheck, tests and production build.
4. Review the change and merge to `main` only when ready.
5. GitHub Pages deploys `main` automatically.
6. Installed PWAs detect the new service worker and show **New version ready**.
7. The user selects **Update now**. Local IndexedDB workspaces are preserved.

## Versioning

- Patch (`2.0.0` → `2.0.1`): bug fixes.
- Minor (`2.0` → `2.1`): compatible features.
- Major (`2.x` → `3.0`): substantial product or data-model changes.

## Workspace migrations

Do not silently discard fields. `normalizeWorkspace()` is the compatibility boundary for current workspaces. If a future release changes the persisted schema, add an explicit migration and retain a pre-migration recovery copy before writing the transformed workspace.

## Rollback

Git history is the source of truth. If a release fails after deployment:

1. Revert the offending commit or restore the last known-good source.
2. Commit to `main`.
3. Wait for CI + Pages deployment to go green.
4. The PWA update prompt will offer the restored build.

A rollback must not intentionally downgrade or mutate the user's local workspace schema unless an explicit reverse migration exists.

### Automatic pre-migration safety copy

The local database includes a dedicated `migration-backup` store. If the app opens a persisted workspace whose schema/version differs from the current 2.0 schema, the raw workspace is copied there before normalization runs. This is separate from the rolling recovery snapshots used during normal editing.

# Autosave and recovery

Famme Journey Studio is local-first. The active workspace is persisted to IndexedDB in the browser profile.

## Autosave states

The top bar exposes three meaningful states:

- **Saving…** — a local write is pending.
- **Saved** — the current workspace has been persisted locally.
- **Save error** — the in-memory workspace is still available, but the local write failed.

Autosave is debounced during rapid edits and is also attempted when the tab/app moves to the background.

## Recovery snapshots

Before a newer workspace state replaces the active saved state, the previous state is copied into a rolling recovery store. The five most recent local recovery snapshots are retained.

Recovery snapshots are available in **Settings → Recovery snapshots**. Restoring a snapshot replaces the active local workspace after explicit confirmation.

## Crash recovery

A React error boundary prevents a render crash from producing a blank screen. Recovery mode offers:

1. reload the application; or
2. restore the latest local recovery snapshot.

Recovery snapshots are browser-local. They are not a substitute for a portable `.fjs` export.

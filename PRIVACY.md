# Privacy

Famme Journey Studio is designed as a local-first application.

## Public application behavior

- The public core has no user account system.
- The public core has no analytics or telemetry by default.
- The active workspace is stored locally in the browser using IndexedDB.
- Workspace, performance and actual-path files are only shared when the user explicitly exports or sends them.
- GitHub Pages hosts the application files; it is not used as a workspace database.

## Sensitive workspaces

A `.fjs` file may contain business-sensitive journey architecture, tracking definitions, creative notes or imported performance data. Treat exported workspace and snapshot files according to the data policies of the organization that owns the data.

Public bug reports should never include confidential workspace files or internal company data.

# Sharing and portfolio exports

Famme Journey Studio separates the public application from company-specific workspace data.

## Full share workspace

Use **Share & Portfolio -> Export share workspace** when the recipient should receive the complete working model. This can include:

- journeys and templates
- tracking and creatives
- annotations and versions
- imported performance snapshots
- observed paths
- mapping governance

The recipient imports the `.fjs` file into their own Famme Journey Studio instance.

## Portfolio-safe workspace

The portfolio exporter creates a copy and never edits the active workspace. The user can choose to:

- remove performance and observed-path data
- replace tracking event names with generic measurement labels
- generalize paid-media node and creative details
- remove internal notes, TODOs and journey versions

This makes it possible to demonstrate the product and architecture without intentionally exposing working data.

## Hosted app + workspace file

Once published as a PWA, the recommended sharing model is:

```text
Public Famme Journey Studio URL
             +
portable .fjs workspace
```

The application remains generic while each organization owns its own data file.

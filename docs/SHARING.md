# Sharing and portfolio exports

Journey Studio by Famme separates the public application from company-specific workspace data.

## Full share workspace

Use **Share & Portfolio -> Export share workspace** when the recipient should receive the complete working model. This can include:

- journeys and templates
- tracking and creatives
- annotations and versions
- imported performance snapshots
- observed paths
- mapping governance

The recipient imports the `.fjs` file into their own Journey Studio by Famme instance.

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
Public Journey Studio by Famme URL
             +
portable .fjs workspace
```

The application remains generic while each organization owns its own data file.

## Share one journey

From **Journeys** or **Share & Portfolio**, export a single journey as `.jsjourney`. The recipient imports it from the Journeys page. This does not expose other journeys, templates, performance snapshots or workspace settings.

## Share one template

From **Templates**, use **Share** to export one `.jstemplate`. Imported templates are assigned a new local id and become editable local templates.

## Community templates

The public repository reserves `/templates` for company-neutral `.jstemplate` contributions. Export a template from the app, remove confidential data, then add the file through a pull request.

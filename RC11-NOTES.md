# Journey Studio by Famme 2.0.0-rc.11

RC11 focuses on product identity and reusable template portability.

## Product identity

- Product name: **Journey Studio by Famme**
- Installed PWA / shortcut name: **Journey Studio**
- App mark: **JS**
- Existing workspace schemas and IndexedDB identifiers are intentionally unchanged for backwards compatibility.

## Custom templates

Templates can now be created from an existing journey. The created template is an independent copy and does not stay linked to the source journey.

Each template can be shared individually as a `.jstemplate` file. Importing the file creates a new local custom template with a fresh template ID, so it can coexist with the source template and with system templates.

System templates can also be exported and, when imported, become ordinary custom templates.

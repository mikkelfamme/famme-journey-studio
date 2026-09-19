# Migration

## Previous single-file Journey Studio workspaces

Beta 1 can import JSON backups produced by the earlier single-file prototype. The importer detects the legacy shape instead of relying on a company-specific name.

The migration converts:

- journeys
- canvas coordinates
- node types and funnel stages
- edges and edge metadata
- journey-level tracking definitions into node-level tracking
- creatives
- owner, audience, product, status and scope
- cross-journey connections where a source node can be resolved
- embedded performance/actual-path snapshots when their structure is recognizable

Legacy node types are mapped to the current domain model, for example:

```text
customer-step  -> customerStep
google-ads     -> googleAds
landing-page   -> landingPage
crm-email      -> crm
```

The imported workspace is independent of the original file. Export it again as `.fjs` after reviewing the migration.

## Migration limits

Some old prototype concepts were presentation-only and have no direct 2.0 equivalent. Beta 1 preserves the operational journey model rather than pixel-perfect legacy UI state. Review cross-journey links and any old print-only settings after migration.

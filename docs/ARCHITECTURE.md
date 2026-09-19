# Architecture

## Core principle

A journey is structured data. The editor, plan, Master View, tracking context, performance metrics and observed-path analysis all reference the same stable journey and node IDs.

## Client architecture

```text
React / TypeScript
    |
    +-- WorkspaceContext
    |      |
    |      +-- IndexedDB persistence
    |
    +-- Journey Editor (XYFlow)
    |      +-- nodes / edges
    |      +-- tracking
    |      +-- creatives
    |      +-- annotations
    |      +-- cross-journey handoffs
    |      +-- health validation
    |      +-- versions
    |      +-- performance overlay
    |      +-- Planned vs Actual panel
    |
    +-- Templates
    +-- Master View
    +-- Component Library
    +-- Insights & Data
           +-- performance snapshots
           +-- KPI Dictionary
           +-- Mapping Center
           +-- freshness
           +-- opportunities
           +-- observed paths
```

The public core has no server dependency and no telemetry.

## Intelligence-layer separation

The planned journey is never replaced by analytics data.

```text
Journey / node stable IDs
          |
          +--> Performance snapshot
          |       +-- source
          |       +-- mapping quality
          |       +-- metrics
          |
          +--> Mapping override
          |       +-- governance quality
          |       +-- note
          |
          +--> Actual-path snapshot
                  +-- observed sequence
                  +-- users / sessions / count
                  +-- share
```

Snapshots are appendable time slices. The workspace can select one active performance period and one comparison period without duplicating the journey architecture.

## KPI Dictionary

Raw metric keys are given semantic meaning:

```text
metric key
  +-- display label
  +-- unit
  +-- business role
  +-- desired direction
  +-- primary / secondary
```

This allows the Opportunity engine to distinguish, for example, a beneficial revenue increase from a potentially adverse cost-per-acquisition increase.

## Mapping governance

Imported records carry an initial `direct`, `proxy` or `unmapped` quality. Workspace-level overrides can document a different governance decision without changing the source snapshot. This preserves source immutability and auditability.

## Planned vs Actual

Observed paths are separate snapshots. Each step can reference a stable `nodeId`; unknown real-world steps can remain label-only. The comparison engine reports planned steps not observed, observed steps not mapped to the plan and a directional match score for the top path.

## Component Library

A Component Library item stores a reusable `JourneyNodeData` definition, not a canvas position. A journey node can reference a component by `componentId`. Synchronization updates the shared definition while preserving node-local annotations.

## Versioning

Versions are embedded snapshots of journey content. They do not create duplicate journeys. The current draft can be compared with a snapshot by node, edge, tracking and creative deltas before restore.

## Persistence

IndexedDB stores the active local workspace. `.fjs` is the portable exchange format. The migration layer supplies safe defaults for intelligence-layer fields when an older 2.0 workspace is opened.

## Data separation

The application code is generic. Company-specific journeys, campaign names, performance data and observed paths belong in workspace/snapshot files, not in the repository.

## Beta 1 public-distribution layer

The hosted application and workspace data are intentionally separate:

```text
Public application
      |
      +-- blank workspace
      +-- generic templates
      +-- synthetic demo
      |
      +---- imports ----> organization-specific .fjs workspace
```

### Legacy migration

`parseStudioDataFile()` detects both the current v2 schema and the previous single-file workspace shape. Legacy nodes, tracking, creatives, edges and cross-journey connections are converted before `normalizeWorkspace()` applies the current defaults.

### Portfolio sanitization

Portfolio export is a pure-copy transformation. It can remove intelligence snapshots, internal annotations/versions and detailed measurement or paid-media information without mutating the source workspace.

### Guided onboarding

First-run tour state is stored in `WorkspaceSettings`. New, demo and migrated legacy workspaces can opt into the guide, while existing 2.0 workspaces normalize safely without forcing it.

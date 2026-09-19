# Famme Journey Studio 2.0.0-alpha.3

Alpha 3 moves the intelligence layer from the earlier prototype into the public React architecture.

## Added
- performance snapshot model and smart import
- KPI Dictionary and automatic metric discovery
- Mapping Center with source quality plus workspace governance overrides
- performance overlay on journey nodes
- performance coverage in Master View
- active/comparison period selection
- data-freshness monitoring
- rule-based opportunity/gap detection
- actual-path snapshot model and import
- Planned vs Actual workspace view
- Planned vs Actual inspector inside Journey Editor
- actual-path occurrence badges on canvas while comparing paths
- performance and actual-path mapping exports
- generated journey plans now include performance coverage and observed-path status when available

## Compatibility
Existing 2.0 workspaces are normalized with empty intelligence collections and sensible defaults. The workspace schema remains `famme-journey-studio-workspace-v2`.

## Build environment note
The source has been syntax-transpiled with TypeScript 5.8 in the build environment. A dependency-backed `npm run build` still requires package installation from npm or an existing package cache.

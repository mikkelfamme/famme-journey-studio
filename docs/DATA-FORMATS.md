# Data formats

Journey Studio by Famme keeps the visual architecture and imported measurement data separate. External analytics processes can use exported mapping files to obtain stable journey and node IDs.

## Performance snapshot

```json
{
  "schema": "famme-journey-performance-v1",
  "generatedAt": "2026-09-01T08:00:00Z",
  "period": "2026-08-01 to 2026-08-31",
  "sources": [
    { "name": "Web analytics", "note": "Production property" },
    { "name": "Ad platform" }
  ],
  "nodeMetrics": [
    {
      "journeyId": "journey_example",
      "nodeId": "node_example",
      "source": "Ad platform",
      "quality": "direct",
      "mappingNote": "Campaign is dedicated to this journey step.",
      "metrics": {
        "impressions": 120000,
        "clicks": 8400,
        "cost": 12500,
        "conversions": 420
      }
    }
  ],
  "journeyMetrics": []
}
```

Unknown numeric metric keys are automatically added to the KPI Dictionary with inferred defaults and can then be edited.

## Actual-path snapshot

```json
{
  "schema": "famme-journey-actual-paths-v1",
  "generatedAt": "2026-09-01T08:00:00Z",
  "period": "2026-08-01 to 2026-08-31",
  "source": "Warehouse path model",
  "journeyPaths": [
    {
      "journeyId": "journey_example",
      "paths": [
        {
          "label": "Search to purchase",
          "users": 380,
          "sharePct": 28.4,
          "steps": [
            { "nodeId": "node_search" },
            { "nodeId": "node_landing" },
            { "label": "Unmodelled checkout step" },
            { "nodeId": "node_purchase" }
          ]
        }
      ]
    }
  ]
}
```

A label-only step is valid and deliberately represents observed behavior that has not yet been mapped to a planned node.

## Mapping exports

Settings and Insights & Data can export:

- `famme-journey-performance-map-v1`
- `famme-journey-actual-path-map-v1`

These are read-only mapping manifests for external data preparation. They are not imported back as snapshots.


## Local-first data connection workflow (RC12.10+)

Journey Studio does not maintain a live backend connection to analytics or CRM systems. The intended workflow is:

1. Export the performance map and/or actual-path map to obtain stable `journeyId` and `nodeId` values.
2. Use those IDs in an external analytics process such as BigQuery, a script, a BI pipeline or another connector layer.
3. Map source measurements to journey nodes and mark each mapping as `direct`, `proxy` or `unmapped`.
4. Produce a `famme-journey-performance-v1` and/or `famme-journey-actual-paths-v1` snapshot.
5. Import the snapshot through **Import Data**. Journey Studio previews the file before storing it locally.

Typical external sources may include GA4, Google Ads, Meta, a ticket shop, CRM/booking data or warehouse tables. The source-system integration happens outside Journey Studio; Journey Studio receives the prepared snapshot.

## Portable single journey — `.jsjourney`

Schema: `journey-studio-journey-v1`.

A `.jsjourney` contains one journey only. Import assigns a new journey id and new node/edge ids, resets status to Draft, and deliberately drops cross-journey links and saved versions so the imported journey is independent of its source workspace.

## Portable template — `.jstemplate`

Schema: `journey-studio-template-v1`.

Template metadata includes:

- name and description;
- category and scope;
- semantic template version;
- tags;
- author;
- created/updated timestamps;
- reusable nodes, connections and plan inputs.

Templates may be empty. This is the default for user-created templates: metadata is created first, then the journey architecture is built in the Template Editor.

## Directional connection handles (RC12.8+)

Journey edges may store XYFlow `sourceHandle` and `targetHandle` ids. Journey Studio uses the following visual grammar:

**Incoming / target handles**
- `target-top-left`
- `target-top`
- `target-top-right`
- `target-left-top`
- `target-left-bottom`

**Outgoing / source handles**
- `source-bottom-left`
- `source-bottom`
- `source-bottom-right`
- `source-right-top`
- `source-right-bottom`

A handle can be referenced by multiple edges. This is how a journey can split from one component into several branches or merge several branches into one component.

Portable files from older releases may omit handle ids or contain legacy top/left source and bottom/right target handles. RC12.8 normalizes those values automatically on load/import; the portable schemas themselves are unchanged.

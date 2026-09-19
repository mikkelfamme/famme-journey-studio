# Data formats

Famme Journey Studio keeps the visual architecture and imported measurement data separate. External analytics processes can use exported mapping files to obtain stable journey and node IDs.

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

Settings can export:

- `famme-journey-performance-map-v1`
- `famme-journey-actual-path-map-v1`

These are read-only mapping manifests for external data preparation. They are not imported back as snapshots.

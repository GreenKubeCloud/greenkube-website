---
title: Reports & Exports
description: Explore estimated carbon, cost, and resource data with flexible time ranges and CSV or JSON exports.
---

GreenKube provides cost and estimated carbon data for historical analysis. Exports are inputs for further analysis, not a complete organizational emissions inventory.

## Report Types

### Dashboard Report Builder

The `/report` page in the web dashboard provides a visual interface:
1. Pick a relative window or custom date range
2. Optionally filter by namespace
3. Choose aggregation granularity (hourly → yearly)
4. Preview row count and totals
5. Download CSV or JSON directly to your browser

### Continuous Collection

When running as a service (`greenkube start`), metrics are collected every 5 minutes and stored in the database. Raw rows are compressed into hourly aggregates after 24 hours; the default raw-row retention is 7 days, while hourly aggregates are retained indefinitely by default. Report history therefore depends on the configured retention settings and available collected data.

## Report Data

Each report row includes per-pod data:

| Metric | Unit | Description |
|--------|------|-------------|
| Energy | Joules | Estimated energy consumption |
| CO₂e (Scope 2) | grams | Operational emissions from electricity |
| Embodied CO₂e (Scope 3) | grams | Hardware manufacturing emissions |
| Total CO₂e | grams | Scope 2 + Scope 3 |
| Cost | USD | Allocated infrastructure cost |
| CPU Usage | millicores | Actual CPU utilization |
| CPU Request | millicores | Requested CPU resources |
| Memory Usage | bytes | Actual memory consumption |
| Memory Request | bytes | Requested memory |
| Network Rx/Tx | bytes | Network traffic in/out |
| Disk Read/Write | bytes | Disk I/O |
| Restarts | count | Container restart count |
| Node | — | Node name and instance type |
| Zone | — | Electricity Maps carbon zone |

## Export Formats

### CSV

Download comma-separated data for spreadsheet analysis from the dashboard's Report page or `/api/v1/report/export?format=csv`.

### JSON

Download structured JSON from the same Report page or `/api/v1/report/export?format=json`.

## Time Range Syntax

| Syntax | Meaning |
|--------|---------|
| `1h` | Last 1 hour |
| `6h` | Last 6 hours |
| `24h` | Last 24 hours |
| `7d` | Last 7 days |
| `30d` | Last 30 days |
| `3m` | Last 3 months |
| `6m` | Last 6 months |
| `1y` | Last 12 months |
| `ytd` | Year-to-date |
| `years=2024` | Full calendar year 2024 in the export API |
| `start` / `end` | Custom date range in the dashboard or API |

## Grouping Options

Use the dashboard's granularity control or the export API's `aggregate=true&granularity=monthly` parameters to select a supported grouping. Use `aggregate=true&group_by=namespace` to aggregate by namespace.

## Filtering

Filter by namespace in the Report page. For other filters, use the relevant metrics endpoints in the [API Reference](/guide/api/).

## Exporting an Annual Summary

```bash
curl -O -J \
  "http://greenkube:8000/api/v1/report/export?format=csv&years=2024&aggregate=true&granularity=monthly&group_by=namespace"
```

The exported values are estimates with data-source and allocation limitations; reconcile them with your organization's other data before external use.

## API-Based Reports

```bash
# Report preview (row count + totals)
GET /api/v1/report/summary?last=30d

# Download report file
GET /api/v1/report/export?format=csv&years=2024&aggregate=true&granularity=monthly

# Namespace breakdown
GET /api/v1/metrics/by-namespace?last=30d

# Pre-computed summary (cached, fast)
GET /api/v1/metrics/dashboard-summary
```

See the [API Reference](/guide/api/) for complete endpoint documentation.

---
title: Historical Analysis
description: Report on any time period with flexible grouping and date-range options. Export to CSV or JSON for BI integration and CSRD/ESRS E1 compliance.
---

GreenKube stores all collected metrics over time, enabling **powerful historical analysis** for trend detection, compliance reporting, and capacity planning.

## Time-Series Storage

Every collection cycle captures a complete snapshot of your cluster:
- Per-pod resource usage (CPU, memory, network, disk)
- Per-node power and carbon estimation
- Grid carbon intensity at collection time (zone-specific)
- Cost data from OpenCost

These snapshots are stored in your chosen backend (PostgreSQL or SQLite) and are available for querying at any time. Raw 5-minute metrics are automatically compressed to hourly aggregates after a configurable threshold (default: 24 h), and aggregated data is retained indefinitely by default — supporting multi-year CSRD/ESRS E1 compliance.

## Flexible Time Ranges

Query any time period through the API, CLI, or dashboard:

```bash
# Last 24 hours
greenkube report --last 24h

# Last 7 days
greenkube report --last 7d

# Custom date range (ISO 8601)
greenkube report --start 2024-01-01 --end 2024-01-31

# Full calendar year
greenkube report --years 2024

# Multiple years
greenkube report --years 2023 --years 2024

# Year-to-date
greenkube report --last ytd
```

## Grouping & Aggregation

Metrics can be grouped at different granularities:

| Option | Use Case |
|--------|----------|
| `--hourly` | Detailed analysis, peak detection |
| `--daily` | Weekly trends, daily reports |
| `--weekly` | Month-over-month comparison |
| `--monthly` | Quarterly/annual CSRD reports |
| `--yearly` | Long-term trend analysis |

```bash
# Daily carbon emissions for January 2024
greenkube report --start 2024-01-01 --end 2024-01-31 --daily

# Monthly aggregation for a full year (CSRD use case)
greenkube report --years 2024 --monthly --format csv --output 2024-annual.csv
```

## Namespace Grouping

Group results by namespace for per-team cost and carbon allocation:

```bash
greenkube report --last 30d --monthly --group-by-namespace
```

## Export Formats

### CSV
Standard CSV output compatible with Excel, Google Sheets, and BI tools:

```bash
greenkube report --last 7d --format csv --output weekly-report.csv
```

### JSON
Structured JSON for programmatic consumption:

```bash
greenkube report --last 30d --format json --output monthly-report.json
```

### API
Full access via REST API for integration with dashboards and pipelines:

```bash
# Time-series for charts
GET /api/v1/metrics/timeseries?last=30d&granularity=day

# Pre-computed dashboard cache (fastest)
GET /api/v1/metrics/dashboard-timeseries/30d

# Downloadable report
GET /api/v1/report/export?format=csv&years=2024&granularity=monthly

# Per-namespace breakdown
GET /api/v1/metrics/by-namespace?last=30d
```

## Dashboard Report Builder

The web dashboard `/report` page provides a visual interface to:
- Pick a time window or custom date range
- Filter by namespace
- Choose aggregation granularity
- Preview row count and totals before downloading
- Export directly to CSV or JSON in the browser

## Use Cases

### CSRD/ESRS E1 Compliance Reporting
Generate annual or multi-year emission reports with:
- Total kgCO₂e per namespace/workload (Scope 2 operational + Scope 3 embodied)
- Custom date ranges aligned with fiscal/calendar years
- Namespace breakdown for business unit allocation

```bash
# Full 2024 annual report for CSRD submission
greenkube report --years 2024 --monthly --group-by-namespace \
  --format csv --output 2024-csrd-report.csv
```

### Capacity Planning
Analyze historical trends to:
- Predict future resource needs
- Identify growth patterns
- Plan infrastructure scaling

### Cost Allocation
Break down cloud spending by:
- Team / namespace
- Application / service
- Time period

### Optimization Tracking
Measure the impact of optimization actions:
- Before/after comparison using custom date ranges
- Savings ledger showing attributed savings from applied recommendations
- ROI calculation on green initiatives

## Dashboard Integration

The dashboard includes interactive time-series charts with:
- Drag-to-zoom on time ranges
- Overlay comparison (this week vs. last week)
- Stacked area/bar views for namespace breakdown
- Real-time updates as new data arrives

## Related

- [Reports & Exports Guide](/guide/reports/) — Detailed usage
- [REST API](/features/rest-api/) — Programmatic access
- [Dashboard](/features/real-time-dashboard/) — Interactive visualization

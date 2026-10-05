---
title: Historical Analysis
description: Explore historical cost and estimated carbon data by date range, and export CSV or JSON for further analysis.
---

GreenKube stores collected metrics over time for trend detection and capacity planning.

## Time-Series Storage

Every collection cycle captures a complete snapshot of your cluster:
- Per-pod resource usage (CPU, memory, network, disk)
- Per-node power and carbon estimation
- Grid carbon intensity at collection time (zone-specific)
- Cost data from OpenCost

These snapshots are stored in PostgreSQL or SQLite. Raw metrics are compressed to hourly aggregates after a configurable threshold (default: 24 h); raw rows are retained for 7 days by default, while hourly aggregates are retained indefinitely unless you configure a limit.

## Flexible Time Ranges

Query supported time windows through the API or dashboard:

Use the Report page for a relative or custom date range, or `/api/v1/report/export?format=csv&years=2024` for an annual export.

## Grouping & Aggregation

Metrics can be grouped at different granularities:

| Granularity | Use Case |
|-------------|----------|
| Hourly | Detailed analysis, peak detection |
| Daily | Weekly trends, daily reports |
| Weekly | Month-over-month comparison |
| Monthly | Annual comparisons |
| Yearly | Long-term trend analysis |

Set the granularity in the Report page or use the export API's `granularity` parameter.

## Namespace Grouping

Group results by namespace for per-team cost and carbon allocation:

Select a namespace in the Report page or use `aggregate=true&group_by=namespace` on the export API.

## Export Formats

### CSV
Standard CSV output compatible with Excel, Google Sheets, and BI tools:

Download CSV from the Report page or `/api/v1/report/export?format=csv`.

### JSON
Structured JSON for programmatic consumption:

Download JSON from the Report page or `/api/v1/report/export?format=json`.

### API
Full access via REST API for integration with dashboards and pipelines:

```bash
# Time-series for charts
GET /api/v1/metrics/timeseries?last=30d&granularity=day

# Pre-computed dashboard cache (fastest)
GET /api/v1/metrics/dashboard-timeseries/30d

# Downloadable report
GET /api/v1/report/export?format=csv&years=2024&aggregate=true&granularity=monthly

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

### Historical Footprint Estimates
Compare modeled operational and embodied emissions by workload and namespace across time windows. Document the estimation method, fallbacks, and missing data before using these figures outside the engineering team.

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

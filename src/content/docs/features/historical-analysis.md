---
title: Historical Analysis
description: Report on any time period with flexible grouping. Export to CSV or JSON for BI integration.
---

GreenKube stores all collected metrics over time, enabling **powerful historical analysis** for trend detection, compliance reporting, and capacity planning.

## Time-Series Storage

Every collection cycle captures a complete snapshot of your cluster:
- Per-pod resource usage
- Per-node power estimation
- Carbon intensity at collection time
- Cost data from OpenCost

These snapshots are stored in your chosen backend (PostgreSQL, SQLite, or Elasticsearch) and are available for querying at any time.

## Flexible Time Ranges

Query any time period through the API, CLI, or dashboard:

```bash
# Last 24 hours
greenkube report --period=24h

# Last 7 days
greenkube report --period=7d

# Custom range
greenkube report --from=2024-01-01 --to=2024-01-31

# Last quarter
greenkube report --period=90d
```

## Grouping & Aggregation

Metrics can be grouped at different granularities:

| Grouping | Use Case |
|---|---|
| **Hourly** | Detailed analysis, peak detection |
| **Daily** | Weekly trends, daily reports |
| **Weekly** | Month-over-month comparison |
| **Monthly** | Quarterly/annual CSRD reports |
| **Yearly** | Long-term trend analysis |

```bash
# Daily carbon emissions for January
greenkube report --from=2024-01-01 --to=2024-01-31 --group-by=daily
```

## Export Formats

### CSV
Standard CSV output compatible with Excel, Google Sheets, and BI tools:

```bash
greenkube report --format=csv --output=report.csv
```

### JSON
Structured JSON for programmatic consumption:

```bash
greenkube report --format=json --output=report.json
```

### API
Full access via REST API for integration with dashboards and pipelines:

```bash
GET /api/v1/timeseries?from=2024-01-01&to=2024-01-31&group_by=daily
```

## Use Cases

### CSRD Compliance Reporting
Generate monthly and quarterly emission reports with:
- Total kgCO₂e per namespace/workload
- Comparison with previous period
- Breakdown by Scope (2 and 3)

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
- Provider / region

### Optimization Tracking
Measure the impact of optimization actions:
- Before/after comparison
- Savings tracking over time
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

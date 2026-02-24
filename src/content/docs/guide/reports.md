---
title: Reports & Exports
description: Generate detailed carbon, cost, and resource reports from GreenKube with flexible time ranges and export formats.
---

import { Aside } from '@astrojs/starlight/components';

GreenKube provides powerful reporting capabilities for regulatory compliance (CSRD/ESRS E1), cost analysis, and sustainability tracking.

## Report Types

### On-Demand Reports

Generate instant reports via the CLI:

```bash
# Daily report (last 24 hours)
greenkube report --daily

# Last 7 days
greenkube report --last 7d

# Last 3 months, grouped monthly
greenkube report --last 3m --monthly

# Custom date range
greenkube report --start 2024-01-01 --end 2024-03-31 --monthly
```

### Continuous Collection

When running as a service (`greenkube start`), metrics are collected continuously and stored in the database. Reports can then query any historical period.

## Report Data

Each report includes per-pod data:

| Metric | Unit | Description |
|--------|------|-------------|
| Energy | Joules | Estimated energy consumption |
| CO₂e | grams | Carbon dioxide equivalent emissions |
| Cost | USD | Allocated infrastructure cost |
| CPU Usage | millicores | Actual CPU utilization |
| CPU Request | millicores | Requested CPU resources |
| Memory Usage | bytes | Actual memory consumption |
| Memory Request | bytes | Requested memory |
| Network Rx/Tx | bytes | Network traffic in/out |
| Disk Read/Write | bytes | Disk I/O |
| Storage | bytes | Ephemeral storage usage |
| Restarts | count | Container restart count |
| Node | — | Node name and instance type |
| Zone | — | Carbon zone (Electricity Maps) |

## Export Formats

### Table (Default)

Rich terminal tables with color-coded values:

```bash
greenkube report --daily
```

### CSV

Comma-separated values for spreadsheet analysis:

```bash
greenkube report --last 7d --format csv -o weekly-report.csv
```

### JSON

Structured JSON for programmatic processing:

```bash
greenkube report --last 30d --format json -o monthly-report.json
```

## Time Range Syntax

The `--last` flag supports flexible time units:

| Syntax | Meaning |
|--------|---------|
| `1h` | Last 1 hour |
| `6h` | Last 6 hours |
| `24h` | Last 24 hours |
| `1d` | Last 1 day |
| `7d` | Last 7 days |
| `30d` | Last 30 days |
| `1m` | Last 1 month |
| `3m` | Last 3 months |
| `6m` | Last 6 months |
| `1y` | Last 1 year |

## Grouping Options

Group results for trend analysis:

| Option | Description |
|--------|-------------|
| `--daily` | One row per pod per day |
| `--monthly` | One row per pod per month |
| `--yearly` | One row per pod per year |

## Filtering

Focus reports on specific workloads:

```bash
# By namespace
greenkube report --last 7d -n production

# By pod name pattern
greenkube report --last 7d --pod "api-*"
```

## CSRD / ESRS E1 Compliance

GreenKube reports are designed to support **CSRD (Corporate Sustainability Reporting Directive)** requirements, specifically **ESRS E1 (Climate Change)**:

- **Scope 3 emissions** — Cloud infrastructure carbon footprint
- **Energy consumption** — Detailed breakdown by workload
- **Time-series data** — Historical trends for year-over-year comparison
- **Data provenance** — Clear flagging of estimated vs. measured values

<Aside type="note">
  GreenKube provides the raw data needed for CSRD reporting. You may need additional tools or processes to format the data according to your organization's specific reporting templates.
</Aside>

## API-Based Reports

For automated reporting, use the REST API:

```bash
# Get metrics summary
curl "http://localhost:8000/api/v1/metrics/summary?last=30d"

# Get time-series data for charts
curl "http://localhost:8000/api/v1/metrics/timeseries?granularity=day&last=30d"

# Get per-pod metrics
curl "http://localhost:8000/api/v1/metrics?namespace=production&last=7d"
```

See the [API Reference](/guide/api/) for complete endpoint documentation.

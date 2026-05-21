---
title: Reports & Exports
description: Generate detailed carbon, cost, and resource reports from GreenKube with flexible time ranges, namespace grouping, and CSRD/ESRS E1 export formats.
---

import { Aside } from '@astrojs/starlight/components';

GreenKube provides powerful reporting capabilities for regulatory compliance (CSRD/ESRS E1), cost analysis, and sustainability tracking.

## Report Types

### On-Demand CLI Reports

Generate reports via the CLI:

```bash
# Last 24 hours, terminal table
greenkube report --last 24h --daily

# Last 7 days in JSON
greenkube report --last 7d --format json

# Last 3 months grouped monthly
greenkube report --last 3m --monthly

# Custom date range
greenkube report --start 2024-01-01 --end 2024-03-31 --monthly

# Full calendar year (CSRD use case)
greenkube report --years 2024 --monthly --format csv -o 2024-annual.csv

# Multi-year comparison
greenkube report --years 2023 --years 2024 --yearly

# Namespace breakdown
greenkube report --last 30d --monthly --group-by-namespace
```

### Dashboard Report Builder

The `/report` page in the web dashboard provides a visual interface:
1. Pick a relative window or custom date range
2. Optionally filter by namespace
3. Choose aggregation granularity (hourly → yearly)
4. Preview row count and totals
5. Download CSV or JSON directly to your browser

### Continuous Collection

When running as a service (`greenkube start`), metrics are collected every 5 minutes and stored in the database. Reports can query any historical period, with raw data auto-compressed to hourly aggregates after 24 h and retained indefinitely by default.

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

### Table (Default)

Rich terminal tables with color-coded values:

```bash
greenkube report --last 24h
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
| `--years 2024` | Full calendar year 2024 |
| `--start / --end` | Arbitrary ISO 8601 range |

## Grouping Options

| Option | Description |
|--------|-------------|
| `--hourly` | One row per pod per hour |
| `--daily` | One row per pod per day |
| `--weekly` | One row per pod per week |
| `--monthly` | One row per pod per month |
| `--yearly` | One row per pod per year |
| `--group-by-namespace` | Aggregate all pods within a namespace |

## Filtering

```bash
# By namespace
greenkube report --last 7d -n production

# By pod name
greenkube report --last 7d --pod "api-server"

# By node
greenkube report --last 7d --node "worker-1"
```

## CI/CD Policy Gates

Use `--fail-on-co2` and `--fail-on-cost` to enforce carbon and cost budgets in your CI/CD pipelines:

```bash
# Fail if daily CO₂e exceeds 50 kg (50,000 g)
greenkube report --last 24h --fail-on-co2 50000

# Fail if monthly cost exceeds $500
greenkube report --last 30d --fail-on-cost 500

# Combine with report output
greenkube report --last 24h --fail-on-co2 50000 --fail-on-cost 1000
```

Exit code `1` is returned when the threshold is exceeded, blocking the pipeline. This enables **carbon-aware CI/CD** workflows.

## CSRD / ESRS E1 Compliance

GreenKube is designed to generate the data required for **CSRD (Corporate Sustainability Reporting Directive)** annual GHG disclosures under **ESRS E1 (Climate Change)**:

| ESRS Requirement | GreenKube Implementation |
|------------------|--------------------------|
| **Scope 2 emissions** (market-based) | `co2e_grams` per pod/namespace/cluster |
| **Scope 3 upstream emissions** (Category 1) | `embodied_co2e_grams` — hardware manufacturing |
| **Total GHG (Scope 2 + 3)** | `total_co2e_all_scopes` |
| **Yearly reporting period** | `--years 2024` |
| **Custom date range** | `--start` / `--end` |
| **Business unit allocation** | `--group-by-namespace` |
| **Multi-year retention** | Infinite aggregated retention (default) |
| **Granularity** | Monthly aggregation for annual reports |

### Generating a CSRD Report

```bash
# Annual report for 2024, monthly granularity, by namespace
greenkube report --years 2024 --monthly --group-by-namespace \
  --format csv --output 2024-csrd-report.csv

# Or via API
curl -O -J \
  "http://greenkube:8000/api/v1/report/export?format=csv&years=2024&granularity=monthly&group_by_namespace=true"
```

<Aside type="note">
  GreenKube provides the raw GHG data (Scope 2 + Scope 3) for CSRD reporting. The actual report format for regulatory submissions depends on your organization's specific template and may require additional contextual data from other systems.
</Aside>

## API-Based Reports

```bash
# Report preview (row count + totals)
GET /api/v1/report/summary?last=30d

# Download report file
GET /api/v1/report/export?format=csv&years=2024&granularity=monthly

# Namespace breakdown
GET /api/v1/metrics/by-namespace?last=30d

# Pre-computed summary (cached, fast)
GET /api/v1/metrics/dashboard-summary
```

See the [API Reference](/guide/api/) for complete endpoint documentation.

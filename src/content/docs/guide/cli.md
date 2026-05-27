---
title: CLI Reference
description: Complete reference for all GreenKube CLI commands, options, and usage examples.
---

import { Aside } from '@astrojs/starlight/components';

GreenKube provides a powerful command-line interface built with **Typer** and **Rich** for beautiful terminal output.

## Overview

The CLI is available as the `greenkube` command after installation. It provides several subcommands:

```bash
greenkube --help
```

| Command | Description |
|---------|-------------|
| `greenkube start` | Start the monitoring service + API server + background scheduler |
| `greenkube report` | Generate on-demand reports |
| `greenkube recommend` | Get optimization recommendations |
| `greenkube demo` | Launch a demo with realistic sample data |
| `greenkube version` | Show version information |

### Global Options

| Option | Description |
|--------|-------------|
| `--no-color` | Disable Rich formatting (useful for CI/CD logs) |
| `--version` | Print version and exit |
| `--help` | Show help |

You can also set `NO_COLOR=1` in your environment to disable Rich output globally.

## `greenkube start`

Starts the combined monitoring service: FastAPI server, web dashboard, and background metrics collection scheduler — all in a single process.

```bash
greenkube start [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | Listen port | `8000` |
| `--no-browser` | Don't auto-open the browser | `false` |

**Example:**

```bash
# Start server on default port 8000
greenkube start

# Start on a custom port without opening browser
greenkube start --port 9000 --no-browser
```

This is the default entrypoint used by the Docker image and Helm chart.

## `greenkube report`

Generate reports for any time period with flexible grouping and filtering options.

```bash
greenkube report [OPTIONS]
```

### Time Range Options

| Option | Description | Example |
|--------|-------------|---------|
| `--last` | Relative window | `--last 7d`, `--last 3m`, `--last ytd` |
| `--start` | Start date (ISO 8601) | `--start 2024-01-01` |
| `--end` | End date (ISO 8601) | `--end 2024-12-31` |
| `--years` | Full calendar year (repeatable) | `--years 2024 --years 2023` |

### Grouping Options

| Option | Description |
|--------|-------------|
| `--hourly` | Group results by hour |
| `--daily` | Group results by day |
| `--weekly` | Group results by week |
| `--monthly` | Group results by month |
| `--yearly` | Group results by year |
| `--group-by-namespace` | Return one row per namespace instead of per pod |

### Filtering Options

| Option | Description | Example |
|--------|-------------|---------|
| `--namespace` / `-n` | Filter by namespace | `-n production` |
| `--pod` | Filter by pod name | `--pod "api-*"` |
| `--node` | Filter by node name | `--node "worker-1"` |

### Output Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Output format: `table`, `csv`, `json` | `table` |
| `--output` / `-o` | Write output to file | stdout |

### CI/CD Gate Options

| Option | Description |
|--------|-------------|
| `--fail-on-co2 N` | Exit code 1 if total CO₂e (grams) exceeds N |
| `--fail-on-cost N` | Exit code 1 if total cost (USD) exceeds N |

### Examples

```bash
# Daily report for the last 24 hours (terminal table)
greenkube report --last 24h --daily

# Monthly report for a specific namespace, saved to CSV
greenkube report --last 30d --monthly -n production --format csv -o report.csv

# Full calendar year 2024 for CSRD reporting
greenkube report --years 2024 --monthly --format json -o 2024-annual.json

# Custom date range with namespace grouping
greenkube report --start 2024-01-01 --end 2024-06-30 \
  --monthly --group-by-namespace --format csv

# CI/CD policy gate
greenkube report --last 24h --fail-on-co2 50000 --fail-on-cost 1000
```

### Report Columns

Each row in the report includes:

| Column | Unit | Description |
|--------|------|-------------|
| Pod | — | Pod name |
| Namespace | — | Kubernetes namespace |
| Energy | Joules | Estimated energy consumption |
| CO₂e | grams | GHG Scope 2 (operational) |
| Embodied CO₂e | grams | GHG Scope 3 (hardware manufacturing) |
| Total CO₂e | grams | Scope 2 + Scope 3 |
| Cost | $ | Allocated cost from OpenCost |
| CPU Usage | millicores | Average CPU utilization |
| Memory Usage | bytes | Average memory usage |
| Network Rx | bytes | Total bytes received |
| Network Tx | bytes | Total bytes transmitted |
| Disk Read | bytes | Total disk read |
| Disk Write | bytes | Total disk write |
| Restarts | count | Container restart count |
| Duration | seconds | Time period covered |

## `greenkube recommend`

Analyze recent metrics and generate optimization recommendations.

```bash
greenkube recommend [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--namespace` / `-n` | Filter by namespace | All namespaces |
| `--last` | Analysis window | `24h` |
| `--live` | Run live collection instead of reading from database | `false` |
| `--fail-on-recommendations` | Exit code 1 if any recommendations are found | `false` |

**Examples:**

```bash
# Get all recommendations (reads from database)
greenkube recommend

# Recommendations for a specific namespace
greenkube recommend -n production

# Longer lookback window
greenkube recommend --last 7d

# CI/CD gate: fail the pipeline if optimizations exist
greenkube recommend --fail-on-recommendations
```

### Recommendation Output

Each recommendation includes:
- **Type** — zombie, rightsizing (CPU/memory), autoscaling, carbon-aware, idle namespace, off-peak scaling, overprovisioned node, underutilized node
- **Priority** — high, medium, low
- **Scope** — pod, workload, namespace, or node
- **Details** — Current usage vs. recommended
- **Annual savings** — Projected CO₂e and cost savings extrapolated to 1 year

## `greenkube demo`

Launch a standalone demo instance with realistic sample data — no live cluster metrics required.

```bash
greenkube demo [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--days` | Number of days of sample data to generate | `30` |
| `--port` | Port for the demo API/dashboard server | `9000` |
| `--no-browser` | Don't auto-open the browser | `false` |

**What it does:**
- Creates a temporary SQLite database with realistic Kubernetes metrics
- Simulates the fictional **GreenOptic** company with **22 pods** across **5 namespaces**
- Generates 30 days of carbon emissions, costs, resource usage, and optimization recommendations
- Includes a pre-populated savings ledger with applied demo recommendations
- Starts the API server and dashboard on the specified port

**Examples:**

```bash
# Quick demo (30 days of data, opens browser)
greenkube demo

# Demo with 60 days of data, no browser
greenkube demo --days 60 --no-browser

# Deploy as a standalone Kubernetes pod
kubectl run greenkube-demo \
  --image=greenkube/greenkube:latest \
  --restart=Never \
  --command -- greenkube demo --no-browser --port 9000
```

## `greenkube version`

Display version information.

```bash
greenkube version
```

<Aside type="tip">
  When running inside a Kubernetes pod, use `kubectl exec` to access the CLI:
  ```bash
  kubectl exec -it <pod-name> -n greenkube -- greenkube report --last 24h --daily
  ```
</Aside>

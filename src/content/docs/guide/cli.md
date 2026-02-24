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
| `greenkube start` | Start the continuous monitoring service |
| `greenkube report` | Generate on-demand reports |
| `greenkube recommend` | Get optimization recommendations |
| `greenkube api` | Start the API server |
| `greenkube version` | Show version information |

## `greenkube start`

Starts the background monitoring service that continuously collects metrics.

```bash
greenkube start [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--with-api` | Also start the API server | `false` |
| `--interval` | Collection interval (e.g., `5m`, `1h`) | `5m` |
| `--analyze-nodes` | Enable node analysis | `true` |

**Example:**

```bash
# Start collector + API server
greenkube start --with-api

# Start collector only with custom interval
greenkube start --interval 10m
```

## `greenkube report`

Generate reports for any time period with flexible grouping options.

```bash
greenkube report [OPTIONS]
```

### Time Range Options

| Option | Description | Example |
|--------|-------------|---------|
| `--last` | Report for the last N time units | `--last 7d`, `--last 3m`, `--last 1y` |
| `--daily` | Shortcut for `--last 1d` | `--daily` |
| `--start` | Start date (ISO format) | `--start 2024-01-01` |
| `--end` | End date (ISO format) | `--end 2024-01-31` |

### Grouping Options

| Option | Description |
|--------|-------------|
| `--daily` | Group results by day |
| `--monthly` | Group results by month |
| `--yearly` | Group results by year |

### Filtering Options

| Option | Description | Example |
|--------|-------------|---------|
| `--namespace` / `-n` | Filter by namespace | `-n default` |
| `--pod` | Filter by pod name pattern | `--pod "api-*"` |

### Output Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format` | Output format: `table`, `csv`, `json` | `table` |
| `--output` / `-o` | Write output to file | stdout |

### Examples

```bash
# Daily report for the last 24 hours (terminal table)
greenkube report --daily

# Weekly report in JSON format
greenkube report --last 7d --format json

# Monthly report for a specific namespace, saved to file
greenkube report --last 30d --monthly -n production -o report.csv --format csv

# Custom date range
greenkube report --start 2024-01-01 --end 2024-01-31 --monthly

# Last 3 months, grouped by month
greenkube report --last 3m --monthly
```

### Report Columns

The report includes the following data per pod/group:

| Column | Unit | Description |
|--------|------|-------------|
| Pod | — | Pod name |
| Namespace | — | Kubernetes namespace |
| Energy | Joules | Estimated energy consumption |
| CO₂e | grams | Carbon dioxide equivalent emissions |
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
| `--lookback` | Days of historical data to analyze | `7` |
| `--format` | Output format: `table`, `json` | `table` |

**Example:**

```bash
# Get all recommendations
greenkube recommend

# Recommendations for a specific namespace
greenkube recommend -n production

# JSON output for automation
greenkube recommend --format json
```

### Recommendation Output

Each recommendation includes:
- **Type**: zombie, rightsizing, autoscaling, carbon-aware
- **Severity**: low, medium, high, critical
- **Resource**: Affected pod or namespace
- **Details**: Current usage vs. recommended
- **Savings**: Estimated cost and CO₂ reduction
- **Action**: Suggested kubectl command

## `greenkube api`

Start the FastAPI server (and web dashboard) independently.

```bash
greenkube api [OPTIONS]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--host` | Listen address | `0.0.0.0` |
| `--port` | Listen port | `8000` |

## `greenkube version`

Display version information.

```bash
greenkube version
```

Output:
```
GreenKube v0.2.0
```

<Aside type="tip">
  When running inside a Kubernetes pod, use `kubectl exec` to access the CLI:
  ```bash
  kubectl exec -it <pod-name> -n greenkube -- greenkube report --daily
  ```
</Aside>

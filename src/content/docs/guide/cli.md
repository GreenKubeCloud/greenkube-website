---
title: CLI Reference
description: Reference for the GreenKube start, demo, and version commands.
---

The `greenkube` command provides three commands: `start`, `demo`, and `version`. Use `greenkube --help` or `greenkube <command> --help` to see the installed version's options.

## `greenkube start`

Run GreenKube's data-collection service. It connects to the configured database, collects cluster metrics, and schedules recurring collection and maintenance tasks. The API server and dashboard run through the separate `greenkube-api` entry point; Helm starts them in a separate container.

```bash
greenkube start [--last WINDOW]
```

`--last` sets the initial collection/backfill window. Examples include `10min`, `2h`, `7d`, `3w`, and `1m`. Scheduled collection then follows the service configuration.

```bash
greenkube start --last 2h
```

## `greenkube demo`

Start a self-contained demo with sample data. It does not require a live Kubernetes cluster.

```bash
greenkube demo [--port PORT] [--days DAYS] [--no-browser]
```

| Option | Default | Description |
|--------|---------|-------------|
| `--port`, `-p` | `8000` | Port for the demo API and dashboard |
| `--days`, `-d` | `30` | Number of days of sample data |
| `--no-browser` | Off | Do not open the dashboard automatically |

```bash
docker run --rm -p 9000:9000 greenkube/greenkube demo --no-browser --port 9000
```

Open `http://localhost:9000` while the container is running.

## `greenkube version`

Print the installed GreenKube version:

```bash
greenkube version
```

The root `--version` and `--help` flags are also available:

```bash
greenkube --version
greenkube --help
```

## API, reports, and recommendations

`greenkube report` and `greenkube recommend` are not CLI commands. Generate reports from the dashboard or the REST API, and manage recommendations from the dashboard or recommendation API. See the [API reference](/guide/api/), [Reports & Exports](/guide/reports/), and [Recommendations](/guide/recommendations/).

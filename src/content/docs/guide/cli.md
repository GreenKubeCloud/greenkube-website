---
title: CLI Reference
description: The greenkube command line - start the controller, run the demo, recompute stored rows after a model change, copy a SQLite database into PostgreSQL.
---

The `greenkube` CLI has two runtime modes: `start` runs the controller and `demo` launches a self-contained sample environment. `recompute` and `db copy` are maintenance commands. Recommendations, plans and reports are served by the REST API and the dashboard, not by the CLI.

In a Kubernetes deployment the controller already runs `greenkube start`; run maintenance commands inside it:

```bash
kubectl -n greenkube exec -it deploy/greenkube-controller -- bash
```

## `greenkube start`

Starts the controller: connects to the database, runs schema migrations under a PostgreSQL advisory lock, performs an initial collection, then runs every periodic loop (collection, compression, scans, GitOps discovery and sync, apply detection, measurement, savings attribution, ledger verification, plan execution). It serves its control-loop metrics on port `9102`.

| Flag | Description |
|---|---|
| `--last TEXT` | Re-collect this range at startup (`10min`, `2h`, `7d`, `3w`, `1m`), rewriting existing rows |
| `--force` | With `--last`: replace stored rows even when the new pass looks worse |

## `greenkube demo`

Starts GreenKube with pre-populated sample data, no cluster required: a temporary SQLite database, the API and the dashboard.

| Flag | Description |
|---|---|
| `--port INTEGER` | API port (default `8000`) |
| `--days INTEGER` | Recent days generated at hourly resolution (default `30`); older history extends to two years at daily resolution |
| `--no-browser` | Do not open the browser |

```bash
docker run --rm -p 9000:9000 greenkube/greenkube demo --no-browser --port 9000
```

## `greenkube recompute`

Re-allocates raw metric rows still within retention with the current [Impact Model](/methodology/impact-model/) version, for example after an upgrade that changed the model.

| Flag | Description |
|---|---|
| `--since TEXT` | Start of the range: a duration (`12h`, `7d`) or an ISO-8601 timestamp. Required |
| `--until TEXT` | End of the range (exclusive); default now |
| `--all` | Recompute every row, not only rows written by another model version |
| `--dry-run` | Report what would change without writing |

## `greenkube db copy`

Copies a SQLite database into PostgreSQL, once, when upgrading a 0.3.x SQLite install ([Upgrading](/operations/upgrading/#from-a-sqlite-install)).

```bash
greenkube db copy --from sqlite:///data/greenkube_data.db --to "$DB_CONNECTION_STRING"
```

| Flag | Description |
|---|---|
| `--from TEXT` | Source SQLite database; never written |
| `--to TEXT` | Target PostgreSQL URL |
| `--schema TEXT` | Target schema (default `public`) |
| `--include-metrics` | Also copy the metric history (otherwise re-collected) |
| `--dry-run` | Count rows per table; write nothing |
| `--allow-nonempty` | Resume an interrupted copy into the same database |

## `greenkube version`

Prints the GreenKube version. `--help` shows help for any command.

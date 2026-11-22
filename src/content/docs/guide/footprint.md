---
title: Footprint
description: The GreenKube Footprint pages - cost, energy and CO₂e per workload, namespace and node, the node idle share and cluster total, the node inventory, and CSV or JSON report exports.
---

The **Footprint** pages give the supporting context for optimization: what each workload, namespace and node costs and emits. Recommendations and measured savings live elsewhere ([Web UI](/guide/dashboard/)). The figures come from the [Impact Model](/methodology/impact-model/); how energy and CO₂e are estimated is explained in [Energy & Carbon](/methodology/energy-and-carbon/).

Footprint data is **not exported to Prometheus**: use these pages, their exports and the API below ([Prometheus & Grafana](/guide/grafana/)).

## Overview (`/footprint`)

KPIs and charts of the selected period and namespace: CO₂e, cost, energy and pods. Cluster-wide, the page shows three figures side by side for CO₂e, cost and energy, never added together:

| Figure | Meaning |
|---|---|
| **Allocated** | What the workloads (pod rows) are charged |
| **Node idle share** | Unreserved node capacity (the `__idle__` rows) |
| **Cluster total** | Allocated + idle |

When the idle share is unknown for the period (for example rows older than the first idle row), the page says "not available" with the reason, never zero.

## Nodes

![GreenKube Footprint, Nodes section: node inventory with CPU and memory capacity (demo data)](/screenshots/demo-nodes.png)

`/footprint/nodes` lists the node inventory (`GET /api/v1/nodes`) with CPU and memory capacity. A node whose GPU power is estimated from its TDP (`gpu_tdp_estimate`) or not counted (`unmeasured`), because no DCGM exporter sample reached GreenKube, shows a "GPU power estimated" or "GPU power not measured" badge, and a notice counts such nodes.

## Report

![GreenKube Footprint, Report section: configure, preview and export the cost, energy and CO₂e report as CSV or JSON (demo data)](/screenshots/demo-report.png)

`/footprint/report` configures, previews and exports the cost, energy and CO₂e report as **CSV or JSON**. The old `/report` and `/nodes` routes redirect to `/footprint/report` and `/footprint/nodes`.

Every exported row has a `row_kind` column: `allocated` for workload rows (pods, or namespaces when grouped by namespace). By default the file holds only these rows, so a column sums to the report summary total. With **include idle** (`include_idle=true`) on a cluster-wide export, each selected range ends with:

- one `idle` row (`pod_name=__idle__`, the node idle share);
- one `cluster_total` row (`pod_name=__cluster_total__`, allocated + idle).

Do not sum every row of such a file: `cluster_total` already equals the `allocated` rows plus `idle`. Their values are empty (CSV) or `null` (JSON), never zero, when the idle share is unknown. Exports keep operational (`co2e_grams`) and embodied (`embodied_co2e_grams`) emissions in separate columns.

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/metrics/summary` | Totals for a period (`last`, optional `namespace`); cluster-wide, adds `idle_*` and `cluster_total_*` |
| `GET` | `/api/v1/metrics/timeseries` | Time series (`granularity=hour\|day\|week\|month`) with the same idle and cluster-total fields |
| `GET` | `/api/v1/metrics/by-namespace`, `/metrics/top-pods` | Per-namespace figures, highest-emitting pods |
| `GET` | `/api/v1/nodes` | Node inventory, with each node's `gpu_source` |
| `GET` | `/api/v1/report/summary` | Report row count and totals; cluster-wide, adds the idle share and the cluster total |
| `GET` | `/api/v1/report/years` | Calendar years with reportable data |
| `GET` | `/api/v1/report/export` | Stream the report (`format=csv\|json`, `start`/`end` or `last`, `namespace`, `aggregate`, `granularity`, `group_by=namespace`, `include_idle`) |

```bash
# Monthly report per namespace for a year, as CSV
curl -OJ -H "Authorization: Bearer $GREENKUBE_API_KEY" \
  "http://localhost:8000/api/v1/report/export?start=2025-01-01&end=2025-12-31&aggregate=true&granularity=monthly&group_by=namespace"

# The last 30 days of one namespace, as JSON
curl -OJ -H "Authorization: Bearer $GREENKUBE_API_KEY" \
  "http://localhost:8000/api/v1/report/export?format=json&last=30d&namespace=production"
```

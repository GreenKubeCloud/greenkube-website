---
title: Prometheus & Grafana
description: Scrape GreenKube's own health and savings ledger metrics with the Prometheus Operator, and import the GreenKube Operations Grafana dashboard.
---

GreenKube works with Prometheus in both directions:

| Direction | What it does | Required? |
|---|---|---|
| GreenKube → Prometheus | GreenKube queries your Prometheus for CPU, memory, restarts and load drivers: the evidence behind recommendations and measurements | Strongly recommended |
| Prometheus → GreenKube | Prometheus scrapes GreenKube's `/prometheus/metrics` for GreenKube's own health (collection, loops, scans, measurement, ledger) and the savings ledger counters, for alerts and the operations dashboard | Optional |

**Footprint data is not exported to Prometheus.** Cost, CO₂e and energy per pod, namespace and node would multiply the series Prometheus stores. Read them in the Footprint pages, `GET /api/v1/report/summary`, `GET /api/v1/report/export` (CSV or JSON) and `GET /api/v1/nodes`.

## Scraping GreenKube

With the Prometheus Operator (kube-prometheus-stack):

```yaml
monitoring:
  serviceMonitor:
    enabled: true
    namespace: ""        # empty: the release namespace, next to the scrape token Secret
    interval: 30s
  prometheusRule:
    enabled: true        # alerts, see Alerts & SLOs
```

The ServiceMonitors scrape the API (port `8000`) and the controller (port `9102`) with bearer-token authentication, using the generated `metrics:read` scrape token `GREENKUBE_METRICS_TOKEN`. Prometheus Operator reads that Secret in the ServiceMonitor's own namespace; when you set `monitoring.serviceMonitor.namespace` elsewhere, the chart keeps a copy there (`<release>-scrape-token`). Make sure Prometheus selects the namespace.

Without the Operator, add scrape jobs for `greenkube-api.greenkube.svc:8000` and `greenkube-controller-metrics.greenkube.svc:9102` at `/prometheus/metrics`, with a bearer token holding a `metrics:read` key.

## Metrics

The API serves seven families:

| Metric | Meaning |
|---|---|
| `greenkube_last_collection_timestamp_seconds` | Unix time of the newest stored metric row; `time() -` it grows while collection is stalled |
| `greenkube_metrics_total` | Pods with a stored metric row in the last 20 minutes |
| `greenkube_co2e_savings_attributed_grams_total`, `greenkube_cost_savings_attributed_dollars_total` | Counters: CO₂e and cost accrued in the savings ledger, by `recommendation_type` and `method` (`projected`, `measured`, `user_declared`) |
| `greenkube_co2e_savings_reversed_grams_total`, `greenkube_cost_savings_reversed_dollars_total` | Counters of reversals. Net savings = attributed − reversed |
| `greenkube_savings_measured_vs_projected_ratio` | Share of net accrued CO₂e savings that is measured rather than projected (0–1) |

The savings of a window are `increase()` of the attributed counter minus `increase()` of the reversed counter, **filtered on `method`**: never add methods together. Only `measured` is realized savings.

The controller serves the control-loop families with bounded labels only: collection (watermark lag, coverage, gap and degraded windows, cluster identity), loops (`greenkube_loop_*`, `greenkube_controller_leader`), recommendation scans and source failures, verification outcomes, ledger integrity (`greenkube_ledger_chain_ok`, `greenkube_ledger_chain_head_seq`, `greenkube_ledger_chain_head_keyed`, reconciliation, write errors), GitOps and automation. No family has a `pod` or workload label of its own. The full list is in [docs/prometheus-grafana.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/prometheus-grafana.md) and [docs/observability-slos.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/observability-slos.md).

Prometheus is for alerting and trends; the persisted runs, measurements and the savings ledger remain the source of truth.

## Grafana dashboard: GreenKube Operations

**GreenKube Operations** (`dashboards/greenkube-operations.json` in the repository, published on Grafana.com as dashboard [25377](https://grafana.com/grafana/dashboards/25377/)) shows the health of a GreenKube install and the savings it has proven. It needs Grafana 10 or later, a Prometheus data source, the API and controller ServiceMonitors, and **no plugin**.

| Row | What it shows |
|---|---|
| **About GreenKube** | What GreenKube does, with links to the docs and the source |
| **Collection** | Age of the newest stored row, watermark lag and coverage per source, abandoned and degraded windows |
| **Loops and scans** | Active controller, consecutive failures and time since last success per loop, time since the last successful scan, scans by status, failures by recommendation source |
| **Measurement and ledger** | Measurement loop age, ledger hash chain and reconciliation status, projection backlog, ledger write and verification errors |
| **Savings (ledger v2)** | Net cost and CO₂e accrued by method (attributed − reversed) and the measured share |
| **Automation** | Backlog of plan operations, plans and webhook deliveries by queue and state |

Variables: **Prometheus** (the data source), **Namespace** (the release namespace, a target label that scopes every panel) and **Cluster** (`CLUSTER_NAME`, carried only by the API families). Controller panels are titled *(all clusters)*. The savings panels take `max` per series before summing, because every API replica serves the same counters.

**Import:** Dashboards → New → Import → enter `25377` (or upload `greenkube-operations.json`) → select your Prometheus data source. When importing through the HTTP API, use `/api/dashboards/import` (not `/api/dashboards/db`): only the import endpoint resolves the `${DS_PROMETHEUS}` input. The JSON has no fixed `uid`.

<details>
<summary>Upgrading from the GreenKube FinGreenOps dashboard</summary>

The former large dashboard (`dashboards/greenkube-grafana.json`, uid `greenkube-fingreenops`) is removed together with the per-pod footprint series and the sustainability score it read, and its panels show "No data" after the upgrade. GreenKube Operations is the new revision of the same Grafana.com listing (25377): import it and delete the old dashboard. The Business Charts plugin is no longer needed. See [Upgrading](/operations/upgrading/#prometheus-metrics-sustainability-score-and-grafana-dashboard).

</details>

## Troubleshooting

| Symptom | Check |
|---|---|
| No GreenKube target in Prometheus | The ServiceMonitor's namespace is selected by Prometheus, and its token Secret exists there (`secret not found` in the operator logs). The `greenkube-api` and `greenkube-controller-metrics` targets must be `UP` |
| "Datasource is not set" in every panel | The dashboard was imported through `/api/dashboards/db`; re-import through the import endpoint |
| Unexpected `cluster` label | Set `config.clusterName` to a stable name |
| Savings panels empty | Normal until the first ledger accrual; collection panels fill after the first collection (5 minutes at most) |

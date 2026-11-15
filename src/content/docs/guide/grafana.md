---
title: Prometheus & Grafana
description: Scrape GreenKube's metrics with the Prometheus Operator and import the GreenKube Savings & Footprint Grafana dashboard.
---

GreenKube works with Prometheus in both directions:

| Direction | What it does | Required? |
|---|---|---|
| GreenKube → Prometheus | GreenKube queries your Prometheus for CPU, memory, restarts and load drivers: the evidence behind recommendations and measurements | Strongly recommended |
| Prometheus → GreenKube | Prometheus scrapes GreenKube's `/prometheus/metrics` for dashboards and alerts | Optional |

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

The ServiceMonitors scrape the API and the controller with bearer-token authentication, using the generated `metrics:read` scrape token `GREENKUBE_METRICS_TOKEN`. Prometheus Operator reads that Secret in the ServiceMonitor's own namespace; when you set `monitoring.serviceMonitor.namespace` elsewhere, the chart keeps a copy there. Make sure Prometheus selects the namespace.

Without the Operator, add a scrape job for `greenkube-api.greenkube.svc.cluster.local:8000` at `/prometheus/metrics` with a bearer token holding a `metrics:read` API key.

## Metric families

| Family | Examples |
|---|---|
| Footprint | Cost, energy and CO₂e per cluster, namespace, pod and node; grid intensity per zone |
| Recommendations and savings | Recommendation counts and projected savings by type, measured versus projected ratio |
| Control loop | Optimization runs, scan duration, source failures, verification outcomes, loop last-success timestamps, leader |
| Collection | Watermark lag, coverage, gap windows, degraded windows, cluster identity mismatch |
| GitOps | Discovery freshness, binding coverage, plan duration, queue age, PR lifecycle, provider rate limits |
| Ledger | Chain verification status and failures, write errors |

Control-loop metrics use bounded labels only. Prometheus is for alerting and trends; the persisted runs, measurements and the savings ledger remain the source of truth.

## Grafana dashboard

The **GreenKube — Savings & Footprint** dashboard is in the repository at `dashboards/greenkube-grafana.json` and published on [Grafana.com](https://grafana.com/grafana/dashboards/25377-greenkube-fingreenops-dashboard/) (id 25377).

![GreenKube Grafana dashboard](/screenshots/grafana-dashboard-top-panel.png)

**Import:** Dashboards → Import → upload the JSON (or enter id 25377) → select your Prometheus datasource. When importing through the API, use `/api/dashboards/import` (not `/api/dashboards/db`): only the import endpoint resolves the `${DS_PROMETHEUS}` variable.

The top row uses the [Business Charts](https://grafana.com/grafana/plugins/volkovlabs-echarts-panel/) panel plugin (v7.2.2 or later); install it before importing.

Template variables: `cluster`, `namespace`, the reporting window, and the ranking basis and number of recommendations shown.

## Troubleshooting

| Symptom | Check |
|---|---|
| No GreenKube target in Prometheus | The ServiceMonitor's namespace is selected by Prometheus, and its token Secret exists there (`secret not found` in the operator logs) |
| "Datasource is not set" in every panel | The dashboard was imported through `/api/dashboards/db`; re-import through the import endpoint |
| No data in all panels | GreenKube cannot reach Prometheus: set `config.prometheus.url` |

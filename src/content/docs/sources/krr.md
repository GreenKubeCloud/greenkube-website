---
title: Robusta KRR
description: Push Robusta KRR JSON reports to GreenKube, from CI or from an optional CronJob, and let consensus compare them with VPA and GreenKube's own analyzers.
---

[KRR](https://github.com/robusta-dev/krr) sizes container requests from Prometheus history. GreenKube ingests its JSON reports as signals.

## What it reads

The output of `krr <strategy> -f json` (KRR 1.x): every scanned container becomes up to two signals, one per resource.

| KRR | Signal |
|---|---|
| `object.namespace`, `kind`, `name`, `container` | The target in this GreenKube's cluster |
| `recommended.requests.cpu` / `memory` (and limits) | A container resources proposal, `RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`, decreases **and increases** |
| `object.allocations` | The current values |
| `strategy.name`, `strategy.settings` | The algorithm (`krr.<strategy>`) and its parameters; the window is `history_duration` before the report was received |
| per-resource `severity` | Evidence and a confidence hint (`CRITICAL` 0.8, `WARNING` 0.7, `OK`/`GOOD` 0.6) |
| `recommended.info` | Evidence details (for example `OOMKill detected`) |

Resources with not enough data (`"?"`), or whose recommendation equals the current request, are skipped and counted.

## Push mode (CI)

```bash
krr simple -f json --logtostderr -p "$PROMETHEUS_URL" > krr.json
curl -sS -X POST "$GREENKUBE_URL/api/v1/sources/krr/reports" \
  -H "Authorization: Bearer $GREENKUBE_SIGNALS_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @krr.json
```

The key needs scope `signals:report`. `?complete=false` marks a partial report (for example one namespace): it adds or refreshes advice instead of replacing the previous report. Reports up to 64 MiB are accepted.

## Job mode (optional CronJob)

Disabled by default. Create a `signals:report` API key and store it in a Secret:

```bash
kubectl -n greenkube create secret generic greenkube-krr --from-literal=api-key=gk_…
```

```yaml
sources:
  krr:
    job:
      enabled: true
      schedule: "17 3 * * *"
      prometheusUrl: http://prometheus-operated.monitoring:9090   # empty: KRR discovers it
      extraArgs: ["--history_duration", "336"]
      apiKeySecret: { name: greenkube-krr, key: api-key }
```

The CronJob runs the KRR image pinned by digest, writes the report to an `emptyDir`, and a GreenKube container posts it to the API. Pods run as non-root with a read-only root filesystem. The chart creates a read-only ServiceAccount and ClusterRole for KRR (no Secrets).

## How it runs

Each scan, the `krr` source replays the signals received within `max_age_hours` (168 by default) through the source runner. KRR advice becomes a recommendation only through consensus. Together with every other pushed signal, KRR counts as at most **one independent vote**. The source is `unavailable` until a report is pushed and `degraded` once the newest report is older than `max_age_hours`.

## Limitations

- The parser is pinned against the KRR 1.x report shape; newer fields are ignored.
- A report covering several clusters is refused: push each cluster's report to the GreenKube of that cluster.
- KRR's own savings estimate is not in its JSON report; GreenKube computes the impact anyway.

---
title: Upgrading
description: Back up first, then upgrade. What changes from GreenKube 0.3.x to 0.4 - one topology, automation always on, PostgreSQL in Helm, removed connectors, analyzers and Prometheus series - and how to move a SQLite install.
---

## Before every upgrade: back up the database

**This step is mandatory.** The controller migrates the database schema at startup, migrations only move forward, and `helm rollback` does not undo them: the only way back from a failed upgrade is to restore a backup taken before it ([Backup and restore](/operations/backup-restore/#roll-back-an-upgrade)).

```bash
# With scheduled backups (postgres.backup.enabled=true): run one now and wait for it.
kubectl -n greenkube create job --from=cronjob/greenkube-postgres-backup backup-before-upgrade
kubectl -n greenkube wait --for=condition=complete job/backup-before-upgrade --timeout=1h

# Without them (0.3.x has none): dump the GreenKube schema to your workstation.
kubectl -n greenkube exec greenkube-postgres-0 -c postgres -- sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema=public --format=custom --no-owner' \
  > greenkube-before-upgrade.dump
kubectl -n greenkube get secret greenkube -o yaml > greenkube-secret.yaml   # store encrypted

helm -n greenkube history greenkube   # note the revision to roll back to
```

Then check the free space of the data volume (a migration that backfills a large table needs about as much free space as that table) and upgrade with `--wait` and a generous `--timeout`.

## From 0.3.x to 0.4

GreenKube 0.4 replaces the two install profiles with one topology (api, controller, renderer, PostgreSQL) and turns automation on for everyone: there is no feature flag left, only `automation.policy.pauseDelivery`. Your data is preserved: the bundled PostgreSQL StatefulSet, its volume and its Secret keep their names.

| 0.3.x | 0.4 |
|---|---|
| `profile: standalone` or `production` | One topology: `<release>-api` and `<release>-controller` Deployments, an optional worker |
| Migrations in a Helm hook Job or at every pod start | The controller migrates at startup under an advisory lock; API replicas report not ready until the schema is current |
| `automation.enabled`, `automation.mode` | Always on; delivery activates when Git credentials exist; `pauseDelivery` pauses it |
| Mandatory `automation.providers[]` with an allowlist | Providers inferred from discovered repositories; one Secret `greenkube-git-credentials`; allowlist `["@discovered"]` |
| Renderer only with automation | Renderer always deployed |
| SQLite in Helm | PostgreSQL only; SQLite stays for `greenkube demo` and local development |
| Three `minSamples` knobs | One: `config.recommendations.minSamples` |
| `config.recommendations.sourcePriority`, `vpaEnabled`, `karpenterEnabled` | `sources.settings.<id>.enabled`; the source priority and the Karpenter NodePool source are removed (see below) |

### Deprecated values

An upgrade that reuses a 0.3.x values file keeps working for this minor release: the chart maps the old keys and lists each one under **DEPRECATED VALUES** in the install notes. In 0.5 the values schema rejects them. Note that `automation.enabled: false` now means *discovery, previews and measurement run, no pull request is opened*.

### Removed connectors and consensus policies

GreenKube's measured value now decides every size; VPA, Goldilocks, KRR and pushed signals move the confidence up or down, and a source alone never creates a recommendation.

| Removed | On upgrade |
|---|---|
| The Kubecost, GKE recommender, Azure Advisor and Polaris connectors | Their `sources.settings.<id>` entries (`kubecost`, `gke`, `azure_advisor`, `polaris`) are accepted and ignored, with one warning at start and a line under DEPRECATED VALUES. Push their advice to `POST /api/v1/signals` instead ([Push API](/sources/push/)). |
| `POST /api/v1/sources/polaris/reports` | Answers `404` for every key; nothing is stored. Delete any job that calls it. |
| The chart's KRR and Polaris CronJobs (`sources.krr.job.*`, `sources.polaris.job.*`) | Ignored with a line under DEPRECATED VALUES; the CronJobs, their ServiceAccounts and ClusterRoles are deleted by the upgrade. Run KRR yourself and push its report: [Robusta KRR](/sources/krr/) has a ready-made CronJob. |
| `RECOMMENDATION_CONSENSUS_POLICY` (`safest`, `median`, `weighted`, `priority`; Helm `config.recommendations.consensusPolicy`) | Accepted and ignored, with one warning at start. |
| `RECOMMENDATION_SOURCE_PRIORITY` (Helm `sources.priority`, `config.recommendations.sourcePriority`) | Accepted and ignored, with one warning at start. |

Migration `0310` marks the **active** recommendations whose chosen source was a removed connector `stale` (reason `type_removed`). Recommendations in a pull request, being measured or already in the ledger are untouched, and the ledger is never rewritten. The next scan rebuilds the other recommendations with the native value, which may change their proposed value (a new revision). These values are refused in a later release: remove them from your values file.

### Removed advisory analyzers

The native advisory analyzers (zombie pods, idle namespaces, off-peak scaling, autoscaling candidates, carbon-aware scheduling, over- and under-provisioned nodes) and the Karpenter NodePool heuristic are gone: their advice could not become a pull request or be measured. Rightsizing and the orphaned LoadBalancer and PersistentVolume detection stay.

- Migration `0300` marks the open recommendations of the retired types (`ZOMBIE_POD`, `IDLE_NAMESPACE`, `OFF_PEAK_SCALING`, `AUTOSCALING_CANDIDATE`, `CARBON_AWARE_SCHEDULING`, `OVERPROVISIONED_NODE`, `UNDERUTILIZED_NODE`), active or ignored, `stale` with reason `type_removed`. No row is deleted, applied and measured ones keep their status, and the savings ledger is not touched.
- `RECOMMENDATION_KARPENTER_ENABLED` and the analyzer thresholds (`ZOMBIE_COST_THRESHOLD`, `ZOMBIE_ENERGY_THRESHOLD`, `AUTOSCALING_CV_THRESHOLD`, `AUTOSCALING_SPIKE_RATIO`, `OFF_PEAK_IDLE_THRESHOLD`, `OFF_PEAK_MIN_IDLE_HOURS`, `IDLE_NAMESPACE_ENERGY_THRESHOLD`, `CARBON_AWARE_THRESHOLD`, `NODE_UTILIZATION_THRESHOLD`; Helm `config.recommendations.zombieCostThreshold` and siblings, `karpenterEnabled`) are accepted and ignored for this release, with one warning at start.
- `sources.settings` entries of the removed sources (`greenkube.zombie`, `greenkube.autoscaling`, `greenkube.off_peak`, `greenkube.idle_namespace`, `greenkube.carbon_aware`, `greenkube.nodes`, `greenkube.nodepool`) are accepted and ignored, named in the same warning.

The Karpenter, Cluster Autoscaler and HPA reads stay: the realization factor and the rightsizing evidence use them.

### Prometheus metrics, sustainability score and Grafana dashboard

`/prometheus/metrics` now exports GreenKube's own health and the savings ledger counters only. Per-pod and per-namespace footprint series are gone: on a 40-pod test fixture the API endpoint drops from 75 metric families and 3,066 series to 7 families and 27 series. Footprint data stays in the Footprint pages, `GET /api/v1/report/summary`, `GET /api/v1/report/export` and `GET /api/v1/nodes`. No HTTP API route, setting or Helm value changes for this, and no data is deleted (the score was never stored).

Recording rules, alerts or dashboards of your own that read these series return no data after the upgrade:

| Removed | Replacement |
|---|---|
| `greenkube_sustainability_score`, `greenkube_sustainability_dimension_score` | None: the score had no defined method |
| `greenkube_pod_*` (cost, CO₂e, energy, requests, usage and efficiency, network, disk, restarts), `greenkube_pue`, `greenkube_grid_intensity_gco2_kwh` | Footprint pages and `GET /api/v1/report/export`; usage from your Prometheus (cAdvisor, kube-state-metrics) |
| `greenkube_namespace_*` and `greenkube_cluster_*` footprint totals, `greenkube_cluster_idle_*`, `greenkube_cluster_with_idle_*`, `greenkube_cluster_pod_count`, `greenkube_cluster_namespace_count` | `GET /api/v1/report/summary`, `GET /api/v1/metrics/summary` |
| `greenkube_node_*` (info, capacity, allocated, embodied emissions) | `GET /api/v1/nodes`; kube-state-metrics |
| `greenkube_carbon_intensity_score`, `greenkube_carbon_intensity_zone`, `greenkube_zone_grid_intensity_gco2_kwh` | The Footprint report |
| `greenkube_dashboard_summary_*` | `GET /api/v1/metrics/dashboard-summary` |
| `greenkube_dashboard_savings_*` window gauges | `increase()` of `greenkube_*_savings_attributed_*_total` minus `greenkube_*_savings_reversed_*_total`, filtered on `method` |
| `greenkube_savings_run_rate_annual_*`, `greenkube_cluster_co2e_saved_grams_total`, `greenkube_cluster_cost_saved_dollars_total` | `GET /api/v1/recommendations/savings` |
| `greenkube_recommendations_total`, `greenkube_recommendations_implemented_total`, `greenkube_recommendations_savings_*`, `greenkube_namespace_recommendation_savings_*`, `greenkube_top_recommendations` | `GET /api/v1/recommendations`; scan health from `greenkube_optimization_runs_total` and `greenkube_recommendations_generated_total` |
| `greenkube_estimated_metrics_ratio` | `greenkube_metric_rows_written_total{source}` (controller) |

Kept: `greenkube_last_collection_timestamp_seconds`, `greenkube_metrics_total`, the four ledger counters, `greenkube_savings_measured_vs_projected_ratio` and every control-loop family. The chart PrometheusRule reads none of the removed series.

**Grafana.** The former dashboard `dashboards/greenkube-grafana.json` (uid `greenkube-fingreenops`) is removed. Import **GreenKube Operations** (`dashboards/greenkube-operations.json`, the new revision of Grafana.com dashboard 25377) and delete the old dashboard from Grafana: its panels show "No data" after the upgrade ([Prometheus & Grafana](/guide/grafana/)).

### Removed usage dimensions

GreenKube no longer collects network receive and transmit, disk read and write, ephemeral storage, or PVC request and usage: nothing used them for a recommendation or a measurement.

- The range collection sends 11 Prometheus range queries per chunk instead of 16 and no longer runs the 3 instant PVC queries of each window.
- New metric rows leave these columns NULL, the hourly rollup no longer aggregates them, and the metrics API no longer returns them. Their per-pod Prometheus series went with the other `greenkube_pod_*` series.
- Pod snapshots no longer record the containers' ephemeral-storage request, so each running pod opens one new snapshot version after the upgrade.
- The measured-ledger input no longer records `traffic_ratio` (it was informational); existing ledger entries are not rewritten.

The columns and their old values stay: migration `0320` only marks them deprecated. A migration after the next release drops them; take a backup before that upgrade if you want to keep the old values.

### Ledger chain key

The upgrade hook generates the savings ledger chain key `LEDGER_CHAIN_KEY` once into the Secret `<release>` (with `secrets.existingSecret`, add the key yourself). Entries already stored keep their plain SHA-256 hash and stay valid; new entries are chained with HMAC-SHA256. Back up the Secret with the database, and see [The ledger chain key](/concepts/measurements-and-ledger/#the-ledger-chain-key) for rotation (`greenkube db ledger-rotate-key`) and for accepting the head after a restore (`greenkube db ledger-accept-head`).

### From an install with PostgreSQL

Use `--reset-then-reuse-values` (Helm 3.14 or later) or pass your values file again. Plain `--reuse-values` does not work for this upgrade: the keys added in 0.4 would be missing, and the chart stops before changing anything.

```bash
helm repo update
helm upgrade greenkube greenkube/greenkube -n greenkube --reset-then-reuse-values --wait --timeout 10m
kubectl -n greenkube rollout status deployment/greenkube-controller
kubectl -n greenkube rollout status deployment/greenkube-api
kubectl -n greenkube delete configmap greenkube --ignore-not-found   # the old hook ConfigMap
```

### From a SQLite install

An upgrade with `config.db.type=sqlite` fails before Helm changes anything and prints the steps. In short:

1. Switch to the bundled PostgreSQL with the controller stopped, keeping the old claim:

   ```bash
   helm upgrade greenkube greenkube/greenkube -n greenkube --reset-then-reuse-values \
     --set config.db.type=postgres --set controller.replicas=0
   ```

2. Copy the data with a one-shot Job running `greenkube db copy --from sqlite:///data/greenkube_data.db --to "$DB_CONNECTION_STRING"`. It copies recommendations, events, the savings ledger, change measurements and the GitOps state; add `--include-metrics` for the metric history (otherwise re-collected). The full Job manifest is in [docs/upgrading.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/upgrading.md#from-a-sqlite-install).
3. Start the controller: `--set controller.replicas=1`.
4. Once you have checked the data, delete the Job and the old claim, and set `config.persistence.enabled=false`.

### Authentication

Existing users go through the initial-admin flow on their first visit: sign in as `admin` with the password of the Secret `<release>-initial-admin` and choose a new one. Existing API keys keep working, including the deprecated bootstrap key `GREENKUBE_API_KEY`, which stays an admin key until you restrict it with `auth.legacyApiKey`.

A 0.3.1 install in `config.apiAuthMode: api_key` has no accounts: its sign-in page asks for an API key. Enter `GREENKUBE_API_KEY` from the Secret `<release>` (or a scoped `gk_` key) to keep browser access; this needs HTTPS or `kubectl port-forward` to `localhost`. To give people their own accounts and roles, move to `config.apiAuthMode: session`.

The upgrade adds the scrape token `GREENKUBE_METRICS_TOKEN` and the ServiceMonitors switch to it in the same release. `monitoring.serviceMonitor.namespace` now defaults to the release namespace, next to the token: check that Prometheus selects that namespace.

The bundled PostgreSQL now accepts connections only from the api, controller and worker pods. A Job of yours that connects to it (backup, `greenkube db copy`) needs the label `greenkube.cloud/postgres-client: "true"` on its pod template.

## Within 0.4

Back up first, then `helm upgrade` with your values file. The controller migrates the schema at startup and the API replicas report ready once it is current. To go back after a migration, restore the backup: `helm rollback` alone does not undo migrations.

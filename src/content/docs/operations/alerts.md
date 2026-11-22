---
title: Alerts & SLOs
description: The Prometheus alerts the GreenKube chart installs (operations, control loops, ledger integrity, cluster identity) and example service-level objectives for the optimization loop.
---

GreenKube exposes its metrics at `/prometheus/metrics` on the API and on the controller (port `9102`). The chart's ServiceMonitors scrape both with a generated `metrics:read` scrape token. Every periodic job runs in the controller, so the control-loop telemetry comes from it.

```yaml
monitoring:
  serviceMonitor:
    enabled: true
  prometheusRule:
    enabled: true
```

A ServiceMonitor whose token Secret is missing is rejected by the Prometheus Operator; every alert that reads a GreenKube metric then stays silent or fires as absent. See [Prometheus & Grafana](/guide/grafana/).

## Operations alerts

Group `greenkube.operations`, on by default with `monitoring.prometheusRule.enabled`. Thresholds are Helm values under `monitoring.prometheusRule.operations`.

| Alert | Meaning |
|---|---|
| `GreenKubeAPIDown` (critical) | No API pod answers its scrape: UI, API and webhooks are down |
| `GreenKubeDatabaseUnavailable` (critical) | Controller heartbeat writes keep failing: the database refuses writes (bundled or external) |
| `GreenKubeAPIUnavailable` (critical) | API pods exist but none is ready: pending migrations or database unreachable |
| `GreenKubePostgresDown` (critical) | The bundled database is not ready |
| `GreenKubeBackupMissing` (warning) | No successful backup for `backupMaxAgeHours` (36) |
| `GreenKubeDataVolumeLow` (warning) | Less than 15% free on the database or backup volume |
| `GreenKubeDataVolumeFillingUp` (warning) | The volume will be full within 4 days at the current growth |

Set `operations.kubeStateMetrics: false` when kube-state-metrics is not scraped, since its alerts would never fire.

## Loop health alerts

Group `greenkube.loop`, rendered with the controller alerts:

| Alert | Meaning |
|---|---|
| `GreenKubeCollectionLagging` | The leader's collection watermark fell behind (30 minutes by default) |
| `GreenKubeCollectionDegraded` | A window was stored in degraded mode after repeated failed pod or node lists (RBAC, API timeouts) |
| `GreenKubeRecommendationScanFailing` | Every scan of the last hour failed |
| `GreenKubeRecommendationSourceFailing` | One source keeps failing; its signals miss the consensus |
| `GreenKubeRecommendationScanStale` | No successful scan for 3 hours |
| `GreenKubeMeasurementStalled` | Apply detection, verification and change measurement are not advancing |
| `GreenKubeGitProviderRateLimited` | A Git provider keeps rate-limiting GreenKube; pull requests are delayed |

## Integrity alerts

| Alert | Meaning | What to do |
|---|---|---|
| `GreenKubeLedgerChainVerificationFailed` (critical, group `greenkube.ledger`) | A ledger entry no longer matches the hash chain (edited, deleted or reordered rows) | Treat the ledger as untrusted, export it and compare it with your last export before anything else writes to it |
| `GreenKubeLedgerChainKeyDropped` | The ledger head was keyed with `LEDGER_CHAIN_KEY` in the last 30 days and is not any more: the chain may have been re-written without the key | Check that the controller still has the key; see [The ledger chain key](/concepts/measurements-and-ledger/#the-ledger-chain-key) |
| `GreenKubeLedgerReconciliationFailed`, `GreenKubeLedgerProjectionBacklog` (warning, 3 hours) | The ledger v2 accrued book no longer equals the v1 accrual rows, or v1 rows are not projected | The savings totals may not reconcile with the report; check the controller logs |
| `GreenKubeAttributionClockSkew`, `GreenKubeAccrualWatermarkAhead` | The controller clock disagrees with the database clock, or the accrual watermark is in the future | Fix the node clock; attribution refuses to accrue meanwhile |
| `GreenKubeClusterIdentityMismatch` (critical) | Collection refuses the database because it belongs to another cluster (cluster rebuilt, backup restored into a new cluster) | See [Restoring into a new cluster](/operations/backup-restore/#restoring-into-a-new-or-rebuilt-cluster) |

The ledger alert is rendered whenever the ServiceMonitor is enabled, even with the controller alerts off.

## Controller and automation alerts

Groups `greenkube.controller` and `greenkube.automation` cover the controller itself (a loop failing, no active controller) and the delivery pipeline (operations or plans stuck, failed syncs, webhook deliveries stuck, a stale plan worker).

## Example service-level objectives

These are example operational objectives, not service guarantees.

| SLO | Target | Signal |
|---|---|---|
| Successful optimization runs | ≥ 99% over 30 days | `greenkube_optimization_runs_total{status="succeeded"}` over all runs |
| Ledger chain verified | 1 | `min(greenkube_ledger_chain_ok)` |
| Fresh collection data | < 15 minutes old | `time() - greenkube_last_collection_timestamp_seconds` |
| No abandoned collection windows | 0 per day | `increase(greenkube_collection_gap_windows_total[1d])` |
| Collection coverage of the backfill horizon | 1.0 | `greenkube_collection_coverage_ratio` |
| Fresh GitOps discovery | < 15 minutes old | `time() - greenkube_gitops_discovery_last_success_timestamp_seconds` |
| Supported-layout binding coverage | ≥ 95% | `greenkube_gitops_coverage_ratio` |
| Plan creation p95 | < 30 seconds | `greenkube_automation_plan_duration_seconds` |
| Verification rollback reviews | < 5% | `greenkube_verification_outcomes_total{outcome="rollback_review"}` |
| Exactly one active controller | 1 | `sum(greenkube_controller_leader)` |

Prometheus is for alerting and trends. The persisted optimization runs, recommendation events, measurements and the savings ledger remain the source of truth, not the metrics.

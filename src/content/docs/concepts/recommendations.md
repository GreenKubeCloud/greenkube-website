---
title: Recommendations
description: How GreenKube turns signals from many sources into one ranked recommendation, with consensus, evidence, projected impact, risk, confidence, expected value and delivery eligibility.
---

A **recommendation** is one proposed change on one target. GreenKube builds it from the signals of every source that has an opinion about that target, then enriches it with what a reviewer needs to decide.

## What a recommendation contains

- **Target**: namespace, workload owner (kind and name), and container when the change is container-specific. Node-level and cluster-level recommendations target a node, a PersistentVolume or a Service.
- **Type**: for example `RIGHTSIZING_CPU`, `RIGHTSIZING_MEMORY`, `ORPHANED_LOAD_BALANCER`.
- **Proposal**: the current and proposed values (CPU request 500m → 200m), or a schedule for off-peak scaling.
- **Evidence**: observation window, sample count and coverage; usage distribution (average, p50, p90, p95, p99, max); restarts and OOM kills; the method used to estimate savings; rollback conditions.
- **Projected impact**: annual cost and CO₂e by component (operational energy, idle share, embodied), the realization factor, and the [released capacity](/concepts/released-capacity/) in cores and GiB.
- **Risk** (`low`, `medium`, `high`) and **confidence** (0–1), each with the factors that explain it.
- **Expected value**: the projected value adjusted for risk and effort, used for ranking.
- **Consensus**: every source's vote, the agreement between them and whether the advice is contested.
- **Eligibility**: whether the recommendation can become a pull request and, if not, each blocker with its code, message and fix.

## Native analyzers

GreenKube's own analyzers are one source among others:

| Type | Trigger (summary) |
|---|---|
| `RIGHTSIZING_CPU`, `RIGHTSIZING_MEMORY` | Two-way. **Decrease** when average usage is far below the request and at least 7 days are observed; **increase** (reliability) when p99 usage approaches the request or OOM kills occur. |
| `ZOMBIE_POD` | A workload that costs money but uses almost no energy, for at least 7 days. Never for DaemonSets, operators, controllers or webhooks. |
| `AUTOSCALING_CANDIDATE` | Spiky CPU usage and no HPA. |
| `OFF_PEAK_SCALING` | Several consecutive idle hours every day; includes a suggested UTC scale-to-zero window. |
| `IDLE_NAMESPACE` | A namespace with cost but almost no energy, for at least 7 days. |
| `CARBON_AWARE_SCHEDULING` | A workload running on a grid much more carbon-intensive than its zone average. |
| `OVERPROVISIONED_NODE` | A node whose average CPU (and memory) utilization is very low. |
| `ORPHANED_PERSISTENT_VOLUME`, `ORPHANED_LOAD_BALANCER` | A volume or LoadBalancer that appears unused continuously for 7 days. |

Each analyzer can be disabled in `sources.settings`; its active advice then goes stale.

## Consensus across sources

VPA, KRR and GreenKube's own analyzer may each size the CPU request of the same container. GreenKube groups their signals by target, capability and finding kind, and the consensus engine picks one value per group with `config.recommendations.consensusPolicy`:

| Policy | Rule |
|---|---|
| `safest` (default) | The least aggressive value: the highest proposed request, for decreases and increases alike. |
| `median` | The median per resource (a value a source actually proposed). |
| `weighted` | The median weighted by each source's measured track record. |
| `priority` | The highest-priority source wins. |

Rules that keep the vote honest:

- **One vote per engine.** Goldilocks runs the VPA recommender, so Goldilocks and VPA on the same object count once. Both stay listed.
- **Pushed signals count once.** All pushed signals together (every push client and the KRR and Polaris reports) are at most one independent vote.
- **Agreement raises confidence.** Agreement of 0.8 or more between two or more independent sources raises the confidence by 10%.
- **Contested advice is flagged.** Agreement below 0.5, or sources proposing opposite directions, labels the recommendation `contested`. A contested recommendation is never approved automatically.
- **GreenKube computes the impact.** A source's own savings claim is kept for comparison only; every projection comes from the same Impact Model.
- **No empty changes.** A consolidated value equal to the current request produces no recommendation.

## Ranking

Recommendations are ranked by a risk-adjusted expected value: the projected billable cost plus CO₂e valued at a shadow carbon price (`impact.carbonPricePerTonne`, 100 per tonne by default), minus the expected cost of an incident weighted by risk and blast radius, and optionally the engineering effort. Profiles change the presets: `balanced`, `cost_first`, `carbon_first`, `low_risk`, `quick_wins`.

## Evidence before advice

Recommendations need evidence first:

- request increases and other recommendation types appear after `minSamples` samples (36, about 3 hours at the default 5-minute step);
- request decreases appear only after 7 days of observed history, so that a weekly cycle is seen.

The setup checklist shows when the first recommendation becomes eligible.

## Statuses

| Status | Meaning |
|---|---|
| `active` | Current and actionable |
| `ignored` | Hidden by a user (can be restored) |
| `stale` | No longer produced by the latest complete scan |
| `expired` | Not acted on before its expiry (14 days by default) |
| `pr_open` | A pull request implementing it is open |
| `applied` | The change is live in the cluster (also a measured change whose saving was not realized or inconclusive) |
| `verifying` | The post-change window is running |
| `verified` | The measured saving was realized and no health check failed |
| `regressed` | A realized saving that no longer holds; its accruals since the drift began are reversed |
| `rollback_review` | A health check failed after the change |
| `reverted` | A rollback reached the cluster |
| `failed` | The pull request was closed without merge, or the change could not be completed |

Every transition is written to an audit trail (`GET /api/v1/recommendations/{id}/events`).

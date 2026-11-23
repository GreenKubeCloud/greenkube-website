---
title: Recommendations
description: How GreenKube turns signals from many sources into one ranked recommendation, with consensus, evidence, projected impact, risk, confidence, expected value and delivery eligibility.
---

A **recommendation** is one proposed change on one target. GreenKube builds it from the signals of every source that has an opinion about that target, then enriches it with what a reviewer needs to decide.

## What a recommendation contains

- **Target**: namespace, workload owner (kind and name), and container when the change is container-specific. Deletion recommendations target a PersistentVolume or a LoadBalancer Service.
- **Type**: for example `RIGHTSIZING_CPU`, `RIGHTSIZING_MEMORY`, `ORPHANED_LOAD_BALANCER`.
- **Proposal**: the current and proposed values (CPU request 500m → 200m), with the limit changes delivered with it.
- **Evidence**: observation window, sample count and coverage; usage distribution (average, p50, p90, p95, p99, max); restarts and OOM kills; the method used to estimate savings; rollback conditions.
- **Projected impact**: annual cost and CO₂e by component (operational energy, idle share, embodied), the realization factor, and the [released capacity](/concepts/released-capacity/) in cores and GiB.
- **Risk** (`low`, `medium`, `high`) and **confidence** (0–1), each with the factors that explain it.
- **Expected value**: the projected value adjusted for risk and effort, used for ranking.
- **Consensus**: every source's vote, the agreement between them and whether the advice is contested.
- **Eligibility**: whether the recommendation can become a pull request and, if not, each blocker with its code, message and fix.

## What GreenKube recommends

GreenKube recommends what it can deliver as a pull request and measure afterwards:

| Type | Trigger (summary) |
|---|---|
| `RIGHTSIZING_CPU`, `RIGHTSIZING_MEMORY` | Two-way. **Decrease** when average usage is far below the request and at least 7 days are observed; **increase** (reliability) when p99 usage approaches the request, a memory working set nears its limit, or OOM kills occur. |
| `ORPHANED_PERSISTENT_VOLUME`, `ORPHANED_LOAD_BALANCER` | A volume or LoadBalancer that appears unused continuously for 7 days (`config.recommendations.deletionMinUnusedDays`). The reason lists the evidence; a deletion is never approved automatically. |

Each native analyzer can be disabled in `sources.settings` (for example `greenkube.orphaned_lb: { enabled: false }`); its active advice then goes stale. Opt a Service or PersistentVolume out of deletion advice with the annotation `greenkube.io/ignore: "true"`.

<details>
<summary>Removed in 0.4.0: advisory analyzers</summary>

The native advisory analyzers (zombie pods, idle namespaces, off-peak scaling, autoscaling candidates, carbon-aware scheduling, node utilization with over- and under-provisioned nodes, including `UNDERUTILIZED_NODE`) and the Karpenter NodePool connector were removed: their advice could not become a pull request or be measured. On upgrade their open recommendations become `stale` with reason `type_removed`; applied and measured ones keep their status and the ledger is not touched. See [Upgrading](/operations/upgrading/#removed-advisory-analyzers).

</details>

## Consensus across sources

VPA, Goldilocks, KRR and GreenKube's own analyzer may each size the CPU request of the same container. GreenKube groups their signals by target, capability and finding kind and applies **one policy**:

- **GreenKube's measured value decides the size.** The consolidated request or limit is the value GreenKube's own analyzer proposed from its measurements.
- **Other sources move the confidence.** VPA, Goldilocks, KRR and pushed signals never change the value. Agreement of 0.8 or more between two or more independent sources raises the confidence by 10%; disagreement (agreement below 0.5, or opposite directions) labels the recommendation `contested` and lowers it by 20%. A contested recommendation is never approved automatically.
- **A source alone never creates a recommendation.** A container request or limit becomes a recommendation only when GreenKube's own analyzer proposed a change for that container. Advice from VPA, Goldilocks, KRR or a push with no native measurement stays a signal on the **Sources** page.

There is nothing to configure: the other consensus policies and the source priority were removed in 0.4.0, and their settings no longer exist ([Upgrading](/operations/upgrading/#removed-connectors-and-consensus-policies)).

Rules that keep the vote honest:

- **One vote per engine.** Goldilocks runs the VPA recommender, so Goldilocks and VPA on the same object count once. Both stay listed.
- **Pushed signals count once.** All pushed signals together (every push client and the KRR reports) are at most one independent vote.
- **Floors and small changes are not votes.** A value on a tool's own minimum (KRR `simple` 10m and 100 Mi, the Fairwinds VPA chart 15m and 100 Mi per pod) is set aside, and a change below 5% (or 10m CPU / 16 MiB) votes to keep the current request. Both are listed in `consensus.ignored_votes`.
- **GreenKube computes the impact.** A source's own savings claim is kept for comparison only; every projection comes from the same Impact Model.
- **No empty changes.** A consolidated value equal to the current request produces no recommendation.

### OOM floor

A memory increase GreenKube proposes because the container was OOM-killed is a **lower bound**: no external proposal (VPA, Goldilocks, KRR, a pushed or plugin signal) can bring the consolidated value below it. Every OOM-driven increase carries a `consensus.floor` block (`source_id`, `signal_id`, `value`, `reason: oom_kills`, `policy_value`, and `applied`, true when the floor raised the value). An OOM-driven increase also raises the memory limit above the new request with headroom, because the kernel kills at the limit, not at the request. CPU has no equivalent: throttling only adds CPU limit advice.

## Ranking

Recommendations are ranked by a risk-adjusted expected value: the projected billable cost plus CO₂e valued at a shadow carbon price (`impact.carbonPricePerTonne`, 100 per tonne by default), minus the expected cost of an incident weighted by risk and blast radius, and optionally the engineering effort. Profiles change the presets: `balanced`, `cost_first`, `carbon_first`, `low_risk`, `quick_wins`.

## Evidence before advice

Recommendations need evidence first:

- request increases appear after `minSamples` samples (36, about 3 hours at the default 5-minute step);
- request decreases appear only after 7 days of observed history, so that a weekly cycle is seen;
- a LoadBalancer or PersistentVolume deletion appears only after the resource looked unused for 7 days in a row.

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

---
title: Savings Measurement
description: How GreenKube measures what an applied change saved - a 7-day baseline, a counterfactual adjusted for load, constant prices, a 90% confidence interval with a noise floor, confounder checks, and the documented statistical limits.
---

GreenKube measures every applied change **once**, against a **counterfactual**: what the workload would have cost **without** the change. The method follows the spirit of IPMVP Option B (retrofit isolation with measurement of the affected system): a baseline period before the change, a reporting period after it, a model that adjusts the baseline to the reporting period's conditions, and an uncertainty statement.

This page summarizes the method for reviewers. The reference, with every formula and its version history, is [docs/methodology/savings-measurement.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/methodology/savings-measurement.md) (strategy `request_rightsizing`, version 2.5).

## What is measured

| Change | Strategy |
|---|---|
| CPU and memory request changes | `request_rightsizing`: the allocated cost, CO₂e and capacity of the workload, per replica |
| Deletion of an orphaned LoadBalancer or PersistentVolume | `resource_deletion`: the asset's allocated rate, released once apply detection verified the resource is absent, only when that rate has a trusted provenance |

Replica, schedule and node-pool changes have no measurement strategy yet.

## 1. Windows

| Window | Default |
|---|---|
| **Baseline** | The **7 days** before the merge (or plan approval). It never contains the change. Seven days give every hour of the week one baseline observation. |
| **Warm-up** | 1 hour after the rollout completed, excluded. |
| **Post-window** | **7 days** after the warm-up. A verdict needs at least 5 complete days of aligned hours. |
| **Health window** | The first 72 hours of the post-window, for the early health gates. |

The baseline is frozen in a snapshot when the change is recorded, with a content hash. Measurements always use the frozen snapshot, never a re-read of the baseline period, and evidence is never frozen from a failed read.

## 2. Hourly observations

Each hour of each window is reduced to one bucket: allocated cost (only from rows with a **trusted** cost provenance: OpenCost, Kubecost or a bundled pricing catalog; configured rates are never trusted), CPU and memory cost components, requested and charged capacity, replicas, usage, energy, operational and embodied CO₂e, and the carbon factor. An hour counts for a quantity when at least half of it is covered by qualifying data. A missing cost is missing, never zero.

- **Constant prices.** Both windows are revalued at the baseline's prices: a request change moves the charged quantity, not the price. A spot-price move or a pricing edit between the windows is never booked as a saving (the price effect is reported separately, not claimed).
- **Constant carbon factor.** Operational CO₂e of both windows is valued at the post-window's grid factor for the same hour of the week, so a windier post week is not booked as a carbon saving of the change.
- **Per replica.** Quantities are fitted per replica and multiplied by the post-window replica-hours. A replica count that drops for another reason (an HPA scaling in) is never credited to the change.

## 3. Counterfactual

The counterfactual is adjusted by a **load driver**, the hourly amount of work the workload was asked to do, taking the first that covers both windows:

1. requests per second from the service mesh or ingress (Istio, Linkerd, ingress-nginx, Envoy/Contour);
2. a PromQL expression in the workload annotation `greenkube.io/load-metric`;
3. the workload's CPU usage (the weakest driver, flagged `weak`).

With a load driver, each quantity is modelled by least squares on the baseline: `metric = α[slot] + β × load`. The slot is the hour of the week when the baseline holds at least two weeks, otherwise the hour of the day split into weekdays and weekends. The fit is used only when its diagnostics pass (enough paired hours and degrees of freedom, identifiable and sensible `β`, little extrapolation); otherwise the quantity falls back to the **hour-of-week model**: the baseline mean of the same hour of the week, scaled by the load ratio with a fitted elasticity between 0 and 1.

## 4. Uncertainty and outcome

The 90% confidence interval of the mean hourly saving has two variance terms:

- **within the windows**: a circular block bootstrap of the hourly savings, with one-day blocks (plus a residual bootstrap of the baseline fit);
- **between weeks**: anything that moves a whole week (traffic, a price level, grid intensity, a holiday). With two or more baseline weeks it is estimated; with the default single baseline week it is an **assumed** week-to-week variation of 5% (`changeMeasurement.priorWeekCv`).

The outcome rule is applied once, at the end of the post-window. There is no repeated testing.

| Condition (on allocated cost) | Outcome |
|---|---|
| A severe confounder was found | `contaminated` |
| Coverage below 0.8, no trusted cost in a window, or fewer than 5 complete days | `inconclusive` |
| Interval lower bound above the noise floor (2% of the counterfactual) | `realized` |
| Interval upper bound at or below the noise floor | `not_realized` |
| Otherwise | `inconclusive` |

Values are signed and never floored: a cost increase is reported as a negative saving with its interval. A CO₂e claim needs its own interval to be realized **and** the change to be realized. **Projection accuracy** (measured ÷ projected annual saving) is reported, always against the **allocated** projection, never against the billable one.

### Confounders

Another recorded change on the workload, a spec or HPA edit inside the windows, a replica shift, a price or instance-type shift, a change in the baseline window, node-pool hardware or capacity changes, and changes to neighbours. Severe confounders make the measurement `contaminated`; moderate ones are reported with the result.

### Health

Per-pod p95 usage against the applied request plus headroom, restarts compared with the baseline restart rate, OOM kills, readiness, CPU throttling. A signal that cannot be read is reported `not_available`, never counted as a pass. A failed health gate sends the change to `rollback_review`.

## 5. After the verdict

- **Drift monitor.** A realized change that loses half of its per-replica saving for 3 consecutive days, or whose requests are reverted, or whose workload is deleted, becomes `regressed`; its measured accruals since the onset are reversed in the ledger.
- **One measurement per change.** The saving is split across the change's recommendations by cost component, so the CPU and memory records of one change never claim the workload's saving twice.
- **Re-measurement** is manual and only for `not_realized` or `inconclusive` measurements; it supersedes the previous measurement.
- **Released capacity** is measured from the workload specs and gets its own verdict ([Released capacity](/concepts/released-capacity/#measured)).

## Statistical limits

These limits are documented in the repository and apply to the defaults:

- **One baseline week.** With the default 7-day baseline, each hour of the week has a single baseline value and the week-to-week variation is assumed (5%), not measured. When the real variation is larger, the interval is too narrow and a zero saving is declared `realized` too often. The project's simulation (400 trials, true saving zero, noise floor on) measured false-`realized` rates of 2.0% at 5% week-to-week variation, **16% at 10% and 33.5% at 20%**, against about 4% with a 28-day baseline. CO₂e in a wind-heavy grid zone typically varies more than 5% between weeks, so CO₂e verdicts with a 7-day baseline are optimistic. An unusual baseline week (a holiday, an incident) also biases the counterfactual.
- **Use a longer baseline** for such workloads: `config.recommendations.changeMeasurement.preWindowDays: 14` (or 28) replaces the assumed variation by an estimate and enables hour-of-week slots.
- **No control group.** A level shift common to the whole cluster is not subtracted, only covered by the interval.
- **Allocated, not billed.** The measured saving is allocated cost: what the workload stops being charged. The bill only drops when nodes are removed; pool-level measurement of billed savings is not implemented.
- **Load-driver heuristics.** The ingress-nginx and Envoy drivers assume a Service named after the workload. Set `greenkube.io/load-metric` when that does not hold.
- **Spec observations depend on the lifecycle interval.** A spec change reverted between two detection passes is not seen.

## Accelerated demo mode

`config.recommendations.changeMeasurement.accelerated` exists for the quickstart only. It accepts a baseline of 1 hour or more and a post-window of 30 minutes or more, and measures on **demo rules**: 5-minute slots instead of clock hours, the baseline mean as counterfactual (no seasonality, no load driver, no between-week term), and a verdict after 6 aligned slots instead of 5 days.

:::caution[Not representative]
A load or price move during the demo windows is attributed to the change. Every accelerated measurement records `representative: false`: it shows the pipeline end to end (`/changes`, `/ledger`, drift), **not a saving**. Its measured saving never accrues in the savings ledger and never restates a projection. Keep the flag off in production.
:::

## Auditing a measurement

`GET /api/v2/changes/{id}` reports whether the baseline snapshot still verifies against its content hash. `GET /api/v2/changes/{id}/measurements` returns the counterfactual parameters (model, diagnostics, interval method, between-week basis, constant prices, carbon factors, price effect), the confounders, the health gates and the capacity verdict. The same evidence always produces the same interval: the bootstrap is seeded from the change.

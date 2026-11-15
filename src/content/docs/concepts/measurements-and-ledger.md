---
title: Measurements & Ledger
description: How GreenKube records an applied change, measures it once against a counterfactual, watches it for drift, and books the result in an append-only, hash-chained savings ledger.
---

A projection says what a change *should* save. A measurement says what it *did* save. GreenKube keeps both, labels both, and never adds one to the other.

## Changes

When apply detection sees that a recommendation is live (the rollout completed and the live requests match the proposal), GreenKube records one immutable **change** per plan and workload revision, with:

- the recommendations it applies, the plan, pull request, merge commit and synced revision when it came through GitOps;
- the workload UID, generations and pod-template digests before and after;
- the rollout start and completion;
- a frozen **baseline snapshot**: the workload's hourly observations over the 7 days before the merge, its load-driver series, the unit prices and the carbon-intensity source of that period. The snapshot carries a content hash, and measurements always use it, never a re-read of the past.

Changes applied by hand (manual mode) are recorded the same way. Changes are served at `GET /api/v2/changes`.

## Measurement

Each change is measured **once**, after a 7-day post-window, against a **counterfactual**: what the workload would have cost without the change. The counterfactual comes from the baseline week, adjusted for the workload's load (mesh or ingress requests, a `greenkube.io/load-metric` annotation, or CPU usage) when a load driver fits, otherwise matched hour of the week.

| Step | What happens |
|---|---|
| Saving | Counterfactual minus actual, per replica, at the baseline's constant prices (a price move is never booked as a saving) |
| Uncertainty | A 90% confidence interval from a circular block bootstrap, plus an assumed week-to-week variation |
| Confounders | Another change on the workload, a spec or HPA edit, replica, price or instance-type shifts, node-pool changes |
| Health | Per-pod usage headroom, restarts compared with the baseline rate, OOM kills, readiness, CPU throttling. A signal that cannot be read is `not_available`, never a pass |
| Outcome | `realized` when the interval is above a 2% noise floor, `not_realized` when it is at or below it, `inconclusive` when it straddles it or coverage is too low, `contaminated` when a severe confounder was found |

The result is compared with the projection (**projection accuracy**: measured ÷ projected allocated saving). Values are signed: a cost increase is reported as a negative saving. A `not_realized` or `inconclusive` change is never re-tested automatically; an operator can start a new measurement that supersedes the previous one.

The full method, with its formulas and documented limits, is in [Savings measurement](/methodology/savings-measurement/).

## Drift monitor

After a change is `realized`, an hourly loop keeps watching it. If the workload loses at least half of its per-replica saving for 3 consecutive days, or its requests are reverted in Git, or it is deleted, the change ends: its recommendations become `regressed` and the measured accruals since the drift began are reversed.

## The savings ledger

Every saving GreenKube reports ends up as an entry of an **append-only, hash-chained ledger**. An entry is one signed amount of one quantity (`cost` in its currency, or `co2e_g`) earned during one UTC hour under one method:

| Method | Meaning |
|---|---|
| `projected` | Accrued while a change is applied but not yet measured |
| `measured_allocated` | Accrued after a realized measurement |
| `user_declared` | Declared on a manual apply |
| `realized_billed` | Reserved for pool-level billed savings; not written yet |

- **Append-only.** Database triggers reject updates and deletes. A correction is always a new entry: a `reversal` (drift, rollback review, revert) or a `restatement` (the projected accrual of a measured period replaced by the measured amount).
- **Hash-chained.** Each cluster's entries are numbered without gaps and chained with SHA-256. The controller verifies the chain at startup and every `config.ledger.chainVerifyInterval` (1 hour); a broken chain raises the critical alert `GreenKubeLedgerChainVerificationFailed`.
- **Linked.** Each entry carries its recommendations, change, measurement, pull request and method version.
- **Never mixed.** The summary keeps one total per method, quantity and unit; different currencies are never added.
- **Exportable.** `GET /api/v2/ledger/export` streams CSV or FOCUS-aligned rows (avoided spend as a credit, corrections as adjustments, with `x-greenkube-*` provenance columns).

Changes that were not realized, are inconclusive, failed, are in rollback review or were reverted accrue nothing measured. Measurements made in the accelerated demo mode never accrue.

Released capacity is reported on each measurement but is not accrued in the ledger: the ledger books cost and CO₂e only. See [Released capacity](/concepts/released-capacity/).

## In the UI

- **Overview**: measured allocated savings, the realization factor, savings pending verification and the projected opportunity, each in its own panel.
- **Changes**: one board from approved plan to measured outcome: Plan → PR open → Merged → Synced → Applied → Measuring → Outcome.
- **Ledger**: totals per method and every applied change with its measurement, confidence interval, projection and split across recommendations.

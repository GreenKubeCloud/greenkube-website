---
title: Measurements & Ledger
description: How GreenKube records an applied change, measures it once against a counterfactual, watches it for drift, and books the result in an append-only, keyed hash-chained savings ledger.
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

Every saving GreenKube reports ends up as an entry of an **append-only, hash-chained ledger**. An entry is one signed amount of one quantity (`cost` in its currency, `co2e_g`, or released capacity in `cpu_core_h` and `mem_gib_h`) earned during one UTC hour under one method:

| Method | Meaning |
|---|---|
| `projected` | Accrued while a change is applied but not yet measured |
| `measured_allocated` | Accrued after a realized measurement |
| `user_declared` | Declared on a manual apply |
| `realized_billed` | Reserved for pool-level billed savings; not written yet |

- **Append-only.** Database triggers reject updates and deletes. A correction is always a new entry: a `reversal` (drift, rollback review, revert) or a `restatement` (the projected accrual of a measured period replaced by the measured amount).
- **Hash-chained and keyed.** Each cluster's entries are numbered without gaps and chained; with the [chain key](#the-ledger-chain-key) new entries are chained with HMAC-SHA256. The controller verifies the chain at startup and every `config.ledger.chainVerifyInterval` (1 hour), incrementally, and the whole chain once a day; a broken chain raises the critical alert `GreenKubeLedgerChainVerificationFailed`. Each verified head is published in Prometheus (`greenkube_ledger_chain_head_seq`, `greenkube_ledger_chain_head_keyed`), so its history is a witness kept outside the database.
- **Linked.** Each entry carries its recommendations, change, measurement, pull request and method version.
- **Never mixed.** The summary keeps one total per method, quantity and unit; different currencies are never added.
- **Exportable.** `GET /api/v2/ledger/export` streams CSV or FOCUS-aligned rows (avoided spend as a credit, corrections as adjustments, with `x-greenkube-*` provenance columns).

Changes that were not realized, are inconclusive, failed, are in rollback review or were reverted accrue nothing measured. Measurements made in the accelerated demo mode never accrue.

Released capacity measured on a verified change is booked as its own quantities (`cpu_core_h`, `mem_gib_h`, reason `released_capacity`), signed, never converted to money or added to a savings total. The measured cost of a reliability fix is booked as a negative `cost` entry with reason `cost_of_fix` and reported as a reliability cost, never netted into savings. See [Released capacity](/concepts/released-capacity/).

## The ledger chain key

The hash chain detects an accidental or partial change: a modified, removed or reordered entry, or a lost tail. With the chain key `LEDGER_CHAIN_KEY`, someone who can write to the database but does not hold the key cannot recompute the chain either, so multiplying values and re-chaining fails verification.

- **Generated once.** The chart's credentials bootstrap hook creates `LEDGER_CHAIN_KEY` in the Secret `<release>` (or you supply `secrets.ledgerChainKey`, or add the key to your `secrets.existingSecret`). It is never stored in the database. Without a key the chain uses plain SHA-256 and the controller warns once.
- **Never lose it.** Entries chained with a key only verify with it. When the head is keyed and the controller holds no key or another one, it appends nothing (fail closed) and counts it in `greenkube_ledger_write_errors_total{reason="chain_key"}`. Back the Secret up with the database.
- **Entries written before the key** keep the plain SHA-256 rule and stay valid. The status row that records where each key took over (by sequence number, never by time) is signed with the current key: an edited, missing or unsigned row fails verification.
- **Alerts.** `GreenKubeLedgerChainKeyDropped` fires when the head was keyed in the last 30 days and is not any more.

### Rotate the key

1. Deploy the Secret with the new key as `LEDGER_CHAIN_KEY` (`secrets.ledgerChainKey`) and the old one in `LEDGER_CHAIN_PREVIOUS_KEYS` (`secrets.ledgerChainPreviousKeys`). The controller then stops appending until the rotation is recorded.
2. With the same environment (for example in the controller pod), run:

   ```bash
   greenkube db ledger-rotate-key --cluster-uid <uid> --reason "scheduled rotation"
   ```

   The command verifies the chain with the old key, records the boundary (new key id, next sequence number), signs the status row with the new key and audits the rotation. A previous key then verifies only the entries before the boundary.
3. Let the next verification run soon after the rotation.

### Accept the head after a restore

A verification failure is sticky: the last verified head anchors every later verification, so a lost tail keeps failing. After a backup restore or a failover that lost the last entries, and once the incident is investigated, accept the current head explicitly:

```bash
greenkube db ledger-accept-head --cluster-uid <uid> --reason "restored from the 03:17 backup"
```

The chain must still pass the structural checks; nothing is written to the ledger, and the acceptance is logged with its reason and the head it replaces. Run it with the controller's `LEDGER_CHAIN_KEY` (and `LEDGER_CHAIN_PREVIOUS_KEYS`) in the environment, otherwise the next verification fails with `status_unsigned`. When the signed status row itself was lost, `--trust-entry-keys` rebuilds the key boundaries from the entries' own keys (only when no trusted row exists; the step is warned and audited).

The key lifecycle and its residual risks are documented in [docs/methodology/savings-measurement.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/methodology/savings-measurement.md) in the repository.

## In the UI

- **Overview**: measured allocated savings, the realization factor, savings pending verification and the projected opportunity, each in its own panel.
- **Changes**: one board from approved plan to measured outcome: Plan → PR open → Merged → Synced → Applied → Measuring → Outcome.
- **Ledger**: totals per method and every applied change with its measurement, confidence interval, projection and split across recommendations.

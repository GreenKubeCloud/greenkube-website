---
title: Released Capacity
description: Released capacity is the third result GreenKube reports next to money and CO₂e - the CPU cores and memory a change frees, projected and measured, never converted to money.
---

Next to cost and CO₂e, GreenKube reports the **reserved capacity a change releases**, in its own units: CPU cores and GiB of memory (plus storage GiB and LoadBalancers for orphaned-resource deletions).

## Why a third quantity

A request cut lowers what a workload is *allocated* immediately. The bill only drops when nodes are removed. On a fixed-capacity cluster (on-premises, bare metal, or a cloud cluster without a node autoscaler), the expected billed saving of a rightsizing is therefore zero, even though the change really freed capacity that other workloads can use or that lets you avoid buying the next node.

Released capacity is the honest result in that situation. It needs **no price, no OpenCost and no autoscaler**.

## Rules

- Released capacity is **never converted to money** and **never added to a cost saving**.
- It is always labelled **projected** (before the change) or **measured** (after it).
- An increase is a negative release and is never shown as a saving.
- Measured on a verified change, it is booked in the savings ledger as its own quantities (`cpu_core_h` core-hours, `mem_gib_h` GiB-hours), never added to a savings total and left out of the FOCUS export.

## Projected

Every recommendation projection reports:

| Figure | Meaning |
|---|---|
| Instantaneous | `(current request − proposed request) × replicas`, in cores and GiB, per replica and in total |
| Annual | CPU core-hours, GiB-hours, replica-hours and node-hours per year, annualized over the target's observed coverage |
| Deletions | Storage GiB of an orphaned PersistentVolume, number of LoadBalancers |

The API returns it as `released_capacity` on each recommendation; the pull request includes a "Released capacity (projected)" table, and the recommendation pages show it in a separate block.

## Measured

Every decided measurement also carries a **capacity verdict**, measured from the workload specs alone (the requests recorded before and after the rollout), independently of prices and of the cost outcome:

| Verdict | When |
|---|---|
| `released` | At least 90% of the proposed per-replica decrease is observed for every resource changed |
| `partially_released` | Between 5% and 90% |
| `not_released` | Below 5% |
| `unknown` | The requests before or after were not recorded |

A replica count that moved for another reason (an HPA scaling out or in) is reported separately as a replica change and never booked as a release. The capacity verdict is decided even when the cost verdict is `inconclusive`, for example on a cluster without OpenCost and without an autoscaler. It is returned by `GET /api/v2/changes/{id}/measurements` and shown on the change page.

![A measured change in the GreenKube UI: the allocated saving with its 90% interval, and a separate Released capacity (measured) panel showing 0.35 CPU cores released (demo data)](/screenshots/demo-change.png)

## From released capacity to the bill

How much released capacity becomes removed node-hours is estimated by the **realization factor**, derived per node pool from the cluster's autoscalers (Karpenter consolidation policy, Cluster Autoscaler, disruption budgets and blockers). See [Impact Model: realization factor](/methodology/impact-model/#realization-factor).

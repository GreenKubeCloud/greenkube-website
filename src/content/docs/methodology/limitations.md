---
title: Limitations
description: What GreenKube's numbers do not capture yet - stated plainly, so that you know how far to trust each figure.
---

GreenKube fails closed and explains why. This page collects the limits documented across the methodology so that you can judge each number before you rely on it. It describes release 0.4.0; known issues and their fixes are tracked in the [changelog](https://github.com/GreenKubeCloud/GreenKube/blob/main/CHANGELOG.md).

## Savings measurement

- **Allocated, not billed.** Measured savings are what the changed workloads stop being *charged*. The bill only drops when nodes are removed; pool-level measurement of billed savings is on the roadmap. The UI shows the expected billed share with its realization factor, labelled as an expectation.
- **One baseline week by default.** The 7-day baseline cannot measure week-to-week variation, so a 5% variation is assumed. When the real variation is larger, false `realized` verdicts become more frequent (16% at 10% variation, 33.5% at 20% in the project's simulation, against about 4% with a 28-day baseline). CO₂e verdicts in grid zones with large weekly swings are optimistic. Use `changeMeasurement.preWindowDays: 14` or more for such workloads.
- **No control group.** A level shift common to the whole cluster is covered by the interval, not subtracted.
- **Request changes and asset deletions only.** GreenKube only recommends what it can measure: CPU and memory requests and limits, and orphaned LoadBalancer and PersistentVolume deletions.
- **Accelerated demo mode is not representative.** Its measurements carry `representative: false` and never accrue in the ledger.

## Cost

- **Without OpenCost, no verified cost saving on-premises.** Configured rates are never trusted for measurement, so on clusters without a bundled catalog every cost measurement ends `inconclusive`. Released capacity is still measured.
- **List prices.** Catalogs contain on-demand list prices with no discounts, savings plans or spot prices. Observed OpenCost costs take precedence when available.
- **No GCP catalog.** GCP nodes without OpenCost fall back to OpenCost's default rates (GCP `us-central1` prices).
- **Marginal pricing.** Projections price released capacity at the node's unit rate; on an over-committed node the measured allocation change can be smaller.

## Energy and carbon

- **Modelled, not metered.** Energy comes from CPU power profiles, a constant memory power per GiB and, when available, DCGM GPU power. Storage and network energy are not modelled. Kepler-measured node power is on the roadmap.
- **Embodied emissions** use an operator value or Boavizta values per instance, else an estimate of 12 kg per vCPU (100 kg when the capacity is unknown), flagged as estimated, and a fixed 4-year lifespan.
- **Grid intensity defaults.** Without live Electricity Maps or Wattnet data, zone defaults or a global fallback (500 gCO₂e/kWh) are used, and rows are tagged with their intensity source.
- **Not an inventory.** Carbon figures are workload-level estimates for decisions; they are not a complete organizational inventory or compliance report.

## Realization

- **The realization factor is a heuristic.** It is derived from autoscaler policies and blockers; it does not yet measure pool headroom or the node-hours actually removed.
- **Fixed capacity means zero expected billed savings.** On a cluster without a node autoscaler, rightsizing projects no billable saving; the released capacity and the allocated saving are the meaningful results there.

## Delivery

- **Pull requests cover container resources and orphaned-resource deletions.** Replicas, HPAs, schedules and NodePool changes are not recommended: the advisory analyzers that produced them were removed because their advice could not be delivered or measured.
- **Some GitOps layouts fail closed**: Argo CD inline Helm values, charts in another repository, remote charts that need registry credentials, runtime-only or cross-repository Flux `valuesFrom`, and Applications deploying to another cluster.
- **A deletion has no automated rollback.** A revert recreates the manifest, not the data or the address.

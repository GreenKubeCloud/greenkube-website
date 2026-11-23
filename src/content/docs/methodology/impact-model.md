---
title: Impact Model
description: The single versioned set of formulas GreenKube uses to allocate cost, energy and CO₂e to workloads and to project what a change releases - reservation-aware allocation, the cost fallback chain, released capacity and the realization factor.
---

The **Impact Model** is the single set of formulas GreenKube uses to say what a workload **is charged** (allocated cost and allocated CO₂e), what it **draws** (energy), and what a proposed change **releases**. Recommendation projections and the stored metric rows both come from it, so a projection and its later measurement are computed the same way.

The model is versioned (currently `4.0.0`); a change to a formula bumps the version, and every projection records the version that produced it. The reference is [docs/methodology/impact-model.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/methodology/impact-model.md).

## Vocabulary

GreenKube never adds these together and always labels them:

| Term | Meaning |
|---|---|
| **Allocated** | The share of node cost and emissions a workload is charged under the allocation policy |
| **Projected** | The model's estimate of how much an allocated value changes if a proposal is applied |
| **Expected (billable)** | Projected allocated change × realization factor: the part expected to become removed node-hours on the bill |
| **Measured** | What [savings measurement](/methodology/savings-measurement/) observes after the change |

## Reservation-aware allocation

For each node and interval, each workload reserves `max(request, usage)` of CPU and memory. Its **reservation share** of the node decides its part of the node's cost, idle power and embodied emissions; the unreserved remainder goes to an `__idle__` row. Dynamic CPU energy follows actual usage.

| Quantity | Split |
|---|---|
| CPU and RAM cost | By CPU and memory reservation share |
| Idle energy | By CPU reservation share |
| Dynamic energy | By CPU usage share |
| Memory energy | By memory reservation (0.392 W/GiB by default, Cloud Carbon Footprint coefficient) |
| GPU energy | As attributed by the DCGM exporter |
| Operational CO₂e | Energy × PUE × grid intensity, same split as the energy |
| Embodied CO₂e | Manufacturing emissions over a 4-year lifespan, by CPU reservation share: an operator value (node annotation `greenkube.io/embodied-kg` or `config.boavizta.embodiedKgByInstanceType`), else Boavizta for the instance type, else 12 kg per vCPU, else 100 kg when the capacity is unknown (fallbacks flagged as estimated) |

Properties:

- **Conservation.** Workloads plus `__idle__` equal the node totals, for cost, energy and CO₂e.
- **One boundary for cost and carbon.** Idle power and embodied emissions follow reservations, like cost, so a request cut lowers a workload's allocated CO₂e the same way it lowers its allocated cost.
- **History at sample time.** Node and pod attributes come from the snapshot history valid at the sample time, not from the live API at collection time.

### Power profiles

1. The instance type has a power profile (Cloud Carbon Footprint per-vCPU coefficients).
2. Otherwise the node's CPU capacity scales a default profile.
3. Otherwise a default profile is used, and the projection is flagged `unknown_node_profile`.

Grid intensity comes from Electricity Maps or [Wattnet](/guide/wattnet/) for the node's electricity zone and hour, with zone defaults when no live value is available. Power profiles, the GPU model, embodied emissions, grid intensity, PUE and what is measured versus estimated are detailed in [Energy & Carbon](/methodology/energy-and-carbon/).

## Unit prices: the cost fallback chain

| Tier | Source | Confidence |
|---|---|---|
| 0. Observed, per sample | The sample's own OpenCost (or OpenCost-compatible Kubecost) cost | 0.9 (0.8 when apportioned from a total) |
| 1. Observed, per node | OpenCost or Kubecost CPU and RAM costs over the node's rows | 0.9 |
| 2. Pricing catalog | On-demand list price of the instance type and region (AWS, Azure, OVHcloud, Scaleway catalogs, generated from public price lists) | 0.75 |
| 3a. Custom rates | `impact.pricing.cpuCoreHour` and `ramGiBHour` | 0.7 |
| 3b. Default rates | OpenCost's default custom pricing (GCP `us-central1` prices) | lower |

The tier is recorded with every projection. GreenKube never converts currencies: a catalog is used only when its currency equals `impact.pricing.currency`. Only tiers 0 to 2 are **trusted** by measurement; configured and default rates price projections but never verify a saving.

## Projections

All window totals are annualized over the target's **observed coverage** (not the whole lookback); coverage below one week is flagged and lowers the confidence.

| Change | Projection |
|---|---|
| Container requests (rightsizing) | The reservation released, priced at the sample's unit prices, plus the idle-power and embodied share that follows it |
| Asset deletion (orphaned PV or LoadBalancer) | The asset's cost (the OpenCost per-asset cost, or a configured default per GiB-month or per LoadBalancer); realization factor 1; CO₂e not modelled |

The workload deletion, replica schedule and node-pool consolidation projections were removed in 0.4.0 with the advisory analyzers that produced them; projections already stored keep their `impact` object as written.

CO₂e is reported by component (operational energy, idle share, embodied). A measurement is only ever compared with the projected value of the components it sees, on the same allocated basis.

## Released capacity

Every projection also reports the reserved capacity the change releases, in its own units: CPU core-hours, GiB-hours, replica-hours and node-hours per year, plus instantaneous cores and GiB, and storage GiB and LoadBalancers for asset deletions. It needs no price, no OpenCost and no autoscaler. Released capacity is **never converted to money and never added to a cost saving**. See [Released capacity](/concepts/released-capacity/).

## Realization factor

```text
expected_billable_cost_annual = allocated_cost_annual × realization_factor
co2e_expected_annual_g        = co2e_allocated_annual_g × realization_factor
```

Released requests only remove cost and emissions from the bill when nodes are removed. GreenKube derives the factor **per node pool** from what the cluster can do:

| Situation | Factor |
|---|---|
| No autoscaler (fixed nodes: allocated savings only) | 0.0 |
| Karpenter `WhenEmptyOrUnderutilized` (or equivalent) | 0.8 |
| Karpenter `WhenEmpty` | 0.3 |
| Cluster Autoscaler | 0.6 |
| Karpenter disruption budget of 0 nodes, always active | 0.0 |
| Any of the above with blockers | × 0.5 |

Blockers include `do-not-disrupt` and `safe-to-evict: "false"` pods, scale-down-disabled nodes, PodDisruptionBudgets that allow no disruption, Karpenter `DisruptionBlocked` events, an unhealthy Cluster Autoscaler, and no consolidation decision while nodes are eligible. Inputs that cannot be read are never treated as "no autoscaler". Before the controller has observed the cluster, the factor is 1.0 and labelled `unobserved`.

`impact.autoscalerHint` declares an autoscaler detection cannot see (`none`, `cluster_autoscaler` or `karpenter`); `impact.realizationFactor` overrides the factor for every projection.

### What the controller reads

Karpenter and the Cluster Autoscaler are **not recommendation sources**: the Karpenter NodePool connector was removed in 0.4.0. The controller reads them, read only, for the realization factor and the risk model:

- the Cluster Autoscaler status ConfigMap `kube-system/cluster-autoscaler-status`;
- Karpenter NodePools (consolidation policy, disruption budgets) and NodeClaims (claim → pool);
- Karpenter `DisruptionBlocked` events (a blocker: the pool's factor is halved) and `Unconsolidatable` events (reported, factor unchanged);
- `do-not-disrupt` / `safe-to-evict` annotations and blocking PodDisruptionBudgets.

Events that cannot be read (RBAC) are reported as such, never as "no blocker". The chart's ClusterRole grants `get`/`list` on `karpenter.sh` NodePools and NodeClaims and `list` on core `events`. HPA reads feed the rightsizing evidence and the risk model.

On a fixed-capacity cluster the expected billable saving of a rightsizing is therefore zero: the honest result there is the [released capacity](/concepts/released-capacity/), and the allocated saving still shows what the workload stops being charged.

## Value and ranking

```text
value_annual = expected_billable_cost_annual + carbon_price × co2e_expected_annual_g / 1e6
```

`impact.carbonPricePerTonne` defaults to 100 currency units per tonne, an internal shadow price in the range of EU ETS prices. Set it to 0 to value cost only. The ranking starts from this value, adjusted for risk and effort.

## SCI mapping

| SCI term (ISO/IEC 21031) | Impact Model |
|---|---|
| `E` (energy) | Allocated energy: dynamic CPU by usage, idle CPU and memory by reservation, attributed GPU, times PUE |
| `I` (intensity) | Grid intensity of the row's zone and hour |
| `M` (embodied) | Boavizta manufacturing emissions × reservation share × time / lifespan |
| `R` (functional unit) | Not modeled: GreenKube reports per workload and per year |

See [Limitations](/methodology/limitations/) for what the model does not capture.

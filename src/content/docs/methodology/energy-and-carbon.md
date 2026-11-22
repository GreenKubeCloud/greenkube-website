---
title: Energy & Carbon
description: How GreenKube estimates node power (CPU, memory, GPU), allocates energy and CO₂e to workloads with an explicit node idle share, resolves embodied emissions, grid intensity and PUE, and what is measured versus estimated.
---

Carbon is reported next to cost on every workload, recommendation and measured change. This page explains where the energy and CO₂e figures come from. They are **model-based estimates, not power-meter readings**; every row records the provenance of each input so you can tell which parts are estimated. The formulas are part of the versioned [Impact Model](/methodology/impact-model/); the reference documents are [docs/power_estimation_methodology.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/power_estimation_methodology.md) and [docs/methodology/impact-model.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/methodology/impact-model.md).

## Node power

For each node and collection step, GreenKube estimates power from three components:

```text
node_cpu_cores     = max(root cgroup CPU of the node, Σ pod CPU)
node_utilization   = min(node_cpu_cores / node_vcores, 1)
cpu_power_watts    = min_watts + node_utilization × (max_watts − min_watts)
memory_power_watts = node_memory_gib × 0.392 W/GiB
gpu_power_watts    = Σ GPUs: measured DCGM board power, else a TDP estimate
```

### CPU

Known instance types use the [Cloud Carbon Footprint](https://www.cloudcarbonfootprint.org/) per-vCPU coefficients of their provider multiplied by the instance's vCPU count:

| Provider | Min W/vCPU | Max W/vCPU |
|---|---:|---:|
| AWS | 0.74 | 3.50 |
| GCP | 0.71 | 4.26 |
| Azure | 0.78 | 3.76 |
| OVH | 0.80 | 3.52 |
| Scaleway | 0.60 | 2.78 |

OVH and Scaleway have no CCF defaults: their values are the average of the CPU micro-architectures they document, following CCF's method for unknown micro-architectures. Each row records where the node profile came from (`power_source`):

1. `instance_profile`: the instance type is in the bundled profile data;
2. `node_capacity_derived`: the node's CPU capacity × its provider's per-vCPU coefficients (the average of the listed providers, 0.73–3.56 W per vCPU, when the provider is unknown); flagged as estimated;
3. `default_profile`: no instance type and no capacity known; the configured default instance (1 vCPU, 1–10 W) is used, flagged as estimated and counted in `greenkube_unknown_power_profile_nodes`.

CPU used outside pods (kubelet, container runtime, kernel) counts in dynamic power when the node's root cgroup series exceeds the pods' sum; that system share goes to the node's idle row.

### Memory

The Cloud Carbon Footprint memory coefficient, **0.392 W per GiB** (`impact.memoryWattsPerGiB`), applied to the node's memory capacity. When the capacity is unknown, only the reserved memory is counted.

### GPU

- **With the NVIDIA DCGM exporter**, GreenKube reads the measured board power (`DCGM_FI_DEV_POWER_USAGE`) and utilization of each GPU per step. A GPU attributed to a pod is charged to that pod; unattributed GPUs go to the node's idle row. When DCGM reports utilization but no power, power is `idle + util × (TDP − idle)` from bundled board-power profiles (idle is 15% of TDP).
- **Without DCGM**, GPUs declared in the node capacity (`nvidia.com/gpu`, `amd.com/gpu`, `gpu.intel.com/*`) are detected. Each GPU a pod requests is charged to it at the TDP formula with an assumed 50% utilization (`config.power.gpuAssumedUtilizationPct`); other GPUs count at the idle floor on the idle row. GPUs of an unknown model are flagged "GPU power not measured".

Rows carry `gpu_source` (`dcgm`, `gpu_tdp_estimate`, `unmeasured`), and the [Footprint nodes page](/guide/footprint/#nodes) badges nodes whose GPU power is estimated or not measured.

### Shared hosts

Nodes on the same physical host (same `bootID`, or `kind://` and `k3d://` provider IDs) are treated as one host: each of N nodes gets 1/N of the host's idle power, memory power and embodied emissions, with a "Shared host" estimation reason. Opt out with `config.power.sharedHostDetection: false`.

## Allocation and the node idle share

Each workload reserves `max(request, usage)` of CPU and memory. The node's power and emissions are split as follows:

| Quantity | Split |
|---|---|
| Idle CPU power (`min_watts`) | By CPU reservation share |
| Dynamic CPU power | By CPU usage share |
| Memory power | By memory reservation share |
| GPU power | To the pod DCGM (or the GPU request) attributes it to |
| Embodied emissions | By CPU reservation share |
| Operational CO₂e | Energy × PUE × grid intensity, same split as the energy |

What no pod reserves (unreserved cores and memory, GPUs without a pod, system CPU) is written to an explicit **`__idle__` row per node and step**, so pod rows plus the idle row add up to the node totals for energy, operational and embodied CO₂e. Idle power and embodied emissions follow reservations, like cost, so a request cut lowers a workload's allocated CO₂e the same way it lowers its allocated cost.

The Footprint page and `GET /api/v1/metrics/summary`, `/metrics/timeseries` and `/report/summary` show the **allocated** totals (workloads), the **node idle share** and the **cluster total** (allocated + idle) side by side, never mixed. See [Footprint](/guide/footprint/).

## Embodied emissions

Manufacturing emissions are amortized per node-hour over a 4-year hardware lifespan: `M_h = GWP × 1000 / (lifespan_years × 8760)` gCO₂e per node-hour. The node's GWP is resolved in this order and recorded as `embodied_source`:

1. `configured`: the node annotation `greenkube.io/embodied-kg` (whole-node kg CO₂e, for on-premises hardware), then `config.boavizta.embodiedKgByInstanceType`;
2. `boavizta`: the lifetime embedded GWP of the cloud instance type from the [Boavizta API](https://api.boavizta.org);
3. `fallback_per_vcpu`: 12 kg CO₂e per vCPU (the Boavizta m5 family ratio, `config.boavizta.embodiedKgPerVcpu`) × cores, plus 0 kg per GiB by default (`embodiedKgPerGib`);
4. `fallback_default`: 100 kg when the node's capacity is unknown.

Rows of the two fallbacks are flagged as estimated ("Embodied emissions estimated"). A failed Boavizta lookup is retried at most every 24 hours.

## Grid carbon intensity

Operational CO₂e is `energy_kWh × PUE × grid intensity` of the node's electricity zone and hour. The provider is `config.electricityProvider`:

- **Electricity Maps** (default), with a token (`secrets.electricityMapsToken`) for live values;
- **[Wattnet](/guide/wattnet/)**, free and EU-funded, for 52 European zones at 15-minute granularity.

Each row records where its intensity came from (`intensity_source`):

| Value | Meaning |
|---|---|
| `consolidated` | Final provider value no older than `INTENSITY_MAX_AGE` (6 hours by default) |
| `realtime` | Provisional provider value; the hourly recompute replaces it once the provider consolidates it |
| `zone_default` | No fresh value: the bundled annual mean of the zone |
| `country_default` | The zone (a sub-zone such as `US-CAL-CISO`) has no bundled value: its country's annual mean |
| `stale` | Only an older value exists and neither the zone nor its country has a default |
| `global_default` | Nothing else: `config.defaultIntensity` (500 gCO₂e/kWh by default) |

The bundled defaults are the annual mean intensity of each country for 2024, with life-cycle emission factors, from [Ember's yearly electricity data](https://ember-energy.org/data/yearly-electricity-data/) (CC BY 4.0). An annual mean ignores hour-to-hour variation: set an Electricity Maps or Wattnet token for hourly values. Defaults are never written into the intensity history, so a missing token or a provider outage cannot pass for measured data.

On-premises, label nodes with their zone (`topology.kubernetes.io/zone=FR`) or set `config.defaultZone`, so they get their country's value rather than the global default.

## PUE

Power Usage Effectiveness multiplies IT energy to account for the data center's cooling and power distribution. Each node's PUE comes from its provider's profile; providers without a specific value, and on-premises nodes (`config.cloudProvider: on-prem`), use `config.defaults.pue` (`1.3` by default). On-premises, set it to the measured PUE of your site.

## GHG Protocol scopes

| Scope | Field | Content |
|---|---|---|
| Scope 2 (location-based estimate) | `co2e_grams` | Grid intensity × energy × PUE |
| Scope 3, category 1 | `embodied_co2e_grams` | Hardware manufacturing emissions, amortized and allocated by CPU reservation |

Scope 1 does not apply to Kubernetes workloads and is not tracked. Exports keep `co2e_grams` and `embodied_co2e_grams` in separate columns.

## Measured versus estimated

| Input | Measured | Estimated |
|---|---|---|
| CPU usage, memory usage, requests | From Prometheus (cAdvisor, kube-state-metrics) | — |
| CPU power | — | CCF power profiles × utilization (`power_source`) |
| Memory power | — | 0.392 W per GiB |
| GPU power | DCGM board power (`gpu_source: dcgm`) | TDP profile (`gpu_tdp_estimate`), or not counted (`unmeasured`) |
| Grid intensity | Provider value (`consolidated`, `realtime`) | Annual means and the global default |
| Embodied emissions | — | Operator value, Boavizta, or a per-vCPU fallback (`embodied_source`) |
| PUE | — | Provider profile or configured default |

Rows built with any estimated input carry `is_estimated` and the reasons.

## Limitations

- **Modelled, not metered.** Energy comes from power profiles, a constant memory power per GiB and, when available, DCGM GPU power. Storage and network energy are not modelled; orphaned PersistentVolume and LoadBalancer deletions project no CO₂e. Kepler-measured node power is on the roadmap.
- **Annual means hide hourly swings.** Without a provider token, intensity is a yearly country mean.
- **Fixed lifespan.** Embodied emissions use a 4-year lifespan for every node.
- **Not an inventory.** Carbon figures are workload-level estimates for decisions, not a complete organizational inventory or compliance report.

See also [Limitations](/methodology/limitations/).

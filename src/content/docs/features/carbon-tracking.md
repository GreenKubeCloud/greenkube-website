---
title: Carbon Tracking
description: GreenKube estimates CPU-based operational CO₂e and hardware embodied emissions for Kubernetes workloads, with documented assumptions and limitations.
---

GreenKube converts modeled Kubernetes workload energy use into **estimated CO₂ equivalent emissions** using electricity-grid carbon intensity data (Scope 2) and hardware manufacturing data (Scope 3). These estimates are not a complete GHG Protocol inventory or a compliance report.

## The Problem

Engineering teams running Kubernetes workloads have no visibility into the carbon footprint they generate. Without measurement, reducing emissions is impossible — and cloud waste compounds the problem by creating unnecessary CO₂ on top of unnecessary spending.

## GHG Scope Classification

GreenKube uses GHG Protocol Scope 2 and Scope 3 terminology for modeled operational and embodied emissions. Its workload estimates do not constitute a complete corporate inventory or compliance report.

### Scope 2 — Operational Emissions (Electricity)

**Field:** `co2e_grams`

Scope 2 covers the carbon emitted by generating the electricity your workloads consume.

```
co2e_grams = energy_kwh × grid_intensity_gCO₂e_per_kWh × pue
```

**Data sources:**
- **Energy:** Estimated from CPU utilization × node power profile (see [Energy Estimation](/architecture/energy-estimation/))
- **Grid intensity:** Real-time data from [Electricity Maps API](https://www.electricitymaps.com/) (default) or the free [Wattnet API](https://wattnet.eu) for European zones — selectable via `config.electricityProvider`
- **PUE (Power Usage Effectiveness):** Provider-level data-center efficiency factors (AWS 1.15, GCP 1.09, Azure 1.18, OVHcloud 1.26, Scaleway 1.37)

### Scope 3, Category 1 — Embodied Emissions (Hardware Manufacturing)

**Field:** `embodied_co2e_grams`

Scope 3 Category 1 covers the upstream carbon cost of manufacturing the cloud hardware running your pods.

```
embodied_co2e_grams = (gwp_kg × 1000 / lifespan_hours) ×
                      (pod_duration_seconds / 3600) ×
                      (pod_cpu_cores / node_cpu_cores)
```

**Data sources:**
- **GWP (Global Warming Potential):** [Boavizta API](https://boavizta.org/) per instance type (typically 50–170 kg for cloud VMs)
- **Fallback:** `DEFAULT_EMBODIED_EMISSIONS_KG` = 100 kg when Boavizta has no data for a given instance type — calibrated to a cloud VM vCPU slice
- **Hardware lifespan:** `DEFAULT_HARDWARE_LIFESPAN_YEARS` = 4 years (standard cloud equipment lifecycle)
- **Allocation:** Proportional to the pod's CPU share of the node

### Total Footprint (Scope 2 + Scope 3)

**Field:** `total_co2e_all_scopes`

This field combines modeled operational and embodied emissions. It is not a complete inventory of all cloud services or an audited organizational footprint.

## How Carbon Zones Work

Each cluster node is automatically mapped to an Electricity Maps zone based on its cloud provider and region. GreenKube includes built-in mappings for:

| Provider | Zone detection |
|----------|---------------|
| AWS | `eu-west-1` → `IE`, `us-east-1` → `US-MIDA-PJM`, etc. |
| GCP | `us-central1` → `US-IL`, `europe-west3` → `DE`, etc. |
| Azure | `westeurope` → `NL`, `eastus` → `US-MIDA-PJM`, etc. |
| OVH | `GRA11` → `GRA` → `FR`, OpenStack `nova` zone handled gracefully |
| Scaleway | `fr-par` → `FR`, `nl-ams` → `NL`, `pl-waw` → `PL` |

If a zone can't be resolved automatically, GreenKube falls back to a configurable default zone (`DEFAULT_ZONE`) or the global default intensity (`DEFAULT_INTENSITY` = 500 gCO₂e/kWh).

## Using Carbon Estimates

Use `co2e_grams`, `embodied_co2e_grams`, and `total_co2e_all_scopes` to compare workloads and track changes over time. Export historical data through the dashboard or API; see [Reports & Exports](/guide/reports/). Keep the energy model, allocation assumptions, fallback values, and missing data alongside any exported totals.

## Carbon Visibility Features

| Feature | Description |
|---------|-------------|
| Per-pod CO₂e breakdown | See exactly which workloads emit the most carbon |
| Scope 2 + Scope 3 per pod | Modeled operational and hardware-embodied components in the estimate |
| Historical time series | Configurable multi-year retention |
| Estimation transparency | `is_estimated` flag + `estimation_reasons` per metric |
| Export formats | CSV, JSON, API access for BI integration |

## Configuration

Set your Electricity Maps API token to use time-varying, zone-specific carbon intensity:

```yaml
# Helm values.yaml
secrets:
  electricityMapsToken: "your-api-token"
```

Without a token, GreenKube uses static default intensities per zone from the bundled CSV. These estimates can help with trend analysis, but lack time-specific grid data. Get a free token at [electricitymaps.com](https://www.electricitymaps.com/).

You can also select the free, EU-funded [Wattnet](https://wattnet.eu) provider for 15-minute-resolution grid intensity across 52 European zones:

```yaml
# Helm values.yaml
config:
  electricityProvider: wattnet
secrets:
  wattnetEmail: "you@example.com"
  wattnetPassword: "your-password"
```

See the [Wattnet guide](/guide/wattnet/) for zone mapping and setup details.

## Related

- [Energy Estimation Methodology](/architecture/energy-estimation/) — Detailed power model
- [Configuration Guide](/getting-started/configuration/) — All environment variables
- [Reports & Exports](/guide/reports/) — Export historical estimates

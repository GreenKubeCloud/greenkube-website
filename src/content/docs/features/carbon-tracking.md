---
title: Carbon Tracking
description: GreenKube measures Scope 2 and Scope 3 carbon emissions for every Kubernetes pod using real-time grid intensity data and hardware embodied emissions.
---

GreenKube converts your Kubernetes cluster's **energy consumption into CO₂ equivalent emissions** using real-time electricity grid carbon intensity data (Scope 2) and hardware manufacturing data (Scope 3), giving full GHG Protocol coverage for cloud workloads.

## The Problem

Engineering teams running Kubernetes workloads have no visibility into the carbon footprint they generate. Without measurement, reducing emissions is impossible — and cloud waste compounds the problem by creating unnecessary CO₂ on top of unnecessary spending.

## GHG Scope Classification

GreenKube implements the **GHG Protocol Corporate Accounting and Reporting Standard** for cloud workloads, covering both operational and upstream emissions.

### Scope 2 — Operational Emissions (Electricity)

**Field:** `co2e_grams`

Scope 2 covers the carbon emitted by generating the electricity your workloads consume.

```
co2e_grams = energy_kwh × grid_intensity_gCO₂e_per_kWh × pue
```

**Data sources:**
- **Energy:** Estimated from CPU utilization × node power profile (see [Energy Estimation](/architecture/energy-estimation/))
- **Grid intensity:** Real-time data from [Electricity Maps API](https://www.electricitymaps.com/) per zone
- **PUE (Power Usage Effectiveness):** Provider-specific datacenter efficiency profiles (AWS 1.15, GCP 1.09, OVH 1.37, etc.)

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

The combined carbon footprint across both scopes is the primary metric for CSRD/ESRS E1 annual GHG disclosure.

## How Carbon Zones Work

Each cluster node is automatically mapped to an Electricity Maps zone based on its cloud provider and region. GreenKube includes built-in mappings for:

| Provider | Zone detection |
|----------|---------------|
| AWS | `eu-west-1` → `IE`, `us-east-1` → `US-MIDA-PJM`, etc. |
| GCP | `us-central1` → `US-IL`, `europe-west3` → `DE`, etc. |
| Azure | `westeurope` → `FR`, `eastus` → `US-MIDA-PJM`, etc. |
| OVH | `GRA11` → `GRA` → `FR`, OpenStack `nova` zone handled gracefully |
| Scaleway | `fr-par` → `FR`, `nl-ams` → `NL`, `pl-waw` → `PL` |

If a zone can't be resolved automatically, GreenKube falls back to a configurable default zone (`DEFAULT_ZONE`) or the global default intensity (`DEFAULT_INTENSITY` = 500 gCO₂e/kWh).

## CSRD / ESRS E1 Reporting

GreenKube is designed as a **CSRD/ESRS E1 reporting tool** for cloud infrastructure emissions. It generates the data needed for mandatory GHG disclosures under the EU Corporate Sustainability Reporting Directive:

| ESRS Requirement | GreenKube Field |
|------------------|-----------------|
| Scope 2 (market-based) | `co2e_grams` |
| Scope 3 upstream (Category 1) | `embodied_co2e_grams` |
| Total GHG (Scope 2 + 3) | `total_co2e_all_scopes` |
| Time range flexibility | `--years 2024`, `--start/--end` |
| Namespace breakdown | `--group-by-namespace` |
| Multi-year retention | Infinite aggregated retention by default |

See [Reports & Exports](/guide/reports/) for instructions on generating CSRD-ready reports.

## Carbon Visibility Features

| Feature | Description |
|---------|-------------|
| Per-pod CO₂e breakdown | See exactly which workloads emit the most carbon |
| Scope 2 + Scope 3 per pod | Full upstream + operational footprint |
| Historical time series | Configurable multi-year retention |
| Estimation transparency | `is_estimated` flag + `estimation_reasons` per metric |
| Export formats | CSV, JSON, API access for BI integration |

## Configuration

Set your Electricity Maps API token for real-time, zone-specific carbon intensity:

```yaml
# Helm values.yaml
secrets:
  electricityMapsToken: "your-api-token"
```

Without a token, GreenKube uses static default intensities per zone from the bundled CSV — still useful for trend analysis, but less accurate for compliance reporting. Get a free token at [electricitymaps.com](https://www.electricitymaps.com/).

## Related

- [Energy Estimation Methodology](/architecture/energy-estimation/) — Detailed power model
- [Configuration Guide](/getting-started/configuration/) — All environment variables
- [Reports & Exports](/guide/reports/) — Generate CSRD-ready reports

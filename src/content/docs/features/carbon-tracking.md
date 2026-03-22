---
title: Carbon Tracking
description: Convert energy consumption to CO₂e emissions using real-time grid carbon intensity data, giving your team clear carbon visibility across all Kubernetes workloads.
---

GreenKube's carbon tracking converts your Kubernetes cluster's **energy consumption into CO₂ equivalent emissions** using real-time electricity grid carbon intensity data.

## The Problem

Engineering teams running Kubernetes workloads have no visibility into the carbon footprint they generate. Without measurement, reducing emissions is impossible — and cloud waste compounds the problem by creating unnecessary CO₂ on top of unnecessary spending.

## How It Works

### 1. Energy Estimation
GreenKube estimates the power consumption of each pod using a combination of:
- **CPU utilization** × node TDP (Thermal Design Power)
- **Memory utilization** × per-GB power coefficient
- **GPU utilization** × GPU TDP (when applicable)
- **Network and disk I/O** power overhead

### 2. Carbon Zone Mapping
Each node is automatically mapped to a **carbon zone** based on its cloud provider and region. GreenKube includes built-in mappings for:
- AWS (all regions)
- Google Cloud Platform (all regions)
- Microsoft Azure (all regions)
- OVH Cloud
- Scaleway

### 3. Carbon Intensity
GreenKube fetches **real-time carbon intensity** (gCO₂/kWh) from [Electricity Maps](https://www.electricitymaps.com/) for each carbon zone. This means your emissions tracking reflects the actual energy mix of the grid powering your workloads.

### 4. Emissions Calculation

```
CO₂e (grams) = Energy (kWh) × Carbon Intensity (gCO₂/kWh)
```

This is computed per pod, aggregated per namespace, and rolled up to the cluster level.

## Carbon Visibility & Reporting

GreenKube gives you the data you need to understand and reduce your carbon footprint:

| Feature | Description |
|---|---|
| Per-pod CO₂e breakdown | See exactly which workloads emit the most carbon |
| Historical data | Time-series storage with configurable retention |
| Audit trail | Immutable metric snapshots with timestamps |
| Export formats | CSV, JSON export; API access for BI integration |
| Methodology transparency | Open-source estimation models |

> **Note on CSRD:** GreenKube provides carbon data that *can be useful* as supporting evidence for sustainability reporting. However, it is not purpose-built as a CSRD compliance tool. For formal regulatory submissions, consult a qualified sustainability auditor.

## Configuration

To enable real-time carbon intensity, set your Electricity Maps API token:

```yaml
# Helm values.yaml
electricityMaps:
  enabled: true
  token: "your-api-token"
```

Without a token, GreenKube falls back to **static carbon intensity averages** per country — still useful, but less accurate.

## Related

- [Energy Estimation Methodology](/architecture/energy-estimation/) — Detailed power model
- [Configuration Guide](/getting-started/configuration/) — All environment variables
- [Reports & Exports](/guide/reports/) — Generate CSRD-ready reports

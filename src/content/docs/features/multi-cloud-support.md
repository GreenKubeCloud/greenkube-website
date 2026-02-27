---
title: Multi-Cloud Support
description: Built-in profiles for AWS, GCP, Azure, OVH, and Scaleway with automatic region-to-carbon-zone mapping.
---

GreenKube supports **all major cloud providers** out of the box, with automatic detection and region-specific carbon intensity mapping.

## Supported Providers

| Provider | Regions | Auto-Detection |
|---|---|---|
| **Amazon Web Services** | All regions (us-east-1, eu-west-1, etc.) | ✅ Via node labels |
| **Google Cloud Platform** | All regions (us-central1, europe-west1, etc.) | ✅ Via node labels |
| **Microsoft Azure** | All regions (eastus, westeurope, etc.) | ✅ Via node labels |
| **OVH Cloud** | All regions (GRA, SBG, BHS, etc.) | ✅ Via node metadata |
| **Scaleway** | All regions (fr-par, nl-ams, pl-waw) | ✅ Via node metadata |
| **On-premises** | Manual configuration | Via config |

## How It Works

### 1. Provider Detection
GreenKube reads Kubernetes node labels to identify the cloud provider:
- `node.kubernetes.io/instance-type` → AWS, GCP, Azure
- `topology.kubernetes.io/region` → Region identifier
- Provider-specific labels as fallback

### 2. Instance Profiles
Each cloud provider instance type has a profile containing:
- **CPU model** and core count
- **TDP** (Thermal Design Power) in watts
- **RAM** capacity
- **GPU** (if applicable)

These profiles are used for power estimation when Prometheus metrics aren't granular enough.

### 3. Region → Carbon Zone Mapping
Each cloud region is mapped to an electricity grid zone:

```
AWS us-east-1     → US-MIDA-PJM    (PJM Interconnection)
AWS eu-west-1     → IE              (Ireland)
GCP europe-west1  → BE              (Belgium)
Azure westeurope  → NL              (Netherlands)
OVH GRA           → FR              (France)
Scaleway fr-par   → FR              (France)
```

This mapping is crucial for accurate carbon tracking — a workload in `eu-west-1` (Ireland, ~300 gCO₂/kWh) has a very different footprint than one in `eu-north-1` (Sweden, ~20 gCO₂/kWh).

## Multi-Cluster Support

GreenKube can monitor multiple clusters across different providers:

```yaml
clusters:
  - name: production-aws
    provider: aws
    region: eu-west-1
    kubeconfig: /path/to/aws-kubeconfig
  - name: staging-gcp
    provider: gcp
    region: europe-west1
    kubeconfig: /path/to/gcp-kubeconfig
```

## Custom Providers

For on-premises or unsupported providers, you can configure:

```yaml
greenkube:
  cloudProvider: "custom"
  carbonZone: "FR"              # Electricity Maps zone
  defaultTdpWatts: 150          # Fallback TDP per node
  defaultPueRatio: 1.2          # Power Usage Effectiveness
```

## PUE (Power Usage Effectiveness)

GreenKube accounts for data center overhead using PUE ratios:

| Provider | Typical PUE |
|---|---|
| AWS | 1.135 |
| GCP | 1.10 |
| Azure | 1.18 |
| OVH | 1.15 |
| On-premises (avg) | 1.5–2.0 |

```
Total Power = IT Power × PUE
```

## Related

- [Carbon Tracking](/features/carbon-tracking/) — How emissions are calculated
- [Energy Estimation](/architecture/energy-estimation/) — Power model details
- [Configuration Guide](/getting-started/configuration/) — Provider settings

---
title: Multi-Cloud Support
description: Built-in profiles for AWS, GCP, Azure, OVH, and Scaleway with automatic region-to-carbon-zone mapping.
---

GreenKube includes instance-power and region-to-carbon-zone data for AWS, GCP, Azure, OVHcloud, and Scaleway, plus configurable support for on-premises clusters. Detection and mapping coverage depends on the node metadata and the built-in mapping tables; unresolved zones use the configured fallback.

## Supported Providers

| Provider | Regions | Auto-Detection |
|---|---|---|
| **Amazon Web Services** | Built-in mappings for supported regions | From node labels |
| **Google Cloud Platform** | Built-in mappings for supported regions | From node labels |
| **Microsoft Azure** | Built-in mappings for supported regions | From node labels |
| **OVHcloud** | Provider-specific power estimates and zone mappings | From node metadata |
| **Scaleway** | Provider-specific power estimates and zone mappings | From node metadata |
| **On-premises** | Manual configuration | Via config |

## How It Works

### 1. Provider Detection
GreenKube reads Kubernetes node labels to identify the cloud provider:
- `node.kubernetes.io/instance-type` → AWS, GCP, Azure
- `topology.kubernetes.io/region` → Region identifier
- Provider-specific labels as fallback

### 2. Instance Power Profiles
Power estimates use a profile with minimum and maximum watts per vCPU and the instance's vCPU count. They are not hardware power measurements; see [Energy Estimation](/architecture/energy-estimation/) for the model and its assumptions.

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

These are examples from the built-in mapping tables; grid intensity changes over time and is sourced separately. Unmapped regions fall back to `config.defaultZone` when set, or to the configured global intensity.

## On-Premises or Unknown Providers

For on-premises clusters or unsupported providers, set:

```yaml
# values.yaml
config:
  cloudProvider: on-prem    # or leave as "unknown" for auto-detection
  defaultZone: "FR"         # Electricity Maps zone code
  defaults:
    pue: 1.5                # Your data center PUE
```

GreenKube uses the SPECpower linear model for power estimation regardless of provider.

## PUE (Power Usage Effectiveness)

GreenKube uses a provider-level PUE factor in its modeled operational-emissions calculation:

| Provider | Typical PUE |
|---|---|
| AWS | 1.15 |
| GCP | 1.09 |
| Azure | 1.18 |
| OVHcloud | 1.26 |
| Scaleway | 1.37 |

For on-premises nodes, configure a PUE appropriate to your environment. The generic default profile uses PUE `1.3`.

```
Total Power = IT Power × PUE
```

## Related

- [Carbon Tracking](/features/carbon-tracking/) — How emissions are calculated
- [Energy Estimation](/architecture/energy-estimation/) — Power model details
- [Configuration Guide](/getting-started/configuration/) — Provider settings

---
title: Multi-Resource Monitoring
description: Collect CPU, memory, network, disk, PVC, and restart metrics from Kubernetes workloads.
---

GreenKube collects CPU, memory, network, disk, storage, and restart data from the supported Prometheus and Kubernetes sources. **Only CPU usage currently feeds the energy and operational CO₂e model**; the other measurements provide resource context and are available in metrics and reports.

## Monitored Resources

### CPU
- **Usage** — CPU utilization per pod from Prometheus
- **Requests** — CPU request values from Kubernetes pod specifications

### Memory
- **Working set** — Memory use reported by `container_memory_working_set_bytes`
- **Requests** — Memory request values from Kubernetes pod specifications

### Network I/O
- **Bytes transmitted and received** — Per-pod network byte rates from Prometheus

### Disk I/O
- **Read throughput** — Disk bytes read per second where Prometheus exposes the counter
- **Write throughput** — Disk bytes written per second where Prometheus exposes the counter

### Storage
- **PVC request and usage** — Storage requests and used bytes where the required metrics are available
- **Orphaned PersistentVolumes** — Recommendations for released volumes or volumes whose claim no longer exists

### Pod Health
- **Restart count** — Per-pod container restarts reported by Prometheus

> **Note:** GPU use is not currently included in the energy model. Memory, network, disk, and storage metrics are also not converted into energy or CO₂e.

## Data Sources

GreenKube collects metrics from multiple sources:

| Source | Metrics |
|---|---|
| **Prometheus** | CPU, memory, network, disk, PVC request/usage, restart counters |
| **Kubernetes API** | Pod and node metadata, resource requests, HPA, health-verification data, PV and LoadBalancer cleanup inputs |
| **OpenCost** | Cost allocation data |
| **Electricity Maps or Wattnet** | Grid carbon intensity for supported zones |
| **Boavizta API** | Hardware data used in embodied-emissions estimates |

## Collection Pipeline

```
Prometheus ─┐
K8s API ────┼──→ Async Collector ──→ Processor ──→ Storage
OpenCost ───┤                                        │
Elec. Maps ─┘                                   Dashboard/API
```

The collection pipeline runs in phases: node discovery first (sequential), then zone resolution, then concurrent metrics collection via `asyncio.gather`, then carbon intensity prefetch and final assembly. This minimises overhead on your cluster.

## Retention & Aggregation

- **Raw metrics (5-min)** — Retained for 7 days (configurable via `METRICS_RAW_RETENTION_DAYS`)
- **Hourly aggregates** — Kept indefinitely by default (configurable via `METRICS_AGGREGATED_RETENTION_DAYS`, default `-1` = no limit) for historical analysis.
- **Compression** — Raw rows are compressed into hourly aggregates after 24 hours (`METRICS_COMPRESSION_AGE_HOURS`)
- **Export** — CSV/JSON for any time range via `/api/v1/report/export`

## Related

- [Data Pipeline Architecture](/architecture/data-pipeline/) — How collection works
- [Energy Estimation](/architecture/energy-estimation/) — How metrics become energy
- [Dashboard](/features/real-time-dashboard/) — Visualize all metrics

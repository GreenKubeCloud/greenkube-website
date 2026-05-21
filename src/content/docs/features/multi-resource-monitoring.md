---
title: Multi-Resource Monitoring
description: Track CPU, memory, network I/O, disk I/O, storage, pod restarts, and GPU usage across your entire Kubernetes cluster.
---

GreenKube provides **comprehensive resource monitoring** that goes far beyond basic CPU and memory metrics, giving you full visibility into your cluster's resource consumption.

## Monitored Resources

### CPU
- **Usage** — Actual CPU seconds consumed per pod
- **Requests vs. Limits** — Configuration vs. actual consumption
- **Throttling** — Detect pods being CPU-throttled
- **Per-core breakdown** — Utilization across individual cores

### Memory
- **Working set** — Actual memory in use
- **RSS** — Resident Set Size
- **Requests vs. Limits** — Identify over/under-provisioned workloads
- **OOM risk** — Pods approaching their memory limits

### Network I/O
- **Bytes transmitted** — Outbound network traffic per pod
- **Bytes received** — Inbound network traffic per pod
- **Packet rate** — Packets per second for anomaly detection
- **Cross-namespace traffic** — East-west traffic patterns

### Disk I/O
- **Read throughput** — Bytes read per second
- **Write throughput** — Bytes written per second
- **IOPS** — I/O operations per second
- **Latency** — Read/write latency percentiles

### Storage
- **PVC usage** — Persistent Volume Claim utilization
- **Capacity planning** — Growth trends and forecasting
- **Orphaned volumes** — PVCs not attached to any pod

### Pod Health
- **Restart count** — Track instability across workloads
- **Uptime** — Time since last restart
- **Phase** — Running, Pending, Failed, Succeeded
- **Container status** — Individual container readiness

> **Note:** GPU data is not collected and used for now. It's planned for future releases.
## Data Sources

GreenKube collects metrics from multiple sources:

| Source | Metrics |
|---|---|
| **Prometheus** | CPU, memory, network, disk |
| **Kubernetes API** | Pod status, restarts, node info, HPAs |
| **OpenCost** | Cost allocation data |
| **Electricity Maps** | Carbon intensity per region |

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
- **Hourly aggregates** — Kept indefinitely by default (configurable via `METRICS_AGGREGATED_RETENTION_DAYS`, default `-1` = no limit). Required for multi-year CSRD/ESRS E1 reporting.
- **Compression** — Raw rows are compressed into hourly aggregates after 24 hours (`METRICS_COMPRESSION_AGE_HOURS`)
- **Export** — CSV/JSON for any time range via `/api/v1/report/export`

## Related

- [Data Pipeline Architecture](/architecture/data-pipeline/) — How collection works
- [Energy Estimation](/architecture/energy-estimation/) — How metrics become energy
- [Dashboard](/features/real-time-dashboard/) — Visualize all metrics

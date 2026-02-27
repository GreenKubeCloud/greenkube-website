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

### GPU (when available)
- **GPU utilization** — Percentage of GPU compute in use
- **GPU memory** — VRAM usage
- **GPU power** — Watts consumed by GPU
- **GPU temperature** — Thermal monitoring

## Data Sources

GreenKube collects metrics from multiple sources:

| Source | Metrics |
|---|---|
| **Prometheus** | CPU, memory, network, disk, GPU |
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

The collection pipeline runs asynchronously using `asyncio.gather`, ensuring minimal overhead on your cluster.

## Retention & Aggregation

- **Raw metrics** — Configurable retention (default: 30 days)
- **Hourly aggregation** — Kept for 90 days
- **Daily aggregation** — Kept for 1 year
- **Export** — CSV/JSON for any time range

## Related

- [Data Pipeline Architecture](/architecture/data-pipeline/) — How collection works
- [Energy Estimation](/architecture/energy-estimation/) — How metrics become energy
- [Dashboard](/features/real-time-dashboard/) — Visualize all metrics

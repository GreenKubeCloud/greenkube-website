---
title: Grafana & Prometheus Integration
description: Set up Prometheus scraping and import the pre-built GreenKube Grafana dashboard for comprehensive FinGreenOps monitoring.
---

import { Aside, Steps } from '@astrojs/starlight/components';

GreenKube exposes Prometheus metrics at `/prometheus/metrics` and ships with a **pre-built Grafana dashboard** for comprehensive FinGreenOps monitoring.

## Prometheus Integration

### Automatic Setup (kube-prometheus-stack)

If you use the **kube-prometheus-stack** (Prometheus Operator), the Helm chart automatically creates a `ServiceMonitor` and a `NetworkPolicy`:

```yaml
# In your values.yaml
monitoring:
  serviceMonitor:
    enabled: true            # Creates a ServiceMonitor resource
    namespace: monitoring    # Must match your Prometheus serviceMonitorNamespaceSelector
    interval: 30s
  networkPolicy:
    enabled: true            # Allows Prometheus to reach the GreenKube API port
    prometheusNamespace: monitoring
```

### Manual Prometheus Setup

If you're not using the Prometheus Operator, add a scrape config manually:

```yaml
# Add to your prometheus.yml
scrape_configs:
  - job_name: 'greenkube'
    scrape_interval: 30s
    metrics_path: /prometheus/metrics
    static_configs:
      - targets: ['greenkube-api.greenkube.svc.cluster.local:8000']
```

### Exposed Metrics

GreenKube exposes the following Prometheus metrics:

| Metric | Type | Description |
|--------|------|-------------|
| `greenkube_co2e_grams` | Gauge | CO₂e emissions per pod |
| `greenkube_energy_joules` | Gauge | Energy consumption per pod |
| `greenkube_cost_total` | Gauge | Cost per pod |
| `greenkube_cpu_usage_millicores` | Gauge | CPU utilization per pod |
| `greenkube_memory_usage_bytes` | Gauge | Memory usage per pod |
| `greenkube_network_receive_bytes` | Gauge | Network bytes received per pod |
| `greenkube_network_transmit_bytes` | Gauge | Network bytes transmitted per pod |
| `greenkube_grid_intensity` | Gauge | Grid carbon intensity per zone |
| `greenkube_recommendation_total` | Gauge | Recommendation counts by type |
| `greenkube_node_info` | Info | Node metadata (instance type, zone, capacity) |

All metrics include labels for `pod`, `namespace`, `node`, and `zone` where applicable.

## Grafana Dashboard

### Import the Dashboard

<Steps>

1. **Get the dashboard JSON**

   The dashboard file is at `dashboards/greenkube-grafana.json` in the [GreenKube repository](https://github.com/GreenKubeCloud/GreenKube).

2. **Import in Grafana**

   In Grafana, go to **Dashboards → Import**, then either:
   - Upload the `greenkube-grafana.json` file, or
   - Paste the JSON content directly

3. **Select your data source**

   Choose the Prometheus data source that scrapes GreenKube metrics.

4. **Click Import**

   The dashboard is ready to use immediately.

</Steps>

### Dashboard Panels

The pre-built Grafana dashboard includes:

**KPI Row:**
- Total CO₂e emissions
- Total cost
- Total energy consumption
- Active pods count
- Active nodes count

**Time-Series Charts:**
- CO₂e emissions over time
- Cost trends over time
- Energy consumption over time

**Namespace Breakdown:**
- Pie charts for CO₂e distribution by namespace
- Pie charts for cost distribution by namespace

**Top Pods:**
- Bar charts for highest-emitting pods
- Bar charts for most expensive pods

**Node Utilization:**
- CPU usage per node
- Memory usage per node

**Grid Intensity:**
- Carbon intensity over time per zone

**Recommendations:**
- Summary table of optimization suggestions with estimated savings

### Customization

The dashboard is fully customizable in Grafana. Common modifications include:

- Adjusting time ranges and refresh intervals
- Adding alerts on CO₂e thresholds
- Filtering by specific namespaces
- Adding custom panels using the GreenKube Prometheus metrics

<Aside type="tip">
  You can set up Grafana alerts on metrics like `greenkube_co2e_grams` to get notified when carbon emissions exceed a threshold — enabling **carbon budget** enforcement.
</Aside>

## Related

- [REST API](/guide/api/) — API endpoints powering the metrics
- [Dashboard Guide](/guide/dashboard/) — Built-in web dashboard
- [Configuration](/getting-started/configuration/) — Monitoring configuration options

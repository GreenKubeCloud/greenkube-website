---
title: Dashboard Guide
description: Learn how to use the GreenKube web dashboard to monitor carbon emissions, costs, and resource usage across your Kubernetes cluster.
---

import { Aside } from '@astrojs/starlight/components';

GreenKube includes a modern web dashboard built with **SvelteKit** and **ECharts**, served directly by the FastAPI backend. No additional deployment required — it ships inside the same container.

## Accessing the Dashboard

After deploying GreenKube, access the dashboard via port-forward:

```bash
kubectl port-forward svc/greenkube-api 8000:8000 -n greenkube
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

<Aside type="tip">
  For production access, configure an **Ingress** resource or set the service type to **LoadBalancer** in your Helm values.
</Aside>

## Dashboard Pages

### 📊 Dashboard (Home)

The main dashboard provides a high-level overview of your cluster's environmental and financial impact:

**KPI Cards:**
- **Total CO₂e** — Aggregate carbon emissions across all pods
- **Total Cost** — Combined cost from OpenCost data
- **Total Energy** — Energy consumption in kWh
- **Active Pods** — Number of monitored pods

**Charts:**
- **Time-series chart** — CO₂ emissions and cost trends over time (ECharts)
- **Namespace breakdown** — Pie chart showing emission distribution by namespace
- **Top pods** — Bar chart of highest-emitting and most expensive pods

### 📈 Metrics

An interactive, sortable, and searchable table with per-pod metrics:

| Column | Description |
|--------|-------------|
| Pod Name | Full pod identifier |
| Namespace | Kubernetes namespace |
| Energy (J) | Energy consumption in Joules |
| CO₂e (g) | Carbon emissions in grams |
| Cost ($) | Allocated cost |
| CPU Usage | Actual CPU utilization (millicores) |
| CPU Request | Requested CPU (millicores) |
| Memory Usage | Actual memory (bytes) |
| Memory Request | Requested memory (bytes) |
| Network Rx/Tx | Network bytes received/transmitted |
| Disk Read/Write | Disk I/O bytes |
| Storage | Ephemeral storage usage |
| Restarts | Container restart count |

**Features:**
- Sort by any column (ascending/descending)
- Search/filter by pod name or namespace
- Export table data to CSV or JSON
- Pagination for large clusters

### 🖥️ Nodes

The node inventory page displays all cluster nodes with:

- **CPU/Memory capacity bars** — Visual representation of available resources
- **Instance type** — Cloud provider instance type (e.g., `m5.xlarge`)
- **Cloud provider** — Detected cloud provider
- **Availability zone** — Node zone/region
- **Carbon zone** — Mapped Electricity Maps zone
- **Architecture** — CPU architecture (amd64, arm64)
- **Operating system** — Node OS

### 💡 Recommendations

Actionable optimization suggestions organized by type:

**Recommendation Types:**

| Type | Icon | Description |
|------|------|-------------|
| **Zombie Pod** | 🧟 | Idle workloads consuming resources with minimal value |
| **Rightsizing** | 📏 | Over-provisioned CPU or memory that can be reduced |
| **Autoscaling** | 📈 | Workloads with high usage variability that benefit from HPA/VPA |
| **Carbon-Aware** | 🌍 | Opportunities for time-shifting to low-carbon periods |
| **Idle Namespace** | 🗂️ | Namespaces with minimal activity |

Each recommendation includes:
- Severity level (low, medium, high, critical)
- Affected resource (pod/namespace)
- Current vs. recommended configuration
- Estimated savings (cost + CO₂e)
- Actionable kubectl commands

### ⚙️ Settings

System configuration and health status:

- **API Health** — Connection status and response times
- **Version** — Current GreenKube version
- **Configuration** — Active settings (sanitized, no secrets)
- **Database** — Connection type and status
- **Prometheus** — Connected endpoint
- **OpenCost** — Connected endpoint

## Dashboard Features

### Theme Support
The dashboard supports both **light** and **dark** modes, detected automatically from your system preferences.

### Responsive Design
Fully responsive layout that works on:
- Desktop monitors
- Tablets
- Mobile phones

### Data Export
Export capabilities are available on most pages:
- **CSV** — For spreadsheet analysis
- **JSON** — For programmatic processing

### Real-time Updates
The dashboard polls the API at regular intervals to display near-real-time data. WebSocket support is available when the connection allows it.

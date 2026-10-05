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
- **Total CO₂e** — Combined modeled operational and embodied estimate
- **Total Cost** — Combined cost from OpenCost data
- **Total Energy** — Energy consumption in kWh
- **Active Pods** — Number of monitored pods
- **Sustainability Score** — 0–100 composite score across 7 dimensions

**Charts:**
- **Time-series chart** — CO₂ emissions and cost trends over time (ECharts)
- **Namespace breakdown** — Pie chart showing emission distribution by namespace
- **Top pods** — Bar chart of highest-emitting and most expensive pods

![GreenKube dashboard home page with KPI cards, trends, and top emitters](/screenshots/demo-dashboard.png)

### ️ Nodes

The node inventory page displays all cluster nodes with:

- **CPU/Memory capacity and allocatable values** with comparison bars
- **Instance type** — Cloud provider instance type (e.g., `m5.xlarge`)
- **Zone and region** — Kubernetes node location labels, when available
- **Architecture and OS** — Node architecture (for example, `amd64` or `arm64`) and operating system
- **Hardware profile** — CPU name, TDP, or GPU count when reported by the hardware data source

![GreenKube nodes page showing node inventory and hardware metadata](/screenshots/demo-nodes.png)

### 💡 Recommendations

Optimization suggestions organized by type and lifecycle status:

**Recommendation Types:** Zombie Pod, CPU/Memory Rightsizing, Autoscaling Candidate, Carbon-Aware Scheduling, Idle Namespace, Off-Peak Scaling, Overprovisioned Node, Underutilized Node, Orphaned PersistentVolume, Orphaned LoadBalancer

**Tabs:** Active, Ignored, Realized Savings, and Pull Requests

Each recommendation includes:
- Priority (high, medium, low)
- Scope (pod, workload, namespace, node, cluster)
- Projected annual savings where supported by the recommendation type
- Ignore flow with an optional reason
- Restore action from the Ignored tab
- Applied recommendations summarized in the Realized Savings tab
- Eligible workload CPU and memory rightsizing recommendations can be previewed as manifest changes and submitted through the GitOps pull-request workflow when configured.

The GitOps workflow creates a pull request; it does not directly apply changes to the cluster. The separate API lifecycle endpoint can mark a recommendation as applied for savings tracking.

![GreenKube recommendations page with active recommendations and annual savings](/screenshots/demo-recommendations.png)

### 📋 Report

Visual report builder for cost and estimated carbon exports:

- **Time range picker** — relative window (1h → ytd), custom `start`/`end` dates, or a full calendar year
- **Namespace filter** — scope to a specific team/environment
- **Granularity** — hourly, daily, weekly, monthly, yearly
- **Preview** — row count and totals before downloading
- **Export** — direct browser download to CSV or JSON

![GreenKube report page with export parameters and preview](/screenshots/demo-report.png)

### ⚙️ Settings

System configuration and health status:

- **Service Health** — Popup-style health check for all data sources (Prometheus, OpenCost, Electricity Maps, Wattnet, Boavizta, Kubernetes, Database) with icons and last-checked timestamps. Inactive electricity providers (e.g. Electricity Maps when Wattnet is selected) are excluded from the overall status.
- **Version** — Current GreenKube version
- **Configuration** — Runtime settings for integration URLs (including Prometheus, OpenCost, and Boavizta), cloud provider, default zone, and electricity provider (Electricity Maps or Wattnet). Changes apply at runtime; persistence to a Kubernetes Secret is best-effort and depends on deployment permissions.
API-key authentication is configured through Helm values or environment variables rather than this dashboard form; see the [Configuration Reference](/getting-started/configuration/).

![GreenKube settings page with health checks and runtime configuration](/screenshots/demo-settings.png)

## Dashboard Features

### Theme Support
The dashboard supports both **light** and **dark** modes, detected automatically from your system preferences.

### Responsive Design
Fully responsive layout that works on:
- Desktop monitors
- Tablets
- Mobile phones

### Data Export
The **Report** page provides CSV and JSON downloads for the selected time range, namespace, aggregation, and grouping options.

### Data Refresh
The dashboard loads data for the selected time window and provides a manual **Refresh** action for dashboard summaries. Values update as collection and summary-refresh jobs run; the web UI does not use a WebSocket stream or continuous client-side polling.

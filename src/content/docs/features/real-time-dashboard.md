---
title: Dashboard
description: A SvelteKit dashboard for periodically refreshed carbon and cost summaries, namespace and top-pod charts, node inventory, and optimization recommendations.
---

GreenKube ships with a **SvelteKit dashboard** for viewing estimated workload energy and carbon, OpenCost allocations, cluster inventory, and recommendations. Data reflects collection and summary-refresh cycles; it is not a real-time telemetry stream.

## Overview

The dashboard is served directly from the GreenKube container alongside the REST API, so there's **nothing extra to install**. Once deployed, access it at `http://<your-service>:8000`.

## Key Capabilities

### Cluster Overview
- **Energy** and estimated CO₂e totals for the selected time window
- **Cost allocations** from OpenCost
- **Namespace breakdown** and a ranked top-pods chart
- **Recommendation summary** and savings information where estimates are available

### Per-Pod Metrics
The home page includes a top-pods chart. Detailed per-pod resource and carbon metrics are available from the REST API and report exports, including CPU and memory use, network and disk counters, requests, and restart counts.

### Node Inventory
A complete view of your cluster nodes including:
- Instance type, CPU and memory capacity/allocatable values
- Architecture, operating system, zone, and region
- Hardware-profile details such as CPU name, TDP, or GPU count when available

### Report Builder
The `/report` page lets you:
- Configure a relative, custom, or calendar-year range, a namespace filter, and aggregation (hourly/daily/weekly/monthly/yearly)
- Preview totals (CO₂e, embodied CO₂e, energy, cost) before downloading
- Export to CSV or JSON directly from the browser — no CLI or `kubectl exec` required

### Service Health & Configuration
- **Settings page:** Color-coded health cards for each data source (green=healthy, yellow=degraded, red=unreachable, gray=unconfigured) with latency and auto-discovery status
- **Startup health popup:** On first load, a modal alerts you if any data source is unreachable and offers inline fields to configure missing URLs/tokens
- **Sidebar health indicators:** Per-service health dots visible from any page
- **Runtime configuration:** Override Prometheus URL, OpenCost URL, Electricity Maps token, and Boavizta URL directly from the browser

### Interactive Charts
- Time-series charts respond to the selected dashboard window
- Namespace and top-pod charts provide additional breakdowns
- The Report page is the dashboard's CSV and JSON export interface

## Architecture

The dashboard is a **SvelteKit SPA** (Single Page Application) that communicates with the GreenKube FastAPI backend:

```
Browser → SvelteKit SPA → FastAPI REST API → PostgreSQL or SQLite
```

All static assets are bundled and served by the same container, ensuring **zero additional infrastructure** is required.

## Screenshots

The dashboard automatically adapts to light and dark themes and is fully responsive for tablet and desktop use.

## Getting Started

After [installing GreenKube](/getting-started/installation/), access the dashboard:

```bash
kubectl port-forward svc/greenkube-api 8000:8000 -n greenkube
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

## Related

- [Dashboard User Guide](/guide/dashboard/) — Detailed usage instructions
- [REST API Reference](/guide/api/) — Endpoints powering the dashboard
- [Architecture Overview](/architecture/overview/) — How data flows through the system

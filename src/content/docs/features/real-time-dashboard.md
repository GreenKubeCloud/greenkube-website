---
title: Real-time Dashboard
description: A modern SvelteKit dashboard providing interactive charts, per-pod metrics, node inventory, and optimization recommendations.
---

GreenKube ships with a **modern SvelteKit dashboard** that provides a complete overview of your Kubernetes cluster's energy consumption, carbon emissions, and cost metrics — all in real time.

## Overview

The dashboard is served directly from the GreenKube container alongside the REST API, so there's **nothing extra to install**. Once deployed, access it at `http://<your-service>:8000`.

## Key Capabilities

### Cluster Overview
- **Energy consumption** (Watts) per node and per namespace
- **Carbon emissions** (gCO₂e) with breakdown by workload
- **Cost estimates** from OpenCost integration
- **Recommendation summary** with estimated savings

### Per-Pod Metrics
Drill down into individual pods to see:
- CPU and memory utilization vs. requests/limits
- Network I/O (bytes sent/received)
- Disk I/O and storage usage
- Pod restart count and uptime
- GPU utilization (if applicable)

### Node Inventory
A complete view of your cluster nodes including:
- Hardware specs (CPU model, cores, RAM, TDP)
- Cloud provider and region
- Carbon zone mapping
- Current power draw (estimated)

### Interactive Charts
- Time-series charts with configurable time ranges
- Stacked area charts for namespace comparison
- Trend analysis with daily/weekly/monthly grouping
- Export chart data as CSV or JSON

## Architecture

The dashboard is a **SvelteKit SPA** (Single Page Application) that communicates with the GreenKube FastAPI backend:

```
Browser → SvelteKit SPA → FastAPI REST API → PostgreSQL/SQLite/ES
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

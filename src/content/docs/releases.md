---
title: Releases
description: GreenKube release history — changelogs, download links, and upgrade guides for all versions.
---

import { Aside } from '@astrojs/starlight/components';

## Current Release

<div class="release-card">

### 🚀 v0.2.0 — Full-Stack FinGreenOps Platform

<span class="release-tag">Latest</span> <span class="release-tag">Stable</span>

**Release Date:** 2025

This major release transforms GreenKube from a CLI tool into a full-stack monitoring platform with a web dashboard, REST API, and comprehensive resource tracking.

#### ✨ New Features

**Dashboard & API:**
- Modern SvelteKit web dashboard with real-time charts (ECharts)
- FastAPI REST API with full OpenAPI documentation
- Interactive per-pod metrics table with sort, search, and export
- Node inventory page with capacity visualization
- Recommendations dashboard with savings estimates
- Settings page with system health monitoring

**Multi-Resource Monitoring:**
- Memory usage tracking (bytes consumed)
- Network I/O monitoring (bytes received/transmitted)
- Disk I/O tracking (bytes read/written)
- Ephemeral storage monitoring (requests and usage)
- Pod restart count tracking
- GPU usage monitoring (millicores, when available)

**Enhanced Recommendations:**
- Autoscaling candidate detection (CV and spike analysis)
- Carbon-aware scheduling suggestions
- Idle namespace cleanup recommendations
- Improved zombie detection with energy thresholds
- Configurable thresholds via Helm values

**Infrastructure:**
- PostgreSQL as default storage backend (StatefulSet in Helm)
- Elasticsearch support for large-scale deployments
- Service auto-discovery for Prometheus and OpenCost
- Multi-architecture Docker images (amd64 + arm64)
- Post-install hook for database initialization
- Comprehensive RBAC (ServiceAccount, ClusterRole)

**Developer Experience:**
- 293+ unit tests
- Pre-commit hooks (Ruff formatting + linting)
- Gitleaks secret scanning in CI
- GitHub Actions CI/CD (lint, test, build, push, Helm publish)

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.0` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube` |
| Source Code | [GitHub Release](https://github.com/GreenKubeCloud/GreenKube/releases) |

</div>

---

<div class="release-card">

### 🌱 v0.1.0 — Initial Release

**Release Date:** 2024

The first public release of GreenKube, establishing the core carbon tracking capabilities.

#### ✨ Features

- CLI-based carbon reporting for Kubernetes workloads
- Prometheus integration for CPU metrics collection
- Energy estimation using Cloud Carbon Footprint methodology
- Carbon emission calculation with configurable grid intensity
- Support for AWS, GCP, Azure cloud providers
- SQLite storage backend
- CSV and JSON export
- Helm chart for Kubernetes deployment
- Basic zombie pod and rightsizing recommendations

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Source Code | [GitHub Release](https://github.com/GreenKubeCloud/GreenKube/releases) |

</div>

---

## Upgrade Guide

### From v0.1.x to v0.2.0

<Aside type="caution">
  v0.2.0 introduces PostgreSQL as the default storage backend. If you were using SQLite, plan a data migration or start fresh.
</Aside>

1. **Update the Helm repository:**
   ```bash
   helm repo update
   ```

2. **Review your values.yaml** — New configuration options are available for:
   - Database backend selection
   - API server settings
   - Recommendation thresholds
   - Prometheus query tuning

3. **Upgrade the release:**
   ```bash
   helm upgrade greenkube greenkube/greenkube \
     -f my-values.yaml \
     -n greenkube
   ```

4. **Verify the upgrade:**
   ```bash
   kubectl get pods -n greenkube
   kubectl port-forward svc/greenkube-api 8000:8000 -n greenkube
   ```

## Versioning

GreenKube follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0) — Breaking changes
- **MINOR** (0.x.0) — New features, backwards compatible
- **PATCH** (0.0.x) — Bug fixes, backwards compatible

## Release Channels

| Channel | Description | Docker Tag |
|---------|-------------|-----------|
| **Stable** | Tested releases | `greenkube/greenkube:0.2.0` |
| **Latest** | Most recent stable | `greenkube/greenkube:latest` |

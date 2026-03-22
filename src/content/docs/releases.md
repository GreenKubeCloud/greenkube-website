---
title: Releases
description: GreenKube release history — changelogs, download links, and upgrade guides for all versions.
---

import { Aside } from '@astrojs/starlight/components';

## Current Release

<div class="release-card">

### 🚀 v0.2.3 — Grafana, Demo Mode & Observability

<span class="release-tag">Latest</span> <span class="release-tag">Stable</span>

**Release Date:** March 2026

A feature-packed release bringing full Prometheus/Grafana integration, a demo mode for easy evaluation, database migrations, API security, and significant architecture improvements.

#### ✨ New Features

**Observability & Monitoring:**
- **Grafana dashboard:** Pre-built `dashboards/greenkube-grafana.json` with KPIs, time-series, per-namespace breakdown, node utilization, grid intensity, and recommendations panels
- **Prometheus integration:** ServiceMonitor, NetworkPolicy, and Prometheus RBAC templates in the Helm chart for seamless kube-prometheus-stack scraping
- **Prometheus `/prometheus/metrics` endpoint:** Comprehensive metric exposition (CO₂e, cost, energy, CPU, memory, network, disk, restarts, nodes, grid intensity, recommendations) with correct label relabeling

**Demo & Evaluation:**
- **Demo mode:** `greenkube demo` command generates 7 days of realistic sample data (22 pods, 5 namespaces) in a standalone SQLite instance — explore the dashboard without a live cluster

**Infrastructure & Reliability:**
- **Database migration system:** Automated schema migration runner with versioned scripts for PostgreSQL and SQLite
- **API security:** Optional bearer-token authentication (`GREENKUBE_API_KEY`), configurable CORS origins, rate limiting via slowapi
- **Pagination:** `GET /api/v1/metrics` now supports `offset` and `limit` query parameters
- **Docker healthcheck:** Built-in `HEALTHCHECK` instruction for standalone usage
- **Helm chart tests:** `helm test` connectivity validation via `test-connection.yaml`
- **Graceful shutdown:** `preStop` lifecycle hook on the API container

**Architecture:**
- **`CarbonIntensityRepository` split:** Dedicated repository implementations per backend (Postgres, SQLite, Elasticsearch) following the same pattern as other repositories
- **DataProcessor refactor:** Monolithic processor split into focused collaborators — `CollectionOrchestrator`, `MetricAssembler`, `NodeZoneMapper`, `PrometheusResourceMapper`, `CostNormalizer`, `HistoricalRangeProcessor`, `EmbodiedEmissionsService`
- **Dependency injection:** Replaced global `Config` singleton and global `db_manager` singleton with explicit lifecycle management

**Documentation & Testing:**
- On-premises zone configuration guide
- Prometheus & Grafana setup guide
- Contributing guide (`CONTRIBUTING.md`) and architecture diagram
- API curl examples in README
- **474+ unit tests** (up from 323) with full integration test coverage
- Shared `parse_duration()` utility, `Config.reload()` for test isolation

#### 🔄 Changed
- Minimum Python version raised from 3.9 to 3.10 (3.9 reached EOL October 2025)
- Helm chart generates a random PostgreSQL password when none is provided
- Replaced f-string logging with lazy `%`-formatting throughout the codebase
- `Recommendation` model uses typed `scope` field instead of sentinel `pod_name="*"`

#### 🐛 Fixed
- CLI `recommend` command now uses the unified recommendation engine (all 9 types) instead of legacy 2-type API
- CLI `recommend` reads from database by default (consistent with API); added `--live` flag for real-time mode
- Cost normalization in `run_range()` now divides range total by number of time steps
- Helm `recommendSystemNamespaces` moved inside `recommendations` scope in `values.yaml`
- PostgreSQL credentials no longer shipped as plain text in Helm defaults
- DB connection string sourced from Secret instead of inline env var in deployment
- Removed `.tgz` artifacts from git tracking

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.3` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube` |
| Source Code | [GitHub Release](https://github.com/GreenKubeCloud/GreenKube/releases) |

</div>

---

<div class="release-card">

### 🚀 v0.2.2 — Bug Fixes & Data Quality

**Release Date:** February 2026

A quality-focused release addressing 25 bugs identified during a comprehensive data quality audit, improving calculation accuracy, storage consistency, and overall reliability.

#### 🐛 Bug Fixes

**Calculation & Accuracy:**
- Fixed PUE triple-inconsistency: per-provider PUE now passed as parameter to calculator
- Fixed OpenCost cost 288× overestimate by dividing daily cost by steps per day
- Zone-specific default grid intensity (e.g. FR=26 gCO₂/kWh) instead of global 500
- Added `calculation_version` field to CombinedMetric for reproducibility
- Added public `prefetch_intensity()` method on calculator

**Storage & Consistency:**
- Fixed `carbon_intensity` column type from INTEGER to REAL in SQLite
- Fixed `node` column missing in SQLite schema
- Added `DO UPDATE` upsert logic instead of silent `DO NOTHING`
- Removed 48-hour lookback window from SQLite for backend consistency
- Fixed volume mount missing in API container for SQLite mode
- Split `EmbodiedRepository` into per-backend classes with shared ABC

**Collectors & Integrations:**
- Fixed `ElectricityMapsCollector` to pass `target_datetime` to API
- Fixed `BoaviztaCollector` to reuse httpx client instead of creating one per request
- Removed pytest hack from `BasicEstimator` — always uses configured step

**Architecture & Reliability:**
- Added jitter (±10%) and exponential backoff to scheduler
- Moved all Config class-level attributes to instance attributes for test isolation
- Added `clear_caches()` to factory for proper test teardown
- Aggregator no longer mutates input metrics (uses `model_copy()`)
- CPU-adjusted metrics now flagged with estimation reason

**Testing:**
- 323+ unit tests (up from 293)
- All tests isolated and deterministic

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.2` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube` |
| Source Code | [GitHub Release](https://github.com/GreenKubeCloud/GreenKube/releases) |

</div>

---

<div class="release-card">

### 🚀 v0.2.0 — Full-Stack FinGreenOps Platform

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

**Release Date:** 2025

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
| **Stable** | Tested releases | `greenkube/greenkube:0.2.3` |
| **Latest** | Most recent stable | `greenkube/greenkube:latest` |

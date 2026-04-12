---
title: Releases
description: GreenKube release history — changelogs, download links, and upgrade guides for all versions.
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Current Release

<div class="release-card">

### 🚀 v0.2.8 — Security Hardening & SCD2

<span class="release-tag">Latest</span> <span class="release-tag">Stable</span>

**Release Date:** April 11, 2026

#### 🔒 Security

- **Dockerfile hardening:** Builder stage upgraded to `node:22-alpine`. Both stages now run `apt-get upgrade` to patch OS CVEs. The final image runs as `greenkube` (UID/GID 10001) with `/sbin/nologin` shell.
- **Helm securityContext:** Full pod + container hardening on collector and API — `runAsNonRoot`, `allowPrivilegeEscalation: false`, `readOnlyRootFilesystem: true`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`. `/tmp` served by `emptyDir` volumes (64 MiB each).
- **PostgreSQL securityContext:** `readOnlyRootFilesystem: true`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault`. Upgraded from `17-alpine` to `18-alpine`. `/var/run/postgresql` and `/tmp` mounted as `emptyDir` volumes.
- **SCRAM-SHA-256:** `POSTGRES_INITDB_ARGS` now enforces `scram-sha-256` authentication, replacing the legacy MD5 protocol. Liveness and readiness probes added via `pg_isready`.
- **ClusterRole least-privilege:** Removed `secrets` from the ClusterRole resource list — eliminates the critical RBAC over-permission (KSV-0041) that allowed reading cluster-wide secrets.
- **API security headers:** New `SecurityHeadersMiddleware` injects 7 OWASP-recommended headers on every response: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Cache-Control`, and `Content-Security-Policy`. CORS now restricted to `GET`, `POST`, `OPTIONS` and explicit headers.
- **Automated vulnerability scanning (CI):** New `security.yml` GitHub Actions workflow — Trivy image scan, Trivy IaC scan (Dockerfile + Helm), Trivy filesystem scan (Python deps), and `npm audit`. Runs on every push/PR to `main`/`dev` and weekly. SARIF results uploaded to GitHub Security.
- **`.trivyignore`:** Documents 8 upstream-unfixable CVEs with justifications and a quarterly review date.

#### ✨ Added

- **`secrets.existingSecret` Helm value:** Pass a pre-created Kubernetes Secret instead of storing credentials in `values.yaml` — recommended for production.
- **SQLite SCD2 node snapshots:** `SQLiteNodeRepository` implements Slowly Changing Dimensions Type 2. A `node_snapshots_scd` table stores only rows where tracked columns (`instance_type`, `vcpu`, `memory_gb`, `region`, `provider`, `zone`) actually changed, avoiding write amplification on stable clusters.
- **Recommendation `scope` column:** `recommendation_history` now includes a `scope` column (`pod`, `namespace`, `node`) for granularity filtering. `pod_name` and `namespace` are nullable for node-scope recommendations. Applied in migration `0003`.
- **Configurable connection pool:** `DB_POOL_MIN_SIZE` (default: 2) and `DB_POOL_MAX_SIZE` (default: 10) control `asyncpg` pool bounds. Exposed as `db.poolMinSize` / `db.poolMaxSize` in `values.yaml`.
- **Configurable statement timeout:** `DB_STATEMENT_TIMEOUT_MS` (default: 30 000 ms) sets per-statement timeout via `server_settings`. Exposed as `db.statementTimeoutMs`.
- **Database indexes (migration 0003):** Compound indexes on `combined_metrics(namespace, timestamp)`, `namespace_cache(last_seen)`, `carbon_intensity_history(datetime)`.
- **Artifact Hub listing:** `Chart.yaml` enriched with full Artifact Hub annotations (category, 6 screenshots, links, recommendations, images for amd64 + arm64, maintainers, readme). `artifacthub-repo.yml` added for Verified Publisher badge.
- **`llms.txt`:** LLM/AI crawler guidance file (`greenkube-website/public/llms.txt`) following the [llms.txt](https://llmstxt.org/) convention.

#### 🐛 Fixed

- **Aggregate queries spanning raw + hourly tables:** `aggregate_summary` and `aggregate_timeseries` now correctly query both `combined_metrics` and `hourly_metrics`, preventing gaps between live and archived data.
- **Infinite aggregated retention by default:** `METRICS_AGGREGATED_RETENTION_DAYS` defaults to `-1` (infinite) for CSRD/ESRS E1 compliance. Set a positive integer to enforce a rolling window.
- **Frontend npm audit (HIGH):** Updated `svelte`, `vite`, `rollup`, `picomatch`, `devalue`, and `@sveltejs/kit` to resolve all HIGH-severity advisories.

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.8` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube && helm install greenkube greenkube/greenkube -n greenkube --create-namespace` |
| Source Code | [GitHub Release v0.2.8](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.8) |

</div>

---

<div class="release-card">

### 🚀 v0.2.7 — Service Health, CI/CD Gates & Scaleway

**Release Date:** April 5, 2026

#### ✨ New Features

**Observability & Health:**
- **Collector health checks:** New `HealthCheckService` performs periodic connectivity checks against all data sources (Prometheus, OpenCost, Electricity Maps, Boavizta, Kubernetes). Each probe reports status (`healthy`, `degraded`, `unreachable`, `unconfigured`), latency, resolved URL, and auto-discovery status.
- **`GET /api/v1/health/services` endpoint:** Aggregated health status for all data sources with per-service details. Supports `?force=true` to bypass the 30-second cache.
- **`GET /api/v1/health/services/{service_name}` endpoint:** Health status for a single named service.
- **`POST /api/v1/config/services` endpoint:** Update service URLs (Prometheus, OpenCost, Boavizta) and the Electricity Maps token at runtime from the frontend.
- **Frontend service health overview:** Settings page displays color-coded health cards (green=healthy, yellow=degraded, red=unreachable, gray=unconfigured) with latency, URL, and auto-discovery status.
- **Frontend startup health popup:** On first load, if any data source is unreachable or unconfigured, a modal popup alerts the user with inline configuration fields.
- **Sidebar health indicators:** Per-service health dots for all data sources in the sidebar.

**Cloud Provider:**
- **Scaleway Kapsule support:** Detects Scaleway nodes via `k8s.scaleway.com/*` labels and `node.spec.provider_id`. Supports `fr-par`, `nl-ams`, `pl-waw` mapped to Electricity Maps zones. PUE profile: 1.37.

**CI/CD Integration:**
- **`--no-color` / `NO_COLOR`:** Disables Rich formatting for clean pipeline logs.
- **`--fail-on-recommendations`** on `greenkube recommend`: Exit code 1 when recommendations are found.
- **`--fail-on-co2-threshold` / `--fail-on-cost-threshold`** on `greenkube report`: Enforce carbon/cost policy gates in CI/CD.

**Testing:**
- Vitest frontend test suite with **133 tests** across 8 files covering all JS utilities and Svelte components.
- Total: **771 tests** (Python + frontend).

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.7` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube && helm install greenkube greenkube/greenkube -n greenkube --create-namespace` |
| Source Code | [GitHub Release v0.2.7](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.7) |

</div>

---

<div class="release-card">

### 🚀 v0.2.6 — Report Page, PUE Fixes & Sustainability Score

**Release Date:** April 5, 2026

#### ✨ New Features

**Report Builder:**
- **Report page in the web dashboard:** New `/report` route — configure time range (1 h → 1 y), namespace filter, aggregation (hourly/daily/weekly/monthly/yearly) and export format (CSV or JSON). Preview totals before downloading, then trigger a direct browser download.
- **`GET /api/v1/report/summary`:** Preview row count, totals (CO₂e, embodied CO₂e, energy, cost) before downloading.
- **`GET /api/v1/report/export`:** Stream a downloadable CSV or JSON file with correct `Content-Disposition` headers.

**Sustainability Score Engine:**
- **`SustainabilityScorer`:** Composite **0–100 score** across 7 weighted dimensions:
  - Resource Efficiency (25%), Carbon Efficiency (20%), Waste Elimination (15%), Node Efficiency (15%), Scaling Practices (10%), Carbon-Aware Scheduling (10%), Stability (5%)
- **New Prometheus gauges:** `greenkube_sustainability_score{cluster}` and `greenkube_sustainability_dimension_score{cluster, dimension}`
- **Grafana panels:** Score gauge, per-dimension bar chart, score timeline, and carbon intensity by zone.
- **kube-state-metrics compatible labels** on all pod-level metrics.
- **Grafana template variables:** `cluster` and `region` drop-downs for multi-cluster filtering.

#### 🐛 Bug Fixes
- **PUE fallback:** `Config.get_pue_for_provider()` now correctly falls back to `DEFAULT_PUE` (1.3) for unknown nodes instead of applying the configured cloud provider's profile.
- **`CLOUD_PROVIDER` default:** Changed from `aws` to `unknown` to avoid silently applying AWS PUE (1.15) on unconfigured clusters.
- **Settings page:** API health dot was always red — fixed condition (`status === 'ok'`).

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.6` |
| Source Code | [GitHub Release v0.2.6](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.6) |

</div>

---

<div class="release-card">

### 🚀 v0.2.5 — CI/CD Refactor & OVH Support

**Release Date:** April 4, 2026

#### 🔄 Changed

- **CI/CD:** Replaced monolithic `ci-cd.yml` with three focused workflows: `ci.yml`, `dev-build.yml`, `release.yml`.
- **Docker tags:** Development images tagged `dev-<sha>` / `dev-latest`; release images use semver + `latest`.
- **Release process:** Production builds only triggered by `vX.Y.Z` git tags — no more mutable version tags.
- **GitHub Releases:** Automated releases with extracted changelog notes on each tag push.

#### 🐛 Bug Fixes

- **Helm:** `pre-install-check` uses a dedicated `ServiceAccount` created via `pre-install` hook — fixes race condition on fresh installs.
- **Helm:** `post-install-hook` uses its own hook lifecycle — prevents "serviceaccount not found" errors.
- **OVH zone mapping:** `topology.kubernetes.io/zone=nova` ignored; numeric suffixes stripped (`GRA11` → `GRA`) before CSV lookup.
- **OVH provider detection:** Nodes with `node.k8s.ovh/type` label correctly identified as provider `ovh`.

#### ✨ Added

- **OVH region mapping:** Extended with all uppercase trigrams and new-API long-form region IDs (`eu-west-par`, `eu-west-gra`, `eu-central-waw`, `ca-east-bhs`, `us-east-vin`, `ap-southeast-sgp`, `ap-southeast-syd`, `ap-south-mum`…).

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.5` |
| Source Code | [GitHub Release v0.2.5](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.5) |

</div>

---

<div class="release-card">

### 🚀 v0.2.4 — Helm Fixes & SQL Performance

**Release Date:** March 30, 2026

#### 🐛 Bug Fixes

- **Helm:** `ServiceMonitor` and `NetworkPolicy` disabled by default — fresh installs no longer fail on clusters without the Prometheus Operator.
- **Helm:** Added `pre-install-check` hook that validates Prometheus Operator CRD presence with a clear actionable error message.
- **Grafana:** Wrapped cluster overview stat panels with `sum()` to prevent duplicate series.
- **Recommendation history:** Skip node-level recommendations when saving — prevents integrity errors.
- **Container startup:** Fixed `greenkube start` hanging due to buffered stdout.

#### ⚡ Performance

- **SQL-level aggregation** for `/api/v1/metrics/summary` and `/api/v1/metrics/timeseries`: **10–20× faster** for large datasets.
- **Non-blocking dashboard recommendations:** Recommendations loaded asynchronously.

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.4` |
| Source Code | [GitHub Release v0.2.4](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.4) |

</div>

---

<div class="release-card">

### 🚀 v0.2.3 — Grafana, Demo Mode & Observability

**Release Date:** March 29, 2026

#### ✨ New Features

- **Grafana dashboard:** Pre-built `dashboards/greenkube-grafana.json` with KPIs, time-series, namespace breakdown, node utilization, grid intensity, and recommendations panels.
- **Prometheus integration:** ServiceMonitor, NetworkPolicy, and Prometheus RBAC templates in the Helm chart.
- **Demo mode:** `greenkube demo` generates 7 days of realistic sample data (22 pods, 5 namespaces) in a standalone SQLite instance.
- **Database migration system:** Automated schema migration runner with versioned scripts for PostgreSQL and SQLite.
- **API security:** Bearer-token authentication (`GREENKUBE_API_KEY`), configurable CORS origins, rate limiting.
- **DataProcessor refactor:** Monolithic processor split into `CollectionOrchestrator`, `MetricAssembler`, `NodeZoneMapper`, `PrometheusResourceMapper`, `CostNormalizer`, `HistoricalRangeProcessor`, `EmbodiedEmissionsService`.
- **Dependency injection:** Replaced global singletons with explicit lifecycle management.
- **476+ unit tests** (up from 323).

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.3` |
| Source Code | [GitHub Release v0.2.3](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.3) |

</div>

---

<div class="release-card">

### 🚀 v0.2.2 — Full-Stack FinGreenOps Platform

**Release Date:** February 2026

This release transforms GreenKube from a CLI tool into a full-stack monitoring platform.

#### ✨ New Features

- Modern SvelteKit web dashboard with real-time charts (ECharts)
- FastAPI REST API with full OpenAPI documentation
- Interactive per-pod metrics table with sort, search, and export
- Node inventory with capacity visualization
- 9-type recommendation engine (zombie, rightsizing, autoscaling, carbon-aware, etc.)
- PostgreSQL as default backend (StatefulSet in Helm), Elasticsearch for scale
- Service auto-discovery for Prometheus and OpenCost
- Multi-architecture Docker images (amd64 + arm64)
- Historical range reports (daily/monthly/yearly)
- Embodied emissions via Boavizta API
- 293+ unit tests, Ruff + Gitleaks pre-commit hooks, GitHub Actions CI/CD

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.2` |
| Source Code | [GitHub Release v0.2.2](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.2) |

</div>

---

<div class="release-card">

### 🌱 v0.1.0 — Initial Release

**Release Date:** August 2025

The first public release of GreenKube, establishing the core carbon tracking capabilities.

#### ✨ Features

- CLI-based carbon reporting for Kubernetes workloads
- Prometheus integration for CPU metrics collection
- Energy estimation using Cloud Carbon Footprint methodology
- Carbon emission calculation with configurable grid intensity
- Support for AWS, GCP, Azure cloud providers
- SQLite storage backend, CSV and JSON export
- Helm chart for Kubernetes deployment
- Basic zombie pod and rightsizing recommendations

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Source Code | [GitHub Release v0.1.0](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.1.0) |

</div>

---

## Upgrade Guide

### From v0.2.x to v0.2.8

<Steps>

1. **Update the Helm repository:**
   ```bash
   helm repo update
   ```

2. **Review security changes:** The ClusterRole no longer includes `secrets`. If your deployment depended on this, adjust accordingly. SCRAM-SHA-256 replaces MD5 for PostgreSQL — existing clusters upgrading the PostgreSQL StatefulSet to `18-alpine` should run the provided `scripts/pg_upgrade_17_to_18.sh` migration script first.

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
   # Open http://localhost:8000 → check Settings page for service health
   ```

</Steps>

### From v0.1.x to v0.2.x

<Aside type="caution">
  v0.2.x introduces PostgreSQL as the default storage backend. Add `DB_TYPE=sqlite` to your values to keep using SQLite, or plan a data migration.
</Aside>

<Steps>

1. **Update the Helm repository:**
   ```bash
   helm repo update
   ```

2. **Review your `values.yaml`** — New options for database backend, API settings, recommendation thresholds, and Prometheus query tuning.

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

</Steps>

## Versioning

GreenKube follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0) — Breaking changes
- **MINOR** (0.x.0) — New features, backwards compatible
- **PATCH** (0.0.x) — Bug fixes, backwards compatible

## Release Channels

| Channel | Description | Docker Tag |
|---------|-------------|-----------|
| **Stable** | Current tested release | `greenkube/greenkube:0.2.8` |
| **Latest** | Most recent stable | `greenkube/greenkube:latest` |
| **Dev** | Development builds (unstable) | `greenkube/greenkube:dev-latest` |

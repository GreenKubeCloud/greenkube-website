---
title: Releases
description: GreenKube release history — changelogs, download links, and upgrade guides for all versions.
---

import { Aside, Steps } from '@astrojs/starlight/components';

## Current Release

<div class="release-card">

### 🚀 v0.2.11 — Actionable Recommendations in Grafana & Startup Scan

<span class="release-tag">Latest</span> <span class="release-tag">Stable</span>

**Release Date:** May 26, 2026

#### ✨ Added

- **Grafana: Actionable Recommendations section** — New dashboard row showing the top-N ranked active recommendations as horizontal bar cards with projected annual CO₂e and cost savings. Uses the new `greenkube_top_recommendations` Prometheus gauge.
- **`GET /api/v1/recommendations/top`** — New endpoint returning the highest-impact active recommendations ranked by projected annual savings. Parameters: `limit` (1–50, default 5), `metric` (`co2` or `cost`), `refresh`, `namespace`. Returns `TopRecommendation` DTOs with rank, type, resource, scope, priority, and projected annual CO₂e / cost savings.
- **Prometheus: `greenkube_top_recommendations` gauge** — Exposes ranked active recommendations with labels: `cluster`, `rank`, `sort_metric`, `value_metric`, `namespace`, `type`, `resource`, `scope`, `priority`.
- **Prometheus: Per-namespace recommendation savings gauges** — `greenkube_namespace_recommendation_savings_co2e_grams_total` and `greenkube_namespace_recommendation_savings_cost_dollars_total` (labels: `cluster`, `namespace`).
- **Startup recommendation scan** — The API now triggers a full recommendation scan immediately after startup, ensuring Grafana and the dashboard always have data to display after deployments or pod restarts (even with ephemeral SQLite storage).
- **Grafana: `$recommendation_metric` and `$recommendation_limit` template variables** — Users can toggle the ranking metric (CO₂e / Cost) and the number of displayed recommendations (3 / 5 / 10) directly from the Grafana UI.

#### 🔄 Changed

- **Grafana: `$node` and `$region` template variables removed** — Both variables have been dropped from the dashboard; node and region filtering is now handled at the Prometheus/label level.

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.11` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube && helm install greenkube greenkube/greenkube -n greenkube --create-namespace` |
| Source Code | [GitHub Release v0.2.11](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.11) |

</div>

---

<div class="release-card">

### v0.2.10 — Recommendation Lifecycle, Savings Ledger & Grafana v2

**Release Date:** May 7, 2026

#### ✨ Added

- **Recommendation full lifecycle:** Recommendations now support a complete status lifecycle (`open`, `in_progress`, `resolved`, `dismissed`, `snoozed`). New API endpoints allow updating status, bulk-dismissing, and snoozing recommendations. DB migrations `0006` (lifecycle columns) and `0007` (upsert null-fix) applied for both PostgreSQL and SQLite.
- **Frontend recommendation lifecycle UI:** The recommendations page exposes status filters, per-recommendation controls (dismiss, snooze, mark in-progress/resolved), and a lifecycle summary on the dashboard.
- **Recommendation deduplication by Deployment:** The recommender now groups pods by their parent Deployment (via regex on the standard ReplicaSet pod-name suffix) before generating rightsizing and off-peak recommendations — one consolidated recommendation per workload instead of one per pod replica.
- **Annualised savings projections:** Each recommendation now exposes projected annual CO₂e savings (`annual_co2e_savings_grams`) and annual cost savings (`annual_cost_savings_usd`), surfaced in the API, frontend, and CLI output.
- **Savings attribution system:** New `SavingsAttributor` service prorates projected annual CO₂e and cost savings to the actual observation window. Two new Prometheus gauges: `greenkube_co2e_savings_attributed_grams_total` and `greenkube_cost_savings_attributed_dollars_total`. DB migration `0008` applied for both engines.
- **Report: Yearly and custom date ranges:** `GET /api/v1/report` now accepts `--years` (calendar year) and arbitrary `--start`/`--end` timestamps. Reports can additionally be grouped by namespace via `--group-by-namespace`.
- **Redesigned frontend report page:** The `/report` page rebuilt with configurable report parameters, date range pickers, and a simplified export flow.
- **Grafana dashboard v2 (complete rebuild):** Dashboard restructured to 4 sections and 9 panels: *GreenKube Impact Command Center*, *CO₂e by Namespace*, *Regional Node Cleanliness*, and *Top Emitters & Spenders*. All PromQL expressions corrected for proper aggregation; namespace/cluster variables wired to every panel.
- **New Prometheus metrics:** Recommendation counts by status, attributed savings gauges, node activity flag (`is_active`).
- **Demo mode "GreenOptic":** New comprehensive demo simulating the fictional `GreenOptic` company — realistic node topology, multi-namespace workloads, 30 days of historical metrics, and a backfilled savings ledger aligned with resolved demo recommendations.
- **Expanded test coverage:** `docker-compose.test.yml` integration tests run against live SQLite and PostgreSQL. Full recommendation lifecycle end-to-end suite added.

#### 🐛 Fixed

- **Embodied emissions default reduced to 100 kg:** `DEFAULT_EMBODIED_EMISSIONS_KG` lowered from 350 kg to 100 kg.
- **Node recommendation memory usage:** The underutilised-node recommender now correctly factors in memory utilisation alongside CPU.
- **Rightsizing false positives:** CPU and memory rightsizing recommendations no longer suggest *increasing* requests.
- **Grafana filters:** Namespace and cluster variable filters now consistently applied to every panel.

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.10` |
| Source Code | [GitHub Release v0.2.10](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.10) |

</div>

---

<div class="release-card">

### 🚀 v0.2.9 — Dashboard Cache, OOM Fixes & K8s Config Persistence

**Release Date:** April 21, 2026

#### ✨ Added

- **Frontend config persistence via K8s Secret:** UI-applied settings (`PROMETHEUS_URL`, `OPENCOST_API_URL`, `ELECTRICITY_MAPS_TOKEN`, `BOAVIZTA_API_URL`) are now patched into the GreenKube Kubernetes Secret on save, surviving pod restarts and `helm upgrade --reuse-values` without manual intervention. A namespaced `Role`/`RoleBinding` grants the service account `get`+`patch` access to exactly the GreenKube Secret.
- **GreenKube favicon:** Browser tab now shows the real GreenKube logo (`favicon.ico`) instead of the Svelte placeholder SVG.
- **`GET /api/v1/metrics/by-namespace`:** Lightweight endpoint returning CO2e, embodied emissions, energy, and cost aggregated by namespace over a time window, using a dual-table `UNION ALL + GROUP BY` — avoids loading full row sets into memory.
- **`GET /api/v1/metrics/top-pods`:** Lightweight endpoint returning the top-N pods by CO2e over a time window. Dashboard donut and top-pods charts now use these endpoints instead of the expensive `GET /metrics` route, eliminating OOM restarts on large time ranges.
- **GHG Scope 2 / Scope 3 carbon classification:** Emissions are now formally categorised per the GHG Protocol Corporate Standard.
- **Pre-computed dashboard cache (`metrics_summary` + `metrics_timeseries_cache`):** Two new DB tables (migrations `0004` and `0005` for PostgreSQL and SQLite) store pre-aggregated KPI scalars and time-series buckets for five fixed windows (`24h`, `7d`, `30d`, `1y`, `ytd`). Refreshed hourly by the background scheduler — eliminates full-table scans on every dashboard load.
- **`SummaryRefresher`:** New service computing cluster-wide and per-namespace KPI totals and time-series buckets with adaptive granularity per window (hourly / daily / weekly / monthly).
- **Dashboard API endpoints:**
  - `GET /api/v1/metrics/dashboard-summary` — cached KPI scalars, optionally filtered by namespace.
  - `GET /api/v1/metrics/dashboard-timeseries/{window_slug}` — cached time-series for `24h`, `7d`, `30d`, `1y`, or `ytd`.
  - `POST /api/v1/metrics/dashboard-summary/refresh` — on-demand background refresh (HTTP 202).
- **Adaptive chart granularity:** Dashboard charts automatically select optimal time bucket per window — hourly for `24h`, daily for `7d`/`30d`, weekly for `1y`, monthly for `ytd`.
- **Boavizta fallback with configurable default:** When Boavizta does not recognise a cloud provider or instance type, `EmbodiedEmissionsService` injects a fallback profile using `DEFAULT_EMBODIED_EMISSIONS_KG` (default: **350 kg CO2e**) instead of silently using 0 g. Metrics are flagged `is_estimated=True` with descriptive reasons.

#### 🐛 Fixed

- **Async K8s Secret patching:** In-cluster Secret patch now correctly uses `kubernetes_asyncio` (the async client that is installed) instead of the sync `kubernetes` package.
- **Elasticsearch optional dependency:** `elasticsearch` and `elasticsearch-dsl` moved to an optional extra (`pip install greenkube[elasticsearch]`). All imports are now lazy, removing heavy transitive dependencies and startup warnings for PostgreSQL/SQLite users.
- **Electricity Maps not called for OpenStack providers (zone = `nova`):** The scheduler now falls back to the node's geographic region when the provider zone (`nova`) is not a recognised Electricity Maps zone code. Restores carbon-intensity data on OVH, Infomaniak, and similar OpenStack clouds.
- **Race condition in collection orchestrator:** Node collection is now an explicit Phase 1 in `DataProcessor.run()` that runs alone before any concurrent collection, preventing K8s API client races and cascade Electricity Maps errors.
- **Pod CPU utilisation aggregation per node:** `CollectionOrchestrator` was averaging pod CPU usage per node across timestamps instead of summing — caused underestimated energy figures on nodes with multiple measured pods.
- **Chart legends overlapping:** ECharts legend layout fixed to prevent label overlap on small viewports.
- **`DEFAULT_ZONE` spurious warning:** `NodeZoneMapper` no longer emits a false warning when the zone was correctly resolved via a valid `DEFAULT_ZONE`.

#### 🔄 Changed

- **`DataProcessor.run()` restructured into four explicit phases:** Phase 1 (node discovery, sequential), Phase 2 (zone resolution), Phase 3 (parallel metrics + Boavizta), Phase 4 (carbon-intensity prefetch + assembly). Eliminates the previous race condition and the redundant second K8s `collect_instance_types()` call.
- **`CollectionOrchestrator` simplified:** `NodeCollector` dependency removed; node enrichment uses the `nodes_info` dict passed in from Phase 1.

#### 📦 Downloads

| Asset | Link |
|-------|------|
| Docker Image | `docker pull greenkube/greenkube:0.2.9` |
| Helm Chart | `helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube && helm install greenkube greenkube/greenkube -n greenkube --create-namespace` |
| Source Code | [GitHub Release v0.2.9](https://github.com/GreenKubeCloud/GreenKube/releases/tag/v0.2.9) |

</div>

---

<div class="release-card">

### 🚀 v0.2.8 — Security Hardening & SCD2

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

### From v0.2.x to v0.2.11

<Steps>

1. **Update the Helm repository:**
   ```bash
   helm repo update
   ```

2. **No schema migrations:** v0.2.11 adds no new DB migrations — upgrade is a
   drop-in replacement. The startup recommendation scan runs automatically on
   first boot to populate the new `greenkube_top_recommendations` gauge.

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

### From v0.2.7 to v0.2.8+

<Steps>

1. **Update the Helm repository:**
   ```bash
   helm repo update
   ```

2. **Review security changes:** The ClusterRole no longer includes `secrets`. SCRAM-SHA-256 replaces MD5 for PostgreSQL — clusters upgrading to `18-alpine` should run `scripts/pg_upgrade_17_to_18.sh` first.

3. **Upgrade the release:**
   ```bash
   helm upgrade greenkube greenkube/greenkube \
     -f my-values.yaml \
     -n greenkube
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
| **Stable** | Current tested release | `greenkube/greenkube:0.2.11` |
| **Latest** | Most recent stable | `greenkube/greenkube:latest` |
| **Dev** | Development builds (unstable) | `greenkube/greenkube:dev-latest` |

---
title: REST API
description: FastAPI API for metrics, recommendations, configuration, and reports, with OpenAPI documentation.
---

GreenKube exposes a complete **REST API** powered by FastAPI, providing programmatic access to all metrics, recommendations, and configuration.

## API Overview

The API is served under `http://<service>:8000/api/v1/`. Interactive API documentation is at `/api/v1/docs`, and the OpenAPI schema is at `/api/v1/openapi.json`.

- **Auto-generated OpenAPI docs** at `/api/v1/docs` (Swagger UI)
- **CORS support** for cross-origin API clients
- **Optional authentication** via bearer token (`GREENKUBE_API_KEY`)
- **Configurable rate limiting** per client and API route
- **Pagination** support on metrics endpoints (`offset` and `limit`)
- **JSON responses** with consistent error handling
- **Pydantic v2 validation** on all request/response models

## Endpoints

### Health & Status
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/health` | Health check (liveness) |
| GET | `/api/v1/version` | API and app version |
| GET | `/api/v1/config` | Current configuration (redacted) |
| GET | `/api/v1/health/services` | Aggregated health status for all data sources (supports `?force=true` to bypass cache) |
| GET | `/api/v1/health/services/{service_name}` | Health status for a single named service |
| POST | `/api/v1/config/services` | Apply service URL/token updates in memory; Kubernetes Secret persistence is best-effort |

### Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/metrics` | Per-pod metrics with pagination |
| GET | `/api/v1/metrics/summary` | Aggregated cluster/namespace totals |
| GET | `/api/v1/metrics/timeseries` | Bucketed time-series for charts |
| GET | `/api/v1/metrics/by-namespace` | CO₂e, cost, energy aggregated per namespace |
| GET | `/api/v1/metrics/top-pods` | Top-N pods by CO₂e for a time window |
| GET | `/api/v1/metrics/dashboard-summary` | Pre-computed KPI cache (fast) |
| GET | `/api/v1/metrics/dashboard-timeseries/{window_slug}` | Pre-computed timeseries for `1h`, `6h`, `24h`, `7d`, `30d`, `1y`, `ytd` |
| POST | `/api/v1/metrics/dashboard-summary/refresh` | On-demand cache refresh |

### Recommendations
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/recommendations` | Read active records; generates them on an empty first read. `?refresh=true` schedules a refresh. |
| GET | `/api/v1/recommendations/active` | Persisted active recommendations (`?refresh=true` to re-run) |
| GET | `/api/v1/recommendations/top` | Top-N ranked by projected annual savings — `?limit=5&metric=co2` or `metric=cost` |
| GET | `/api/v1/recommendations/ignored` | Recommendations currently marked ignored |
| GET | `/api/v1/recommendations/applied` | Applied recommendations ordered by most recent application |
| GET | `/api/v1/recommendations/history` | Historical records with optional time filtering |
| GET | `/api/v1/recommendations/savings` | Aggregate savings by recommendation type |
| GET | `/api/v1/recommendations/{id}` | Recommendation detail with evidence and assessment |
| GET | `/api/v1/recommendations/{id}/events` | Recommendation lifecycle audit trail |
| POST | `/api/v1/recommendations/{id}/apply-pr` | Preview or enqueue a Git pull request for eligible rightsizing recommendations |
| GET | `/api/v1/recommendations/{id}/apply-pr/eligibility` | Check pull-request eligibility |
| GET | `/api/v1/recommendations/{id}/pull-requests` | Pull-request attempts for a recommendation |
| GET | `/api/v1/automation/status` | Git PR automation readiness |
| PATCH | `/api/v1/recommendations/{id}/apply` | Mark as applied and record savings |
| PATCH | `/api/v1/recommendations/{id}/ignore` | Mark a recommendation ignored |
| DELETE | `/api/v1/recommendations/{id}/ignore` | Restore an ignored recommendation |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/report/summary` | Preview row count and totals (CO₂e, energy, cost) before downloading |
| GET | `/api/v1/report/years` | List calendar years with reportable data |
| GET | `/api/v1/report/export` | Stream a downloadable CSV or JSON file |

### Prometheus Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/prometheus/metrics` | Prometheus-format metrics for scraping (CO₂e, cost, energy, CPU, memory, network, nodes, grid intensity, sustainability score, recommendations) |

## Time Windows and Filtering

Metric endpoints use route-specific query parameters. For example, `/metrics/timeseries` accepts `last` and `granularity=hour|day|week|month`, while `/metrics` also supports pagination and a namespace filter. Report endpoints accept one of a relative `last` window, a custom `start` and `end`, or repeatable `years` values for calendar-year reports. Aggregated reports also accept `granularity` and `group_by=pod|namespace`; see the [API Reference Guide](/guide/api/) for details.

## Example Requests

### Get Latest Metrics
```bash
curl http://localhost:8000/api/v1/metrics | jq
```

### Get Carbon Emissions for a Namespace
```bash
curl "http://localhost:8000/api/v1/metrics/timeseries?namespace=production&last=7d&granularity=day"
```

### Get Active Recommendations
```bash
curl http://localhost:8000/api/v1/recommendations/active
```

### Get Ranked Top Recommendations
```bash
curl "http://localhost:8000/api/v1/recommendations/top?limit=5&metric=co2"
```

## Authentication

GreenKube supports bearer-token authentication via `GREENKUBE_API_KEY` (Helm value: `secrets.apiKey`):

```bash
# With authentication enabled
GREENKUBE_API_KEY="your-api-key"
curl -H "Authorization: Bearer ${GREENKUBE_API_KEY}" http://localhost:8000/api/v1/metrics
```

In development, an empty key leaves protected routes open. Production requires a non-empty key when `config.apiAuthMode` is `api_key`. Use a reverse proxy or Kubernetes network controls as additional deployment-layer protection.

## Rate Limiting

API routes use a configurable per-client, per-route sliding-window rate limit:

```yaml
# In values.yaml
config:
  apiRateLimit: "60/minute"
```

## CORS Configuration

CORS origins can be configured for cross-origin clients. The Helm chart defaults to `*`; restrict this for deployments that need cross-origin access:

```yaml
config:
  corsOrigins: "*"  # Restrict in production, e.g. "https://my-company.internal"
```

## Integration Examples

### Grafana Data Source
Use the JSON API data source plugin to pull GreenKube metrics into Grafana dashboards.

### Carbon threshold check
The CLI does not provide a carbon-gate command; query the metrics API from your own automation:

```bash
# Via API + jq
# Example only: total_co2e_grams is an estimated operational metric, not a complete carbon inventory.
CARBON=$(curl -s "http://greenkube:8000/api/v1/metrics/summary?last=24h" | jq '.total_co2e_grams')
if [ "$(echo "$CARBON > 1000" | bc)" -eq 1 ]; then
  echo "Carbon budget exceeded: ${CARBON}g CO₂e"
  exit 1
fi
```

### Slack Notifications
Poll recommendations and send alerts for critical findings.

## Related

- [API Reference Guide](/guide/api/) — Detailed endpoint documentation
- [Dashboard](/features/real-time-dashboard/) — Visual interface powered by this API
- [Historical Analysis](/features/historical-analysis/) — Time-series queries

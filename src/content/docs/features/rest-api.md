---
title: REST API
description: Full-featured FastAPI backend with OpenAPI docs, CORS support, and comprehensive endpoints for all metrics.
---

GreenKube exposes a complete **REST API** powered by FastAPI, providing programmatic access to all metrics, recommendations, and configuration.

## API Overview

The API is served at `http://<service>:8000/api/v1/` and includes:

- **Auto-generated OpenAPI docs** at `/docs` (Swagger UI) and `/redoc`
- **CORS support** for cross-origin dashboard access
- **Optional authentication** via bearer token (`GREENKUBE_API_KEY`)
- **Rate limiting** via slowapi to protect against abuse
- **Pagination** support on metrics endpoints (`offset` and `limit`)
- **JSON responses** with consistent error handling
- **Pydantic v2 validation** on all request/response models

## Endpoints

### Health & Status
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check (liveness) |
| GET | `/api/v1/version` | API and app version |
| GET | `/api/v1/config` | Current configuration (redacted) |
| GET | `/api/v1/health/services` | Aggregated health status for all data sources (supports `?force=true` to bypass cache) |
| GET | `/api/v1/health/services/{service_name}` | Health status for a single named service |
| POST | `/api/v1/config/services` | Update service URLs and tokens at runtime (session-scoped) |

### Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/metrics` | Per-pod metrics with pagination |
| GET | `/api/v1/metrics/summary` | Aggregated cluster/namespace totals |
| GET | `/api/v1/metrics/timeseries` | Bucketed time-series for charts |
| GET | `/api/v1/metrics/by-namespace` | CO₂e, cost, energy aggregated per namespace |
| GET | `/api/v1/metrics/top-pods` | Top-N pods by CO₂e for a time window |
| GET | `/api/v1/metrics/dashboard-summary` | Pre-computed KPI cache (fast) |
| GET | `/api/v1/metrics/dashboard-timeseries/{window_slug}` | Pre-computed timeseries for `24h`, `7d`, `30d`, `1y`, `ytd` |
| POST | `/api/v1/metrics/dashboard-summary/refresh` | On-demand cache refresh |

### Time Series
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/metrics/timeseries` | Historical metrics with `last`, `start`/`end`, granularity |

### Recommendations
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/recommendations` | Run recommender engine live |
| GET | `/api/v1/recommendations/active` | Persisted active recommendations (`?refresh=true` to re-run) |
| GET | `/api/v1/recommendations/ignored` | Permanently ignored recommendations |
| GET | `/api/v1/recommendations/history` | Historical records with optional time filtering |
| GET | `/api/v1/recommendations/savings` | Aggregate savings by recommendation type |
| PATCH | `/api/v1/recommendations/{id}/apply` | Mark as applied and record savings |
| PATCH | `/api/v1/recommendations/{id}/ignore` | Permanently ignore |
| PATCH | `/api/v1/recommendations/{id}/snooze` | Hide for N days (`?days=14`) |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/report/summary` | Preview row count and totals (CO₂e, energy, cost) before downloading |
| GET | `/api/v1/report/export` | Stream a downloadable CSV or JSON file |

### Prometheus Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/prometheus/metrics` | Prometheus-format metrics for scraping (CO₂e, cost, energy, CPU, memory, network, nodes, grid intensity, sustainability score, recommendations) |

## Query Parameters

Most endpoints support common query parameters:

```
?start=2024-01-01T00:00:00Z    # Start time (ISO 8601)
&end=2024-01-31T23:59:59Z      # End time (ISO 8601)
&last=7d                        # Relative window (e.g., 24h, 7d, 30d, ytd, 1y)
&namespace=production           # Filter by namespace
&granularity=daily              # Aggregation: hourly/daily/weekly/monthly
&limit=100                      # Pagination
&offset=0                       # Pagination offset
```

## Example Requests

### Get Latest Metrics
```bash
curl http://localhost:8000/api/v1/metrics | jq
```

### Get Carbon Emissions for a Namespace
```bash
curl "http://localhost:8000/api/v1/metrics/timeseries?namespace=production&last=7d&granularity=daily"
```

### Get Active Recommendations
```bash
curl http://localhost:8000/api/v1/recommendations/active
```

## Authentication

GreenKube supports **optional bearer-token authentication** via the `GREENKUBE_API_KEY` environment variable (or `config.api.apiKey` in Helm values):

```bash
# With authentication enabled
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:8000/api/v1/metrics
```

When no API key is configured, the API is open. For external exposure, you can combine the API key with:
- Kubernetes Ingress with authentication
- OAuth2 proxy
- Network policies

## Rate Limiting

Rate limiting is available via [slowapi](https://github.com/laurents/slowapi) to protect the API from abuse:

```yaml
# In values.yaml
config:
  apiRateLimit: "60/minute"  # slowapi format (0 = disabled)
```

## CORS Configuration

CORS is enabled by default to allow the dashboard to communicate with the API:

```yaml
config:
  corsOrigins: "*"  # Restrict in production, e.g. "https://my-company.internal"
```

## Integration Examples

### Grafana Data Source
Use the JSON API data source plugin to pull GreenKube metrics into Grafana dashboards.

### CI/CD Carbon Gate
Use the `--fail-on-co2` CLI flag or poll the API:

```bash
# Via CLI
greenkube report --last 24h --fail-on-co2 1000

# Via API + jq
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

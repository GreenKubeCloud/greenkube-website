---
title: API Reference
description: Complete reference for the GreenKube REST API endpoints, parameters, and response formats.
---

import { Aside } from '@astrojs/starlight/components';

GreenKube exposes a REST API built with **FastAPI**. Interactive Swagger documentation is available at `/api/v1/docs` when the server is running.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

The API supports **optional bearer-token authentication** via the `GREENKUBE_API_KEY` environment variable. When set, all API requests must include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:8000/api/v1/metrics
```

When no API key is configured, the API is open (designed for cluster-internal use).

## Endpoints

### Health & System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness check — returns `{"status":"ok","version":"0.2.10"}` |
| `/version` | GET | Version info |
| `/config` | GET | Non-sensitive configuration |
| `/health/services` | GET | Aggregated health status for all data sources (Prometheus, OpenCost, Electricity Maps, Boavizta, K8s) |
| `/health/services/{name}` | GET | Single service health — add `?force=true` to bypass 30s cache |
| `/config/services` | POST | Update service URLs/tokens at runtime and persist to K8s Secret |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/metrics` | GET | Per-pod metrics with pagination (`?offset=0&limit=1000`) |
| `/metrics/summary` | GET | Aggregated cluster/namespace totals |
| `/metrics/timeseries` | GET | Bucketed time-series for charts |
| `/metrics/by-namespace` | GET | CO₂e, embodied emissions, energy, cost aggregated by namespace |
| `/metrics/top-pods` | GET | Top-N pods by CO₂e over a time window |
| `/metrics/dashboard-summary` | GET | Pre-computed KPI cache — fast, no full-table scan |
| `/metrics/dashboard-timeseries/{window_slug}` | GET | Pre-computed timeseries for `24h`, `7d`, `30d`, `1y`, or `ytd` |
| `/metrics/dashboard-summary/refresh` | POST | Trigger on-demand cache refresh (returns HTTP 202) |

**Common query parameters:** `namespace`, `last` (e.g. `24h`, `7d`, `30d`, `1y`, `ytd`), `granularity` (`hour`, `day`, `week`, `month`)

#### Example: Get metrics with Scope 2 + Scope 3

```bash
curl "http://localhost:8000/api/v1/metrics?namespace=production&last=24h"
```

```json
{
  "metrics": [
    {
      "pod_name": "api-deployment-7b5f8c9d6-x2k4p",
      "namespace": "production",
      "timestamp": "2024-02-21T14:00:00Z",
      "joules": 1250.5,
      "co2e_grams": 0.174,
      "embodied_co2e_grams": 0.012,
      "total_co2e_all_scopes": 0.186,
      "total_cost": 0.0023,
      "grid_intensity": 45.2,
      "pue": 1.15,
      "cpu_usage_millicores": 85.3,
      "memory_usage_bytes": 134217728,
      "is_estimated": false,
      "estimation_reasons": []
    }
  ],
  "total": 42
}
```

### Report

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/report/summary` | GET | Preview: row count, totals before downloading |
| `/report/export` | GET | Downloadable file (CSV or JSON) with correct `Content-Disposition` headers |

**Report parameters:**
- `format` — `csv` or `json`
- `last` — relative window (e.g. `7d`, `ytd`)
- `start` / `end` — ISO 8601 date range
- `years` — calendar year, e.g. `?years=2024&years=2025`
- `granularity` — `hourly`, `daily`, `weekly`, `monthly`, `yearly`
- `namespace` — filter by namespace
- `group_by_namespace` — return namespace breakdown

```bash
# CSRD annual report
curl -O -J "http://localhost:8000/api/v1/report/export?format=csv&years=2024&granularity=monthly"
```

### Recommendations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommendations` | GET | Generate live recommendations (runs the recommender engine) |
| `/recommendations/active` | GET | Persisted active recommendations — add `?refresh=true` to re-run engine |
| `/recommendations/ignored` | GET | All permanently ignored recommendations |
| `/recommendations/history` | GET | Historical records with optional time filtering |
| `/recommendations/savings` | GET | Aggregate savings by recommendation type |
| `/recommendations/{id}/apply` | PATCH | Mark applied with optional realized savings |
| `/recommendations/{id}/ignore` | PATCH | Permanently ignore a recommendation |
| `/recommendations/{id}/snooze` | PATCH | Hide for N days — add `?days=14` |

#### Example: Get active recommendations

```bash
curl "http://localhost:8000/api/v1/recommendations/active"
```

```json
[
  {
    "id": 42,
    "type": "RIGHTSIZING_CPU",
    "status": "open",
    "priority": "high",
    "scope": "workload",
    "pod_name": "api-deployment",
    "namespace": "production",
    "description": "CPU request (500m) is 6× higher than average usage (85m). Recommended: 105m.",
    "annual_co2e_savings_grams": 1250.0,
    "annual_cost_savings_usd": 45.60,
    "current_cpu_request_millicores": 500,
    "recommended_cpu_request_millicores": 105
  }
]
```

#### Example: Resolve a recommendation

```bash
curl -X PATCH "http://localhost:8000/api/v1/recommendations/42/apply"
```

This triggers a savings ledger entry and updates the `greenkube_co2e_savings_attributed_grams_total` Prometheus gauge.

### Sustainability Score

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sustainability` | GET | Compute and return the 7-dimension 0–100 score |

```bash
curl "http://localhost:8000/api/v1/sustainability"
```

```json
{
  "overall_score": 72.4,
  "dimension_scores": {
    "resource_efficiency": 68.0,
    "carbon_efficiency": 81.0,
    "waste_elimination": 92.0,
    "node_efficiency": 65.0,
    "scaling_practices": 70.0,
    "carbon_aware_scheduling": 55.0,
    "stability": 95.0
  }
}
```

### Prometheus Metrics

| Endpoint | Format | Description |
|----------|--------|-------------|
| `/prometheus/metrics` | Prometheus text | Scraped by Prometheus |

See the [Grafana guide](/guide/grafana/) for the full list of exposed gauges.

## Error Handling

All endpoints return standard HTTP status codes:

| Status | Description |
|--------|-------------|
| `200` | Success |
| `202` | Accepted (background operation started) |
| `400` | Bad request (invalid parameters) |
| `404` | Resource not found |
| `500` | Internal server error |

## Interactive Documentation

When the API is running, visit:
- **Swagger UI**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

<Aside type="tip">
  The Swagger UI lets you try out API calls directly from your browser — great for exploring and testing.
</Aside>

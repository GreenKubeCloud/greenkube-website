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

The API supports bearer-token authentication via `GREENKUBE_API_KEY` (Helm value: `secrets.apiKey`). When configured, send `Authorization: Bearer ${GREENKUBE_API_KEY}` on protected API requests. In development, an empty key leaves protected routes open; production requires a non-empty key.

```bash
GREENKUBE_API_KEY="your-api-key"
curl -H "Authorization: Bearer ${GREENKUBE_API_KEY}" http://localhost:8000/api/v1/metrics
```

The health, Swagger UI, and OpenAPI schema endpoints remain public. Do not expose an unauthenticated development instance to untrusted networks.

## Endpoints

### Health & System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness check |
| `/version` | GET | Version info |
| `/config` | GET | Non-sensitive configuration |
| `/health/services` | GET | Aggregated health status for all data sources (Prometheus, OpenCost, Electricity Maps, Wattnet, Boavizta, K8s). Non-selected electricity providers are reported as `inactive` and excluded from the overall status. |
| `/health/services/{name}` | GET | Single service health — add `?force=true` to bypass 30s cache |
| `/config/services` | POST | Apply service URL/token updates in memory; best-effort persistence to a Kubernetes Secret |
| `/namespaces` | GET | List namespaces with collected metrics |
| `/nodes` | GET | List cluster nodes |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/metrics` | GET | Per-pod metrics with pagination (`?offset=0&limit=1000`) |
| `/metrics/summary` | GET | Aggregated cluster/namespace totals |
| `/metrics/timeseries` | GET | Bucketed time-series for charts |
| `/metrics/by-namespace` | GET | CO₂e, embodied emissions, energy, cost aggregated by namespace |
| `/metrics/top-pods` | GET | Top-N pods by CO₂e over a time window |
| `/metrics/dashboard-summary` | GET | Pre-computed KPI cache — fast, no full-table scan |
| `/metrics/dashboard-timeseries/{window_slug}` | GET | Pre-computed timeseries for `1h`, `6h`, `24h`, `7d`, `30d`, `1y`, or `ytd` |
| `/metrics/dashboard-summary/refresh` | POST | Trigger on-demand cache refresh (returns HTTP 202) |

**Common query parameters:** `namespace`, `last` (e.g. `24h`, `7d`, `30d`, `1y`, `ytd`), `granularity` (`hour`, `day`, `week`, `month`)

#### Example: Get metrics with Scope 2 + Scope 3

```bash
curl "http://localhost:8000/api/v1/metrics?namespace=production&last=24h"
```

```json
{
  "items": [
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
  "total": 42,
  "offset": 0,
  "limit": 1000,
  "next_cursor": null
}
```

### Report

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/report/summary` | GET | Preview: row count, totals before downloading |
| `/report/years` | GET | List calendar years available in stored metrics |
| `/report/export` | GET | Downloadable file (CSV or JSON) with correct `Content-Disposition` headers |

**Report parameters:**
- `format` — `csv` or `json`
- `last` — relative window (e.g. `7d`, `ytd`)
- `start` / `end` — ISO 8601 date range
- `years` — calendar year, e.g. `?years=2024&years=2025`
- `aggregate` — set to `true` to aggregate exported rows
- `granularity` — when aggregating: `hourly`, `daily`, `weekly`, `monthly`, `yearly`
- `namespace` — filter by namespace
- `group_by` — when aggregating: `pod` or `namespace`

```bash
# Annual estimated cost and carbon export
curl -O -J "http://localhost:8000/api/v1/report/export?format=csv&years=2024&aggregate=true&granularity=monthly"
```

### Recommendations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommendations` | GET | Read active recommendations; generates records when none exist. `?refresh=true` schedules a refresh |
| `/recommendations/active` | GET | Persisted active recommendations — add `?refresh=true` to re-run engine |
| `/recommendations/top` | GET | Top-N ranked active recommendations by projected annual savings — `?limit=5&metric=co2` (or `cost`), `?refresh=true` |
| `/recommendations/ignored` | GET | Recommendations currently marked ignored |
| `/recommendations/applied` | GET | Applied recommendations ordered by most recent application |
| `/recommendations/history` | GET | Historical records with optional time filtering |
| `/recommendations/savings` | GET | Aggregate savings by recommendation type |
| `/recommendations/{id}` | GET | Recommendation detail with evidence and assessment |
| `/recommendations/{id}/events` | GET | Recommendation lifecycle audit trail |
| `/recommendations/{id}/apply-pr` | POST | Preview a rightsizing patch or enqueue a Git pull request |
| `/recommendations/{id}/pull-requests` | GET | Pull-request attempts for a recommendation |
| `/recommendations/{id}/apply-pr/eligibility` | GET | Check GitOps pull-request eligibility |
| `/automation/status` | GET | Git PR automation readiness |
| `/recommendations/{id}/apply` | PATCH | Mark applied with optional actual resource values |
| `/recommendations/{id}/ignore` | PATCH | Permanently ignore a recommendation |
| `/recommendations/{id}/ignore` | DELETE | Restore an ignored recommendation to active |

#### Example: Get active recommendations

```bash
curl "http://localhost:8000/api/v1/recommendations/active"
```

```json
[
  {
    "id": 42,
    "type": "RIGHTSIZING_CPU",
    "status": "active",
    "priority": "high",
    "scope": "workload",
    "pod_name": "api-deployment",
    "namespace": "production",
    "description": "CPU request (500m) is 6× higher than average usage (85m). Recommended: 105m.",
    "potential_savings_co2e_grams": 1250.0,
    "potential_savings_cost": 45.60,
    "current_cpu_request_millicores": 500,
    "recommended_cpu_request_millicores": 105
  }
]
```

#### Example: Apply a recommendation

```bash
curl -X PATCH "http://localhost:8000/api/v1/recommendations/42/apply"
```

This triggers a savings ledger entry and updates the `greenkube_co2e_savings_attributed_grams_total` Prometheus gauge.

#### Example: Restore an ignored recommendation

```bash
curl -X DELETE "http://localhost:8000/api/v1/recommendations/42/ignore"
```

### Prometheus Metrics

| Endpoint | Format | Description |
|----------|--------|-------------|
| `/prometheus/metrics` | Prometheus text | Scraped by Prometheus |

The sustainability score is exposed through Prometheus metrics; see the [Grafana guide](/guide/grafana/).

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

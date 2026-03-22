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

### Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/metrics` | Latest metrics snapshot |
| GET | `/api/v1/metrics/namespaces` | Metrics grouped by namespace |
| GET | `/api/v1/metrics/nodes` | Per-node metrics and hardware info |
| GET | `/api/v1/metrics/pods` | Per-pod detailed metrics |

### Time Series
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/timeseries` | Historical metrics with filtering |
| GET | `/api/v1/timeseries/energy` | Energy consumption over time |
| GET | `/api/v1/timeseries/carbon` | Carbon emissions over time |
| GET | `/api/v1/timeseries/cost` | Cost data over time |

### Recommendations
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/recommendations` | Active recommendations |
| GET | `/api/v1/recommendations/history` | Historical recommendations |
| GET | `/api/v1/recommendations/summary` | Aggregated savings potential |

### Prometheus Metrics
| Method | Path | Description |
|---|---|---|
| GET | `/prometheus/metrics` | Prometheus-format metrics for scraping (CO₂e, cost, energy, CPU, memory, network, nodes, grid intensity, recommendations) |

## Query Parameters

Most endpoints support common query parameters:

```
?from=2024-01-01T00:00:00Z    # Start time (ISO 8601)
&to=2024-01-31T23:59:59Z      # End time (ISO 8601)
&namespace=production           # Filter by namespace
&group_by=daily                 # Aggregation: hourly/daily/weekly/monthly
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
curl "http://localhost:8000/api/v1/timeseries/carbon?namespace=production&from=2024-01-01&group_by=daily"
```

### Get Active Recommendations
```bash
curl http://localhost:8000/api/v1/recommendations?severity=critical
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
  api:
    rateLimit: 60  # requests per minute (0 = disabled)
```

## CORS Configuration

CORS is enabled by default to allow the dashboard to communicate with the API:

```yaml
greenkube:
  corsOrigins: "*"  # Restrict in production
```

## Integration Examples

### Grafana Data Source
Use the JSON API data source plugin to pull GreenKube metrics into Grafana dashboards.

### CI/CD Pipeline
Add carbon budget checks to your pipeline:

```bash
CARBON=$(curl -s http://greenkube:8000/api/v1/metrics | jq '.total_carbon_grams')
if [ $(echo "$CARBON > 1000" | bc) -eq 1 ]; then
  echo "Carbon budget exceeded!"
  exit 1
fi
```

### Slack Notifications
Poll recommendations and send alerts for critical findings.

## Related

- [API Reference Guide](/guide/api/) — Detailed endpoint documentation
- [Dashboard](/features/real-time-dashboard/) — Visual interface powered by this API
- [Historical Analysis](/features/historical-analysis/) — Time-series queries

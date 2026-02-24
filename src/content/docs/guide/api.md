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

The API currently does not require authentication. It is intended to be accessed within the cluster network or via port-forward.

## Endpoints

### Health & System

#### `GET /api/v1/health`

Health check endpoint. Returns the application status and version.

**Response:**
```json
{
  "status": "healthy",
  "version": "0.2.0",
  "uptime_seconds": 3600
}
```

#### `GET /api/v1/version`

Returns the application version.

**Response:**
```json
{
  "version": "0.2.0"
}
```

#### `GET /api/v1/config`

Returns the current configuration (sensitive values are redacted).

**Response:**
```json
{
  "db_type": "postgres",
  "cloud_provider": "aws",
  "default_zone": "FR",
  "default_intensity": 500.0,
  "prometheus_url": "http://prometheus:9090",
  "api_port": 8000,
  "normalization_granularity": "hour"
}
```

### Metrics

#### `GET /api/v1/metrics`

Retrieve per-pod metrics with optional filtering.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `namespace` | string | Filter by namespace | All |
| `last` | string | Time range (e.g., `24h`, `7d`, `30d`) | `24h` |
| `pod` | string | Filter by pod name pattern | All |

**Example Request:**
```bash
curl "http://localhost:8000/api/v1/metrics?namespace=default&last=24h"
```

**Response:**
```json
{
  "metrics": [
    {
      "pod_name": "api-deployment-7b5f8c9d6-x2k4p",
      "namespace": "default",
      "timestamp": "2024-02-21T14:00:00Z",
      "duration_seconds": 300,
      "joules": 1250.5,
      "co2e_grams": 0.174,
      "total_cost": 0.0023,
      "grid_intensity": 45.2,
      "pue": 1.2,
      "cpu_request": 250,
      "cpu_usage_millicores": 85.3,
      "memory_request": 268435456,
      "memory_usage_bytes": 134217728,
      "network_receive_bytes": 1048576,
      "network_transmit_bytes": 524288,
      "disk_read_bytes": 2097152,
      "disk_write_bytes": 1048576,
      "restart_count": 0,
      "node": "ip-10-0-1-42",
      "node_instance_type": "m5.xlarge",
      "emaps_zone": "FR",
      "is_estimated": false
    }
  ],
  "total": 42,
  "period": {
    "start": "2024-02-20T14:00:00Z",
    "end": "2024-02-21T14:00:00Z"
  }
}
```

#### `GET /api/v1/metrics/summary`

Aggregated summary across all pods.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `namespace` | string | Filter by namespace | All |
| `last` | string | Time range | `24h` |

**Response:**
```json
{
  "total_co2e_grams": 45.2,
  "total_cost": 12.35,
  "total_energy_joules": 325000,
  "total_pods": 42,
  "period": {
    "start": "2024-02-20T14:00:00Z",
    "end": "2024-02-21T14:00:00Z"
  }
}
```

#### `GET /api/v1/metrics/timeseries`

Time-series data for charting.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `granularity` | string | `hour`, `day`, `week`, `month` | `day` |
| `last` | string | Time range | `7d` |
| `namespace` | string | Filter by namespace | All |

**Response:**
```json
{
  "timeseries": [
    {
      "timestamp": "2024-02-21T00:00:00Z",
      "co2e_grams": 45.2,
      "total_cost": 12.35,
      "energy_joules": 325000,
      "pod_count": 42
    }
  ]
}
```

### Namespaces

#### `GET /api/v1/namespaces`

List all active namespaces with metrics.

**Response:**
```json
{
  "namespaces": [
    {
      "name": "default",
      "pod_count": 15,
      "total_co2e_grams": 12.3,
      "total_cost": 3.45
    },
    {
      "name": "production",
      "pod_count": 27,
      "total_co2e_grams": 32.9,
      "total_cost": 8.90
    }
  ]
}
```

### Nodes

#### `GET /api/v1/nodes`

Cluster node inventory with hardware and capacity details.

**Response:**
```json
{
  "nodes": [
    {
      "name": "ip-10-0-1-42",
      "instance_type": "m5.xlarge",
      "cloud_provider": "aws",
      "zone": "eu-west-1a",
      "emaps_zone": "FR",
      "cpu_capacity": 4000,
      "memory_capacity": 17179869184,
      "architecture": "amd64",
      "os": "linux"
    }
  ]
}
```

### Recommendations

#### `GET /api/v1/recommendations`

Optimization recommendations based on recent metrics.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `namespace` | string | Filter by namespace | All |

**Response:**
```json
{
  "recommendations": [
    {
      "type": "rightsizing",
      "severity": "high",
      "resource": "api-deployment-7b5f8c9d6-x2k4p",
      "namespace": "default",
      "details": "CPU usage is 15% of request (250m). Recommend reducing to 50m.",
      "current": {"cpu_request": 250, "cpu_usage_avg": 37.5},
      "recommended": {"cpu_request": 50},
      "estimated_savings": {
        "cost_per_day": 0.45,
        "co2e_grams_per_day": 2.1
      }
    }
  ],
  "total": 5
}
```

## Error Handling

All endpoints return standard HTTP status codes:

| Status | Description |
|--------|-------------|
| `200` | Success |
| `400` | Bad request (invalid parameters) |
| `404` | Resource not found |
| `500` | Internal server error |

Error response format:
```json
{
  "detail": "Description of the error"
}
```

## Interactive Documentation

When the API is running, visit:
- **Swagger UI**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

<Aside type="tip">
  The Swagger UI lets you try out API calls directly from your browser — great for exploring and testing.
</Aside>

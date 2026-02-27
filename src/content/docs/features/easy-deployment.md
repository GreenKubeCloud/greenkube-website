---
title: Easy Deployment
description: Production-ready Helm chart with PostgreSQL, auto-discovery, RBAC, and health probes. Deploy in minutes.
---

GreenKube is designed with a **Zero-Config goal** — get meaningful insights with minimal setup. The production-ready Helm chart handles all the complexity for you.

## One-Command Install

```bash
helm repo add greenkube https://GreenKubeCloud.github.io/GreenKube
helm repo update
helm install greenkube greenkube/greenkube -n greenkube --create-namespace
```

That's it. GreenKube will:
1. Deploy the application container (API + Dashboard)
2. Deploy a PostgreSQL StatefulSet for metric storage
3. Create the necessary RBAC roles for Kubernetes API access
4. Auto-discover Prometheus and OpenCost endpoints
5. Start collecting metrics immediately

## What's Included

### Helm Chart Components

| Component | Description |
|---|---|
| **Deployment** | GreenKube application (API + SvelteKit dashboard) |
| **PostgreSQL StatefulSet** | Persistent metric storage with PVC |
| **ConfigMap** | All configuration environment variables |
| **Secret** | Database credentials and API tokens |
| **ClusterRole + Binding** | Read-only access to pods, nodes, HPAs |
| **ServiceAccount** | Dedicated identity for the application |
| **Services** | API service + PostgreSQL service |
| **PVC** | Persistent volume for PostgreSQL data |
| **Post-Install Hook** | Database schema initialization |

### Auto-Discovery

GreenKube automatically detects:
- **Prometheus** — Searches common service names and ports
- **OpenCost** — Searches for OpenCost service in the cluster
- **Node metadata** — CPU model, cores, RAM from Kubernetes API
- **Cloud provider** — Detected from node labels

### Health & Observability

- **Liveness probe** — `/health` endpoint
- **Readiness probe** — `/health` endpoint with DB connectivity check
- **Prometheus metrics** — `/metrics` endpoint for self-monitoring
- **Structured logging** — JSON-formatted logs for easy aggregation

## Configuration

All settings are configurable via `values.yaml`:

```yaml
greenkube:
  prometheusUrl: "http://prometheus-server.monitoring:9090"
  opencostUrl: "http://opencost.opencost:9003"
  dbType: "postgresql"       # or "sqlite", "elasticsearch"
  collectionInterval: 300    # seconds

electricityMaps:
  enabled: true
  token: ""                  # Your API token

postgresql:
  enabled: true
  storage: "5Gi"
```

Every parameter can also be set via environment variables (12-Factor App compliant).

## Docker Image

The Docker image is:
- **Lightweight** — Based on `python:3.11-slim`
- **Secure** — Runs as non-root user
- **Multi-arch** — Available for `linux/amd64` and `linux/arm64`

```bash
docker pull greenkube/greenkube:latest
```

## Related

- [Installation Guide](/getting-started/installation/) — Step-by-step instructions
- [Configuration Reference](/getting-started/configuration/) — All options explained
- [Architecture Overview](/architecture/overview/) — System design

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
| **ClusterRole + Binding** | Read-only access to pods, nodes, HPAs, endpoints, PersistentVolumes/Claims |
| **ServiceAccount** | Dedicated identity for the application |
| **Services** | API service + PostgreSQL service |
| **PVC** | Persistent volume for PostgreSQL data |
| **Post-Install Hook** | Database schema initialization |
| **ServiceMonitor** | Automatic Prometheus scraping (kube-prometheus-stack) |
| **NetworkPolicy** | Allows Prometheus to reach GreenKube API |

### Auto-Discovery

GreenKube automatically detects:
- **Prometheus** — Searches common service names and ports
- **OpenCost** — Searches for OpenCost service in the cluster
- **Node metadata** — CPU model, cores, RAM from Kubernetes API
- **Cloud provider** — Detected from node labels

### Health & Observability

- **Liveness probe** — `/health` endpoint
- **Readiness probe** — `/health` endpoint with DB connectivity check
- **Docker healthcheck** — Built-in `HEALTHCHECK` instruction for standalone usage
- **Prometheus metrics** — `/prometheus/metrics` endpoint with comprehensive metric exposition
- **Grafana dashboard** — Pre-built JSON dashboard for one-click import
- **Structured logging** — JSON-formatted logs for easy aggregation

## Security

As of v0.2.8, the Helm chart ships with comprehensive security hardening enabled by default:

- **Non-root containers** — `runAsNonRoot: true`, `runAsUser/Group: 10001`
- **Read-only root filesystem** — `readOnlyRootFilesystem: true` on all containers; `/tmp` directories served by bounded `emptyDir` volumes
- **Dropped capabilities** — `capabilities.drop: [ALL]`, `allowPrivilegeEscalation: false`
- **Seccomp** — `seccompProfile.type: RuntimeDefault` on every container
- **SCRAM-SHA-256** — PostgreSQL enforces the stronger SCRAM-SHA-256 password protocol
- **Least-privilege RBAC** — ClusterRole grants only the minimum required permissions (no `secrets` access)
- **API security headers** — 7 OWASP-recommended HTTP response headers on every response
- **Automated CVE scanning** — Weekly Trivy scans (image, IaC, deps) with results in GitHub Security

## Configuration

All settings are configurable via `values.yaml`:

```yaml
config:
  cloudProvider: aws          # auto-detected from node labels if left as "unknown"
  db:
    type: postgres            # or "sqlite"
    poolMinSize: 2
    poolMaxSize: 10
    statementTimeoutMs: 30000

secrets:
  electricityMapsToken: ""   # Your Electricity Maps API token
  existingSecret: ""         # Set to use a pre-created K8s Secret

postgresql:
  enabled: true
  persistence:
    enabled: true
    size: 5Gi
```

Every parameter can also be set via environment variables (12-Factor App compliant).

## Docker Image

The Docker image is:
- **Lightweight** — Based on `python:3.14-slim`
- **Secure** — Runs as non-root user (`greenkube`, UID 10001), read-only root filesystem
- **Multi-arch** — Available for `linux/amd64` and `linux/arm64`
- **Hardened** — Builder stage uses `node:22-alpine`; OS packages upgraded at build time

```bash
docker pull greenkube/greenkube:latest
```

## Related

- [Installation Guide](/getting-started/installation/) — Step-by-step instructions
- [Configuration Reference](/getting-started/configuration/) — All options explained
- [Architecture Overview](/architecture/overview/) — System design

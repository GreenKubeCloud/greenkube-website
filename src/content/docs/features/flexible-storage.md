---
title: Flexible Storage
description: Choose PostgreSQL for persistent deployments or SQLite for development and standalone use.
---

GreenKube supports PostgreSQL and SQLite through shared repository interfaces. Select the backend in Helm values or with the corresponding environment variables.

## Supported Backends

### PostgreSQL (Recommended)
- Supported production backend
- Bundled in the Helm chart as a StatefulSet, or use an external PostgreSQL database
- Persistent storage and configurable connection pooling

```yaml
# values.yaml
config:
  db:
    type: postgres
postgres:
  enabled: true
  persistence:
    enabled: true
    size: 10Gi
```

### SQLite (Development & Standalone)
- Zero infrastructure — single file database
- Perfect for local development and testing
- Great for single-node standalone deployments
- **SCD2 node snapshots** — Slowly Changing Dimensions Type 2 tracking stores only changed node rows (`instance_type`, `vcpu`, `memory_gb`, `region`, `provider`, `zone`), avoiding write amplification on stable clusters

```yaml
config:
  db:
    type: sqlite
    path: /data/greenkube_data.db
```

## Data Retention & Compression

GreenKube uses a configurable multi-tier retention strategy:

| Tier | Default | Env Var |
|------|---------|--------|
| Raw metrics (5-min) | 7 days | `METRICS_RAW_RETENTION_DAYS` |
| Hourly aggregates | Infinite | `METRICS_AGGREGATED_RETENTION_DAYS` (-1 = infinite) |
| Compression threshold | 24 h | `METRICS_COMPRESSION_AGE_HOURS` |

Raw metrics are automatically compressed to hourly aggregates after the threshold, keeping storage compact without losing historical visibility. Aggregates are retained indefinitely by default unless a limit is configured.

## Related

- [Storage Architecture](/architecture/storage/) — Technical deep-dive
- [Configuration Guide](/getting-started/configuration/) — All storage options
- [Architecture Overview](/architecture/overview/) — System design principles

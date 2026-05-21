---
title: Flexible Storage
description: Supports PostgreSQL, SQLite, and Elasticsearch — choose the backend that fits your needs.
---

GreenKube is **storage-agnostic** by design. The application core never depends on a specific storage implementation, letting you choose the backend that best fits your use case.

## Supported Backends

### PostgreSQL (Recommended for Production)
- Full SQL support with time-series optimized queries
- Included in the Helm chart as a StatefulSet
- Persistent storage with configurable PVC
- Supports connection pooling and replicas

```yaml
# values.yaml
greenkube:
  dbType: "postgresql"
postgresql:
  enabled: true
  storage: "10Gi"
```

### SQLite (Development & Standalone)
- Zero infrastructure — single file database
- Perfect for local development and testing
- Great for single-node standalone deployments
- **SCD2 node snapshots** — Slowly Changing Dimensions Type 2 tracking stores only changed node rows (`instance_type`, `vcpu`, `memory_gb`, `region`, `provider`, `zone`), avoiding write amplification on stable clusters

```yaml
greenkube:
  dbType: "sqlite"
  sqlitePath: "/data/greenkube.db"
```

## Repository Pattern

The storage agnosticism is achieved through the **Repository Pattern**:

```
┌──────────────────┐
│   Business Logic │  ← Calls repository.save_metric()
│   (Core)         │     Never knows about SQL/NoSQL
└────────┬─────────┘
         │ interface
┌────────┴─────────┐
│   Repository     │  ← Abstract interface
│   Interface      │
└────────┬─────────┘
    ┌────┼────┐
    ▼    ▼    ▼
  PG  SQLite  ES     ← Concrete implementations
```

This means:
- Switching backends requires **only a configuration change**
- The business logic is **fully tested** without any real database
- New backends can be added without touching the core

## Factory Pattern

Backend instantiation is handled by `core/factory.py`:

```python
# Simplified example
def create_repository(config: Config) -> MetricRepository:
    if config.db_type == "postgresql":
        return PostgreSQLRepository(config.db_url)
    elif config.db_type == "sqlite":
        return SQLiteRepository(config.sqlite_path)
    elif config.db_type == "elasticsearch":
        return ElasticsearchRepository(config.es_url)
```

## Data Retention & Compression

GreenKube uses a configurable multi-tier retention strategy:

| Tier | Default | Env Var |
|------|---------|--------|
| Raw metrics (5-min) | 7 days | `METRICS_RAW_RETENTION_DAYS` |
| Hourly aggregates | Infinite | `METRICS_AGGREGATED_RETENTION_DAYS` (-1 = infinite) |
| Compression threshold | 24 h | `METRICS_COMPRESSION_AGE_HOURS` |

Raw metrics are automatically compressed to hourly aggregates after the threshold, keeping storage compact without losing historical visibility. Infinite aggregated retention is the default to support multi-year CSRD/ESRS E1 compliance.

## Related

- [Storage Architecture](/architecture/storage/) — Technical deep-dive
- [Configuration Guide](/getting-started/configuration/) — All storage options
- [Architecture Overview](/architecture/overview/) — System design principles

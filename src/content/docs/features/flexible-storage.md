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
- No additional services required

```yaml
greenkube:
  dbType: "sqlite"
  sqlitePath: "/data/greenkube.db"
```

### Elasticsearch (Scale & Analytics)
- Optimized for large-scale metric storage
- Advanced time-series aggregation queries
- Integrates with Kibana for additional visualization
- Ideal for organizations already running an ELK stack

```yaml
greenkube:
  dbType: "elasticsearch"
  elasticsearchUrl: "http://elasticsearch:9200"
```

## Repository Pattern

The storage agnosticism is achieved through the **Repository Pattern**:

```
┌──────────────────┐
│   Business Logic  │  ← Calls repository.save_metric()
│   (Core)          │     Never knows about SQL/NoSQL
└────────┬─────────┘
         │ interface
┌────────┴─────────┐
│   Repository      │  ← Abstract interface
│   Interface       │
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

## Migration Between Backends

GreenKube supports data export/import to facilitate migration:

```bash
# Export from current backend
greenkube export --format json --output metrics.json

# Import into new backend
greenkube import --input metrics.json
```

## Related

- [Storage Architecture](/architecture/storage/) — Technical deep-dive
- [Configuration Guide](/getting-started/configuration/) — All storage options
- [Architecture Overview](/architecture/overview/) — System design principles

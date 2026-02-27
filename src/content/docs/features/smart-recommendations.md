---
title: Smart Recommendations
description: AI-powered analysis detects zombie pods, rightsizing opportunities, autoscaling candidates, and carbon-aware scheduling.
---

GreenKube's recommendation engine analyzes your cluster metrics to produce **actionable optimization suggestions** that reduce both costs and carbon emissions.

## How It Works

The recommendation engine runs a multi-pass analysis:

### Pass 1: Resource Utilization Analysis
- Compare actual usage vs. requests/limits over a configurable window
- Detect consistent over-provisioning (usage < 30% of request)
- Detect under-provisioning (usage > 90% of limit)

### Pass 2: Behavioral Pattern Detection
- Identify **zombie pods** — running but doing no useful work
- Detect **periodic workloads** — candidates for cron jobs or autoscaling
- Find **idle namespaces** — entire namespaces with minimal activity

### Pass 3: Optimization Modeling
- Calculate optimal resource requests/limits based on P95 usage
- Model HPA configurations for variable workloads
- Estimate savings in $, kWh, and kgCO₂e

### Pass 4: Carbon-Aware Insights
- Suggest schedule shifts for batch workloads to low-carbon periods
- Recommend region migration for workloads where carbon intensity varies significantly

## Recommendation Types

| Type | Icon | Description |
|---|---|---|
| Zombie Pod | 🧟 | Pod with near-zero utilization |
| Rightsizing | 📏 | Over or under-provisioned resources |
| HPA Candidate | ⚖️ | Workload suitable for autoscaling |
| Carbon Scheduling | 🌍 | Shift to lower-carbon time/region |
| Namespace Cleanup | 🧹 | Idle or unused namespace |
| Storage Optimization | 💾 | Orphaned PVCs or over-sized volumes |

## Confidence Levels

Each recommendation includes a confidence score:

- **High** — Strong signal, >90% confidence in estimated savings
- **Medium** — Good signal, 60-90% confidence
- **Low** — Weak signal, worth investigating but may be a false positive

## Accessing Recommendations

### Dashboard
The Recommendations tab shows all active suggestions with:
- Priority ranking
- Affected resources
- Estimated savings
- One-click details

### CLI
```bash
# View all recommendations
greenkube report --recommendations

# Filter by type
greenkube report --recommendations --type=zombie

# Export as JSON
greenkube report --recommendations --format=json
```

### API
```bash
# All recommendations
GET /api/v1/recommendations

# Filtered
GET /api/v1/recommendations?type=rightsizing&severity=critical
```

## History Tracking

Recommendations are tracked over time so you can:
- See when a recommendation first appeared
- Track whether it was resolved
- Measure the impact of optimizations you've applied

## Related

- [Cost Optimization](/features/cost-optimization/) — Financial impact details
- [Recommendations Guide](/guide/recommendations/) — Usage instructions
- [Multi-Resource Monitoring](/features/multi-resource-monitoring/) — Data feeding the engine

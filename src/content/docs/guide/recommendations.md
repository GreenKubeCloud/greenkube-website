---
title: Recommendations
description: Understand GreenKube's 9 optimization recommendation types, persisted lifecycle states, ranked top recommendations, and realized savings tracking.
---

import { Card, CardGrid } from '@astrojs/starlight/components';

GreenKube analyzes your cluster metrics to generate actionable recommendations that reduce both **costs** and **carbon emissions**.

## Recommendation Engine

The recommendation engine reads stored metrics over a configurable lookback window controlled by `RECOMMENDATION_LOOKBACK_DAYS` (default: `7` days) and applies threshold-based detection algorithms. Results are deduplicated at the **Deployment level** — pods belonging to the same Deployment are grouped so you see one recommendation per workload, not one per replica.

Each recommendation includes:
- **Type** — one of 9 detection categories
- **Priority** — `high`, `medium`, or `low`
- **Scope** — `pod`, `workload`, `namespace`, or `node`
- **Projected annual savings** — `potential_savings_co2e_grams` and `potential_savings_cost`

When the API or startup scan runs, metrics from namespaces that no longer exist in Kubernetes are filtered out when the cluster API is reachable. That lets GreenKube reconcile old active recommendations as `stale` instead of regenerating them forever.

<CardGrid>
  <Card title="🧟 Zombie Detection">
    Identifies pods consuming resources but producing little or no value — idle workloads that should be terminated.
  </Card>
  <Card title="📏 Rightsizing (CPU & Memory)">
    Finds pods with CPU or memory requests significantly higher than actual usage, suggesting smaller resource allocations.
  </Card>
  <Card title="📈 Autoscaling">
    Detects workloads with high usage variability that would benefit from Horizontal Pod Autoscalers.
  </Card>
  <Card title="🌍 Carbon-Aware Scheduling">
    Identifies workloads that could be time-shifted to periods of lower grid carbon intensity.
  </Card>
  <Card title="🗂️ Idle Namespace">
    Spots namespaces with minimal activity that may contain forgotten resources consuming energy and cost.
  </Card>
  <Card title="🌙 Off-Peak Scaling">
    Suggests scaling down workloads during off-peak hours with a generated CronJob schedule.
  </Card>
  <Card title="🖥️ Overprovisioned Node">
    Identifies nodes with far more capacity than their scheduled pods require.
  </Card>
  <Card title="💤 Underutilized Node">
    Flags nodes running at very low CPU and memory utilization — consolidation candidates.
  </Card>
</CardGrid>

## Recommendation Types

### 🧟 Zombie Pods (`ZOMBIE_POD`)

**What:** Pods that are running and consuming resources but show near-zero energy usage.

**Detection:**
- Energy consumption `< ZOMBIE_ENERGY_THRESHOLD`
- Cost `> ZOMBIE_COST_THRESHOLD` (default: $0.01)

**Scope:** pod

---

### 📏 Rightsizing CPU (`RIGHTSIZING_CPU`)

**What:** Pods with CPU requests significantly higher than actual utilization.

**Detection:**
- Average CPU utilization `< RIGHTSIZING_CPU_THRESHOLD` × CPU request (default: **30%**)
- Recommendation uses P95 usage, observed max, average usage, and a headroom multiplier for safe reductions
- Only reductions are surfaced — recommendations that would increase a request are discarded

**Scope:** workload (grouped per Deployment)

---

### 📏 Rightsizing Memory (`RIGHTSIZING_MEMORY`)

**What:** Pods with memory requests significantly higher than actual utilization.

**Detection:**
- Average memory utilization `< RIGHTSIZING_MEMORY_THRESHOLD` × memory request (default: **30%**)

**Scope:** workload (grouped per Deployment)

---

### 📈 Autoscaling Candidates (`AUTOSCALING_CANDIDATE`)

**What:** Workloads with high CPU usage variability that would benefit from autoscaling.

**Detection:**
- Coefficient of Variation `> AUTOSCALING_CV_THRESHOLD` (default: 0.7)
- Max/min ratio `> AUTOSCALING_SPIKE_RATIO` (default: 3.0)
- No existing HPA detected

**Scope:** workload

---

### 🌍 Carbon-Aware Scheduling (`CARBON_AWARE_SCHEDULING`)

**What:** Workloads running during high-carbon-intensity windows that could be shifted to cleaner periods.

**Detection:** Grid intensity `> zone average × CARBON_AWARE_THRESHOLD` (default: 1.5×)

**Scope:** pod / workload

---

### 🗂️ Idle Namespace Cleanup (`IDLE_NAMESPACE`)

**What:** Namespaces with minimal energy consumption.

**Detection:** Total namespace energy `< IDLE_NAMESPACE_ENERGY_THRESHOLD` (default: 1,000 J)

**Scope:** namespace

---

### 🌙 Off-Peak Scaling (`OFF_PEAK_SCALING`)

**What:** Workloads with sustained idle periods during consistent time windows.

**Detection:** Idle period `>= OFF_PEAK_MIN_IDLE_HOURS` (default: 4h) at consistent hours, below `OFF_PEAK_IDLE_THRESHOLD` of the daily peak.

**Output:** Suggested CronJob/KEDA scale-down + scale-up schedule.

**Scope:** workload (grouped per Deployment)

---

### 🖥️ Overprovisioned Node (`OVERPROVISIONED_NODE`)

**What:** Nodes with far more capacity than their scheduled workloads require.

**Detection:** Node CPU utilization `< NODE_UTILIZATION_THRESHOLD` (default: 20%)

**Scope:** node

---

### 💤 Underutilized Node (`UNDERUTILIZED_NODE`)

**What:** Nodes running at very low CPU and memory utilization — consolidation candidates.

**Detection:** Node has fewer than 3 pods and average CPU utilization below 15%.

**Scope:** node

---

## Recommendation Lifecycle

Each recommendation is persisted in the database and reconciled across scans.

```
active -> applied
  |
  +-> ignored -> active
  |
  +-> stale
```

| Status | Meaning |
|--------|---------|
| `active` | Current valid recommendation, shown in active lists, top recommendations, Prometheus active gauges, Grafana cards, and the frontend Active tab |
| `applied` | Recommendation explicitly implemented through the API; excluded from active lists and included in realized savings |
| `ignored` | Recommendation intentionally hidden with an audit reason; preserved for review and can be restored |
| `stale` | Previously active recommendation that no longer appears in the latest generated set |

### Managing Lifecycle in the Dashboard

On the `/recommendations` page:
- **Active tab** — current actionable recommendations with type filter and annual savings summary
- **Ignored tab** — previously ignored recommendations with restore action
- **Realized Savings tab** — applied recommendations and cumulative realized savings
- **Ignore flow** — ignore requires a reason; restore is available from the Ignored tab

The current frontend does **not** expose an Apply button yet, even though the API supports applying recommendations.

### Managing Lifecycle via API

```bash
# Mark a recommendation as applied
PATCH /api/v1/recommendations/{id}/apply

# Permanently ignore with a reason
PATCH /api/v1/recommendations/{id}/ignore

# Restore an ignored recommendation
DELETE /api/v1/recommendations/{id}/ignore

# Get active recommendations (optionally trigger a live refresh)
GET /api/v1/recommendations/active?refresh=true

# Get applied recommendations
GET /api/v1/recommendations/applied

# Get ranked top recommendations
GET /api/v1/recommendations/top?limit=5&metric=co2

# Get savings summary
GET /api/v1/recommendations/savings
```

## Savings Ledger

When a recommendation is marked **applied**, GreenKube estimates realized annual savings on the recommendation row, then the `SavingsAttributor` converts those annual values into per-period ledger rows. Over time this accumulates into:

- `greenkube_co2e_savings_attributed_grams_total` — cumulative CO₂e savings (Prometheus gauge)
- `greenkube_cost_savings_attributed_dollars_total` — cumulative cost savings (Prometheus gauge)

The savings ledger is visible in:
- The Grafana dashboard's **Impact Command Center** section (attributed savings timeline)
- The `/api/v1/recommendations/savings` endpoint

For fixed Grafana windows, prefer the pre-computed dashboard gauges:

- `greenkube_dashboard_savings_co2e_grams_total`
- `greenkube_dashboard_savings_cost_dollars_total`

## Ranked Top Recommendations

GreenKube also exposes a ranked view of active recommendations with positive projected savings:

```bash
GET /api/v1/recommendations/top?limit=5&metric=co2
GET /api/v1/recommendations/top?limit=10&metric=cost&refresh=true
```

This API powers:

- The Grafana **Actionable Recommendations** row
- The `greenkube_top_recommendations` Prometheus gauge
- CO₂e-first or cost-first ranking via `metric=co2|cost`

## Using Recommendations

### CLI

```bash
# Get all recommendations (reads from database)
greenkube recommend

# Filter by namespace
greenkube recommend -n production

# Longer lookback window
greenkube recommend --last 7d

# Live collection (re-runs the full collection pipeline)
greenkube recommend --live

# CI/CD gate: exit 1 if any recommendations exist
greenkube recommend --fail-on-recommendations
```

### API

```bash
# Live recommendations (runs the recommender)
GET /api/v1/recommendations

# Persisted active recommendations
GET /api/v1/recommendations/active

# Persisted applied recommendations
GET /api/v1/recommendations/applied

# Ranked active recommendations by projected annual savings
GET /api/v1/recommendations/top

# History
GET /api/v1/recommendations/history
```

## Tuning Thresholds

All thresholds are configurable via Helm `values.yaml` or environment variables:

```yaml
config:
  recommendations:
    lookbackDays: 7                   # Analysis window used by API/startup scan
    rightsizingCpuThreshold: 0.3      # 30% usage triggers CPU rightsizing
    rightsizingMemoryThreshold: 0.3   # 30% usage triggers memory rightsizing
    rightsizingHeadroom: 1.2          # 20% safety margin on new request
    zombieCostThreshold: 0.01         # $0.01/day minimum to flag
    zombieEnergyThreshold: 1000       # 1,000 Joules minimum to flag
    autoscalingCvThreshold: 0.7       # High variability coefficient
    autoscalingSpikeRatio: 3.0        # 3× max/min ratio
    carbonAwareThreshold: 1.5         # 1.5× average intensity
    nodeUtilizationThreshold: 0.2     # 20% CPU for overprovisioned node
    offPeakIdleThreshold: 0.05        # 5% of daily peak
    offPeakMinIdleHours: 4            # 4h idle to suggest off-peak scaling
    minCpuMillicores: 10              # Floor for generated CPU requests
    minMemoryBytes: 16777216          # Floor for generated memory requests
    applyTolerance: 0.25              # Reserved for future auto-apply detection
```

Adjust these based on your cluster size, workload patterns, and organizational priorities.

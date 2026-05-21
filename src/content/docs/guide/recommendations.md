---
title: Recommendations
description: Understand GreenKube's 9 optimization recommendation types, lifecycle management, savings tracking, and CI/CD integration.
---

import { Card, CardGrid } from '@astrojs/starlight/components';

GreenKube analyzes your cluster metrics to generate actionable recommendations that reduce both **costs** and **carbon emissions**.

## Recommendation Engine

The recommendation engine reads metrics from the database over a configurable lookback window (default: `24h`) and applies threshold-based detection algorithms. Results are deduplicated at the **Deployment level** — pods belonging to the same Deployment are grouped so you see one recommendation per workload, not one per replica.

Each recommendation includes:
- **Type** — one of 9 detection categories
- **Priority** — `high`, `medium`, or `low`
- **Scope** — `pod`, `workload`, `namespace`, or `node`
- **Annual savings** — projected CO₂e and cost savings extrapolated to 1 year

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
- Average CPU utilization `< RIGHTSIZING_CPU_THRESHOLD` × CPU request (default: **50%**)
- Recommendation uses a headroom multiplier for safe reductions (e.g., 1.2×)
- Only reductions are surfaced — recommendations that would increase a request are discarded

**Scope:** workload (grouped per Deployment)

---

### 📏 Rightsizing Memory (`RIGHTSIZING_MEMORY`)

**What:** Pods with memory requests significantly higher than actual utilization.

**Detection:**
- Average memory utilization `< RIGHTSIZING_MEMORY_THRESHOLD` × memory request (default: **50%**)

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

**Detection:** Idle period `>= OFF_PEAK_MIN_IDLE_HOURS` (default: 2h) at consistent hours.

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

**Detection:** Node CPU `< 0.05 cores` with workloads that could migrate to other nodes.

**Scope:** node

---

## Recommendation Lifecycle

Each recommendation is persisted in the database with a full status lifecycle.

```
open → in_progress → resolved
         ↓
      dismissed / snoozed
```

| Status | Meaning |
|--------|---------|
| `open` | Active recommendation, not yet acted on |
| `in_progress` | Team is working on this |
| `resolved` | Applied — triggers a **savings ledger entry** |
| `dismissed` | Permanently ignored |
| `snoozed` | Hidden for N days (default: 30) |

### Managing Lifecycle in the Dashboard

On the `/recommendations` page:
- **Status filters** — show only active, snoozed, dismissed, or resolved recommendations
- **Per-recommendation controls** — mark in-progress, resolve, dismiss, or snooze (30 days)
- **Bulk dismiss** — dismiss all recommendations of a given type at once
- **Annual savings preview** — estimated CO₂e and cost savings per recommendation

### Managing Lifecycle via API

```bash
# Mark a recommendation as applied (resolved)
PATCH /api/v1/recommendations/{id}/apply

# Permanently ignore
PATCH /api/v1/recommendations/{id}/ignore

# Snooze for 14 days
PATCH /api/v1/recommendations/{id}/snooze?days=14

# Get active recommendations (optionally trigger a live refresh)
GET /api/v1/recommendations/active?refresh=true

# Get savings summary
GET /api/v1/recommendations/savings
```

## Savings Ledger

When a recommendation is marked **resolved**, GreenKube creates a `SavingsLedgerRecord` that prorates the projected annual savings to the actual collection window. Over time this accumulates into:

- `greenkube_co2e_savings_attributed_grams_total` — cumulative CO₂e savings (Prometheus gauge)
- `greenkube_cost_savings_attributed_dollars_total` — cumulative cost savings (Prometheus gauge)

The savings ledger is visible in:
- The Grafana dashboard's **Impact Command Center** section (attributed savings timeline)
- The `/api/v1/recommendations/savings` endpoint

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

# History
GET /api/v1/recommendations/history
```

## Tuning Thresholds

All thresholds are configurable via Helm `values.yaml` or environment variables:

```yaml
config:
  recommendations:
    rightsizingCpuThreshold: 0.5      # 50% usage triggers CPU rightsizing
    rightsizingMemoryThreshold: 0.5   # 50% usage triggers memory rightsizing
    rightsizingHeadroom: 1.2          # 20% safety margin on new request
    zombieCostThreshold: 0.01         # $0.01/day minimum to flag
    zombieEnergyThreshold: 1000       # 1,000 Joules minimum to flag
    autoscalingCvThreshold: 0.7       # High variability coefficient
    autoscalingSpikeRatio: 3.0        # 3× max/min ratio
    carbonAwareThreshold: 1.5         # 1.5× average intensity
    nodeUtilizationThreshold: 0.2     # 20% CPU for overprovisioned node
    offPeakMinIdleHours: 2            # 2h idle to suggest off-peak scaling
```

Adjust these based on your cluster size, workload patterns, and organizational priorities.

---
title: Smart Recommendations
description: Rule-based analysis detects zombie pods, rightsizing opportunities, autoscaling candidates, carbon-aware scheduling, and more — with persisted active, applied, ignored, and stale states.
---

GreenKube's recommendation engine analyzes your cluster metrics to produce **actionable optimization suggestions** that reduce both costs and carbon emissions simultaneously.

## How It Works

The recommendation engine runs from the API, the startup scan, and the CLI. It reads historical metrics from the database over a configurable lookback window (`RECOMMENDATION_LOOKBACK_DAYS`, default: 7 days) and applies threshold-based detection algorithms across multiple dimensions.

**Deployment-level deduplication:** Pods belonging to the same Deployment are grouped together (via pod-name suffix pattern matching) so you receive one recommendation per workload — not one per replica.

**Annual savings projection:** Every recommendation includes estimated annual CO₂e savings (`annual_co2e_savings_grams`) and annual cost savings (`annual_cost_savings_usd`), extrapolated from the observation window.

## 11 Recommendation Types

### 🧟 Zombie Pod (`ZOMBIE_POD`)

**What:** Pods that are running and consuming resources but show near-zero energy usage — idle workloads that have been forgotten.

**Detection:** `cost > ZOMBIE_COST_THRESHOLD` AND `energy < ZOMBIE_ENERGY_THRESHOLD`

**Scope:** pod

---

### 📏 CPU Rightsizing (`RIGHTSIZING_CPU`)

**What:** Pods with CPU requests significantly higher than actual utilization.

**Detection:** Average CPU utilization `< RIGHTSIZING_CPU_THRESHOLD` (default: 30%) of CPU request.

**Output:** Recommended new CPU request uses P95 usage, observed max, average usage, and headroom. Only reductions are surfaced — recommendations that would increase a request are discarded.

**Scope:** workload (grouped per Deployment)

---

### 📏 Memory Rightsizing (`RIGHTSIZING_MEMORY`)

**What:** Pods with memory requests significantly higher than actual utilization.

**Detection:** Average memory utilization `< RIGHTSIZING_MEMORY_THRESHOLD` (default: 30%) of memory request.

**Scope:** workload (grouped per Deployment)

---

### 📈 Autoscaling Candidate (`AUTOSCALING_CANDIDATE`)

**What:** Workloads with high CPU usage variability that would benefit from Horizontal Pod Autoscaling (HPA).

**Detection:**
- Coefficient of Variation `> AUTOSCALING_CV_THRESHOLD` (default: 0.7)
- Max/min ratio `> AUTOSCALING_SPIKE_RATIO` (default: 3.0)
- No existing HPA detected (via the HPACollector)

**Scope:** workload

---

### 🌍 Carbon-Aware Scheduling (`CARBON_AWARE_SCHEDULING`)

**What:** Workloads running during high-carbon-intensity windows that could be shifted to cleaner periods.

**Detection:** Grid intensity during execution `> zone average × CARBON_AWARE_THRESHOLD` (default: 1.5×)

**Scope:** pod / workload

---

### 🗂️ Idle Namespace (`IDLE_NAMESPACE`)

**What:** Namespaces with minimal energy consumption — likely forgotten resources still incurring cost.

**Detection:** Total namespace energy `< IDLE_NAMESPACE_ENERGY_THRESHOLD`

**Scope:** namespace

---

### 🌙 Off-Peak Scaling (`OFF_PEAK_SCALING`)

**What:** Workloads that maintain full resource allocation during off-peak hours and could benefit from scheduled scale-down.

**Detection:** Sustained idle periods `>= OFF_PEAK_MIN_IDLE_HOURS` (default: 4h) during consistent time windows, below `OFF_PEAK_IDLE_THRESHOLD` of the daily peak.

**Output:** Suggested CronJob/KEDA schedule for scale-down + scale-up.

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

### 💾 Orphaned PersistentVolume (`ORPHANED_PERSISTENT_VOLUME`)

**What:** PersistentVolumes whose claim is gone — `Released` phase or a `claimRef` pointing at a deleted PVC. Deleting the volume releases the provisioned storage.

**Detection:** New `PVCollector` lists PVs/PVCs from the Kubernetes API every scan.

**Scope:** cluster

---

### ⚖️ Orphaned LoadBalancer (`ORPHANED_LOAD_BALANCER`)

**What:** `LoadBalancer` Services with no ready backing endpoints — the cloud load balancer keeps billing hourly while routing traffic to nothing.

**Detection:** New `LoadBalancerCollector` lists Services/Endpoints from the Kubernetes API every scan.

**Scope:** cluster

---

## Recommendation Lifecycle

Each recommendation persists in the database and is reconciled across scans:

```
active -> applied
      |
      +-> ignored -> active
      |
      +-> stale
```

| Status | Meaning |
|--------|---------|
| `active` | Currently valid recommendation, shown in active lists and Grafana ranked cards |
| `applied` | Recommendation explicitly implemented through the API and included in realized savings |
| `ignored` | Recommendation intentionally hidden with an audit reason and restorable later |
| `stale` | Previously active recommendation that disappeared after refresh/reconciliation |

### Savings Ledger

When a recommendation is marked **applied**, GreenKube records realized annual savings and the `SavingsAttributor` converts them into per-period ledger rows. This drives two Prometheus gauges:

- `greenkube_co2e_savings_attributed_grams_total` — cumulative CO₂e savings
- `greenkube_cost_savings_attributed_dollars_total` — cumulative cost savings

These are displayed in the Grafana dashboard's **Impact Command Center** section and on the web dashboard's summary cards.

The new **Actionable Recommendations** Grafana row ranks the highest-impact active recommendations using:

- `GET /api/v1/recommendations/top`
- `greenkube_top_recommendations`

## Accessing Recommendations

### Web Dashboard

The `/recommendations` page provides:
- **Active tab** — current recommendations with type filter and annual savings preview
- **Ignored tab** — ignored recommendations with restore action
- **Realized Savings tab** — applied recommendations plus cumulative realized savings
- **Ignore flow** — reason is optional

The dashboard currently exposes **ignore** and **restore** flows, but not an Apply button.

### CLI

```bash
# View all recommendations (reads from database)
greenkube recommend

# Filter by namespace
greenkube recommend --namespace production

# Specify lookback window
greenkube recommend --last 7d

# Run live collection instead of reading from DB
greenkube recommend --live

# CI/CD gate: exit 1 if any recommendations exist
greenkube recommend --fail-on-recommendations
```

### API

```bash
# Live recommendations (runs the recommender)
GET /api/v1/recommendations

# Persisted recommendations (optionally refresh first)
GET /api/v1/recommendations/active
GET /api/v1/recommendations/active?refresh=true

# Historical records
GET /api/v1/recommendations/history

# Savings summary
GET /api/v1/recommendations/savings

# Get applied recommendations
GET /api/v1/recommendations/applied

# Ranked active recommendations
GET /api/v1/recommendations/top?limit=5&metric=co2

# Update lifecycle status
PATCH /api/v1/recommendations/{id}/apply
PATCH /api/v1/recommendations/{id}/ignore
DELETE /api/v1/recommendations/{id}/ignore
```

## Related

- [Recommendations Guide](/guide/recommendations/) — Step-by-step usage instructions
- [Carbon Tracking](/features/carbon-tracking/) — How emissions are estimated
- [REST API](/guide/api/) — Full API reference

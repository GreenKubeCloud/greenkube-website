---
title: Recommendations
description: Understand GreenKube's optimization recommendations — zombie pods, rightsizing, autoscaling, and carbon-aware scheduling.
---

import { Card, CardGrid } from '@astrojs/starlight/components';

GreenKube analyzes your cluster metrics to generate actionable recommendations that reduce both **costs** and **carbon emissions**.

## Recommendation Engine

The recommendation engine examines metrics collected over a configurable lookback period (default: 7 days) and applies multiple analysis algorithms:

<CardGrid>
  <Card title="🧟 Zombie Detection">
    Identifies pods consuming resources but producing little or no value — idle workloads that should be terminated.
  </Card>
  <Card title="📏 Rightsizing (CPU & Memory)">
    Finds pods with CPU or memory requests significantly higher than actual usage, suggesting smaller resource allocations.
  </Card>
  <Card title="📈 Autoscaling">
    Detects workloads with high usage variability that would benefit from Horizontal or Vertical Pod Autoscalers.
  </Card>
  <Card title="🌍 Carbon-Aware Scheduling">
    Identifies batch workloads that could be time-shifted to periods of lower grid carbon intensity.
  </Card>
  <Card title="🗂️ Idle Namespace">
    Spots namespaces with minimal activity that may contain forgotten resources consuming energy and cost.
  </Card>
  <Card title="🌙 Off-Peak Scaling">
    Suggests scaling down workloads during off-peak hours when high resource allocation isn't needed.
  </Card>
  <Card title="🖥️ Overprovisioned Node">
    Identifies nodes with far more capacity than their scheduled pods require.
  </Card>
  <Card title="💤 Underutilized Node">
    Flags nodes running at very low utilization, wasting energy and money.
  </Card>
</CardGrid>

## Recommendation Types

### 🧟 Zombie Pods (`ZOMBIE_POD`)

**What:** Pods that are running and consuming resources but show minimal CPU/energy usage.

**Detection Criteria:**
- CPU usage consistently below threshold
- Energy consumption below `zombieEnergyThreshold` (default: 1000 J)
- Cost above `zombieCostThreshold` (default: $0.01)
- Running for extended periods

**Example Output:**
```
🧟 ZOMBIE POD — High Severity
Pod: legacy-api-deployment-5d8f7c-k2m4p
Namespace: staging
  CPU usage: 2m (avg over 7 days)
  Energy: 450 J
  Cost: $0.85/day
  Estimated savings: $0.85/day, 3.2g CO₂e/day
  Action: Consider terminating this idle workload
    kubectl delete deployment legacy-api-deployment -n staging
```

### 📏 Rightsizing (`RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`)

**What:** Pods with resource requests (CPU or memory) significantly higher than actual utilization. Two sub-types: `RIGHTSIZING_CPU` for over-provisioned CPU and `RIGHTSIZING_MEMORY` for over-provisioned memory.

**Detection Criteria:**
- Average CPU usage < `rightsizingCpuThreshold` × CPU request (default: 30%)
- Average memory usage < `rightsizingMemoryThreshold` × memory request (default: 30%)
- Applies `rightsizingHeadroom` multiplier (default: 1.2x) for safe recommendations

**Example Output:**
```
📏 RIGHTSIZING — Medium Severity
Pod: web-frontend-7b5f8c9d6-x2k4p
Namespace: production
  CPU: Using 45m of 500m requested (9%)
  Recommendation: Reduce CPU request to 55m (45m × 1.2 headroom)
  Memory: Using 128Mi of 512Mi requested (25%)
  Recommendation: Reduce memory request to 154Mi
  Estimated savings: $1.20/day, 5.4g CO₂e/day
```

### 📈 Autoscaling Candidates (`AUTOSCALING_CANDIDATE`)

**What:** Workloads with high variability in resource usage that would benefit from autoscaling.

**Detection Criteria:**
- High coefficient of variation (CV > `autoscalingCvThreshold`, default: 0.7)
- Spike detection (max/avg ratio > `autoscalingSpikeRatio`, default: 3.0)
- No existing HPA/VPA detected

**Example Output:**
```
📈 AUTOSCALING — Medium Severity
Pod: batch-processor-deployment-8c7d6-n3m2p
Namespace: default
  CPU variability: CV = 1.2 (high)
  Peak: 800m, Average: 150m (5.3x spike ratio)
  Recommendation: Configure HPA with:
    minReplicas: 1, maxReplicas: 5
    targetCPUUtilization: 70%
```

### 🌍 Carbon-Aware Scheduling (`CARBON_AWARE_SCHEDULING`)

**What:** Batch or deferrable workloads that could be scheduled during periods of lower grid carbon intensity.

**Detection Criteria:**
- Grid intensity during workload execution exceeds `carbonAwareThreshold` × average (default: 1.5x)
- Workload appears to be a batch job (CronJob, Job owner)
- Lower-intensity periods available in the same zone

**Example Output:**
```
🌍 CARBON-AWARE — Low Severity
Pod: nightly-etl-job-28445-k2m4p
Namespace: data-pipeline
  Current intensity: 520 gCO₂e/kWh (peak hours)
  Average zone intensity: 280 gCO₂e/kWh
  Recommendation: Schedule during off-peak hours (02:00-06:00 UTC)
  Estimated savings: 8.5g CO₂e/run
```

### 🗂️ Idle Namespace Cleanup (`IDLE_NAMESPACE`)

**What:** Namespaces with minimal activity that may contain forgotten resources.

**Detection Criteria:**
- Total energy below `idleNamespaceEnergyThreshold` (default: 1000 J)
- Low pod count with minimal resource usage

### 🌙 Off-Peak Scaling (`OFF_PEAK_SCALING`)

**What:** Workloads that maintain high resource allocation during off-peak hours and could benefit from scheduled scaling down.

**Detection Criteria:**
- Consistently low utilization during off-peak periods
- Workloads without existing time-based scaling policies

### 🖥️ Overprovisioned Node (`OVERPROVISIONED_NODE`)

**What:** Nodes with significantly more capacity than what the scheduled pods require.

**Detection Criteria:**
- Node resource utilization consistently below threshold
- Opportunity to consolidate workloads onto fewer, right-sized nodes

### 💤 Underutilized Node (`UNDERUTILIZED_NODE`)

**What:** Nodes running with very low utilization that are wasting energy and money.

**Detection Criteria:**
- Node utilization below `nodeUtilizationThreshold` (default: 20%)
- Running for extended periods at low usage

## Using Recommendations

### CLI

```bash
# Get all recommendations
greenkube recommend

# Filter by namespace
greenkube recommend -n production

# JSON output for automation
greenkube recommend --format json
```

### API

```bash
curl "http://localhost:8000/api/v1/recommendations?namespace=production"
```

### Dashboard

Navigate to the **Recommendations** tab in the web dashboard for a visual, filterable view of all suggestions.

## Tuning Thresholds

All thresholds are configurable via Helm values:

```yaml
config:
  recommendations:
    lookbackDays: 7
    rightsizingCpuThreshold: 0.3      # 30% usage triggers rightsizing
    rightsizingMemoryThreshold: 0.3
    rightsizingHeadroom: 1.2           # 20% safety margin
    zombieCostThreshold: 0.01         # $0.01/day minimum
    zombieEnergyThreshold: 1000       # 1000 Joules minimum
    autoscalingCvThreshold: 0.7       # High variability
    autoscalingSpikeRatio: 3.0        # 3x spike ratio
    carbonAwareThreshold: 1.5         # 1.5x average intensity
```

Adjust these based on your cluster size, workload patterns, and organizational priorities.

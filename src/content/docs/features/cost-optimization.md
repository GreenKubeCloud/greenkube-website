---
title: Cost Optimization
description: Identify zombie pods, oversized workloads, and autoscaling opportunities with estimated savings in both cost and carbon.
---

GreenKube combines **FinOps** and **GreenOps** to help teams find workload optimization opportunities. Recommendations are guidance based on collected metrics; GreenKube does not apply changes automatically.

## Smart Detection

GreenKube automatically analyzes your cluster to detect optimization opportunities:

### 🧟 Zombie Pods
Pods with cost above the configured threshold and energy consumption below the configured threshold.

### 📏 Rightsizing Opportunities
Workloads where CPU or memory requests are substantially higher than observed use. The native analyzer suggests reductions; it does not diagnose workloads for increases as a rightsizing recommendation.

### ⚖️ Autoscaling Candidates
Workloads with variable CPU usage that have no existing HPA. GreenKube suggests considering autoscaling; it does not create or configure an HPA.

### 🌍 Carbon-Aware Scheduling
Recommendations identify workloads observed during higher-carbon periods as candidates for time-shifting. GreenKube does not move or reschedule workloads.

## Savings Estimation

Where the recommendation type supports it, GreenKube annualizes projected cost and/or CO₂e savings from the observation window. These are projections, not measured results; cleanup recommendations may only include a cost estimate.

| Metric | Description |
|--------|-------------|
| **Annual cost savings** | Projected $ reduction per year |
| **Annual CO₂e savings** | Projected gCO₂e reduction per year |
| **Priority** | `high`, `medium`, or `low` |

## Recommendation Lifecycle & Savings Tracking

When you mark a recommendation as **applied** through the API, GreenKube records projected savings in its ledger. Post-apply verification can distinguish measured savings from prorated projections. The ledger drives Prometheus metrics including:

- `greenkube_co2e_savings_attributed_grams_total`
- `greenkube_cost_savings_attributed_dollars_total`

These appear in the Grafana **Impact Command Center** and on the dashboard summary.

## How to Use

### Via Dashboard
Navigate to the `/recommendations` page to see active and ignored recommendations and savings. The dashboard supports GitOps pull-request previews and creation for eligible rightsizing recommendations. Marking a recommendation applied is available through the API.

### Via API
```bash
curl "http://localhost:8000/api/v1/recommendations/active?refresh=true"
curl -X PATCH "http://localhost:8000/api/v1/recommendations/42/apply"
```

VPA and Karpenter are optional recommendation sources. Their Kubernetes CRDs are detected at runtime; absent CRDs are skipped. See the [Recommendations Guide](/guide/recommendations/) for details.

## Integration with OpenCost

GreenKube reads cost allocation data from [OpenCost](https://www.opencost.io/), including pod-level data where available. Coverage and pricing depend on OpenCost's configuration and the data it exposes.

## Related

- [Recommendations Guide](/guide/recommendations/) — Detailed usage
- [Smart Recommendations Feature](/features/smart-recommendations/) — Recommendation methods and thresholds
- [Dashboard](/features/real-time-dashboard/) — Visual recommendation overview

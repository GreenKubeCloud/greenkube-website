---
title: Cost Optimization
description: Identify zombie pods, oversized workloads, and autoscaling opportunities with estimated savings in both cost and carbon.
---

GreenKube combines **FinOps** and **GreenOps** into a single platform, helping you cut both cloud costs and carbon emissions simultaneously.

## Smart Detection

GreenKube automatically analyzes your cluster to detect optimization opportunities:

### 🧟 Zombie Pods
Pods that consume resources but do little to no actual work:
- Near-zero CPU utilization over extended periods
- No meaningful network traffic
- Running but not serving requests

### 📏 Rightsizing Opportunities
Workloads where resource requests/limits are significantly mismatched with actual usage:
- **Over-provisioned:** Requests far exceed actual usage → wasting money and energy
- **Under-provisioned:** Actual usage near or above limits → risk of OOM kills and throttling

### ⚖️ Autoscaling Candidates
Workloads that would benefit from Horizontal Pod Autoscaling (HPA):
- High variance in resource usage over time
- Periodic traffic patterns
- Currently running at fixed replica count

### 🌍 Carbon-Aware Scheduling
Suggestions to shift non-urgent workloads to times or regions with lower carbon intensity.

## Savings Estimation

Each recommendation includes an estimated annual impact:

| Metric | Description |
|--------|-------------|
| **Annual cost savings** | Projected $ reduction per year |
| **Annual CO₂e savings** | Projected gCO₂e reduction per year |
| **Priority** | `high`, `medium`, or `low` |

## Recommendation Lifecycle & Savings Tracking

Once you act on a recommendation, you can mark it as **resolved** in the dashboard or via the API. This triggers a **savings ledger entry** that attributes the projected annual savings to actual collection periods, driving Prometheus gauges:

- `greenkube_co2e_savings_attributed_grams_total`
- `greenkube_cost_savings_attributed_dollars_total`

These appear in the Grafana **Impact Command Center** and on the dashboard summary.

## How to Use

### Via Dashboard
Navigate to the `/recommendations` page to see all suggestions with status filters, per-recommendation controls (dismiss, snooze, mark in-progress/resolved), and estimated annual savings.

### Via CLI
```bash
greenkube recommend
# CI/CD gate: exit 1 if recommendations found
greenkube recommend --fail-on-recommendations
```

### Via API
```bash
GET /api/v1/recommendations/active
GET /api/v1/recommendations/savings
PATCH /api/v1/recommendations/{id}/apply
```

### Via API
```bash
curl http://localhost:8000/api/v1/recommendations
```

## Integration with OpenCost

GreenKube integrates with [OpenCost](https://www.opencost.io/) to provide accurate cost data:
- Actual cloud pricing (on-demand, spot, reserved)
- Per-pod cost allocation
- Namespace-level cost breakdown

## Related

- [Recommendations Guide](/guide/recommendations/) — Detailed usage
- [Smart Recommendations Feature](/features/smart-recommendations/) — AI analysis details
- [Dashboard](/features/real-time-dashboard/) — Visual recommendation overview

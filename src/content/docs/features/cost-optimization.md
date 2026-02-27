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

Each recommendation includes an estimated impact:

| Metric | Description |
|---|---|
| **Cost savings** | Estimated monthly $ reduction |
| **Energy savings** | Estimated kWh reduction |
| **Carbon savings** | Estimated kgCO₂e reduction |
| **Confidence** | High / Medium / Low |

## Recommendation Categories

Recommendations are grouped by priority:

- 🔴 **Critical** — Immediate action recommended (e.g., zombie pods burning significant resources)
- 🟡 **Warning** — Notable optimization opportunity (e.g., 3× over-provisioned)
- 🟢 **Info** — Minor improvement possible (e.g., slight rightsizing)

## How to Use

### Via Dashboard
Navigate to the **Recommendations** tab to see all active suggestions with inline actions.

### Via CLI
```bash
greenkube report --recommendations
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

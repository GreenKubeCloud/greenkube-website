---
title: Kubecost
description: GreenKube reads Kubecost's savings APIs (request sizing, abandoned workloads, node-group sizing) and recomputes every impact with its own Impact Model.
---

GreenKube reads Kubecost's savings APIs and turns them into signals. Kubecost's own savings figures are kept for comparison only: GreenKube recomputes every impact with its Impact Model.

## What it reads

| Kubecost | Signal |
|---|---|
| Request sizing (`/model/savings/requestSizingV2`) | Container resources proposals per container and resource, decreases and increases |
| Abandoned workloads (`/model/savings/abandonedWorkloads`) | A deletion proposal per owner workload, **review only** |
| Cluster / node-group sizing | An advisory about the cluster (`NODE_GROUP_SIZING`, high risk), only with a positive saving and only when the answer is about this cluster |

**Abandoned workloads are review-only.** Kubecost's only evidence is low network traffic. The signal says so, and GreenKube's deletion-safety rules still decide (minimum unused duration, dependency evidence). A Kubecost finding alone never deletes anything.

Kubecost 2.x and 3.x are supported; the version is probed from `/model/clusterInfo`.

## Configuration

Network access from the controller to the Kubecost API; no Kubernetes permission and no credential.

```yaml
sources:
  settings:
    kubecost:
      url: "http://kubecost-cost-analyzer.kubecost:9090"   # default probed in-cluster only
      window: "14d"                                        # default 7d
      cluster_id: "prod-eu"                                # required when Kubecost reports several clusters
```

| Key | Default | Meaning |
|---|---|---|
| `url` | `http://kubecost-cost-analyzer.kubecost.svc:9090` | Kubecost API base URL |
| `version` | probed | `"2"` or `"3"` |
| `window` | `7d` | Lookback in days |
| `algorithm_cpu`, `algorithm_ram` | `max` | `max` or `quantile` |
| `target_cpu_utilization`, `target_ram_utilization` | `0.7` | Headroom targets |
| `cluster_id` | unset | Without it, multi-cluster answers are dropped rather than guessed |
| `abandoned_workloads`, `node_group_sizing` | `true` | Turn either query off |

The source collects at most every 30 minutes, because savings queries are heavy for Kubecost.

## Licensing

Kubecost's free tier is limited in cluster spend; beyond it, the savings APIs need a Kubecost license. GreenKube does not check your license: an endpoint that answers an error is reported in the run's diagnostics.

## Limitations

- Bare pods (no controller) are skipped: they cannot become pull requests.
- Node-group sizing is advisory only: GreenKube does not change node groups.

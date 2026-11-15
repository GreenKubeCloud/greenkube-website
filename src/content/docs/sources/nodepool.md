---
title: Karpenter & NodePools
description: GreenKube reads Karpenter NodePools and the Cluster Autoscaler to estimate how much released capacity becomes removed nodes, and to advise on NodePool policies.
---

GreenKube reads the cluster's autoscalers for two purposes: to estimate how much released capacity really becomes removed nodes (the **realization factor**), and to advise on Karpenter NodePool policies.

## Realization context

The controller reads, read-only:

- the Cluster Autoscaler status ConfigMap `kube-system/cluster-autoscaler-status`;
- Karpenter NodePools (consolidation policy, disruption budgets) and NodeClaims;
- Karpenter `DisruptionBlocked` and `Unconsolidatable` events;
- `do-not-disrupt` / `safe-to-evict` annotations and blocking PodDisruptionBudgets;
- with Prometheus, Karpenter's consolidation metrics (decisions, eligible nodes, pool cost).

These feed the per-pool [realization factor](/methodology/impact-model/#realization-factor). Inputs that cannot be read are reported as such, never as "no blocker".

## NodePool advice

Besides a consolidation recommendation for under-utilized pools, the source emits **policy signals**. They are high risk and advisory only: no pull request until GreenKube supports NodePool changes. Each carries a suggested patch.

| Kind | When | Suggested patch |
|---|---|---|
| `NODEPOOL_CONSOLIDATION_POLICY` | `consolidationPolicy: WhenEmpty` | `WhenEmptyOrUnderutilized` |
| `NODEPOOL_CONSOLIDATE_AFTER` | `consolidateAfter` above 1 hour, or `Never` | `5m` |
| `NODEPOOL_CAPACITY_TYPE` | Only `on-demand` capacity and every observed workload on the pool is stateless | Allow `spot` |
| `NODEPOOL_ARCHITECTURE` | Only `amd64` | Allow `arm64`, only if every image on the pool is multi-arch (which GreenKube cannot verify) |

Policy signals are emitted by cluster-wide scans only.

## Permissions and configuration

`get`/`list` on `karpenter.sh` NodePools and NodeClaims, and `list` on core `events`, all in the chart's ClusterRole.

```yaml
sources:
  settings:
    greenkube.nodepool: { enabled: auto }   # auto: run when the Karpenter CRDs exist
impact:
  autoscalerHint: ""        # none, cluster_autoscaler or karpenter, when detection cannot see it
  # realizationFactor: 0.5  # pin the factor for every projection
```

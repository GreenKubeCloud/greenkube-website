---
title: Karpenter & Cluster Autoscaler
description: GreenKube reads Karpenter and the Cluster Autoscaler, read only, to estimate how much released capacity becomes removed nodes. They never produce recommendations.
---

Karpenter and the Cluster Autoscaler are **not recommendation sources**. GreenKube reads them only to estimate how much released capacity really becomes removed nodes: the **realization factor**. The Karpenter NodePool heuristic (`greenkube.nodepool`) and its NodePool policy advice were removed in this release.

## Realization context

The controller reads, read only:

- the Cluster Autoscaler status ConfigMap `kube-system/cluster-autoscaler-status`;
- Karpenter NodePools (consolidation policy, disruption budgets) and NodeClaims (claim → pool);
- Karpenter `DisruptionBlocked` events (a blocker: the pool's factor is halved) and `Unconsolidatable` events (reported, factor unchanged);
- `do-not-disrupt` / `safe-to-evict` annotations and blocking PodDisruptionBudgets;
- with Prometheus, Karpenter's consolidation metrics (decisions, eligible nodes, pool cost). Metrics that are not exported change nothing.

These feed the per-pool [realization factor](/methodology/impact-model/#realization-factor). Events that cannot be read (RBAC) are reported as "Karpenter events could not be read", never as "no blocker". HPA reads stay too: they feed the rightsizing evidence and the risk model.

## Permissions

`get`/`list` on `karpenter.sh` NodePools and NodeClaims, and `list` on core `events`, all in the chart's ClusterRole.

## Configuration

```yaml
impact:
  autoscalerHint: ""        # none, cluster_autoscaler or karpenter, when detection cannot see it
  # realizationFactor: 0.5  # pin the factor for every projection
```

`config.recommendations.karpenterEnabled` and `sources.settings["greenkube.nodepool"]` are accepted and ignored since this release; the chart's install notes name them ([Upgrading](/operations/upgrading/#removed-advisory-analyzers)).

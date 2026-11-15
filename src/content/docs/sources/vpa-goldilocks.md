---
title: VPA & Goldilocks
description: GreenKube reads VerticalPodAutoscalers in recommendation mode, including the ones Goldilocks creates, and counts them as one engine in consensus.
---

The `vpa` source reads VerticalPodAutoscalers in recommendation mode (`updateMode: Off`). [Goldilocks](https://github.com/FairwindsOps/goldilocks) creates exactly such VPAs, so GreenKube reads them in the same pass and labels their advice `goldilocks`.

## What it reads

- VPAs of every namespace (`autoscaling.k8s.io/v1`): their `targetRef` and `status.recommendation.containerRecommendations[]` (`target`, `lowerBound`, `upperBound`, `uncappedTarget`).
- VPAs in `Auto`, `Recreate`, `Initial` or other active modes are skipped and counted (diagnostic `skipped_vpas`): GreenKube does not compete with a VPA that already acts.
- Namespaces labelled `goldilocks.fairwinds.com/enabled=true`, for diagnostics only.

## Signals

- One signal per VPA object, container and resource (`RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`), increases included.
- VPAs labelled `creator=Fairwinds` and `source=goldilocks` produce signals with source `goldilocks`, every other VPA with source `vpa`.
- Both carry **engine family `vpa`**: a Goldilocks VPA and a user VPA on the same container are two signals of the same engine, and consensus counts them as **one vote**. Both stay listed as supporting sources.
- A target at 90% or more of its `upperBound` is flagged as volatile in the evidence, which informs risk.

## Diagnostics

| Code | Meaning |
|---|---|
| `skipped_vpas` | VPAs not in recommendation mode, by `updateMode` |
| `goldilocks_vpas` | VPAs created by Goldilocks |
| `goldilocks_namespaces` | Namespaces opted into Goldilocks |
| `goldilocks_namespace_without_vpas` (warning) | Opted-in namespaces without any Goldilocks VPA in recommendation mode: check that the Goldilocks controller runs |

## Permissions and configuration

The chart's ClusterRole already grants `get`/`list` on `verticalpodautoscalers` and namespaces. Nothing to configure for Goldilocks.

```yaml
sources:
  settings:
    vpa: { enabled: auto }   # true, false or auto (run when the VPA CRD exists)
```

There is no separate switch for Goldilocks: it is the same connector.

## Limitations

- Goldilocks' QoS presets are not read: GreenKube uses the VPA `target`, as Goldilocks' "Burstable" view does.
- Namespace opt-in labels are read for diagnostics only; Goldilocks VPAs are used wherever they are.

---
title: VPA & Goldilocks
description: GreenKube reads mature VerticalPodAutoscalers in recommendation mode, including the ones Goldilocks creates, as one corroborating vote. VPA alone never creates a recommendation.
---

The `vpa` source reads VerticalPodAutoscalers in recommendation mode (`updateMode: Off`). [Goldilocks](https://github.com/FairwindsOps/goldilocks) creates exactly such VPAs, so GreenKube reads them in the same pass and labels their advice `goldilocks`.

**VPA alone never creates a recommendation.** GreenKube's measured value decides the size; a VPA raises the confidence when it agrees and lowers it when it disagrees. A container without a native GreenKube proposal keeps the VPA advice as a signal on the Sources page.

## What it reads

- VPAs of every namespace (`autoscaling.k8s.io/v1`): their `targetRef`, `status.conditions` and `status.recommendation.containerRecommendations[]` (`target`, `lowerBound`, `upperBound`, `uncappedTarget`), and their `VerticalPodAutoscalerCheckpoint` sample history.
- VPAs in `Auto`, `Recreate`, `Initial` or other active modes are skipped and counted (diagnostic `skipped_vpas`): GreenKube does not compete with a VPA that already acts.
- Namespaces labelled `goldilocks.fairwinds.com/enabled=true`, for diagnostics only.

## Signals

- One signal per VPA object, container and resource (`RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`), increases included.
- VPAs labelled `creator=Fairwinds` and `source=goldilocks` produce signals with source `goldilocks`, every other VPA with source `vpa`.
- Both carry **engine family `vpa`**: a Goldilocks VPA and a user VPA on the same container are two signals of the same engine, and consensus counts them as **one vote**. Both stay listed as supporting sources.
- A target at 90% or more of its `upperBound` is flagged as volatile in the evidence, which informs risk.

## Maturity

Minutes after a VPA is created, its recommender has a few samples and very wide bounds, yet its `target` looks like normal advice. GreenKube ignores a VPA until it is mature:

- `LowConfidence=True` or `RecommendationProvided=False`: not mature;
- otherwise the checkpoint's sample history must cover `sources.vpa.minSampleHours` (24 by default; `0` turns the check off).

An immature VPA yields no signal (diagnostic `immature_vpas`). When the checkpoints cannot be read, maturity is unknown (warning `vpa_maturity_unknown`): the VPA still votes, but a decrease it proposes never corroborates a decrease.

## Floors and small changes

The VPA recommender never proposes less than its per-pod minimum (15m and 100 MiB with the Fairwinds `vpa` chart), split between the pod's containers. A target on that floor says "the floor", not "the need", so it is **not counted as a vote**. A target that changes the current request by less than `sources.minChange` (5 % and 10m CPU or 16 MiB) votes to keep the current request. Both are listed in `consensus.ignored_votes`. A VPA target never lowers a memory increase GreenKube proposes after OOM kills ([OOM floor](/concepts/recommendations/#oom-floor)).

## Diagnostics

| Code | Meaning |
|---|---|
| `skipped_vpas` | VPAs not in recommendation mode, by `updateMode` |
| `immature_vpas` | VPAs ignored until mature |
| `vpa_maturity_unknown` (warning) | VPAs whose checkpoint could not be read: they still vote |
| `goldilocks_vpas` | VPAs created by Goldilocks |
| `goldilocks_namespaces` | Namespaces opted into Goldilocks |
| `goldilocks_namespace_without_vpas` (warning) | Opted-in namespaces without any Goldilocks VPA in recommendation mode: check that the Goldilocks controller runs |

## Permissions and configuration

The chart's ClusterRole already grants `get`/`list` on `verticalpodautoscalers`, `verticalpodautoscalercheckpoints` and namespaces. Nothing to configure for Goldilocks.

```yaml
sources:
  settings:
    vpa: { enabled: auto }   # true, false or auto (run when the VPA CRD exists)
  vpa:
    minSampleHours: 24       # hours of samples before a VPA votes
  toolFloors:
    vpa: { cpu: 15m, memory: 100Mi }   # set to your recommender's flags
```

There is no separate switch for Goldilocks: it is the same connector.

## Limitations

- Goldilocks' QoS presets are not read: GreenKube uses the VPA `target`, as Goldilocks' "Burstable" view does.
- Namespace opt-in labels are read for diagnostics only; Goldilocks VPAs are used wherever they are.

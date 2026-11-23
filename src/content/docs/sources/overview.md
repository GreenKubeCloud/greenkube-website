---
title: Sources Overview
description: Where GreenKube's recommendations come from - its own measurements, corroborated by VPA, Goldilocks, Robusta KRR and pushed signals - and how sources run.
---

GreenKube's own measurements decide every recommendation. Other tools corroborate them: every source, native or third-party, implements the same contract and emits **signals** in one public schema, and the consensus engine builds one recommendation per target from them ([Consensus across sources](/concepts/recommendations/#consensus-across-sources)).

**GreenKube's measured value decides; VPA, KRR and pushed signals adjust the confidence; a source alone never creates a recommendation.**

## Available sources

| Source | Kind | What it contributes | How it is enabled |
|---|---|---|---|
| GreenKube analyzers (`greenkube.rightsizing_cpu`, `greenkube.rightsizing_memory`, `greenkube.orphaned_pv`, `greenkube.orphaned_lb`) | native | Two-way CPU and memory rightsizing from measured usage; orphaned PersistentVolumes and LoadBalancers | On by default; each can be disabled |
| [VPA and Goldilocks](/sources/vpa-goldilocks/) (`vpa`, `goldilocks`) | open source | Container requests from mature VPAs in recommendation mode, including those Goldilocks creates | Automatic when the VPA CRD exists |
| [Robusta KRR](/sources/krr/) (`krr`) | open source | Container requests from KRR JSON reports you push | Run KRR yourself (CI or your own CronJob) and push its report |
| [Push API](/sources/push/) (`push:<client>`) | custom | Anything your tools produce, in the public signal schema | A `signals:write` API key |

Any other tool sends its advice through the push API. Third-party advice never reaches a pull request without going through consensus and risk review: a plugin or connector cannot create a recommendation on its own (fail closed). GreenKube's Impact Model computes every savings figure shown; a source's own estimate is kept for comparison only.

Karpenter, the Cluster Autoscaler and HPAs are read for the [realization factor](/methodology/impact-model/#realization-factor) and the rightsizing evidence, not as sources.

<details>
<summary>Removed in 0.4.0</summary>

The Kubecost, GKE recommender, Azure Advisor, Polaris and Karpenter NodePool connectors, the chart's KRR and Polaris CronJobs, the native advisory analyzers and every consensus policy other than "GreenKube's measured value decides" are gone. Their settings no longer exist: leftover values are ignored, so remove them (a leftover `sources.settings` entry is reported as `unknown_source` by `GET /api/v1/sources`). `POST /api/v1/sources/polaris/reports` answers `404`. Push the advice of those tools to `POST /api/v1/signals` instead. See [Upgrading](/operations/upgrading/#removed-connectors-and-consensus-policies).

</details>

## Signals

| Term | Meaning |
|---|---|
| **Signal** | One source's proposal for one target and one capability |
| **Target** | The cluster-qualified object a signal is about (`cluster/group.Kind/namespace/name[/container]`) |
| **Capability** | The optimization domain, for example `container_requests`, `container_limits`, `cleanup` |
| **Proposal** | The typed change, for example `container_resources` or `deletion`; `advisory` is never a pull request |
| **Engine family** | Set when several sources relay one engine (Goldilocks and VPA): consensus counts one vote per engine |

The public schemas are [`signal.v1alpha1.json`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal.v1alpha1.json) and [`signal-batch.v1alpha1.json`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal-batch.v1alpha1.json).

## How sources run

Scans run in the leader controller. For each enabled source, the runner probes it (`unavailable` is not a failure), collects within a timeout, validates the batch (wrong source id, undeclared capability, a resource signal without a resource value, oversized payloads), and records the run and its signals. A source that keeps failing has its circuit opened for a cool-down, and its last known advice is kept. Only a complete, successful run can resolve earlier advice of that source.

The **Sources** page of the UI (and `GET /api/v1/sources`) shows every source with its status (`healthy`, `degraded`, `failing`, `unavailable`, `disabled`, `misconfigured`, `pending`, `unregistered`), last run, signal and recommendation counts, and its **measured track record**. Advice that never became a recommendation (no native measurement of the target) stays visible there as signals.

## Configuration

```yaml
sources:
  pluginsEnabled: true          # load third-party sources installed in the image
  settings:                     # keyed by source id
    greenkube.orphaned_lb: { enabled: false }
    vpa: { enabled: auto }      # auto: run when the VPA CRD exists
    push: { max_age_hours: 72 }
```

`enabled` is `true`, `false` or `auto`. An invalid entry disables that source only and is reported. Never put credentials in these settings: they live in a ConfigMap. `sources.toolFloors`, `sources.minChange` and `sources.vpa.minSampleHours` decide which external proposals count as votes ([Configuration](/getting-started/configuration/#sources)).

## Writing your own source

A Python package can add a source through the `greenkube.sources` entry point group: a `Source` subclass with `discover()`, `health()` and `collect()` that returns signals. Sources are read-only, report partial results honestly (`complete=False`), and pass a contract test suite (`greenkube.signals.testing.check_source_contract`). See [docs/sources.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/sources.md) and the [example package](https://github.com/GreenKubeCloud/GreenKube/tree/main/examples/greenkube-source-example). If you only need to send advice, the [Push API](/sources/push/) needs no code in GreenKube.

---
title: Sources Overview
description: GreenKube is a neutral aggregator. Every source of optimization advice, native or third-party, emits signals in one schema; consensus turns them into recommendations.
---

GreenKube is a **neutral aggregator**: its own analyzers are one source of advice among others. Every source, native or third-party, implements the same contract and emits **signals** in one public schema. The consensus engine then builds one recommendation per target from the signals of every source ([Recommendations](/concepts/recommendations/#consensus-across-sources)).

## Available sources

| Source | Kind | What it contributes | How it is enabled |
|---|---|---|---|
| GreenKube analyzers (`greenkube.*`) | native | Two-way CPU and memory rightsizing, zombie workloads, autoscaling and off-peak candidates, idle namespaces, carbon-aware scheduling, node utilization, orphaned PersistentVolumes and LoadBalancers | On by default; each can be disabled |
| [VPA and Goldilocks](/sources/vpa-goldilocks/) (`vpa`, `goldilocks`) | open source | Container requests from VPAs in recommendation mode, including those Goldilocks creates | Automatic when the VPA CRD exists |
| [Robusta KRR](/sources/krr/) (`krr`) | open source | Container requests from KRR JSON reports | Push a report, or enable the CronJob |
| [Kubecost](/sources/kubecost/) (`kubecost`) | commercial | Request sizing, abandoned workloads, node-group sizing | Automatic when the Kubecost API answers in-cluster, or set its URL |
| [Fairwinds Polaris](/sources/polaris/) (`polaris`) | open source | Hygiene findings, plus requests computed from usage when they are missing | Push an audit, or enable the CronJob |
| [GKE recommender](/sources/gke/) (`gke`) | cloud | Over- and under-provisioned workload insights | Automatic on GKE with Workload Identity |
| [Azure Advisor](/sources/azure-advisor/) (`azure_advisor`) | cloud | Cluster-level AKS advice (advisory) | Subscription, cluster name and Workload Identity |
| [Karpenter and NodePools](/sources/nodepool/) (`greenkube.nodepool`) | native | NodePool consolidation and policy advice, realization context | Automatic when the Karpenter CRDs exist |
| [Push API](/sources/push/) (`push:<client>`) | custom | Anything your tools produce, in the public signal schema | A `signals:write` API key |

Third-party advice never reaches a pull request without going through consensus and risk review: a plugin or connector cannot create a recommendation on its own (fail closed). GreenKube's Impact Model computes every savings figure shown; a source's own estimate is kept for comparison only.

## Signals

| Term | Meaning |
|---|---|
| **Signal** | One source's proposal for one target and one capability |
| **Target** | The cluster-qualified object a signal is about (`cluster/group.Kind/namespace/name[/container]`) |
| **Capability** | `container_requests`, `container_limits`, `replicas`, `horizontal_autoscaling`, `schedule`, `cleanup`, `node_pool`, `placement`, `hygiene` |
| **Proposal** | `container_resources`, `replicas`, `hpa`, `schedule`, `deletion`, `node_pool`, or `advisory` (never a pull request) |
| **Engine family** | Set when several sources relay one engine (Goldilocks and VPA): consensus counts one vote per engine |

The public schemas are [`signal.v1alpha1.json`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal.v1alpha1.json) and [`signal-batch.v1alpha1.json`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal-batch.v1alpha1.json).

## How sources run

Scans run in the leader controller. For each enabled source, the runner probes it (`unavailable` is not a failure), collects within a timeout, validates the batch (wrong source id, undeclared capability, oversized payloads), and records the run and its signals. A source that keeps failing has its circuit opened for a cool-down, and its last known advice is kept. Only a complete, successful run can resolve earlier advice of that source.

The **Sources** page of the UI (and `GET /api/v1/sources`) shows every source with its status (`healthy`, `degraded`, `failing`, `unavailable`, `disabled`, `misconfigured`, `pending`), last run, signal and recommendation counts, and its **measured track record** (for example "14/16 realized").

## Configuration

```yaml
sources:
  pluginsEnabled: true          # load third-party sources installed in the image
  settings:                     # keyed by source id
    greenkube.carbon_aware: { enabled: false }
    vpa: { enabled: auto }      # auto: run when the VPA CRD exists
```

`enabled` is `true`, `false` or `auto`. An invalid entry disables that source only and is reported. Never put credentials in these settings: they live in a ConfigMap.

## Writing your own source

A Python package can add a source through the `greenkube.sources` entry point group: a `Source` subclass with `discover()`, `health()` and `collect()` that returns signals. Sources are read-only, report partial results honestly (`complete=False`), and pass a contract test suite (`greenkube.signals.testing.check_source_contract`). See [docs/sources.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/sources.md) and the [example package](https://github.com/GreenKubeCloud/GreenKube/tree/main/examples/greenkube-source-example). If you only need to send advice, the [Push API](/sources/push/) needs no code in GreenKube.

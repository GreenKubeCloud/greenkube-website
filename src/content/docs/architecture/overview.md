---
title: Architecture
description: GreenKube's components and process topology - a stateless API, one leader controller that runs every loop, an isolated renderer, and PostgreSQL.
---

GreenKube has four parts:

- **Measurement layer**: collectors and storage. It produces per-workload usage, cost, energy and CO₂e, which feed both the recommendation evidence and the before/after comparison used for measurement.
- **Optimization engine**: sources, analyzers, consensus (GreenKube's measured value decides, the other sources move the confidence), evidence and ranking.
- **GitOps delivery**: discovery, bindings, plans, the renderer sandbox, plan execution, and sync.
- **Measurement and savings ledger**: apply detection, change measurement, the drift monitor and the keyed, hash-chained ledger.

## Inputs

| Input | Used for |
|---|---|
| Prometheus (cAdvisor, kube-state-metrics) | Usage, requests, restarts, readiness, throttling, load drivers |
| Metrics Server | Per-container usage |
| Kubernetes API | Pods, nodes, workloads, Services, volumes, autoscalers (read-only RBAC; never Secrets) |
| OpenCost | Observed per-pod and per-asset cost allocation; without it, bundled price catalogs (AWS, Azure, OVHcloud, Scaleway) or your custom rates |
| Electricity Maps or Wattnet | Grid carbon intensity per zone |
| Boavizta | Embodied emissions per instance type |
| NVIDIA DCGM exporter (through Prometheus, optional) | Measured GPU board power and utilization |
| Argo CD and Flux | Workload bindings and sync status |
| Recommendation sources | VPA (with Goldilocks provenance), Robusta KRR reports and the push API, next to GreenKube's own analyzers |
| Karpenter, Cluster Autoscaler, HPA | Realization factor and rightsizing evidence (read only; they never produce recommendations) |
| GitHub, GitLab, Gitea | Repository snapshots, pull requests, merge events |

## Process topology

One rule: **the API handles requests, the controller runs every loop.**

```text
 Browser / CI / Prometheus ─┐
 Git provider webhooks ─────┴─► api (N replicas, no background loop) ──┐
                                                                       ├──► PostgreSQL
 controller (1 leader + hot standbys, Kubernetes Lease) ───────────────┘
   ├─ collection · carbon-intensity · node-analysis
   ├─ recommendation-scan · recommendation-lifecycle (apply detection, measurement)
   ├─ savings-attribution · savings-drift · ledger-chain · metrics-compression
   ├─ gitops-discovery · gitops-sync · automation readiness
   └─ automation-controller · plan-executor ──► renderer (isolated) ──► GitHub / GitLab / Gitea
```

| Process | Runs | Scaling |
|---|---|---|
| `api` | REST API, UI, webhook ingress (into a durable outbox), authentication, plan previews and approvals. No periodic job. | Any number of replicas |
| `controller` | Every periodic loop, declared once in a loop registry. Leader-only loops run on the Lease holder; standbys take over within the Lease duration. Migrates the database at startup. | One leader plus optional hot standbys |
| `worker` (optional) | Claims and executes queued plan operations, nothing else | Any number of replicas |
| `renderer` | Isolated Helm and Kustomize rendering: no Secret, no service-account token, egress denied | Independent |
| PostgreSQL | All state; the only database of a Helm install (bundled StatefulSet or external). SQLite remains for `greenkube demo` and local development | — |

Each loop has its own task: an exception or a timeout fails only that tick, and a failing loop backs off. The controller serves `/healthz`, `/readyz` (every loop alive with a fresh heartbeat) and `/loops`, and writes a heartbeat to the database every 30 seconds so that the API can report the loop state.

## Data flow

1. **Collection.** Every Prometheus step (5 minutes by default), the collection loop reads usage and requests for the window that just closed, resolves pod and node attributes from the snapshot history valid at the sample time, and allocates cost, energy and CO₂e with the [Impact Model](/methodology/impact-model/). Windows are watermarked: a controller back from an outage catches up within the backfill horizon. Raw rows are compressed into hourly aggregates.
2. **Recommendation scan.** Every hour by default, the leader runs every enabled source, validates and stores their signals, builds recommendations by consensus, projects their impact, and computes risk, confidence, expected value and eligibility.
3. **Delivery.** On approval, the plan executor snapshots the repository, renders the change in the sandbox, commits it and opens the pull request. PR polling or signed webhooks follow the merge; the sync loop follows Argo CD or Flux.
4. **Lifecycle.** Apply detection records live changes with their baseline snapshot; measurements are decided at the end of their post-window; savings are attributed hourly to the ledger; the drift monitor watches realized changes; the ledger chain is verified every hour.

## Principles in the code

- **Git is the only write path.** No component writes workloads to the cluster.
- **Fail closed.** Evidence is never frozen from a failed read; a gate whose input cannot be read is `not_available`, never a pass; unsupported GitOps layouts are refused with a typed reason.
- **Same model for estimate and measurement.** Projections and stored rows come from one versioned Impact Model.
- **Append-only accounting.** Ledger rows are never updated or deleted, and their chain is verified; with the chain key (`LEDGER_CHAIN_KEY`) a database writer without the key cannot re-chain them.

The detailed architecture document is [docs/architecture.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/architecture.md).

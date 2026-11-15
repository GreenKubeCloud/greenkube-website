---
title: The Optimization Loop
description: The GreenKube loop from source signals to the savings ledger, and the vocabulary used across the documentation, the API and the UI.
---

GreenKube is an optimization control loop for Kubernetes clusters managed with GitOps. It **aggregates** recommendations from several sources, **decides** which ones are worth doing, **delivers** them as pull requests, **proves** that the change reached the cluster and what it saved, and keeps a **ledger** of the outcome.

```text
 Sources ─► Signals ─► Recommendation ─► Plan (diff + digest) ─► Pull request
                                                                     │ merge
 Ledger ◄── Measurement ◄── Change (apply detection) ◄── Sync (Argo CD / Flux)
```

## The loop at a glance

| Stage | Question it answers | Read more |
|---|---|---|
| Aggregate | What do my tools recommend, for which workloads? | [Sources](/sources/overview/) |
| Decide | Which changes are worth it, and how risky are they? | [Recommendations](/concepts/recommendations/) |
| Deliver | Where does this workload live in Git, and what exactly changes? | [GitOps delivery](/concepts/gitops-delivery/) |
| Prove | Did the merge reach the cluster? Is the new configuration live? What did it save? | [Measurements and ledger](/concepts/measurements-and-ledger/) |
| Ledger | What have we saved so far, measured versus projected? | [Measurements and ledger](/concepts/measurements-and-ledger/#the-savings-ledger) |

## Vocabulary

| Term | Meaning |
|---|---|
| **Source** | Something that produces optimization advice: one of GreenKube's native analyzers, VPA, Goldilocks, KRR, Kubecost, Polaris, the GKE recommender, Azure Advisor, the Karpenter NodePool heuristic, or any tool using the push API. Each source is a plugin with its own health and run history. |
| **Signal** | One source's proposal for one target and one capability (for example "container `web` of `shop/api`: CPU request 500m → 250m"), in one public schema. Signals are not recommendations. |
| **Recommendation** | One proposed change on one target, built by the consensus engine from the signals of every source. It carries evidence, a projected impact, a risk level, a confidence score, an expected value and its delivery eligibility. |
| **Binding** | Where a workload is defined in Git (repository, ref, path, renderer), found by reading Argo CD Applications and Flux Kustomizations or HelmReleases. |
| **Plan** | A validated set of file edits implementing one or more recommendations on one binding, identified by a digest. Approval binds to that digest. |
| **Pull request** | The plan committed on a deterministic branch and opened on GitHub, GitLab or Gitea, with the evidence a reviewer needs. |
| **Sync** | Argo CD or Flux reporting the merged revision as applied and healthy. |
| **Change** | One pod-template revision rolled out on one workload, recorded by apply detection with a frozen baseline snapshot of the 7 days before the merge. |
| **Measurement** | The decision on a change after its post-window: counterfactual minus actual, with a 90% confidence interval, confounder checks and health gates. Outcome `realized`, `not_realized`, `inconclusive` or `contaminated`. |
| **Ledger** | The append-only, hash-chained record of every amount saved, per hour, method and quantity, linked to the pull request, merge commit, synced revision and measurement. |
| **Released capacity** | CPU cores and memory freed by a change, projected and measured, in their own units. Never converted to money. |

## Projected, measured, realized

GreenKube distinguishes several kinds of savings figures and **never adds them together**:

| Kind | Meaning |
|---|---|
| **Projected** | The expected annual impact of a recommendation, computed by the versioned [Impact Model](/methodology/impact-model/) before the change. |
| **Measured allocated** | What the changed workload stops being charged, measured after the change against a counterfactual. |
| **Expected billed** | The measured allocated saving times the realization factor: the share expected to reach the bill once nodes are removed. Labelled as an expectation. |
| **Realized (billed)** | Savings measured on the bill at node-pool level. On the roadmap: no such figure is produced yet, and the word "Realized" is reserved for it in the UI. |
| **User declared** | Savings declared on a manual apply. Never counted as measured. |

## Where things run

| Process | Responsibilities |
|---|---|
| **Controller** (`greenkube start`) | Every periodic loop: collection, carbon intensity, compression, recommendation scans, GitOps discovery, sync observation, apply detection, measurement, savings attribution, ledger verification, plan execution. Leader election in production. |
| **API** (`greenkube-api`) | Stateless: REST API and dashboard, plan preview and approval, webhook ingress. Runs no background loop, so it scales horizontally. |
| **Renderer sandbox** | Renders Kustomize and Helm snapshots with no access to the database, provider tokens or service-account token. |
| **Automation worker** (optional) | Executes approved plan operations only, as extra capacity next to the controller. |

See [Architecture](/architecture/overview/) for the components and data flow.

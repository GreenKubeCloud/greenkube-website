---
title: GitOps Delivery
description: How GreenKube finds a workload in Git through Argo CD or Flux, renders and approves a plan by digest, opens the pull request, follows the sync and detects that the change is live.
---

**Git is the only write path.** GreenKube never mutates a workload in the cluster: no admission webhook, no in-place patch, no `ignoreDifferences`. A change reaches the cluster through a pull request your team reviews, merged by a person, and synced by your own Argo CD or Flux.

## Binding: where does this workload live in Git?

GreenKube reads Argo CD Applications and Flux Kustomizations and HelmReleases to find where each workload is defined. It needs no workload annotation. The result is a **binding**: the repository, ref and path, the controller (`argocd`, `flux_kustomization`, `flux_helm_release`) and the renderer (`raw`, `kustomize`, `helm_values`, `helm_release`). A binding is `resolved`, `ambiguous` (an operator can pick one candidate), `unresolved`, `blocked` or `stale`.

### Supported layouts

| Source | Supported |
|---|---|
| Argo CD raw YAML | Yes |
| Argo CD Kustomize | Yes, the overlay is render-validated |
| Argo CD Helm with a local chart and Git-managed values files | Yes |
| Argo CD multi-source Helm: remote chart (Helm repository or OCI registry) + `$values` Git source | Yes, the deployed chart version is pre-fetched, digest-verified and rendered offline |
| Flux Kustomization (raw or Kustomize) | Yes, rendered as Flux builds it (`targetNamespace`, `namePrefix`, `nameSuffix`) |
| Flux HelmRelease with a local chart, a Git-backed HelmChart, a HelmRepository (HTTP or OCI) or an OCIRepository | Yes, through a managed post-renderer patch written to the Git-owned HelmRelease |
| Argo CD inline `valuesObject` / `parameters`, charts in another repository, remote charts without Git-managed values, runtime-only or cross-repository Flux `valuesFrom` | No: fails closed with a typed reason |
| Applications deploying to another cluster | No: GreenKube only changes the cluster it runs in |

## Plan: the exact diff, approved by digest

A **plan** is a validated set of file edits for one or more recommendations on one binding:

1. GreenKube takes a snapshot of the repository at an exact commit.
2. It renders the change in an isolated sandbox for Kustomize and Helm (no database, no tokens, no service-account token, egress denied).
3. It checks that only the intended fields change.
4. It returns a diff identified by a **digest**.

Approval binds to that digest, so the reviewed change is exactly the committed change. Policy gates run before a plan is created and again before it is approved: risk and confidence thresholds, evidence coverage, open pull request budget, cooldown, change freeze labels and windows, rollout state, HPA and PDB interactions. When live evidence for a gate is missing, the default is to fail closed (`missingEvidence: fail`).

### What can become a pull request

| Action | What it changes |
|---|---|
| Container resources | CPU and memory requests (decreases and reliability increases) and limits (set, raise, remove the CPU limit) of named containers, native sidecars and init containers of Deployments, StatefulSets, DaemonSets, Jobs, CronJobs, Argo Rollouts and more |
| Resource deletion | Removes an orphaned LoadBalancer Service or PersistentVolume from Git (raw and Kustomize), after the full orphan check runs again against the live cluster |

Other recommendation types (replicas, HPAs, off-peak schedules, NodePool changes, zombie workloads, idle namespaces) are advisory and show "Manual change required".

## Pull request

A durable, idempotent worker creates a deterministic branch, makes one atomic commit and opens the pull request on **GitHub** (token or GitHub App with signed commits), **GitLab** or **Gitea**. The pull request carries the evidence, projected impact, released capacity, risk, rendered diff and what will be verified after the merge. Labels (`greenkube`, `optimization/<capability>`, `risk/<level>`), CODEOWNERS reviewers, drafts for high-risk plans and a `greenkube/validation` commit status are configurable.

### Delivery modes

| Mode | What happens | Credentials in the cluster |
|---|---|---|
| `direct` (default) | GreenKube commits on `greenkube/plan/<hash>` and opens the PR | Read and write |
| `patch` | The approved plan downloads as a `git format-patch`; you push and open the PR | Read only |
| `ci` | Your CI lists approved plans, applies each patch with its own token, opens the PR and reports it | Read only |

### Auto-approval

Off by default. When enabled, eligible previews are approved in the same request (the change is still a pull request reviewed in Git). Contested consensus is never auto-approved, increases are only auto-approved when you allow it, and a decrease also needs GreenKube's own usage evidence or at least two independent agreeing sources.

### Pause delivery

`automation.policy.pauseDelivery: true` is the one switch that stops pull requests. Discovery, previews and measurement keep running.

## Sync and apply detection

After the merge (seen by signed webhook or by polling), GreenKube watches the Argo CD or Flux object that owns the workload and waits until it reports the merged revision (or a later commit containing it) and a healthy state. A plan that does not sync within `automation.syncTimeoutSeconds` becomes `sync_failed`.

Before the pull request is opened, GreenKube freezes a **pre-apply baseline**: workload UID, generation and per-container requests. A change counts as applied only when the live workload moved past that baseline **and** its per-container requests match the proposed values. Only then is the change recorded and its measurement started.

```text
draft → validated → approved → applying → pr_open → merged → synced → applied
```

## Rollback

A rollback is a pull request too. GreenKube previews it from the original plan, restores only the files that still match its output, and runs it through the same digest approval. The recommendation becomes `reverted` once the rollback is synced and the original requests are observed again. A deletion has no automated rollback: a revert recreates the manifest, not the data or the address.

## Without GitOps: manual mode

Clusters without GitOps, or resources outside it, use **Apply manually** on the recommendation page. GreenKube shows the `kubectl` steps (a patch built from the same primitives a pull request would write, with a server-side dry run), the diff and notes. **Mark as applied** records the change, which is then measured like a merged pull request. For a deletion it is marked applied only once the cluster confirms the resource is absent. GreenKube never runs these commands itself.

## Security model

| Risk | Control |
|---|---|
| Unauthorized repository change | Per-provider allowlists, server-side binding resolution, digest-bound approval |
| Credential exposure | Secret references only; tokens bound to their host; no credentials in ConfigMaps, logs, plan responses or the browser |
| Renderer compromise | Separate pod without database or provider Secrets or service-account token; read-only root filesystem; egress denied |
| Malicious Helm or Kustomize templates | Pinned binaries, scrubbed environment, timeouts, output limits, no cluster credentials |
| Webhook spoofing | Provider-native signature verification, deduplication, provider-state re-fetch |
| Duplicate pull requests | Deterministic plans, durable operation ids, database-backed leases |

The full reference is [docs/automation.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/automation.md) in the repository.

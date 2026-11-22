---
title: Push API
description: Any tool, script or vendor can contribute advice to GreenKube by pushing signals over HTTP in the public signal schema.
---

Any tool, script or vendor can contribute advice to GreenKube by pushing signals over HTTP. This is GreenKube's neutral aggregator protocol.

## The batch

`POST /api/v1/signals` takes a batch in the public schema [`signal-batch.v1alpha1`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal-batch.v1alpha1.json):

| Field | Meaning |
|---|---|
| `source_id` | `push:<client>`, for example `push:ci` or `push:acme-optimizer` |
| `complete` | Required. `true`: the batch is the client's full current advice and replaces everything it pushed before. `false`: adds or refreshes signals and keeps the others. |
| `signals` | At most 5,000 signals in the [`signal.v1alpha1`](https://github.com/GreenKubeCloud/GreenKube/blob/main/schemas/signal.v1alpha1.json) schema |

## Example

```bash
curl -sS -X POST "$GREENKUBE_URL/api/v1/signals" \
  -H "Authorization: Bearer $GREENKUBE_SIGNALS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "push:ci",
    "complete": true,
    "signals": [{
      "target": {"kind": "Deployment", "namespace": "shop", "name": "api", "container": "web"},
      "capability": "container_requests",
      "kind": "RIGHTSIZING_CPU",
      "proposal": {"kind": "container_resources", "container": "web",
                   "current": {"cpu_request_m": 1000}, "proposed": {"cpu_request_m": 300}},
      "algorithm": {"name": "acme.p95", "params": {"percentile": 95, "window": "14d"}},
      "evidence": {"summary": "p95 CPU is 210m over 14 days"},
      "confidence": 0.7,
      "source_estimate": {"monthly_savings": 18.0, "currency": "USD"}
    }]
  }'
```

The answer lists the accepted, stable `signal_ids`. Schema errors answer `422` with a JSON pointer per problem. A `container_requests` signal must propose a CPU or memory request (a `container_limits` signal a limit), otherwise it is rejected with type `missing_resource_value`.

This is also how to keep feeding GreenKube with the advice of tools whose connectors were removed (Kubecost, the GKE recommender, Azure Advisor, Polaris): convert their output into a batch and push it.

## Rules

- **A key is bound to one client.** An API key with scope `signals:write` may only push batches whose `source_id` is `push:<key name>` (lowercased, other characters replaced by `-`); any other `source_id` answers `403 push_client_mismatch`, even for an `admin` key. It can push signals, nothing else. Create one key per client.
- **Pushes go through consensus.** GreenKube's measured value decides the size; pushed signals raise the confidence when they agree and lower it when they disagree. A push never creates a recommendation or a pull request by itself.
- **One vote.** All pushed signals together (every push client and the KRR reports) are at most one independent consensus vote, so one key cannot outvote real sources or meet the auto-approval condition alone.
- **No pushed deletions alone.** A pushed deletion only supports a deletion another source proposes.
- **Idempotent.** Pushing the same advice again refreshes the stored row. Rows not pushed again for 30 days are pruned.
- **This cluster only.** A signal about another cluster is rejected.

The `push` source is `unavailable` until something is pushed, and `degraded` when the newest push is older than `max_age_hours`.

## Configuration

```yaml
sources:
  settings:
    push: { max_age_hours: 72 }   # default 168; or { enabled: false } to ignore every push
```

## Limitations

- `v1alpha1` may change before `v1`.
- A `RecommendationSignal` CRD (in-cluster pushes without HTTP) is planned, not available.

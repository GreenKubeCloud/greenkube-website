---
title: Fairwinds Polaris
description: GreenKube ingests Polaris audits as hygiene findings, and computes requests from observed usage when Polaris reports them missing.
---

[Polaris](https://github.com/FairwindsOps/polaris) audits workloads against best practices. GreenKube ingests its JSON audits as **hygiene findings**. Polaris finds problems; it never sizes anything. When it reports a missing CPU or memory request, GreenKube computes the request itself from observed usage.

## What it reads

The output of `polaris audit --format=json` (Polaris 9.x and 10.x): every failed check of severity `warning` or `danger`, on a controller, its pod spec or one of its containers, becomes one signal.

| Polaris | Signal |
|---|---|
| `Kind`, `Namespace`, `Name` (and container) | The target |
| check `ID` | Finding kind (`cpuRequestsMissing` → `CPU_REQUESTS_MISSING`), capability `hygiene` |
| check `Message` | An advisory proposal and the evidence summary |
| `Severity` | Evidence and a confidence hint (`danger` 0.8, `warning` 0.6) |
| `Category` | `Efficiency`, `Reliability`, `Security` |

**Hygiene findings are advice, never pull requests.** They are listed with the source's signals.

### Missing requests: a native follow-up

For `cpuRequestsMissing` and `memoryRequestsMissing`, GreenKube looks up the container's observed usage. With enough samples, and when the container still has no request, it proposes `p95 × headroom` (above the configured floors) as a `container_requests` signal linked to the finding. It becomes a recommendation only through consensus, like any other signal.

## Push mode (CI)

```bash
polaris audit --format=json --output-file polaris.json
curl -sS -X POST "$GREENKUBE_URL/api/v1/sources/polaris/reports" \
  -H "Authorization: Bearer $GREENKUBE_SIGNALS_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @polaris.json
```

The key needs scope `signals:report`. `?complete=false` marks a partial audit.

## Job mode (optional CronJob)

```bash
kubectl -n greenkube create secret generic greenkube-polaris --from-literal=api-key=gk_…
```

```yaml
sources:
  polaris:
    job:
      enabled: true
      schedule: "37 3 * * *"
      extraArgs: []            # e.g. ["--namespace", "shop"] (then set complete: false)
      complete: true
      apiKeySecret: { name: greenkube-polaris, key: api-key }
```

The CronJob runs the Polaris image pinned by digest with a read-only ServiceAccount, and a GreenKube container posts the audit to the API.

## How it runs

Each scan replays the findings received within `max_age_hours` (168 by default) and adds the follow-up proposals. The source is `unavailable` until an audit is pushed and `degraded` once the newest audit is older than `max_age_hours`.

## Limitations

- Polaris's own `Score` is not used.
- Push the audit of one cluster to the GreenKube of that cluster.
- The UI has no dedicated hygiene view yet: findings are listed with the source's signals.

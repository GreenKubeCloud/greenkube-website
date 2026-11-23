---
title: Robusta KRR
description: Run Robusta KRR yourself, from CI or a CronJob of your own, and push its JSON report to GreenKube. KRR corroborates GreenKube's measured value; it never sets a size on its own.
---

[KRR](https://github.com/robusta-dev/krr) sizes container requests from Prometheus history. GreenKube does not run KRR: you run it where you like (CI, a laptop, a CronJob of your own) and push its JSON report to GreenKube's push API, which turns it into signals.

**KRR never sets a value on its own.** GreenKube's measured value decides the size; KRR's proposal raises the confidence when it agrees and lowers it when it disagrees. A container KRR sizes but GreenKube does not stays a signal on the Sources page ([Consensus across sources](/concepts/recommendations/#consensus-across-sources)).

## The push contract

`POST /api/v1/sources/krr/reports` takes the raw output of `krr <strategy> -f json` (KRR 1.x), unchanged:

| Part | Value |
|---|---|
| Body | The KRR JSON report, `Content-Type: application/json`, up to 64 MiB |
| Authentication | `Authorization: Bearer <API key>` with scope `signals:report` (Settings > API keys, or `POST /api/v1/auth/api-keys` with `{"name": "krr", "scopes": ["signals:report"]}`). A `signals:write` key is still accepted for one minor release, with a `Deprecation` header |
| `?complete=` | `true` (default): the report replaces the previous one. `false`: a partial report (for example `--namespace shop`) that only adds or refreshes advice |
| `?cluster=` | Only for a report covering several clusters: the kubeconfig context of the cluster this GreenKube runs in. A report made inside the cluster needs no parameter |
| Answer `200` | `batch_id`, `accepted`, `signal_ids`, `withdrawn` and `diagnostics` (skipped `"?"` values, unchanged requests, other clusters) |
| Errors | `400` not JSON, `403` key without the scope, `409` partial reports would hold more than 50,000 signals, `413` body too large, `422` not a KRR report, `503` database unavailable |

## Example: a CronJob that runs KRR and pushes its report

The manifest runs KRR once a day in the `greenkube` namespace, next to a release named `greenkube` (API Service `greenkube-api`, port 8000). KRR writes its report to a shared `emptyDir`; a second container posts it with `curl`. Adjust the namespace, the Service name, the Prometheus URL and the schedule.

1. Create the API key and store it in a Secret:

   ```bash
   kubectl -n greenkube create secret generic greenkube-krr --from-literal=api-key=gk_…
   ```

2. Apply the manifest:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: greenkube-krr
     namespace: greenkube
   ---
   # KRR reads workloads, their pods and HPAs across the cluster, plus Services to
   # discover Prometheus. Read-only; no Secrets.
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: greenkube-krr
   rules:
     - apiGroups: [""]
       resources: ["pods", "nodes", "namespaces", "services"]
       verbs: ["get", "list"]
     - apiGroups: ["apps"]
       resources: ["deployments", "statefulsets", "daemonsets", "replicasets"]
       verbs: ["get", "list"]
     - apiGroups: ["batch"]
       resources: ["jobs", "cronjobs"]
       verbs: ["get", "list"]
     - apiGroups: ["autoscaling"]
       resources: ["horizontalpodautoscalers"]
       verbs: ["get", "list"]
     - apiGroups: ["argoproj.io"]
       resources: ["rollouts"]
       verbs: ["get", "list"]
   ---
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRoleBinding
   metadata:
     name: greenkube-krr
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: ClusterRole
     name: greenkube-krr
   subjects:
     - kind: ServiceAccount
       name: greenkube-krr
       namespace: greenkube
   ---
   apiVersion: batch/v1
   kind: CronJob
   metadata:
     name: greenkube-krr
     namespace: greenkube
   spec:
     schedule: "17 3 * * *"
     concurrencyPolicy: Forbid
     successfulJobsHistoryLimit: 1
     failedJobsHistoryLimit: 3
     jobTemplate:
       spec:
         backoffLimit: 1
         activeDeadlineSeconds: 3600
         ttlSecondsAfterFinished: 86400
         template:
           metadata:
             labels:
               app.kubernetes.io/name: greenkube-krr
           spec:
             restartPolicy: Never
             serviceAccountName: greenkube-krr
             securityContext:
               runAsNonRoot: true
               runAsUser: 10001
               runAsGroup: 10001
               seccompProfile:
                 type: RuntimeDefault
             initContainers:
               - name: krr
                 # Pin the image by digest (the multi-arch index of the tag you choose).
                 image: robustadev/krr:v1.31.1@sha256:835bf3b6fec4d8f27d96d236a36542bd87bfcb4f12f3537f8dce7f886916ed9c
                 command:
                   - python
                   - krr.py
                   - simple
                   - -f
                   - json
                   - --fileoutput
                   - /report/krr.json
                   - --logtostderr
                   - -p
                   - http://prometheus-operated.monitoring:9090   # leave out -p and this line to let KRR discover Prometheus
                   - --history_duration
                   - "336"
                 env:
                   - name: HOME
                     value: /tmp
                 securityContext:
                   allowPrivilegeEscalation: false
                   readOnlyRootFilesystem: true
                   capabilities:
                     drop: ["ALL"]
                 resources:
                   requests: {cpu: 100m, memory: 512Mi}
                   limits: {memory: 2Gi}
                 volumeMounts:
                   - {name: report, mountPath: /report}
                   - {name: tmp, mountPath: /tmp}
             containers:
               - name: push
                 image: curlimages/curl:8.10.1
                 command:
                   - sh
                   - -c
                   - >-
                     curl -sS --fail-with-body -X POST
                     "http://greenkube-api.greenkube.svc:8000/api/v1/sources/krr/reports"
                     -H "Authorization: Bearer ${GREENKUBE_SIGNALS_KEY}"
                     -H "Content-Type: application/json"
                     --data-binary @/report/krr.json
                 env:
                   - name: GREENKUBE_SIGNALS_KEY
                     valueFrom:
                       secretKeyRef: {name: greenkube-krr, key: api-key}
                 securityContext:
                   allowPrivilegeEscalation: false
                   readOnlyRootFilesystem: true
                   capabilities:
                     drop: ["ALL"]
                 resources:
                   requests: {cpu: 10m, memory: 32Mi}
                   limits: {memory: 128Mi}
                 volumeMounts:
                   - {name: report, mountPath: /report, readOnly: true}
             volumes:
               - {name: report, emptyDir: {}}
               - {name: tmp, emptyDir: {}}
   ```

3. Run it once and read the answer:

   ```bash
   kubectl -n greenkube create job --from=cronjob/greenkube-krr krr-now
   kubectl -n greenkube logs job/krr-now -c push
   ```

   The answer lists the accepted signals; `GET /api/v1/sources/krr/signals` shows them after the next scan.

Every pod runs as non-root with a read-only root filesystem, so the job passes the `restricted` Pod Security profile. When the chart's `monitoring.networkPolicy.enabled` is set, admit the job's pods to the API:

```yaml
monitoring:
  networkPolicy:
    additionalIngress:
      - from:
          - podSelector:
              matchLabels:
                app.kubernetes.io/name: greenkube-krr
        ports:
          - {protocol: TCP, port: 8000}
```

## Example: push from CI

```bash
krr simple -f json --logtostderr -p "$PROMETHEUS_URL" > krr.json
curl -sS --fail-with-body -X POST "$GREENKUBE_URL/api/v1/sources/krr/reports" \
  -H "Authorization: Bearer $GREENKUBE_SIGNALS_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @krr.json
```

<details>
<summary>Upgrading from the chart's KRR CronJob</summary>

The chart no longer runs KRR (removed in 0.4.0): `sources.krr.job.*` no longer exists and is silently ignored, so remove it from your values. The upgrade deletes the chart's KRR CronJob, ServiceAccount and ClusterRole. Apply the manifest above (or push from CI) instead; your existing `signals:report` key keeps working.

</details>

## What it reads

Every `scans[]` entry of the report becomes up to two signals, one per resource.

| KRR | Signal |
|---|---|
| `object.namespace`, `kind`, `name`, `container` | The target in this GreenKube's cluster |
| `recommended.requests.cpu` / `memory` (and limits) | A container resources proposal, `RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`, decreases **and increases** |
| `object.allocations` | The current values |
| `strategy.name`, `strategy.settings` | The algorithm (`krr.<strategy>`) and its parameters; the window is `history_duration` before the report was received |
| per-resource `severity` | Evidence and a confidence hint (`CRITICAL` 0.8, `WARNING` 0.7, `OK`/`GOOD` 0.6) |
| `recommended.info` | Evidence details (for example `OOMKill detected`) |

Resources with not enough data (`"?"`), or whose recommendation equals the current request, are skipped and counted.

## How it runs

Each scan, the `krr` source reads the signals received within `max_age_hours` (168 by default) through the source runner (`GET /api/v1/sources/krr/signals`). Together with every other pushed signal, KRR counts as at most **one independent vote**. The source is `unavailable` until a report is pushed and `degraded` once the newest report is older than `max_age_hours`.

## Floors and small changes

KRR `simple` never proposes less than `--mem-min` (100 MB, read as MiB) and `--cpu-min` (10m). A KRR value on that minimum is its floor, not a measured need, so it is **not counted as a vote**. Set `sources.toolFloors.krr` to the minimums your KRR runs with. A KRR value that changes the current request by less than `sources.minChange` (5 % and 10m CPU or 16 MiB) votes to keep the current request. Both are listed in the recommendation's `consensus.ignored_votes`.

## Configuration

| Setting | Default | Meaning |
|---|---|---|
| `sources.settings.krr.max_age_hours` | `168` | Reports older than this are no longer used |
| `sources.settings.krr.enabled` | `auto` | `false` ignores pushed reports |
| `sources.toolFloors.krr` | `{cpu: 10m, memory: 100Mi}` | KRR's `--cpu-min`/`--mem-min`: a value on them is not a vote |
| `sources.minChange.*` | 5 %, 10m, 16 MiB | Smallest change that votes for its own value |

## Limitations

- The parser is pinned against the KRR 1.x report shape; newer fields are ignored.
- A report covering several clusters is refused with `422` unless `?cluster=<context>` names the cluster this GreenKube runs in; push each cluster's report to the GreenKube of that cluster.
- KRR's own savings estimate is not in its JSON report; GreenKube computes the impact anyway.

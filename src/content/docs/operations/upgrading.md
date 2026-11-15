---
title: Upgrading
description: Back up first, then upgrade. What changes from GreenKube 0.3.x to 0.4 - one topology, automation always on, PostgreSQL only - and how to move a SQLite install.
---

## Before every upgrade: back up the database

**This step is mandatory.** The controller migrates the database schema at startup, migrations only move forward, and `helm rollback` does not undo them: the only way back from a failed upgrade is to restore a backup taken before it ([Backup and restore](/operations/backup-restore/#roll-back-an-upgrade)).

```bash
# With scheduled backups (postgres.backup.enabled=true): run one now and wait for it.
kubectl -n greenkube create job --from=cronjob/greenkube-postgres-backup backup-before-upgrade
kubectl -n greenkube wait --for=condition=complete job/backup-before-upgrade --timeout=1h

# Without them (0.3.x has none): dump the GreenKube schema to your workstation.
kubectl -n greenkube exec greenkube-postgres-0 -c postgres -- sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema=public --format=custom --no-owner' \
  > greenkube-before-upgrade.dump
kubectl -n greenkube get secret greenkube -o yaml > greenkube-secret.yaml   # store encrypted

helm -n greenkube history greenkube   # note the revision to roll back to
```

Then check the free space of the data volume (a migration that backfills a large table needs about as much free space as that table) and upgrade with `--wait` and a generous `--timeout`.

## From 0.3.x to 0.4

GreenKube 0.4 replaces the two install profiles with one topology (api, controller, renderer, PostgreSQL) and turns automation on for everyone: there is no feature flag left, only `automation.policy.pauseDelivery`. Your data is preserved: the bundled PostgreSQL StatefulSet, its volume and its Secret keep their names.

| 0.3.x | 0.4 |
|---|---|
| `profile: standalone` or `production` | One topology: `<release>-api` and `<release>-controller` Deployments, an optional worker |
| Migrations in a Helm hook Job or at every pod start | The controller migrates at startup under an advisory lock; API replicas report not ready until the schema is current |
| `automation.enabled`, `automation.mode` | Always on; delivery activates when Git credentials exist; `pauseDelivery` pauses it |
| Mandatory `automation.providers[]` with an allowlist | Providers inferred from discovered repositories; one Secret `greenkube-git-credentials`; allowlist `["@discovered"]` |
| Renderer only with automation | Renderer always deployed |
| SQLite in Helm | PostgreSQL only; SQLite stays for `greenkube demo` and local development |
| Three `minSamples` knobs | One: `config.recommendations.minSamples` |
| `config.recommendations.sourcePriority`, `vpaEnabled`, `karpenterEnabled` | `sources.priority`, `sources.settings.<id>.enabled` |

### Deprecated values

An upgrade that reuses a 0.3.x values file keeps working for this minor release: the chart maps the old keys and lists each one under **DEPRECATED VALUES** in the install notes. In 0.5 the values schema rejects them. Note that `automation.enabled: false` now means *discovery, previews and measurement run, no pull request is opened*.

### From an install with PostgreSQL

Use `--reset-then-reuse-values` (Helm 3.14 or later) or pass your values file again. Plain `--reuse-values` does not work for this upgrade: the keys added in 0.4 would be missing, and the chart stops before changing anything.

```bash
helm repo update
helm upgrade greenkube greenkube/greenkube -n greenkube --reset-then-reuse-values --wait --timeout 10m
kubectl -n greenkube rollout status deployment/greenkube-controller
kubectl -n greenkube rollout status deployment/greenkube-api
kubectl -n greenkube delete configmap greenkube --ignore-not-found   # the old hook ConfigMap
```

### From a SQLite install

An upgrade with `config.db.type=sqlite` fails before Helm changes anything and prints the steps. In short:

1. Switch to the bundled PostgreSQL with the controller stopped, keeping the old claim:

   ```bash
   helm upgrade greenkube greenkube/greenkube -n greenkube --reset-then-reuse-values \
     --set config.db.type=postgres --set controller.replicas=0
   ```

2. Copy the data with a one-shot Job running `greenkube db copy --from sqlite:///data/greenkube_data.db --to "$DB_CONNECTION_STRING"`. It copies recommendations, events, the savings ledger, change measurements and the GitOps state; add `--include-metrics` for the metric history (otherwise re-collected). The full Job manifest is in [docs/upgrading.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/upgrading.md#from-a-sqlite-install).
3. Start the controller: `--set controller.replicas=1`.
4. Once you have checked the data, delete the Job and the old claim, and set `config.persistence.enabled=false`.

### Authentication

Existing users go through the initial-admin flow on their first visit: sign in as `admin` with the password of the Secret `<release>-initial-admin` and choose a new one. Existing API keys keep working, including the deprecated bootstrap key `GREENKUBE_API_KEY`, which stays an admin key until you restrict it with `auth.legacyApiKey`.

The upgrade adds the scrape token `GREENKUBE_METRICS_TOKEN` and the ServiceMonitors switch to it in the same release. `monitoring.serviceMonitor.namespace` now defaults to the release namespace, next to the token: check that Prometheus selects that namespace.

The bundled PostgreSQL now accepts connections only from the api, controller and worker pods. A Job of yours that connects to it (backup, `greenkube db copy`) needs the label `greenkube.cloud/postgres-client: "true"` on its pod template.

## Within 0.4

Back up first, then `helm upgrade` with your values file. The controller migrates the schema at startup and the API replicas report ready once it is current. To go back after a migration, restore the backup: `helm rollback` alone does not undo migrations.

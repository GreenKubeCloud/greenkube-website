---
title: Backup & Restore
description: Back up GreenKube's PostgreSQL on a schedule, restore it safely, roll back an upgrade, apply the cluster identity rule after restoring into a new cluster, and verify the ledger's hash chain.
---

GreenKube keeps everything that matters in PostgreSQL: recommendations and their history, plans and pull requests, applied changes and their measurements, and the append-only, hash-chained savings ledger. The metrics can be collected again; **the ledger and the audit trail cannot**. Back the database up on a schedule, and always before an upgrade.

:::caution[Rolling back an upgrade means restoring the backup, not `helm rollback`]
The controller migrates the schema at startup and migrations only move forward. `helm rollback` brings the previous code back but leaves the new schema in place, which is not supported. To go back, restore the dump taken before the upgrade, then roll the release back ([Roll back an upgrade](#roll-back-an-upgrade)).
:::

## What to back up

| What | Where | How |
|---|---|---|
| The GreenKube schema | Bundled StatefulSet `<release>-postgres` or your external database | `pg_dump` (below) |
| Generated credentials | Secret `<release>` (database password, connection string, scrape token, ledger chain key `LEDGER_CHAIN_KEY`, API key, session secrets) and `<release>-initial-admin` | `kubectl get secret -o yaml`, stored encrypted (or manage them with `secrets.existingSecret`) |
| Your values | Your values file or GitOps repository | Version control |
| Git credentials | `greenkube-git-credentials` | Your secret manager |

With the bundled PostgreSQL, the dump and the data volume are only usable with the password of the Secret `<release>`, and keyed ledger entries only verify with its `LEDGER_CHAIN_KEY`. Keep both.

## Scheduled backups

```yaml
postgres:
  backup:
    enabled: true
    schedule: '17 3 * * *'   # daily, 03:17 cluster time
    keep: 7                  # dumps kept on the volume, oldest deleted first
    persistence:
      size: 20Gi             # or existingClaim: <your claim>
```

The chart renders a CronJob `<release>-postgres-backup` and a claim kept by `helm uninstall`. Each run dumps the GreenKube schema with `pg_dump --format=custom` (bundled or external PostgreSQL, with your TLS mode), checks the archive with `pg_restore --list`, and rotates the dumps. It runs under the Pod Security `restricted` profile without a service-account token. With alerts enabled, `GreenKubeBackupMissing` fires when no run has succeeded for 36 hours.

Copy the dumps off the cluster as well: a backup on the same storage as the database does not survive the loss of that storage.

Run one now, for example right before an upgrade:

```bash
kubectl -n greenkube create job --from=cronjob/greenkube-postgres-backup backup-before-upgrade
kubectl -n greenkube wait --for=condition=complete job/backup-before-upgrade --timeout=1h
```

## Back up by hand

```bash
kubectl -n greenkube exec greenkube-postgres-0 -c postgres -- sh -c \
  'PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" --schema=public --format=custom --no-owner' \
  > greenkube-$(date -u +%Y%m%dT%H%M%SZ).dump
pg_restore --list greenkube-*.dump | head        # the archive is readable
kubectl -n greenkube get secret greenkube -o yaml > greenkube-secret.yaml   # store encrypted
```

## Restore

A restore **drops the schema, then replays the dump into it**, both in one transaction. Do not use `pg_restore --clean` over the existing schema: when the dump is older than the schema (the rollback of an upgrade), the objects newer migrations created are not in the dump and the restore aborts.

1. Stop every writer:

   ```bash
   NS=greenkube RELEASE=greenkube
   kubectl -n $NS scale deployment/$RELEASE-controller deployment/$RELEASE-api --replicas=0
   kubectl -n $NS scale deployment/$RELEASE-worker --replicas=0 2>/dev/null || true
   kubectl -n $NS patch cronjob $RELEASE-postgres-backup -p '{"spec":{"suspend":true}}' 2>/dev/null || true
   ```

2. Restore the dump in one transaction (set `SCHEMA` to your `config.db.schema`):

   ```bash
   SCHEMA=public DUMP=greenkube-20261114T031700Z.dump
   kubectl -n $NS exec -i $RELEASE-postgres-0 -c postgres -- sh -c '
     { printf "DROP SCHEMA IF EXISTS \"%s\" CASCADE;\n" "$1"; pg_restore --no-owner --file=-; } |
       PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
         --single-transaction -v ON_ERROR_STOP=1 -q -o /dev/null' sh "$SCHEMA" < "$DUMP"
   ```

   With an external database, run the same pipeline with its connection string and client tools at least as new as the `pg_dump` that wrote the archive (PostgreSQL 18 for the chart's backups).

3. Start the release that matches the restored schema (the same chart version, or a newer one, which migrates it forward), then the writers:

   ```bash
   kubectl -n $NS scale deployment/$RELEASE-controller --replicas=1
   kubectl -n $NS rollout status deployment/$RELEASE-controller
   kubectl -n $NS scale deployment/$RELEASE-api --replicas=1
   kubectl -n $NS patch cronjob $RELEASE-postgres-backup -p '{"spec":{"suspend":false}}' 2>/dev/null || true
   ```

The procedure is tested in the project's CI: a seeded 0.3.1 schema is dumped, upgraded, restored with this pipeline and upgraded again.

## Restoring into a new or rebuilt cluster

The database records the cluster it belongs to: the `kube-system` namespace UID. A rebuilt cluster, or another cluster, has a new UID, so after such a restore **the controller refuses to collect into the database** (fail closed, so that two clusters never write into one schema). You see it as:

- the controller `/readyz` not ready, with `identity_error` in its body;
- `collection.identity_mismatch` (stored and live UID) in `GET /api/v1/health`;
- `greenkube_collection_identity_mismatch = 1` and the critical alert `GreenKubeClusterIdentityMismatch`.

When the database is meant for this cluster, set `config.collection.allowClusterUidChange: true` for **one** controller start, check the log line `ALLOW_CLUSTER_UID_CHANGE: this database belonged to cluster ...`, then set it back to `false`. Restoring into the same cluster needs nothing: its UID has not changed.

## Verify the ledger after a restore

The savings ledger is hash-chained per cluster: a restore that lost, reordered or altered an entry breaks the chain. The controller verifies it at startup and every `config.ledger.chainVerifyInterval` (1 hour). After the restart:

```bash
kubectl -n $NS port-forward svc/$RELEASE-api 8000:8000 &
curl -s -H "Authorization: Bearer $GREENKUBE_API_KEY" http://localhost:8000/api/v2/ledger/summary | jq .chain
```

`chain.ok` must be `true`, with `verified_head_seq` equal to `head_seq` and a `verified_at` after the restart. `ok: false` names the first broken position, and `GreenKubeLedgerChainVerificationFailed` fires. A dump restored as a whole keeps the chain intact; a chain failure after a restore means a partial or edited restore: restore the dump again, completely.

After a restore or a failover that lost the last entries, the stored anchor (and the head published in Prometheus) is ahead of the chain, so verification keeps failing until you accept the current head, once the incident is investigated, with the controller's `LEDGER_CHAIN_KEY` in the environment:

```bash
kubectl -n greenkube exec deploy/greenkube-controller -- \
  greenkube db ledger-accept-head --cluster-uid <uid> --reason "restored from backup"
```

The acceptance is logged with its reason and the head it replaces; nothing is written to the ledger. A backup taken before a key rotation restores the old status row: record the rotation again ([The ledger chain key](/concepts/measurements-and-ledger/#the-ledger-chain-key)).

## Roll back an upgrade

1. Before the upgrade: run a backup and note the chart revision (`helm history`).
2. If the new release misbehaves: stop the writers, [restore](#restore) the dump taken before the upgrade, then `helm rollback <release> <previous revision> --wait`.
3. [Verify the ledger](#verify-the-ledger-after-a-restore).

Data written between the upgrade and the restore is lost (metrics are collected again for the backfill window). A `helm rollback` without the restore is only safe when the upgrade applied no migration.

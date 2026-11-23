---
title: API Reference
description: The GreenKube REST API - authentication with sessions and scoped API keys, and the main endpoints for recommendations, plans, pull requests, changes, measurements, the savings ledger and signals.
---

The REST API is served by `greenkube-api` under `/api/v1` (and `/api/v2` for changes, the ledger and recommendations v2). Interactive documentation and the OpenAPI schema are available at `/api/v1/docs` and `/api/v1/openapi.json`. The full reference is [docs/api.md](https://github.com/GreenKubeCloud/GreenKube/blob/main/docs/api.md).

## Authentication

- **Machines** send a scoped API key: `Authorization: Bearer gk_<id>_<secret>`. Administrators create keys in **Settings > API keys** or with `POST /api/v1/auth/api-keys`; the key is shown once. Scopes: `read`, `write`, `approve`, `plans:deliver`, `signals:write`, `signals:report`, `metrics:read`, `admin`. A request outside its scopes answers `403 INSUFFICIENT_SCOPE`.
- **The dashboard** signs in with `POST /api/v1/auth/login` and uses an `HttpOnly` session cookie. Mutations authenticated by the cookie need a same-origin `Origin` and the `X-CSRF-Token` header returned by `GET /api/v1/auth/me`.
- **Headless installs** (`config.apiAuthMode: api_key`) have no accounts: the sign-in page posts an API key to `POST /api/v1/auth/api-key-login` (`{"key": "...", "remember": false}`), which checks it like a Bearer key and answers with a signed `HttpOnly` cookie, never the key itself. It accepts the bootstrap key or a scoped key with the `read` scope, needs HTTPS (or `localhost`), and lasts 12 hours (30 days with "Keep me signed in"). Revoking the key signs its browsers out.
- **Single sign-on** works through an authentication proxy or native OpenID Connect, with IdP groups mapped to the `viewer`, `operator` and `admin` roles.

Unauthenticated requests answer `401`. A production instance never serves anonymous requests.

## Health and setup

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Readiness and version; `503` with `status: migrating` until the schema is current |
| `GET` | `/setup/status` | The setup checklist: capabilities, checks, and the fix for anything missing |
| `GET` | `/config` | Non-sensitive runtime configuration, including the pricing `currency` |
| `GET` | `/health/services` | Health of the configured data sources |
| `GET` | `/collection/coverage` | Collection coverage ratio and holes |

## Recommendations and sources

| Method | Path | Description |
|---|---|---|
| `GET` | `/recommendations/active` | Active and `pr_open` recommendations with their expected value and delivery `eligibility`, ranked |
| `GET` | `/recommendations/{id}` | One recommendation |
| `GET` | `/recommendations/{id}/events` | Its lifecycle audit trail |
| `GET` | `/api/v2/recommendations`, `/api/v2/recommendations/{id}` | The v2 shape: typed proposal, impact, risk, value, consensus and revisions |
| `GET` | `/recommendations/savings` | Projected, run-rate and realized-to-date savings blocks, never summed |
| `GET` | `/recommendations/export` | Active recommendations as CSV or JSON |
| `PATCH` / `DELETE` | `/recommendations/{id}/ignore` | Ignore or restore |
| `GET` | `/recommendations/{id}/manual` | Manual mode: the `kubectl` steps |
| `POST` | `/recommendations/{id}/manual/applied` | Mark as applied by hand; the change is then measured |
| `POST` | `/recommendations/{id}/remeasure`, `/recommendations/{id}/rollback-review/dismiss` | Start a new measurement of a `not_realized` or `inconclusive` change; dismiss a rollback review |
| `POST` | `/optimization/runs` | Queue a scan for the controller (`202`) |
| `GET` | `/optimization/runs`, `/optimization/runs/{id}` | Scan runs with per-source health and the diff against the previous set |
| `GET` | `/sources` | Every source with its status, last run and counts |
| `GET` | `/sources/{id}/runs`, `/sources/{id}/signals` | A source's runs and signals |
| `GET` | `/sources/track-record` | Measured realization rate per source and capability |
| `POST` | `/signals` | Push a signal batch (`signals:write`) |
| `POST` | `/sources/krr/reports` | Push a Robusta KRR JSON report (`signals:report`) |

## GitOps and pull requests

| Method | Path | Description |
|---|---|---|
| `GET` | `/gitops/status`, `/gitops/coverage` | Controller availability, discovery freshness, binding coverage |
| `GET` | `/gitops/bindings` | Workload bindings (paginated, filterable by status) |
| `POST` | `/gitops/bindings/{namespace}/{kind}/{name}/resolve` | Pick one candidate for an ambiguous binding |
| `GET` | `/automation/status` | Automation readiness |
| `POST` | `/automation/plans` | Create a render-validated preview from recommendation ids |
| `GET` | `/automation/plans/{plan_id}` | The preview with source and rendered diffs |
| `POST` | `/automation/plans/{plan_id}/approve` | Approve the exact `sha256:` digest and enqueue the plan (`approve` scope) |
| `GET` | `/automation/plans/{plan_id}/patch` | The approved plan as a `git format-patch` (patch and CI modes) |
| `POST` | `/automation/plans/{plan_id}/delivery` | Report a PR opened outside GreenKube (`plans:deliver`) |
| `POST` | `/automation/plans/{plan_id}/rollback-preview` | Inverse preview for a change in rollback review |
| `POST` / `DELETE` | `/automation/plans/{plan_id}/cancel`, `/automation/plans/{plan_id}/abandon`, `/automation/plans/{plan_id}` | Cancel, abandon or delete a plan (`cancelled` status with `status_reason`) |
| `GET` | `/automation/pull-requests` | Pending and open pull requests |
| `POST` | `/webhooks/{provider_id}` | Signed GitHub, GitLab or Gitea pull-request events |

## Changes, measurements and ledger (`/api/v2`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v2/changes` | Applied changes with plan and PR links, generations, digests and latest measurement |
| `GET` | `/api/v2/changes/{id}` | One change, with its baseline snapshot metadata and whether its content hash still verifies |
| `GET` | `/api/v2/changes/{id}/measurements` | Decided measurements: windows, counterfactual parameters, estimates with intervals, confounders, health, capacity |
| `GET` | `/api/v2/ledger/entries` | Ledger entries, newest first, with their provenance and chain position |
| `GET` | `/api/v2/ledger/summary` | One total per method, quantity and unit (cost, CO₂e, released capacity, cost of fix), plus the chain verification status |
| `GET` | `/api/v2/ledger/export` | CSV, or `format=focus` for FOCUS-aligned rows |

## Footprint and reports

| Method | Path | Description |
|---|---|---|
| `GET` | `/metrics/summary`, `/metrics/timeseries`, `/metrics/by-namespace`, `/metrics/top-pods` | Cost, energy and CO₂e per cluster, namespace and pod |
| `GET` | `/nodes` | Node inventory |
| `GET` | `/report/summary` | Report totals; cluster-wide, adds the node idle share and the cluster total |
| `GET` | `/report/export` | Stream a CSV or JSON report (`include_idle=true` appends the idle and cluster-total rows) |

## Example: the loop through the API

```bash
api() { curl -fsS -H "Authorization: Bearer $GREENKUBE_API_KEY" -H 'Content-Type: application/json' "http://localhost:8000/api/v1$1" "${@:2}"; }

api '/recommendations/active?namespace=shop'                        # pick recommendation ids
api /automation/plans -X POST -d '{"recommendation_ids":["<id>"]}'   # preview: status, digest, diff
api /automation/plans/<plan_id>/approve -X POST -d '{"digest":"sha256:…"}'
api /automation/plans/<plan_id>                                      # pr_open → merged → synced → applied
curl -fsS -H "Authorization: Bearer $GREENKUBE_API_KEY" http://localhost:8000/api/v2/changes
```

## Removed in 0.4.0

`POST /api/v1/recommendations/{id}/apply-pr`, `GET …/apply-pr/eligibility` and `GET /api/v1/automation/operations/{operation_id}` are removed: use the plans API and each recommendation's `eligibility`. `POST /api/v1/repository-bindings` is removed, `POST /api/v1/config/services` answers `410 Gone` (data sources are configuration as code), and `POST /api/v1/sources/polaris/reports` answers `404` for every key; nothing is stored. Footprint, recommendation and dashboard series are no longer exported on `/prometheus/metrics`: read them from `/report/summary`, `/report/export`, `/metrics/summary`, `/metrics/dashboard-summary`, `/nodes` and `/recommendations` instead ([Upgrading](/operations/upgrading/#prometheus-metrics-sustainability-score-and-grafana-dashboard)).

---
title: Web UI
description: The GreenKube web UI - a savings-first Overview, ranked recommendations, the changes board from plan to measured outcome, the ledger, sources, the setup checklist and the footprint.
---

The GreenKube UI is a single-page application served by the API at `/`. Every page reads the API with your session; no page starts a scan or writes anything on load. Status is always written as a word (`Measured`, `Projected`, `Action needed`, `Failing`), never shown by colour alone. Try it without installing anything at [demo.greenkube.cloud](https://demo.greenkube.cloud).

![GreenKube Overview: measured allocated savings, savings pending verification, the projected opportunity, changes in flight and what to do next (demo data)](/screenshots/demo-dashboard.png)

## Pages

| Page | Purpose |
|---|---|
| **Overview** (`/`) | Savings first: measured allocated savings with the realization factor, savings pending verification, the projected opportunity, changes in flight, and the top recommendations |
| **Recommendations** (`/recommendations`) | The ranked list with filters and plan preview. Each detail page shows the proposal, expected value, delivery eligibility with blockers and fixes, projected impact by component, released capacity, consensus across sources, evidence, pull requests, measurement and lifecycle timeline |
| **Changes** (`/changes`) | One board from approved plan to measured outcome: Plan → PR open → Merged → Synced → Applied → Measuring → Outcome. Rows that need a human are flagged (sync failed, pull request failed, regressed) |
| **Ledger** (`/ledger`) | Savings totals per method and every applied change with its measurement, confidence interval, original projection and split across recommendations |
| **Sources** (`/sources`) | Every recommendation source: status, last run, counts, measured track record and recent runs |
| **Setup** (`/setup`) | The setup checklist: the four capabilities (discovery, delivery, sync tracking, measurement), each check with its fix, and the repositories found by discovery |
| **Footprint** (`/footprint`) | Cost, energy and CO₂e per workload, namespace and node, with Nodes and Report sections |
| **Automation** (`/automation`) | GitOps discovery, workload binding coverage and manual resolution |
| **Settings** (`/settings`) | Account and API keys |

### Recommendations

![GreenKube Recommendations: ranked recommendations with filters, potential CO₂e and cost savings, and each card's evidence, risk, confidence and expected value (demo data)](/screenshots/demo-recommendations.png)

### Changes

![GreenKube Changes board: every change from plan to pull request, merge, sync, rollout and measured outcome (demo data)](/screenshots/demo-automation.png)

The change page shows the applied change, its measurement and the released capacity:

![GreenKube Change page: a measured change with its allocated saving, 90% interval and released capacity (demo data)](/screenshots/demo-change.png)

### Footprint

![GreenKube Footprint, Nodes section: node inventory with CPU and memory capacity (demo data)](/screenshots/demo-nodes.png)

![GreenKube Footprint, Report section: configure, preview and export the cost, energy and CO₂e report as CSV or JSON (demo data)](/screenshots/demo-report.png)

## Projected, allocated and realized are never summed

Every page uses one vocabulary and shows each kind of saving in its own panel, with its method as a label:

- **Measured allocated savings**: what the changed workloads stop being charged, measured after the change and accrued in the ledger.
- **Realization factor**: the expected share of an allocated saving that reaches the bill, labelled as an expectation.
- **Realized (billed) savings**: shown only when savings measured on the bill exist. The word "Realized" is reserved for them; a measurement outcome reads **Saving measured** or **No saving measured**.
- **Pending verification** (`Projected`): the yearly projection of applied changes not measured yet.
- **Opportunity** (`Projected`): the projected yearly savings of open recommendations. Reliability recommendations add resources on purpose and are counted apart, never as savings.
- **User declared** (Ledger only): savings declared on manual applies, never counted as measured.

## Roles

Pages show only the actions the signed-in user may perform. Opening a pull request, ignoring, restoring and resolving a binding need the `write` scope; approving a plan needs `approve`. A short **Read-only access** note says why actions are missing, and the server enforces the same scopes.

## Pull-request deep links

With `config.externalUrl` set, pull requests link back to the recommendation (`/recommendations/{id}`), the change (`/changes/{plan_id}`) and its ledger entry (`/ledger?change=…`).

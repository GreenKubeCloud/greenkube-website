---
title: Wattnet Electricity Provider
description: Use the free, EU-funded Wattnet API as an alternative to Electricity Maps for real-time grid carbon intensity across 52 European zones.
---

import { Aside, Steps } from '@astrojs/starlight/components';

Since **v0.3.0**, GreenKube's grid carbon intensity source is provider-agnostic. In addition to [Electricity Maps](https://www.electricitymaps.com/) (the default), you can select **[Wattnet](https://wattnet.eu)** — a free, EU-funded service tracking the environmental footprint of European electricity.

## Why Wattnet?

- **Free** for all EU countries — just create an account and authenticate.
- **Financed by the EU** (Horizon Europe, GreenDIGIT project) — no commercial constraints.
- **15-minute granularity** — finer than Electricity Maps' hourly data.
- Covers **52 European zones** at ENTSO-E bidding-zone granularity (e.g. `IT_NORTH`, `SE3`, `NO1`).
- Exposes carbon **and** water footprint data in one API — water footprint integration is on GreenKube's roadmap.

<Aside type="tip">
  Zones outside Europe (US, Asia, South America, Australia, ...) have no Wattnet counterpart and automatically fall back to the static default grid intensity, exactly like Electricity Maps does when its token is missing.
</Aside>

## How It Works

<Steps>

1. GreenKube maps the cluster's cloud zone to an Electricity Maps zone code (unchanged logic).
2. The `WattnetCollector` translates that code to the Wattnet zone naming (most EU country codes, e.g. `FR`, `DE`, `ES`, pass through unchanged).
3. It obtains a short-lived Bearer token from the Wattnet token service using your account credentials. Tokens are valid for 1 day and are cached and refreshed automatically.
4. It fetches the carbon footprint (`GET /v1/footprints`, life-cycle scope) for a window around the requested timestamp.
5. Data-quality flags returned by Wattnet are translated into GreenKube's `is_estimated` / `estimation_reasons` fields, and the records are stored in the same repository used for Electricity Maps data.

</Steps>

After each hourly intensity collection, GreenKube also recomputes the combined metrics from the last 24 hours against the refreshed history, so provisional Wattnet values (younger than ~4 hours) get corrected in place once consolidated.

## Prerequisites

1. Create a free account on the Wattnet token service: [api.wattnet.eu/token-request/register](https://api.wattnet.eu/token-request/register).
2. Keep the email/password you registered with — they're used to obtain API tokens.

## Configuration

<Steps>

1. **Set the provider and credentials in Helm values:**

   ```yaml
   config:
     electricityProvider: wattnet

   secrets:
     wattnetEmail: "you@example.com"
     wattnetPassword: "your-password"
   ```

2. **Or via environment variables (source / Docker installs):**

   ```bash
   ELECTRICITY_PROVIDER=wattnet
   WATTNET_EMAIL="you@example.com"
   WATTNET_PASSWORD="your-password"
   ```

3. **Apply the change:**

   ```bash
   helm upgrade greenkube greenkube/greenkube \
     -n greenkube \
     --set config.electricityProvider=wattnet \
     --set secrets.wattnetEmail="you@example.com" \
     --set secrets.wattnetPassword="your-password"
   ```

</Steps>

<Aside type="note">
  `ELECTRICITY_MAPS_TOKEN` is ignored while `ELECTRICITY_PROVIDER=wattnet`. Only one provider is active at a time; the inactive provider is excluded from the overall health status so you aren't nagged to configure a provider you're not using.
</Aside>

### Verifying the Setup

- The health endpoint reports a `wattnet` service:

  ```bash
  curl "http://localhost:8000/api/v1/health/services/wattnet"
  ```

- Credentials can also be updated at runtime from the **Settings** page in the web dashboard (persisted to the Kubernetes Secret), without restarting the pod.

## Zone Mapping

Most EU country codes are identical in both naming schemes (`FR`, `DE`, `ES`, `NL`, ...) and pass through automatically. A few countries with sub-national grids are mapped to their most representative sub-zone:

| Electricity Maps | Wattnet | Notes |
|---|---|---|
| `IT` | `IT_NORTH` | Country-level default (Milan area); `IT-NO`, `IT-CNO`, `IT-CSO`, `IT-SO`, `IT-SAR`, `IT-SIC` map to their respective Italian sub-zones |
| `SE` | `SE3` | Country-level default (Stockholm area); `SE-SE1`…`SE-SE4` map to `SE1`…`SE4` |
| `NO` | `NO2` | Country-level default (Oslo/Southern Norway); `NO-NO1`…`NO-NO5` map to `NO1`…`NO5` |
| `DK` | `DK1` | Country-level default; `DK-DK1`/`DK-DK2` map to `DK1`/`DK2` |
| `NI`, `GB-NIR` | `NIE` | Northern Ireland |
| `DK-BHM`, `ES-CE`, `ES-CN-*`, `ES-IB-*`, `ES-ML`, `FR-COR`, `GB-ORK`, `PT-MA` | — | Islands/exclaves not covered by Wattnet → static fallback |

Wattnet covers 52 zones across Austria, Belgium, Bosnia and Herzegovina, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Georgia, Germany, Great Britain, Greece, Hungary, Ireland, Italy (7 zones), Latvia, Lithuania, Luxembourg, Moldova, Montenegro, Netherlands, North Macedonia, Northern Ireland, Norway (5 zones), Poland, Portugal, Romania, Serbia, Slovakia, Slovenia, Spain, Sweden (4 zones), Switzerland, Turkey, and Kosovo.

## Related

- [Carbon Tracking](/features/carbon-tracking/) — How emissions are estimated
- [Energy Estimation Methodology](/architecture/energy-estimation/) — Full power/carbon model
- [Configuration Reference](/getting-started/configuration/) — All environment variables and Helm values

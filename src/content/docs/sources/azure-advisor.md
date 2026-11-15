---
title: Azure Advisor
description: On AKS, GreenKube reads Azure Advisor configuration advice about the cluster as advisory signals, through Workload Identity.
---

Azure Advisor gives configuration-level advice about AKS clusters (enable the cluster autoscaler, pick an autoscaler profile, enable cost analysis, use spot node pools). It has no per-workload numbers. GreenKube reads that advice as **advisory signals** about the cluster: they never become pull requests.

## What it reads

The Advisor recommendations of the subscription, filtered on the configured categories:

| Advisor | Signal |
|---|---|
| Impacted resource = this AKS cluster (and resource group, when set) | Used; other clusters and resources are counted and never used |
| Solution text | An advisory proposal on the cluster target |
| Category | Finding kind `AZURE_ADVISOR_<CATEGORY>` |
| Text about the autoscaler, node pools, spot or VM sizes | Capability `node_pool`; otherwise `hygiene` |
| Impact | Evidence; every advisory is high risk |
| Savings amount | Kept for comparison only; GreenKube never ranks on it |

## Permissions (Workload Identity)

No cluster permission is needed. On Azure:

1. Enable Microsoft Entra Workload ID on the cluster.
2. Create a user-assigned managed identity with the **Reader** (or **Advisor Reviewer**) role on the subscription or resource group, federated with GreenKube's ServiceAccount.
3. Label the controller's pods `azure.workload.identity/use: "true"` and annotate their ServiceAccount with `azure.workload.identity/client-id`.

GreenKube exchanges the federated token for an Azure Resource Manager token at each collection. No secret is stored, and the token is only ever sent to the Resource Manager host.

## Configuration

```yaml
sources:
  settings:
    azure_advisor:
      subscription_id: 00000000-0000-0000-0000-000000000000   # required
      cluster_name: aks-prod                                  # required: the AKS resource name
      resource_group: rg-prod                                 # optional
      categories: [Cost, HighAvailability, OperationalExcellence, Performance]
```

The source stays `unavailable` (never failing) until the subscription, the cluster name and the Workload Identity variables are present. It collects at most once per hour.

## Limitations

- Advice only: configuration changes (autoscaler profile, add-ons) are made in Azure, not in Git manifests.
- GreenKube's Impact Model does not price cluster-level configuration changes.

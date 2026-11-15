---
title: GKE Recommender
description: On GKE, GreenKube reads Active Assist insights about over- and under-provisioned workloads through the Recommender API, with Workload Identity and no stored key.
---

Google's Active Assist flags GKE workloads whose requests are too high or too low. GreenKube reads these **insights** from the Recommender API and turns them into signals. The source is read-only: it never writes to the cluster or to Google Cloud.

## What it reads

- The insight types listed at runtime (every `google.container.*` type), because the insight type id is not stable in Google's public documentation.
- Insights of subtype `WORKLOAD_OVERPROVISIONED` or `WORKLOAD_UNDERPROVISIONED` in state `ACTIVE`, in the cluster's location.
- When the insight contains recommended container requests, they become container resources proposals (`RIGHTSIZING_CPU` / `RIGHTSIZING_MEMORY`, decreases and increases). Without readable values, the insight stays an advisory signal and never becomes a pull request.
- An insight is attributed to this cluster only when its target names this project, this cluster's exact location and its name. Anything else is skipped and counted.

**Coverage gaps are always reported.** GKE gives no recommendation for workloads whose requests VPA manages, nor for the target metric of an HPA, and may wait up to three days for new workloads. Every batch carries a `gke_coverage` diagnostic so that a missing insight is never read as "nothing to change".

## Permissions (Workload Identity)

1. Enable the Recommender API (`recommender.googleapis.com`) in the project.
2. Grant the controller's Kubernetes ServiceAccount (`<release>-controller`) two roles on the project: `roles/recommender.viewer` and `roles/serviceusage.serviceUsageConsumer`.

```bash
PROJECT_ID=my-project
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
MEMBER="principal://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$PROJECT_ID.svc.id.goog/subject/ns/greenkube/sa/greenkube-controller"
for ROLE in roles/recommender.viewer roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --role="$ROLE" --member="$MEMBER"
done
```

The project, cluster name, location and access token come from the GKE metadata server: no key file is ever stored.

## Configuration

```yaml
sources:
  settings:
    gke:
      enabled: auto                     # default; false turns it off
      # Only needed when the metadata server does not report them:
      # project_id: my-project
      # cluster_name: prod-gke
      # location: europe-west1-b
```

The source collects at most once per hour (insights are refreshed about daily). With `monitoring.networkPolicy.enabled`, allow egress to the metadata server and Google APIs through `monitoring.networkPolicy.additionalEgress`.

## Limitations

- The insight content is not publicly documented; the parser accepts the known shapes and skips the rest.
- Cloud Monitoring VPA metrics are not read yet.

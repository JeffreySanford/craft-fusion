# Portfolio Environment Plan

This document tracks the work needed to stand up and operate the portfolio environment (data, model, and runtime services).

## Current status

- Environment not yet provisioned.
- Data/ML workflows exist in the `training` project:
  - `nx run training:prepare-portfolio-data`
  - `nx run training:finetune-portfolio`
  - `nx run training:portfolio-pipeline` (prepare + finetune + inference test)

## Next steps (proposed)

1) **Configuration & secrets**

- Define portfolio-specific configuration using the patterns in `documentation/architecture/ENVIRONMENT-CONFIGURATION.md` (endpoints, storage buckets, model artifact location, telemetry keys).
- Produce a `.env.portfolio.example` with placeholders (no secrets committed).

1) **Data pipeline**

- Refresh portfolio datasets via `nx run training:prepare-portfolio-data` and validate outputs (row counts, schema, PII scrub).
- Add a checksum and metadata manifest for the prepared dataset.

1) **Model training and packaging**

- Run `nx run training:finetune-portfolio` (or the full `training:portfolio-pipeline`) and capture metrics (loss, eval set).
- Package the resulting model artifact with hash + size; store in the configured artifact bucket/path.

1) **Deployment & runtime**

- Define the deployment target (container or serverless) and required resources (CPU/GPU, memory, storage, network egress).
- Create a deploy playbook (build image, push, deploy, verify health) and align with PM2/Node processes if applicable.
- Add runtime health checks and latency/error budgets for portfolio endpoints.

1) **Observability & governance**

- Instrument telemetry (logs, traces, metrics) for the portfolio services and wire alerts for SLO breaches.
- Document provenance: dataset version, model hash, training run ID, and deployment version.

## Deliverables

- Portfolio environment configuration doc and example env file (no secrets).
- Dataset manifest + checksum for the prepared portfolio data.
- Model artifact packaged with hash, stored in the designated location.
- Deployment playbook and monitoring checklist for the portfolio runtime.

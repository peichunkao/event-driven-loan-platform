# Delivery phases

Phases 1–4 are the local, runnable demo. "Future upgrades" are deliberately scoped *out* of this iteration to keep the portfolio demo bootable with a single `pnpm docker:up` + `pnpm dev:*`.

| Phase | Scope |
|-------|--------|
| **1–2** | Postgres + Redpanda + Nest GraphQL BFF + audit worker + OpenSearch indexing + React/Vite banker dashboard |
| **3** | **Simulator** — synthetic downstream domain events on `loan.events` (`pnpm dev:simulator`) |
| **4** | **Notifications stub** — consumer group for `NotificationSent` events (`pnpm dev:notifications`); replace with email/push/SMS later |
| **Last** | Sync generated GraphQL schema, `pnpm build` / `pnpm test`, Docker stack via `infra/docker` |

## Future upgrades (not in this round)

| Upgrade | Notes |
|---------|-------|
| **Next.js migration** | Move `apps/web` from Vite to Next.js (App Router + SSR dashboard, `/api` routes as a thin BFF proxy). Aligns with the Next.js-centric stack used by Unloan / CBA digital teams. |
| **Auth** | SSO for bankers (OIDC / Cognito), row-level authorization on `loan_applications`, audit of actor on every event. |
| **AWS deployment** | Terraform/CDK for **ECS Fargate** (API + workers), **RDS Postgres**, **MSK** (Kafka), **OpenSearch Service**, **S3 + CloudFront** for the UI. CI/CD via GitHub Actions. |
| **Observability** | OpenTelemetry traces threaded through `traceId` already present on every event envelope → X-Ray / Datadog. Dashboards for Kafka lag + indexer throughput. |
| **Demo recording** | 30–60 s screen capture of the banker dashboard end-to-end flow → `docs/demo/demo.gif`. See [docs/demo/](./demo/). |

Optional production-oriented work (AWS CLI, deploy scripts) is described in [DEV_SETUP.md](./DEV_SETUP.md).

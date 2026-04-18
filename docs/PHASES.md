# Delivery phases (local demo)

| Phase | Scope |
|-------|--------|
| **1–2** | Postgres + Redpanda + Nest GraphQL + audit worker + OpenSearch indexing + web UI |
| **3** | **Simulator** — synthetic downstream domain events on `loan.events` (`pnpm dev:simulator`) |
| **4** | **Notifications stub** — consumer group for `NotificationSent` events (`pnpm dev:notifications`); replace with email/push/SMS later |
| **Last** | Sync generated GraphQL schema, `pnpm build` / `pnpm test`, Docker stack via `infra/docker` |

Optional production-oriented work (AWS CLI, deploy scripts) is described in [DEV_SETUP.md](./DEV_SETUP.md).

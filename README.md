# Event-driven loan platform

Portfolio monorepo demonstrating a **React + TypeScript** frontend, **Node.js GraphQL** BFF (NestJS), **PostgreSQL**, **Kafka-compatible events** (Redpanda locally), and **OpenSearch** for search and ops views—aligned with an event-driven origination-style workflow.

## What this demonstrates

- **GraphQL as a BFF** for the web app (not the internal integration backbone).
- **Async domain events** consumed by dedicated workers (audit, notifications, risk/AI, indexing).
- **Dockerized** data stack for local development with a path to AWS (ECS, RDS, MSK, OpenSearch Service).

## Prerequisites

- Node **24** (see `.nvmrc`) and **pnpm** via Corepack
- **Docker** for Compose (Postgres, Redpanda, OpenSearch)

## Quick start

```bash
corepack enable
pnpm install
pnpm build
cp apps/api/.env.example apps/api/.env   # adjust if needed
pnpm docker:up                           # Postgres + Redpanda + OpenSearch
pnpm dev:api                             # http://localhost:3000/graphql
pnpm dev:web                             # http://localhost:5173
```

In separate terminals (after Docker is healthy):

```bash
pnpm --filter workers dev:audit    # audit consumer → Postgres
pnpm --filter workers dev:index    # indexing consumer → OpenSearch
```

The web UI creates **draft** applications, **submits** them (emits `LoanApplicationSubmitted` to Kafka), polls **loan applications** every **3s**, and shows **audit** (Postgres) and **search timeline** plus **event overview** (OpenSearch).

## Testing

- `pnpm test` — Jest coverage for `apps/api` (statements/lines/functions **≥90%**, branches **≥80%**) and unit tests for `packages/shared`.
- `pnpm --filter api test:e2e` — lightweight GraphQL health check (no Docker required).

## Layout

| Path | Role |
|------|------|
| `apps/web` | Vite + React UI |
| `apps/api` | NestJS GraphQL API |
| `apps/workers` | Event consumers (Kafka) |
| `apps/simulator` | Live-ish banker activity (simulation) |
| `packages/shared` | Shared event envelope types (Zod) |
| `infra/docker` | `docker-compose` for local stack |

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev:api` / `pnpm dev:web` | Run apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Jest (API + shared) |
| `pnpm docker:up` / `pnpm docker:down` | Start/stop Docker stack |
| `pnpm docker:config` | Validate Compose file |

## License

MIT — see [LICENSE](LICENSE).

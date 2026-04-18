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
pnpm dev:api    # http://localhost:3000/graphql
pnpm dev:web    # http://localhost:5173
```

Optional: start infrastructure services:

```bash
pnpm docker:up
```

See [docs/DEV_SETUP.md](docs/DEV_SETUP.md) for toolchain notes and [docs/INFRA.md](docs/INFRA.md) for container details.

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
| `pnpm test` | Run tests (where defined) |
| `pnpm docker:up` / `pnpm docker:down` | Start/stop Docker stack |
| `pnpm docker:config` | Validate Compose file |

## License

MIT — see [LICENSE](LICENSE).

# Local infrastructure (Docker)

`infra/docker/docker-compose.yml` runs:

- **PostgreSQL 16** — transactional source of truth (port `5432`).
- **Redpanda** — Kafka-compatible streaming API for domain events (broker on host port `9092`). Other containers should use `redpanda:29092` (internal listener).
- **OpenSearch + Dashboards** — search and operational views (`9200`, dashboards `5601`).

## Redpanda vs Apache Kafka

Redpanda is lighter for laptops and speaks the Kafka protocol, which keeps the architecture narrative aligned with **MSK** in AWS while avoiding a heavy ZooKeeper/KRaft setup locally. For interviews you can say: *local broker is Redpanda for ergonomics; production maps to MSK.*

## Commands

From the repository root:

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:config   # validates compose file
```

Use `infra/docker/.env.example` as the template for ports and DB credentials.

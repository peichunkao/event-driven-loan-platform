# Local infrastructure (Docker)

Local mirror of the managed AWS data plane used by a digital loan origination platform. `infra/docker/docker-compose.yml` runs:

- **PostgreSQL 16** — transactional source of truth for loan applications and the audit trail (port `5432`). Maps to **RDS / Aurora Postgres** in AWS.
- **Redpanda** — Kafka-compatible streaming API for domain events (broker on host port `9092`; other containers use the internal listener `redpanda:29092`). Maps to **MSK** in AWS.
- **OpenSearch + Dashboards** — search and operational views over the event stream (`9200`, dashboards `5601`). Maps to **Amazon OpenSearch Service**.

## Redpanda vs Apache Kafka

Redpanda is lighter for laptops and speaks the Kafka protocol, which keeps the architecture narrative aligned with **MSK** in AWS while avoiding a heavy ZooKeeper/KRaft setup locally. For interviews you can say: *local broker is Redpanda for ergonomics; production maps to MSK.*

## Commands

From the repository root:

```bash
pnpm docker:up
pnpm docker:down
pnpm docker:config   # validates compose file
```

Use `infra/docker/.env.example` as the template for ports and host URLs. Postgres credentials for the container are loaded from `infra/docker/postgres.env` (see `docker-compose.yml`).

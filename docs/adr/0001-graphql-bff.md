# ADR 0001: GraphQL as the frontend BFF

## Status

Accepted

## Context

The web client needs flexible reads for loan applications and operational views. Internal integration between services remains event-driven (Kafka), not GraphQL fan-out.

## Decision

Expose a **NestJS GraphQL** API to the React app. Keep resolvers thin and delegate to services. Emit domain events to Kafka from the application layer after successful writes to PostgreSQL.

## Consequences

- Positive: UI can request the shape it needs without many REST round-trips; clear boundary at the BFF.
- Negative: Caching, authorization, and complexity must be managed at the GraphQL layer; versioning still required as the schema evolves.

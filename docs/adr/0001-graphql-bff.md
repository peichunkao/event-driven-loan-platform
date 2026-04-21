# ADR 0001: GraphQL as the frontend BFF

## Status

Accepted

## Context

The banker dashboard needs flexible reads across loan applications, audit trail, and operational search views. Internal integration between services (audit worker, indexing worker, notifications) remains **event-driven (Kafka)**, not GraphQL fan-out. We want a clean line between the *public contract* consumed by the UI and the *internal event backbone* consumed by workers.

## Decision

Expose a **NestJS GraphQL** API as the frontend BFF. Keep resolvers thin and delegate to services. Emit domain events to Kafka from the application layer **after** successful writes to PostgreSQL so the transactional DB stays authoritative and downstream consumers stay decoupled from the UI.

## Consequences

- Positive: UI can request the shape it needs for the banker dashboard without many REST round-trips; clear boundary between the BFF and the internal event backbone; swapping the broker (Redpanda → MSK) or adding consumers does not touch the UI.
- Negative: Caching, authorization, and complexity must be managed at the GraphQL layer; schema versioning is still required as the domain evolves.

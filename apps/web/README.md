# `@loan-platform/web` — Banker Dashboard

Vite + React + TypeScript UI for the **Event-Driven Digital Loan Platform**. This is the banker-facing surface: create draft loan applications, submit them (which emits `LoanApplicationSubmitted` to Kafka), and watch the event-driven backbone light up through an audit timeline and an OpenSearch-backed event stream.

## How it talks to the platform

- **GraphQL only.** The UI calls the NestJS BFF at `VITE_GRAPHQL_URL` (default `http://localhost:3000/graphql`). It never talks to Kafka, Postgres, or OpenSearch directly — that separation is intentional (see ADR 0001 in the root repo).
- **Polling model.** Queries refetch every **3 s** so the dashboard feels live without adding a websocket layer. A `Pause` toggle stops polling if you want to inspect a fixed snapshot.
- **Queries used:** `loanApplications`, `loanApplication(id)`, `searchLoanEvents`, `eventOverview`, and mutations `createLoanApplication` / `submitLoanApplication`.

## Local dev

```bash
pnpm --filter web dev
```

`VITE_GRAPHQL_URL` can be overridden via `.env.local` if the API runs on a non-default host.

## Build

```bash
pnpm --filter web build
pnpm --filter web preview
```

## Future upgrade: Next.js

A Next.js migration (App Router + SSR dashboard, `/api` routes as a thin BFF proxy) is tracked as a **future upgrade** in the root README and `docs/PHASES.md`. For now this package stays on Vite so the portfolio demo boots in a single command.

# Development environment (Part A — macOS)

This document records the toolchain for the event-driven loan platform so clones behave the same on a fresh machine.

## What is already configured on this machine

| Item | Status |
|------|--------|
| Xcode Command Line Tools | Present (`xcode-select -p`) |
| Homebrew | `/opt/homebrew/bin/brew` |
| Git | System git via CLT |
| Docker | Docker Desktop / CLI working (`docker info`) |
| GitHub CLI (`gh`) | Installed via Homebrew |
| Node (fnm) | LTS installed; see `.nvmrc` |
| pnpm | Via Corepack (`corepack enable`) |
| SSH host key for `github.com` | Added to `~/.ssh/known_hosts` |
| SSH key pair | `~/.ssh/id_ed25519` (see below) |
| fnm shell hook | `eval "$(fnm env)"` appended to `~/.zshrc` |

## One-time: connect to GitHub

**Cursor’s GitHub authorization does not configure the `gh` CLI or SSH automatically.** Complete one of these:

### Option A — GitHub CLI (HTTPS or SSH)

```bash
gh auth login
```

Follow the prompts (browser login is typical). Then verify:

```bash
gh auth status
```

### Option B — SSH for `git` operations

1. Show your public key and add it at [GitHub → SSH and GPG keys](https://github.com/settings/keys):

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

2. Test:

   ```bash
   ssh -T git@github.com
   ```

   You should see: `Hi <username>! You've successfully authenticated...`

`~/.ssh/config` includes a `Host github.com` block that uses `~/.ssh/id_ed25519`.

## Every new shell / project directory

New terminals load fnm via `~/.zshrc`. In the repo you can run:

```bash
./scripts/bootstrap-mac.sh
```

Or manually: `eval "$(fnm env)"` then `fnm use` (reads `.nvmrc`).

Node version is pinned with **`.nvmrc`** and **`.node-version`** (major `24` to match current LTS).

Enable package manager:

```bash
corepack enable
```

## Optional later (Phase 4)

- AWS CLI v2: `brew install awscli`
- Configure with `aws configure sso` or access keys when you add deployment scripts.

## Monorepo (Part B)

This repository is a **pnpm workspace** (`pnpm-workspace.yaml`):

- `apps/web` — Vite + React + TypeScript
- `apps/api` — NestJS GraphQL BFF (`/graphql`)
- `apps/workers` — Kafka consumer processes (stubs until Phase 1)
- `apps/simulator` — banker activity simulation (stub)
- `packages/shared` — domain event types and Zod schemas

Typical commands from the repo root:

```bash
pnpm install
pnpm build
pnpm lint
pnpm test
pnpm --filter api test:e2e
pnpm dev:api    # Nest watch mode
pnpm dev:web    # Vite dev server
pnpm docker:up  # Postgres + Redpanda + OpenSearch (see docs/INFRA.md)
```

`pnpm install` runs `prepare`, which builds `@loan-platform/shared` first.

Copy `apps/web/.env.example` if you change the GraphQL URL (defaults to `http://localhost:3000/graphql`).

Copy `apps/api/.env.example` to `apps/api/.env` for local API settings (`DATABASE_URL`, `KAFKA_BROKERS`, `OPENSEARCH_URL`). After `pnpm docker:up`, run workers (`pnpm --filter workers dev:audit` and `dev:index`) so submitted applications produce audit rows and OpenSearch documents.

Run `pnpm test` for Jest (API coverage gates + shared package tests).

## Verification checklist

- [ ] `gh auth status` shows a logged-in user (if you use `gh`).
- [ ] `ssh -T git@github.com` succeeds after adding the public key.
- [ ] `docker info` runs without error.
- [ ] In the repo: `fnm use && node -v` matches the pinned major in `.nvmrc`.
- [ ] `pnpm build` and `pnpm --filter api test:e2e` succeed.

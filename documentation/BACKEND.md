# Backend guide

Express 5 + TypeScript API. **Process entry:** `backend/src/index.ts` (middleware stack, mounts `routes/*`, starts FSRS metrics job).

System overview: `documentation/ARCHITECTURE.md`.

## Run

From repo root:

```bash
yarn dev:backend
```

Or directly:

```bash
cd backend
yarn dev
```

## Build / Test / Lint

From repo root:

```bash
yarn build:backend
yarn test:backend
yarn lint:backend
yarn type-check:backend
```

## Environment

Backend env file:

```bash
cp backend/env.example backend/.env
```

Important variables:

- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGIN` or `CORS_ORIGINS`
- `RATE_LIMIT_*`, `AUTH_RATE_LIMIT_*`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` (optional; transactional email for password reset — use a domain-authenticated sender in Brevo; see `documentation/ENVIRONMENT_SETUP.md`)

For full env reference, see `documentation/ENVIRONMENT_SETUP.md`.

## API and health

- API base: `http://localhost:4002/api`
- Health (no auth): `http://localhost:4002/health`

## Route modules (`backend/src/routes/`)

Mounted from `index.ts` under `/api` unless noted.

- `routes/auth/` — `/auth` register, login, refresh cookie, logout, session (`auth.routes.ts` re-exports the router)
- `users.routes.ts` / `user.routes.ts` — `/users`, `/user` profile and settings
- `decks.routes.ts` — `/decks` CRUD, cards in deck, due/new queues
- `cards.routes.ts` — `/cards` CRUD, single-card review, flags, journey summary
- `reviews.routes.ts` — `/reviews` batch review
- `knowledge.routes.ts` — `/knowledge`
- `study.routes.ts` — `/study` journey consistency, study health dashboard, deck stats
- `optimization.routes.ts` — `/optimization` optimizer and snapshots
- `fsrs-metrics.routes.ts` — `/optimization/metrics` daily, summary, windows, refresh
- `admin.routes.ts` / `dev.routes.ts` — `/admin`, `/dev` (role gates)

Mutating requests use CSRF protection via `X-Requested-With` (see `index.ts`).

## Services worth opening first

- `services/review.service.ts` — writes `review_logs`, updates card FSRS state, appends journey events for ratings
- `services/card-journey.service.ts` — append-only `card_journey_events`, consistency report
- `services/fsrs.service.ts` — FSRS v6 scheduling
- `schemas/*.ts` — Zod validation; `types/database.ts` — row shapes (keep aligned with Liquibase)

## Database

- Pool: `config/database.ts`
- Migrations: repo `migrations/` (`yarn migrate:up` / `migrate:docker`)

## Related docs

- `documentation/SETUP.md`
- `documentation/ENVIRONMENT_SETUP.md`
- `documentation/WEBAPP_SCENARIOS.md`
- `documentation/FSRS_OPTIMIZER.md`

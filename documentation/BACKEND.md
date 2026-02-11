# Backend Guide

Backend service for MemoOn-Card built with Express 5 + TypeScript.

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

For full env reference, see `documentation/ENVIRONMENT_SETUP.md`.

## API and Health

- API base: `http://localhost:4002/api`
- Health: `http://localhost:4002/health`

## Related Docs

- `documentation/SETUP.md`
- `documentation/ENVIRONMENT_SETUP.md`
- `documentation/FSRS_OPTIMIZER.md`

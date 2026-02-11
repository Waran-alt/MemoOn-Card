# Frontend Guide

Frontend app for MemoOn-Card built with Next.js 16 + TypeScript.

## Run

From repo root:

```bash
yarn dev:frontend
```

Or directly:

```bash
cd frontend
yarn dev
```

## Build / Test / Lint

From repo root:

```bash
yarn build:frontend
yarn test:frontend
yarn lint:frontend
yarn type-check:frontend
```

## Environment

Frontend env file:

```bash
cp frontend/env.example frontend/.env
```

Most important variable:

- `NEXT_PUBLIC_API_URL` - backend URL used by browser requests

For full env reference, see `documentation/ENVIRONMENT_SETUP.md`.

## App URLs

- Frontend: `http://localhost:3002`
- Locale routes: `http://localhost:3002/en` and `http://localhost:3002/fr`

## Related Docs

- `documentation/SETUP.md`
- `documentation/QUICK_START.md`
- `documentation/ENVIRONMENT_SETUP.md`

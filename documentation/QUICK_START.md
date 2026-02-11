# Quick start

Get the app running and use it in a few minutes.

## Prerequisites

- Node.js >= 22.0.0  
- Yarn 4.12.0+ (e.g. `corepack enable && corepack prepare yarn@4.12.0 --activate`)  
- Docker & Docker Compose (for DB and optional full stack)  
- PostgreSQL 17+ (or use Docker)

## 1. Install and env

```bash
# From repo root
yarn install

# Environment: copy examples and set values (see documentation/ENVIRONMENT_SETUP.md)
cp env.example .env
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
# Edit backend/.env (JWT_SECRET, CORS_ORIGIN) and frontend/.env (NEXT_PUBLIC_API_URL) as needed
```

## 2. Database and migrations

```bash
# Start Postgres (standalone)
yarn postgres

# Run migrations
yarn migrate:up
```

## 3. Run the app

**Standalone:**

```bash
yarn dev:backend   # backend on BACKEND_PORT (e.g. 4002)
yarn dev:frontend  # frontend on FRONTEND_PORT (e.g. 3002)
```

**With Docker:**

```bash
yarn docker:up
```

Open the frontend (e.g. `http://localhost:3002` or `https://memoon-card.localhost`).

## 4. Use the app

The flow is straightforward:

1. **Register** – Create account (email + password).
2. **Sign in** – Log in with those credentials.
3. **My decks** – Create a deck (title, optional description).
4. **Deck detail** – Open a deck, add **cards** (front/back, optional comment).
5. **Study** – Start a session, see cards, rate (Again / Hard / Good / Easy); session ends when the queue is empty.

No separate user guide is needed; the UI is self-explanatory.

## Next

- **Docs index:** `documentation/README.md`
- **Core docs:** `documentation/ENVIRONMENT_SETUP.md`, `documentation/SETUP.md`, `documentation/FSRS_OPTIMIZER.md`
- **README:** Project structure, lockfile, tech stack, and links at repo root `README.md`

# Memoon Card - Setup Guide

Quick setup guide for Memoon Card application.

## Configuration

- **Client ID**: `memoon-card`
- **Subdomain**: `memoon-card`
- **Full URL**: `https://memoon-card.yourdomain.com`
- **Frontend Port**: `3002`
- **Backend Port**: `4002`
- **Database**: `memoon_card_db`

## Environment Setup

Create a `.env` file in the client root directory with the following variables:

```bash
# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development

# =============================================================================
# FRONTEND
# =============================================================================
FRONTEND_PORT=3002
NEXT_PUBLIC_API_URL=http://localhost:4002

# =============================================================================
# BACKEND
# =============================================================================
BACKEND_PORT=4002

# =============================================================================
# DATABASE
# =============================================================================
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=memoon_card_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# =============================================================================
# DATABASE CONNECTION (for Liquibase, optional)
# =============================================================================
# DATABASE_URL=jdbc:postgresql://localhost:5432/memoon_card_db
```

**Important Notes:**
- Update `POSTGRES_PASSWORD` with a secure password
- Configure client-specific variables (JWT, CORS, LOG_LEVEL, etc.) as needed for your application
- Ports must match the values in `client.config.json` (3002/4002)

## Development

### Standalone Development

```bash
# Start database
docker-compose up -d postgres

# Run migrations
yarn migrate:up

# Start backend
cd backend && yarn dev

# Start frontend (in another terminal)
cd frontend && yarn dev
```

### Integrated with Portfolio (https://memoon-card.localhost)

The subdomain **https://memoon-card.localhost** is served by the Portfolio Nginx proxy. It only works when memoon-card runs **from the Portfolio root** with the generated client compose, so Nginx and memoon-card containers share the same Docker network.

1. **From Portfolio repo root**, generate client config and start the full stack:
   ```bash
   yarn discover:clients
   docker-compose -f docker-compose.yml -f .generated/docker-compose.clients.yml up -d
   ```

2. **Run migrations** (from Portfolio root):
   ```bash
   yarn migrate:client memoon-card
   ```

3. **If you get 502 on https://memoon-card.localhost:**  
   Nginx cannot reach `memoon-card-frontend:3002`. Ensure you started services from **Portfolio root** with the override above (not only `docker-compose up` from this directory). If you run memoon-card from this directory (`clients/memoon-card`) with its own `docker-compose up`, those containers use a different network and Nginx will return 502. Use **http://localhost:3002** when running memoon-card standalone.

## View and manage the database

PostgreSQL runs in Docker. Use any of these:

**1. Command line (psql)** — open a shell inside the Postgres container:

```bash
docker-compose exec postgres psql -U postgres -d memoon_card_db
```

Then run SQL (e.g. `\dt` to list tables, `\q` to quit).

**2. GUI client** — connect with:

| Setting   | Value                                                        |
|-----------|--------------------------------------------------------------|
| Host      | `localhost`                                                  |
| Port      | `5432` (or `POSTGRES_PORT` from `.env`)                      |
| Database  | `memoon_card_db`                                             |
| User      | `postgres`                                                   |
| Password  | value of `POSTGRES_PASSWORD` in `.env` (default `postgres`)  |

Examples: [pgAdmin](https://www.pgadmin.org/), [DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/), [Beekeeper Studio](https://www.beekeeperstudio.io/).

**3. Migrations**

```bash
yarn migrate:up      # apply pending migrations
yarn migrate:status  # show migration status
```

## Access

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:4002
- **Production URL**: https://memoon-card.yourdomain.com

## Notes

- Ports are configured in `client.config.json`
- Database name is `memoon_card_db`
- This file was auto-generated - update as needed for your setup

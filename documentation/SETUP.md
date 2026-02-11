# Setup Guide for MemoOn Card

This guide covers setup and local development for MemoOn-Card.

For an overview of all docs, see `documentation/README.md`.

## Prerequisites

- Node.js >= 22.0.0
- Yarn 4.12.0+
- Docker & Docker Compose
- PostgreSQL 17+ (or use Docker)
- Git

## Initial Setup

### 1. Install Yarn (if not already installed)

```bash
corepack enable
corepack prepare yarn@4.12.0 --activate
```

### 2. Install Dependencies

```bash
# Install dependencies from repo root
yarn install
```

### 3. Set Up Environment Variables

```bash
cp env.example .env
# Copy backend/env.example to backend/.env and frontend/env.example to frontend/.env as needed
# Edit with your configuration (JWT, CORS, API URL, etc.)
```

### 4. Frontend and Backend

This repository already includes both applications:
- `frontend/` (Next.js app)
- `backend/` (Express + TypeScript API)

No framework scaffolding is required.

### 5. Set Up Database Migrations

The Liquibase migration structure is already set up in `migrations/`.

To run migrations:

```bash
# Ensure Liquibase is installed
# Option 1: Use Docker (recommended)
docker run --rm -v $(pwd)/migrations:/liquibase/changelog \
  -e LIQUIBASE_COMMAND_URL=jdbc:postgresql://localhost:5433/memoon_card_db \
  -e LIQUIBASE_COMMAND_USERNAME=postgres \
  -e LIQUIBASE_COMMAND_PASSWORD=postgres \
  -e LIQUIBASE_COMMAND_CHANGELOG_FILE=changelog.xml \
  memoon-liquibase update

# Option 2: Install Liquibase locally
# Download from https://www.liquibase.org/download
liquibase --changeLogFile=migrations/changelog.xml update
```

Or add a script to `package.json`:

```json
{
  "scripts": {
    "migrate:up": "liquibase --changeLogFile=migrations/changelog.xml update"
  }
}
```

### 6. Start Services

#### Option A: Docker Compose (Recommended)

```bash
yarn docker:up
```

This starts:
- PostgreSQL database
- Backend API (if Dockerfile exists)
- Frontend (if Dockerfile exists)

Default ports:
- Frontend: `3002`
- Backend: `4002`
- Postgres host port: `5433` (container internal port remains `5432`)

#### Option B: Local Development

```bash
# Terminal 1: Start database
yarn postgres

# Terminal 2: Start backend
cd backend && yarn dev

# Terminal 3: Start frontend
cd frontend && yarn dev
```

### 7. Verify Setup

- Frontend: http://localhost:3002
- Backend API: http://localhost:4002/health
- Database: `psql -h localhost -p 5433 -U postgres -d memoon_card_db`

## Next Steps

1. **Customize migrations**: Edit `migrations/changesets/001-initial-schema.xml` with your database schema
2. **Build features**: Start developing your application features
3. **Add tests**: Expand Vitest coverage (backend + frontend)
4. **Set up CI/CD**: Configure GitHub Actions or similar
5. **Deploy**: Prepare for deployment (see deployment documentation)

## Project Structure

```
memoon-card/
├── frontend/              # Frontend application
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── backend/               # Backend API
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── migrations/            # Database migrations
│   ├── changelog.xml
│   └── changesets/
├── docker-compose.yml     # Docker services
├── .env                    # Local environment file (from env.example)
└── README.md             # Project overview
```

## Troubleshooting

### Port conflicts
- Change ports in `.env` if `3002`, `4002`, or `5433` are already in use

### Database connection issues
- Ensure PostgreSQL is running: `docker compose ps`
- Check credentials in `.env` match `docker-compose.yml`

### Migration errors
- Verify database exists: `docker compose exec postgres psql -U postgres -l`
- Check Liquibase configuration and changelog syntax

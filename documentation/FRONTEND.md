# Frontend guide

Next.js App Router + TypeScript + Tailwind. Locales **`en`** and **`fr`** at `/{locale}/...`.

Layout shell for the product: `frontend/src/components/AppLayoutShell.tsx`. System overview: `documentation/ARCHITECTURE.md`.

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

## App Router layout (mental model)

- `src/app/[locale]/(protected)/layout.tsx` — requires login (server session check)
- `src/app/[locale]/(protected)/app/layout.tsx` — wraps pages with **AppLayoutShell** (nav)
- `src/app/[locale]/(protected)/app/decks/[id]/study/page.tsx` — study queue and review submission

## API client and auth

- `src/lib/api.ts` — Axios client: bearer token, `X-Requested-With` on mutations, 401 refresh retry
- `src/store/auth.store.ts` — access token + user
- `src/lib/auth.ts` — server-side session from cookies
- `public/locales/{en,fr}/` — i18n JSON; `src/hooks/useTranslation.ts` — typed access

## Related docs

- `documentation/SETUP.md`
- `documentation/QUICK_START.md`
- `documentation/ENVIRONMENT_SETUP.md`
- `documentation/PAGES_AND_AUTH_REVIEW.md`

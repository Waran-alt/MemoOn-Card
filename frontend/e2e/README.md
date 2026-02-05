# E2E tests (Playwright)

Run against a **running** frontend and backend (e.g. Docker stack or `yarn dev` + backend). Tests use **Chromium** only by default.

## One-time setup

```bash
# From repo root or frontend
yarn install
npx playwright install chromium
```

## Run tests

1. Start the app (frontend and backend reachable; frontend port from `FRONTEND_PORT` or default in `e2e/config.ts`).
2. **Same origin for cookies:** When using `E2E_BASE_URL=https://memoon-card.localhost`, the frontend must use the **same origin** for API calls so the refresh cookie is set for that host. Set `NEXT_PUBLIC_API_URL=""` (empty) in the frontend env when serving at `https://memoon-card.localhost`, then restart the dev server. Otherwise the cookie is set for a different host and the app redirects to Sign in after register.
3. **CORS:** If you use `http://localhost:3002` for E2E, the backend must allow that origin (e.g. `CORS_ORIGINS` includes `http://localhost:3002`), or run with `E2E_BASE_URL=https://memoon-card.localhost`.
4. From repo root or `frontend`:

   ```bash
   yarn test:e2e
   # or override base URL:
   E2E_BASE_URL=https://memoon-card.localhost yarn test:e2e
   ```

Optional env (see `env.example`): `E2E_BASE_URL`, `E2E_TEST_PASSWORD`. Defaults live in `e2e/config.ts` (no hardcoded values in specs).

## What’s covered

- **auth.spec.ts**: Landing (Create account / Sign in); unauthenticated redirect to login for `/app` and `/app/decks/:id`; register short-password validation; login wrong-password error; login/register navigation; logged-in redirect from `/` to My decks.
- **login.spec.ts**: Full flow: register → sign out → sign in with same credentials → My decks.
- **study.spec.ts**: Register → create deck → create card → study (Good) → Session complete; study empty deck (No cards to study); two cards with Again/Easy and session count; exit study → deck; two decks on My decks and Back to decks.

Credentials are generated per run (no shared test user).

# Local development

Requirements: Node 24, Python 3.12, Git and Docker Desktop with Linux containers. Commands below run from the repository root unless a directory is given. Compose ports bind only to loopback. Its passwords are development-only values.

1. Start dependencies: `docker compose -f compose.dev.yml up -d --wait`.
2. Install Python tooling if needed: `python -m pip install uv==0.13.9`.
3. In `backend`, install the lockfile: `python -m uv sync --locked`.
4. In `frontend`, install the lockfile: `npm ci`.
5. Before the first API run, create the local runtime roles and apply migrations using the block below.
6. In `backend`, run the API: `python -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`.
7. In a separate terminal in `frontend`, run `npm run dev`; open `http://127.0.0.1:5173`. Vite proxies `/api` to FastAPI.

Public pages now fetch AniList directly in the browser. The legacy API catalogue remains a clearly labelled development fixture service, rejected in production. Supabase Google sign-in requires the actual publishable key and configured exact redirect URL; a database password does not configure OAuth. The owner has deferred Google configuration.

## Browse without the backend

In `frontend`, run `npm ci` once and `npm run dev`. Open `http://127.0.0.1:5173`. Home, anime/manga search and provider-reference detail links do not require FastAPI, PostgreSQL or Redis. Internet access and an available provider are still needed. Guest browsing has no startup banner. Opening sign-in or saving as a guest shows the Google option and requests an immediate readiness check. A shaped loading panel remains in that dialog while personal services start. Existing probes run every 12 seconds after failed checks, with an 8-second request timeout and a five-minute startup window; Retry starts another window. Saves and tracking still require actual authentication and readiness.

The browser queue respects provider cooldowns and spaces reads. Episode display now fetches AniZip independently after a valid title loads; individual provider failures keep the rest of the page usable. See [browser-first architecture](../architecture/browser-first-catalogue.md) for cache, identity and source limitations. Production provider clearance remains separate from development; `VITE_ANILIST_USE_APPROVED=false` and `VITE_ANIZIP_USE_APPROVED=false` are the example defaults. The [three-provider addendum](../product/MULTI_PROVIDER_METADATA_PLAN.md) tracks the remaining trusted episode reconciliation and server-side TMDB enrichment.

Identity lookups used by setup/save/details share a paced browser queue and honor server Retry-After. See [current limits and setup behavior](rate-limits.md). Selecting several favorites takes time to verify; keep the page open while saving. The API still enforces its unchanged shared 24/minute and 1/second resolver guard.

## Local database migration and integration tests

From `backend`, after starting compose:

```powershell
python -m uv run python ../scripts/bootstrap_local_db.py
$env:APP_ENV = 'development'
$env:DATABASE_URL = 'postgresql+asyncpg://alcor_app:alcor_local@127.0.0.1:55432/alcor'
$env:REDIS_URL = 'redis://127.0.0.1:56379/0'
$env:MIGRATION_DATABASE_URL = 'postgresql+asyncpg://alcor_migrate:alcor_local_migration@127.0.0.1:55432/alcor'
python -m uv run alembic upgrade head
```

The API can now be started with the command in step 6. These variables explicitly select loopback development services, even if an ignored configuration file contains other connection settings. For later starts, use the same local settings or the unchanged development defaults.

Optional integration checks, in the same terminal:

```powershell
$env:ALCOR_RUN_INTEGRATION = '1'
python -m uv run pytest -q
```

The bootstrap script targets only the fixed loopback development database. It creates a separate non-superuser, NOBYPASSRLS runtime role. Migration credentials are never a runtime fallback. Local development passwords are not production credentials. Without explicit integration opt-in, database/Redis tests are skipped; do not report them as executed. Tests leave randomly owned disposable local records; they do not target Supabase.

The current local head is migration 008 (versioned recommendation feedback). Remote environments require their own approved migration/release process. `/api/v1/health` checks process liveness; `/api/v1/ready` verifies PostgreSQL and Redis. Local defaults use explicit `127.0.0.1` to avoid a reproduced Windows Redis timeout through `localhost`.

If the signed-in bookmark stays disabled, compare `http://127.0.0.1:8000/api/v1/ready` with `http://127.0.0.1:5173/api/v1/ready`. Both must return JSON containing `status: ready`. An HTML/200 response from port 5173 means the frontend is serving its page instead of proxying the API; the button remains gated correctly. Restart the ALCOR frontend from its `frontend` directory, then refresh the page. A separate app may occupy `localhost:5173` over IPv6; use the explicit ALCOR address above. Do not disable the readiness/authentication guard to make the control clickable.

## Checks

| Directory | Command | Purpose |
| --- | --- | --- |
| backend | `python -m uv run ruff check .` | Python static checks |
| backend | `python -m uv run pytest -q` | API and policy tests; integration prerequisites documented with tests |
| frontend | `npm run lint` | TypeScript/React rules and shared-layer restrictions |
| frontend | `npm run build` | Type check and production asset build |
| backend | `python -m uv run python ../scripts/export_openapi.py` with `PYTHONPATH=.` | Export API contract |
| frontend | `npm run contracts` | Generate TypeScript contract types |
| root | `git diff --check` | Whitespace/diff hygiene |

No automatic script applies migrations to the supplied remote database. Inspect and test them locally first. Keep migration credentials separate from the restricted application role; do not use the Supabase administrative connection as the API runtime identity.

The owner-authorized Supabase migration was applied through `007_source_identity` on 25 November 2026. See the [execution and verification record](supabase-migration.md). Local startup still selects the local database; remote migration does not configure authentication or a deployed API login.

Stop local dependencies without deleting data: `docker compose -f compose.dev.yml stop`. Do not remove volumes unless a deliberate local reset is intended.

## Account frontend configuration

Email/password registration, login, confirmation and password recovery use Supabase. Google is an optional additional provider. The Google setup paragraph is removed; absent configuration produces contextual feedback only after an email attempt, and sends no credentials. A running FastAPI server cannot supply missing account configuration.

Set `VITE_SUPABASE_URL` and an actual `sb_publishable_` key in ignored `frontend/.env.local`; the frontend does not accept secret/service-role keys or legacy anon JWT keys. Enable the Email provider and configure confirmation/password requirements in the dedicated project. Allow the exact frontend callback URLs `/auth/callback`, `/auth/callback?setup=1` and `/auth/callback?recovery=1` on the intended origin; configure Google separately if it is wanted. API `SUPABASE_URL` and `JWT_ISSUER` must identify that same project. Restart Vite and the API after configuration changes.

On 25 November 2026 the owner supplied the publishable key. Local ignored frontend configuration and backend URL/issuer are now set, and both services were restarted. Use `http://127.0.0.1:5173`. A real browser Auth-settings read succeeded: Email/signup enabled, confirmation required, Google disabled. The API's configured JWKS exposes ES256. The sign-up form reaches the configured SDK; verification intercepted the signup request before Supabase, so it created no account or email. Real registration, confirmation/recovery delivery and callback allowlisting still need an actual account workflow check. These local configuration files are not committed; another machine or deployed environment needs its own values. The API still uses the local restricted database.

Implementation references: [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [email signup](https://supabase.com/docs/reference/javascript/auth-signup), [password login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [JavaScript OAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth). The SDK owns one persisted session; the storage adapter discards Google provider credentials. Passwords remain in form memory and are passed only to Supabase. Pending desired-state actions expire after ten minutes and are consumed once. Confirmation-required signup does not create an application session; recovery never resumes a library save. Complete staged authentication/email and independent security review before public use.

## Personal profile and dashboard

`/setup` has three steps and nine optional questions. It supports skip, back, edit, searchable favorites and distinct dislikes/exclusions. Saving resolves new favorite identities through the existing authenticated source resolver, then PUTs `/api/v1/me/setup` with both expected profile/preference versions. The API verifies catalogue UUIDs and atomically saves the name and versioned preferences JSON. No schema migration is required; an older preferences client cannot silently erase an omitted intelligence profile. Favorites and watching-start years never create progress or completion records.

`/dashboard` is the default account landing page. It combines continue queues, favorites, wishlist and explicit-filter suggestions. Strict genre exclusions override likes; publication/episode limits apply only with known metadata, and saved history filtering uses the existing account exclusion endpoint. No preference evidence means a general discovery label. The weighted scoring proposal, learned narratives and APEA remain deferred; story traits and soft dislikes are stored as explicit answers without invented ranking weights.

The setup/dashboard HTML files under `frontend/tests/e2e/` are component-preview fixtures for browser QA. They are not production routes, account sessions or authentication bypasses. Live account workflow acceptance still needs actual Supabase configuration.

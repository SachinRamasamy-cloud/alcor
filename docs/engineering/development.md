# Local development

Requirements: Node 24, Python 3.12, Git and Docker Desktop with Linux containers. Commands below run from the repository root unless a directory is given. Compose ports bind only to loopback. Its passwords are development-only values.

1. Start dependencies: `docker compose -f compose.dev.yml up -d --wait`.
2. Install Python tooling if needed: `python -m pip install uv==0.13.9`.
3. In `backend`, install the lockfile: `python -m uv sync --locked`.
4. In `frontend`, install the lockfile: `npm ci`.
5. In `backend`, run the API: `python -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`.
6. In `frontend`, run `npm run dev`; open `http://127.0.0.1:5173`. Vite proxies `/api` to FastAPI.

Default development catalogue mode is explicitly labelled fixtures. Supabase Google sign-in requires the actual publishable key and configured exact redirect URL; a database password does not configure OAuth. The owner has deferred Google configuration.

## Local database migration and integration tests

From `backend`, after starting compose:

```powershell
python -m uv run python ../scripts/bootstrap_local_db.py
$env:MIGRATION_DATABASE_URL = 'postgresql+asyncpg://alcor_migrate:alcor_local_migration@127.0.0.1:55432/alcor'
python -m uv run alembic upgrade head
$env:ALCOR_RUN_INTEGRATION = '1'
python -m uv run pytest -q
```

The bootstrap script targets only the fixed loopback development database. It creates a separate non-superuser, NOBYPASSRLS runtime role. Migration credentials are never a runtime fallback. Local development passwords are not production credentials. Without explicit integration opt-in, database/Redis tests are skipped; do not report them as executed. Tests leave randomly owned disposable local records; they do not target Supabase.

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

Stop local dependencies without deleting data: `docker compose -f compose.dev.yml stop`. Do not remove volumes unless a deliberate local reset is intended.

## Account frontend configuration

Google remains disabled until the owner enables it. Set `VITE_SUPABASE_URL` and an actual `sb_publishable_` key in ignored `frontend/.env.local`; the current frontend intentionally does not accept secret/service-role keys or legacy anon JWT keys. Add the exact frontend origin plus `/auth/callback` to Supabase's redirect allowlist and configure Google in that dedicated project. API `SUPABASE_URL`/`JWT_ISSUER` must identify the same project. Restart Vite after configuration changes.

Implementation references: [Supabase PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [JavaScript OAuth](https://supabase.com/docs/reference/javascript/auth-signinwithoauth). The SDK owns one persisted session; the storage adapter discards Google provider credentials. Pending desired-state actions are session-scoped, expire after ten minutes and are consumed once. The API still verifies signatures and ownership. Complete staged OAuth and independent security review before public use; mocks are not evidence of a real Google login.

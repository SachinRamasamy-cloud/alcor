# Local development

Requirements: Node 24, Python 3.12, Git and Docker Desktop with Linux containers. Commands below run from the repository root unless a directory is given. Compose ports bind only to loopback. Its passwords are development-only values.

1. Start dependencies: `docker compose -f compose.dev.yml up -d --wait`.
2. Install Python tooling if needed: `python -m pip install uv==0.13.9`.
3. In `backend`, install the lockfile: `python -m uv sync --locked`.
4. In `frontend`, install the lockfile: `npm ci`.
5. In `backend`, run the API: `python -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`.
6. In `frontend`, run `npm run dev`; open `http://127.0.0.1:5173`. Vite proxies `/api` to FastAPI.

Database migration instructions are introduced with the database feature. Default development catalogue mode is explicitly labelled fixtures. Supabase Google sign-in requires the actual publishable key and configured exact redirect URL; a database password does not configure OAuth.

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

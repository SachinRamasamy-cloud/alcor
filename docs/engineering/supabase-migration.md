# Supabase migration record

Date: 25 November 2026 (Asia/Calcutta). Project: `jkwwfkvjjttokashirxe`. Work order: A20. Owner authorization: "run the migration".

## Applied changes

Applied the existing, unchanged Alembic revisions `001_library` through `007_source_identity` from source commit `ef3a6fe`. Created the prerequisite `alcor_runtime` role with NOLOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION and NOBYPASSRLS. The migration connection used TLS and the supplied administrative credentials in process memory only.

The database now has two catalogue tables and twelve personal tables. Supabase's managed table inventory was unchanged. No fixture catalogue or personal history was imported.

## Execution and evidence

The local one-off runner received JSON credentials through stdin. Its modes were `preflight`, `apply` and `verify`; it and its nonsecret metadata snapshots remain under ignored `.local/`. Application migration files and runtime configuration were not edited.

Preflight found PostgreSQL 17.12, no application schemas, no Alembic head and no existing `alcor_runtime` role. After creating that role, the runner called `alembic.command.upgrade(Config('alembic.ini'), '007_source_identity')` from `backend`, with `MIGRATION_DATABASE_URL` set only inside that process. Existing Alembic transaction handling applied the chain. The final database head is `007_source_identity`.

| Check | Result |
| --- | --- |
| Local `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q` | 42 passed |
| Remote schema versus tested local schema | Exact match: 93 columns, 55 constraints, 30 indexes, policies and runtime grants |
| Personal table protection | All 12 have enabled and forced owner RLS |
| Supabase browser roles | Neither `anon` nor `authenticated` has table access to either application schema |
| Account isolation | Only current-owner rows visible; other-owner update affected zero rows; wrong-owner insert rejected |
| Missing account context | Zero private rows visible |
| Verification cleanup | All probe rows and temporary SET-role membership changes rolled back; personal tables empty |
| Managed schemas | Same table inventory before and after |

Failures and corrections: E081-E083 in [error-log.md](error-log.md). The timeout-argument failure occurred before the migration connection; a later SET-role failure affected verification only. Both were diagnosed and corrected without changing migration SQL or weakening policies.

## Recovery and remaining setup

The baseline contained no application schema/data. A failed migration transaction rolls back its schema changes; a separately created unused group role can remain for a reviewed retry. Following a successful migration, use reviewed forward migrations or a tested restore. Existing downgrade functions intentionally refuse destructive reversal. No remote restore was performed or claimed.

The local API still uses its local restricted database connection. `alcor_runtime` is a privilege group, not a login credential; backend deployment still needs a separate restricted login inheriting that group. Do not use the administrative connection as the API identity.

Email registration still needs the browser-safe Supabase publishable key, Email-provider/callback configuration and matching API issuer settings. Database migration does not configure Supabase Auth. Live account/email workflows, independent security review and production release remain pending.

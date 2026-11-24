# Verification and acceptance record

## Baseline

- Task: ALCOR v1 implementation. Initial risk: L2 public workflows; L4 authentication/private data/release boundaries.
- Source: initial commit `12b945b`; requirements: supplied master/editorial v1.0.
- Inspected: repository, environment, full D-SSBP protocol, both plans.
- Commands: `git ls-remote`, `git clone`, `git status --short --branch`, `git log --oneline -5`, version checks and `docker info`.
- Outcome: remote readable; no application tests exist at baseline. Docker daemon unavailable initially. GitHub CLI absent; ordinary Git available.
- Unrequested changes: none. Scientific status: not applicable; no scientific method is being implemented.
- Engineering/security/editorial review: pending human review. Release authorization: repository push requested; production release not established.
- Decision: ready for bounded implementation under the supplied contracts, not approved for production release.

Per-feature executed commands, results, source commits and limitations will be appended here. “Implemented” and “verified” do not mean human-accepted or released.

## A01 — Foundation

- Change: locked React/Vite and FastAPI environments; typed configuration, standard API errors/request IDs, local PostgreSQL/Redis with pinned image digests, contract export/types, lint rules and CI. No personal-data tables or remote mutations in this slice.
- Commands: `python -m uv sync`; `python -m uv run ruff check .`; `python -m uv run pytest -q`; OpenAPI export with `PYTHONPATH=.`; `npm run contracts`; `npm run lint`; `npm run build`; `docker compose -f compose.dev.yml up -d --wait`; `git diff --check`.
- Results: Python static checks passed; 2 tests passed (health/error contract and production fixture rejection); TypeScript/lint/build passed; generated types succeeded; both local dependencies healthy. npm installation audit reported zero vulnerabilities. Final assets use only required Inter Latin weights.
- Additional evidence: Supabase read-only inspection succeeded. The supplied role bypasses RLS and is excluded from runtime design. Tenrai bounded endpoint results are recorded separately, without production approval.
- Dependencies: specified framework/testing stack, resolved in `package-lock.json` and `uv.lock`; no peer dependency overrides.
- Status: implementation and local verification complete for this slice. Human code/security/editorial review, GitHub CI execution and production acceptance pending. The minimal boot page is replaced by the public website in A02; it is not a claimed product release.

## A02 — Public catalogue and website

- Source baseline: `a1e854d`. Changes: attributed 18-title development fixture boundary; catalogue/search/details/episode API contracts; cursor/context validation; responsive public pages; content registry; shared motion/dialog/feedback components; public browser tests.
- Commands: backend `ruff check . --fix`, `ruff format app tests`, `pytest -q` and sequential OpenAPI export; frontend `npm run contracts`, `npm run lint`, `npm run test`, `npm run build`, `npx playwright install chromium`, `npx playwright test`; `git diff --check` before commit.
- Results: 5 Python tests and 3 editorial tests passed. Final browser rerun: 7 passed, including five widths (320/375/768/1024/1440), zero selected WCAG A/AA Axe violations, no horizontal overflow, guest browse/search/reload, sign-in focus restoration and provider-error distinction. Initial failures and corrections are in E009–E013. Original acceptance assertions were preserved.
- Build: initial entry about 141 KB gzip; lazy public route about 7 KB gzip in the measured build. These are build sizes, not field Core Web Vitals measurements.
- Visual evidence: inspected 320px and 1440px screenshots from the browser run. In-app browser access host unavailable; no interactive browser review claimed. Test screenshots/traces are local generated artifacts, with CI configured to upload browser results.
- Status: public development slice implemented/verified. Episode coverage may be unavailable; empty unsupported tabs/actions are omitted. P0 rights, production source, operational validation, manual screen-reader, independent engineering and editorial acceptance remain pending. This is not a P2 production exit or a production release.

## A03 — Private library API checkpoint

- Source baseline: `24f39d3`. Implemented backend only: asymmetric JWT verification, protected routes, transaction-local identity, restricted runtime role, PostgreSQL RLS, library/wishlist persistence, status/version checks, soft wishlist removal, append-only activity and atomic shared Redis limits for private endpoints.
- Commands: `python -m uv run python ../scripts/bootstrap_local_db.py`; `python -m uv run alembic upgrade head` with explicit local migration URL; `python -m uv run ruff check .`; `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q`; sequential OpenAPI export/type generation; frontend lint/test/build.
- Results: 17 Python tests passed, including real PostgreSQL concurrent wishlist idempotency, atomic planned-to-in-progress status change, version conflict, two-account RLS, pooled-context reset and shared Redis second/minute budgets. Invalid JWT signature/algorithm/issuer/audience/expiry/subject/role cases passed. The concurrent secondary-unique-constraint failure and fix are recorded in E014.
- Integration scope: local Docker PostgreSQL/Redis only. Tests use actual restricted database credentials. Supabase was inspected read-only; no remote schema or data mutations occurred. Google OAuth remains unconfigured at the owner's request. No development authentication bypass was added.
- Status: backend checkpoint implemented and locally verified; frontend personal workflows and real OAuth callback/resume are not implemented. Independent security/engineering review, key-rotation integration, production abuse controls and all release gates remain pending. Do not call this a completed P3 phase or production release.

## Session stop requested by owner

The owner requested a stop because the device battery was low. Remaining source, generated contracts, documentation and error records are committed on the existing review branch and pushed. No claim is made that the full implementation plan is complete. See `docs/engineering/handover.md` for the next ready tasks.


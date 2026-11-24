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


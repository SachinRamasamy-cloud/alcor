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


## A03-F ? Account frontend, 25 November 2026

- Baseline: `bcba4a9`; authority: master plan ?8/?10.1 and resume request. Frontend auth boundaries L4; library UI L2. No backend contracts, dependencies or production services changed.
- Implemented: configurable Google PKCE, validated ten-minute pending actions, deduplicated callback exchange/replay, session/account cache cleanup, bearer injection with expected-account checks, library/wishlist pages, status filtering, keyset page navigation, versioned start/remove actions and confirmation dialog. Private queries are keyed by account. Guest writes remain blocked; absent configuration stays visibly unavailable. SDK session persistence removes unneeded provider credentials.
- Executed: `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e` in frontend; `git diff --check`. 16 unit/component tests passed; 7 browser regressions passed across 320/375/768/1024/1440px, including accessibility, focus and guest behavior. Callback tests use a mocked SDK; authenticated UI tests use mocked transport, not a runtime bypass. No real Google login was performed.
- Build: initial entry approximately 199 KB gzip, under the plan's 250 KB gzip budget. Vite warned about the uncompressed chunk exceeding 500 KB; no threshold was relaxed. Field performance is unmeasured.
- Source review identified a possible queued request/account-switch race; transport now checks the expected account before fetch, with a regression test. Existing published API and protected tests preserved.
- Status: implemented and locally verified on the review branch. Human security/editorial acceptance, real staged OAuth, signed private browser-to-API workflow and production release remain pending. P3 imports/export, P4 progress and subsequent roadmap features are not complete.

## B01 ? Episode lookup failure feedback

- Baseline `7d75845`; risk L2. Required behavior and failing regression recorded before the fix in work-orders B01.
- Reproduction: `npx playwright test --grep 'episode lookup'` failed because the episode section contained no alert/retry after HTTP 503. The title synopsis remained available.
- Fix: handle pending/error states before the successful missing-coverage branch. Retry refetches only the episode query. No provider, API or schema changes.
- Verification: frontend `npm run lint` and `npm run build` passed; `npm run test:e2e` passed all 8 tests with the original failure assertion preserved. The preceding account frontend suite passed 16 unit/component tests. Diff whitespace check passed. Vite's known size warning remains documented in E017.
- Status: implementation/local verification complete on the review branch. Human review and production acceptance pending. This fix does not supply missing episode metadata.

## A04-A - Exact tracking vertical slice

Date: 25 November 2026. Baseline `459a036`. Risk L2 behavior/L4 ownership boundaries. Scope and independent expected results are recorded in remaining-scope.md. Owner explicitly excludes Google configuration, import and export from the remaining build.

Implemented: additive local migration 002; owned sessions and sparse progress; manual string/decimal targets; versioned bounded bulk marks/unmark; explicit completion assertions; immutable prior session history during repeats; 100-target response pages; continue queues; atomic library start integration; shared frontend tracker on title details. Manual targets have unknown dates/final total and cannot auto-complete. Source metadata determines coverage separately. One activity event records each changed bulk action. No-op writes preserve versions and do not announce success.

Commands executed: local `docker compose -f compose.dev.yml up -d --wait`; backend `uv run alembic upgrade head` with the local migration URL, `uv run ruff check . --fix`, `uv run ruff format app tests`, `ALCOR_RUN_INTEGRATION=1 uv run pytest -q`, sequential OpenAPI export; frontend `npm run contracts`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`; whitespace check before commit. Python commands used `python -m uv` on this host.

Results: 23 Python tests passed, including actual PostgreSQL owner isolation/composite-reference rejection, retry identity, stale versions, exact 9/1/2/next-9 example, decimal/bonus chapter identity, manual append, pagination and repeat preservation. Frontend: 18 unit/component tests passed; 8 existing public browser regressions passed. Continue queue uses a bounded two-query batch. Build passed, known uncompressed bundle-size warning retained; initial entry remains about 200 KB gzip. E020 documents corrected copy encoding; E021 documents a rejected patch with no partial mutation.

Status: this vertical slice is implemented/locally verified on the review branch. No remote migrations or real Google login executed. Human security/editorial review and production acceptance remain pending. Per-item ratings/notes, undo/corrections, release-driven target reconciliation, long-series performance, real authenticated browser workflows and other remaining-scope items are not claimed complete by this record.

## Collections vertical slice

Date: 25 November 2026. Baseline `078acfc`. Risk L2 behavior/L4 ownership. Requirements: original collections contract and remaining-scope.md. Implemented additive local migration 003, RLS-owned collection/item records, idempotent create request identity, versioned rename/item/reorder/delete, soft collection deletion, bounded lists/detail pages, collection UI and title-page picker. Membership is independent of library status; deletion never removes library/history. No dependency or remote DB change.

Executed: local Alembic upgrade, backend ruff/format and `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q`; sequential OpenAPI export and frontend contract generation; frontend lint/test/build and public browser suite. Results: 24 Python tests and 20 frontend tests passed. Collection tests cover create retry/no-op, optimistic conflict, two-account RLS and retained completed-library evidence after collection deletion. UI checks cover creation identity and service-error distinction. All 8 public Playwright regressions passed, including five widths and accessibility checks. Known build-size warning remains; no threshold weakened.

Status: implemented and locally verified on the review branch; independent human security/editorial acceptance and real authenticated browser validation remain pending. Collection recovery UI and the remaining organization/discovery/operations scope are separate work.

## Personal details vertical slice

Date: 25 November 2026. Baseline `e498a42`; L2 behavior/L4 ownership. Implemented additive local migration 004, account-bounded media-status overlay, versioned title rating/notes/favorite/tags/wishlist details, and independent per-unit ratings/notes. The details page has a controlled editor with explicit reload; drafts retain their original version when another device changes saved data. Unit notes do not imply watched/read status.

Verification: backend ruff and actual local PostgreSQL tests passed (26 total Python tests); OpenAPI exported before TypeScript generation. Frontend lint/build and 21 unit/component tests passed; all 8 public browser regressions passed. Tests verify private note isolation, stale versions, no-op reconciliation, rating bounds and unresolved episode notes without progress changes. Existing tests retained. Known bundle-size warning remains within the stated initial gzip budget. No new dependency, live auth or remote DB mutation.

Status: implemented/locally verified on the review branch; independent security/editorial acceptance and real private browser-to-API validation remain pending. Remaining scope is tracked separately.

## History, statistics and safe recovery

Date: 25 November 2026. Baseline `a51cfd3`. L2 reporting/L4 private recovery. Added local migration 005, owned undo records, keyset history, library/progress statistics, soft library removal, safe metadata/removal/non-completing-progress undo, history/statistics pages and personal navigation. Undo preserves original activity and refuses later versions. Duplicate undo is idempotent. Unknown historical watching dates and incomplete duration estimates remain unspecified. Soft removal preserves session/history data and offers history recovery.

Executed: local Alembic upgrade; backend formatter/lint and actual PostgreSQL tests (28 passed), sequential OpenAPI/type generation; frontend lint/build, 24 unit/component tests and 8 public browser regressions passed. Tests cover isolation, duplicate/stale undo, restored gaps, retained history, and unavailable estimates. E025-E027 record failures and repairs. The activity table remains append-only; advisory locks solved the permission failure without additional grants. Production, independent review and real private browser validation remain pending.

## B02 - Preserve source progress keys

Baseline `9b90804`, L2 identity correctness. Source inspection found manual decimal normalization incorrectly applied to provider keys. `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q -k provider_keys --tb=short` reproduced failure for key `001`. Fix preserves exact source keys, resolves numeric aliases only for manual targets, rejects duplicate resolved bulk targets, and applies the same rule to unit details. Formatter/lint passed; full actual database suite passed 29 tests. Existing manual decimal behavior retained. No migration, dependency, public shape or scientific change. Human review remains pending.

## Profile and preferences vertical slice

Date: 25 November 2026. Baseline `fddd452`. L2 behavior/L4 ownership. Added local migration 006, versioned private profile/preferences, settings/profile pages, IANA timezone validation, explicit discovery preferences, notification opt-in, synopsis spoiler controls and account-scoped motion preferences. Device reduced-motion remains respected. Editors retain original versions and offer explicit reload. User quality/positive-rating thresholds stay optional; no recommendation formula was implemented by this change.

Commands: local Alembic upgrade; backend formatter/lint and actual PostgreSQL suite (30 passed), sequential OpenAPI/type generation; frontend lint, typecheck/production build, 25 unit/component tests and 8 public browser regressions passed. Initial entry measured 203.55 KB gzip. Known uncompressed-size warning remains. Added first-party tzdata for Windows IANA support after a reproduced failure, following https://docs.python.org/3/library/zoneinfo.html. Lockfile preserved reproducibility. E029-E031 record the timezone and test/typecheck failures; assertions retained.

Status: implemented/locally verified on the review branch. Real Google configuration remains excluded; production and human security/editorial review pending. Notification delivery and recommendation ranking are separate features, not implied by saving these preferences.

## Advanced discovery checkpoint

25 November 2026. L2 filtering/L4 saved-filter ownership. Added explicit include/exclude genre/theme, year/score/unit/studio/status/season filters, owned saved filters, private history exclusions before pagination, and bounded source-snapshot random selection. No recommendation weights or default hidden-gem thresholds invented. Provider snapshot coverage is partial. The subsequent owner-requested AniList browser migration supersedes the public transport in this checkpoint.

Executed: backend `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q` (33 passed); frontend `npm run lint`, `npm run test` (25 passed), `npm run build` (passed, 203.90 KB initial gzip, existing size warning). OpenAPI export and generated TypeScript were completed sequentially. No new browser validation claimed for this checkpoint. Human acceptance and production release pending.

## Verified provider identities and personal-service readiness

25 November 2026. Owner-authorized A08; L2 integration/L4 identity. Added namespaced source aliases (local migration 007), verified AniList resolution, exact MAL identity preservation, concurrent first-save protection, owned discovery exclusion batches and saved-note search independent of the legacy provider. Added dependency readiness separate from process liveness. AniList episode titles/coverage are not invented; new source titles support explicit manual tracking. Production provider clearance remains gated.

Executed: local Alembic upgrade to 007; `python -m uv run ruff format app tests`, `python -m uv run ruff check . --fix`, `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q` (39 passed, real local PostgreSQL/Redis); sequential OpenAPI export. Tests cover preserved versions/history, concurrent provider/legacy first saves, two-account exclusions, manual chapter-like keys, dependency loss, and production provider gating. No Supabase migration or live Google validation. Human engineering/security acceptance pending.

## Browser-first pages and page-shaped loading

25 November 2026. A08 frontend, L2/L4 account boundary. Public home/search/details now use the separate AniList transport. Private writes resolve verified identities and wait for readiness; personal views and caches remain account scoped. Public and account routes use page-shaped skeletons with hidden screen-reader loading labels and reduced-motion support. Search input/pagination/footer refinements requested subsequently are separate work.

Executed: `npm run contracts`, `npm run lint`, `npm run test` (44 passed), `npm run build` (passed, 205.92 KB initial gzip; existing size warning), `npm run test:e2e` (17 passed). Browser tests start only Vite and block all ALCOR API calls; provider requests use explicit stubs. Existing guest/no-private-write, source-error and legacy episode-retry assertions retained. Five-width home accessibility checks and catalogue/details alignment checks passed. Inspected narrow/desktop catalogue, details and skeleton screenshots. No live Google, production rights or full provider coverage is claimed.

## Numbered pagination

25 November 2026, A10 pagination scope. Added First/Previous/page numbers/Next/Last and validated custom jumps; URL-backed catalogue/account pages; real owned totals for library, wishlist, collections and history; total tracking targets; local episode-list pages. Legacy cursors remain supported and cannot be combined with numbered-page reads. Filter changes reset paging. Personally filtered discovery retains account-scoped visited cursors and only offers known/next pages; it does not invent a final eligible page or expose private exclusions to AniList.

Executed: backend formatter/lint and actual PostgreSQL suite (40 passed); sequential OpenAPI/TypeScript generation; frontend unit suite (46 passed), lint/build passed (206.89 KB initial gzip, existing warning); 18 browser tests passed, including first/last/custom jumps preserving filters and existing five-width regressions. New database evidence verifies complete non-overlapping library pages, accurate history/collection totals, owner isolation and a 101-unit tracking page boundary. This is a separate owner-requested feature commit; human review remains pending.

## Search editing, custom filtering and product copy

25 November 2026, A10/A11 search scope. Fixed reproduced input replacement/focus loss; added a stable controlled search, 300 ms debounce, immediate submit/clear and composition handling. Centered the wide search and six basic filters. Moved discovery mode, advanced filters and presets into an icon-triggered accessible popup. Added app-side all/any genre matching, exact normalized studio matching and explicit known-score/cover-art choices before displayed pagination. Saved filter contracts retain those choices. No ranking formula or private exclusion list is sent to AniList. Removed the redundant source/development strip and guest startup banner; account feedback uses product language.

Executed: backend formatter/lint and real PostgreSQL suite (40 passed); sequential contracts; frontend lint, 49 unit/component tests and build passed (206.85 KB initial gzip, existing warning). The 20 distinct browser cases were exercised through a full run plus targeted popup/width reruns after E047; all final assertions passed, including the original search focus regression, 300 ms unit timing, input identity, popup accessible names/Escape/focus restoration, popup Axe checks and five widths. No live OAuth or release acceptance claimed.

## Celestial branding and footer

Owner-requested generated image saved unchanged as `frontend/public/brand/alcor-mark.png`, referenced by header, footer and favicon. Built-in imagegen mode, final prompt and asset provenance are recorded in design/brand-assets.md. Added black responsive footer, “Discover the unseen.”, existing navigation routes, supplied GitHub/LinkedIn links and creator credit. No unimplemented intelligence/recommendation claim was copied from the reference image.

Executed: frontend lint and build passed (207.45 KB initial gzip; existing warning); five responsive home/Axe checks and the footer links/logo-load test passed together (6 browser tests). Inspected the generated mark on white/black, desktop footer and 320px page/footer screenshots. E050 records the original link-distinction failure and retained assertions. No full-roadmap or human release acceptance implied.

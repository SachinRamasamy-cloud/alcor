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

## Modern title details and direct AniZip episode display

25 November 2026, A11. Added source banner/poster layout, compact facts and mobile disclosure, initially condensed synopsis with hover/touch/keyboard controls, and corresponding details skeleton. Replaced the empty-success AniList episode shortcut with a bounded, credential-free AniZip request after valid title data loads. Mapping IDs are verified; unsafe images rejected; exact provider keys retained; numeric display order does not rewrite identity. Episode cards separate extras and paginate. Unknown precise release time and final coverage remain null/incomplete. Public metadata display does not modify private progress, manual sessions or completion policy. TMDB enrichment and authoritative episode-to-tracking reconciliation remain unimplemented plan milestones.

Executed: backend formatter/lint and real PostgreSQL/Redis suite (40 passed); sequential OpenAPI/TypeScript generation; frontend lint, 54 unit/component tests, production build (207.71 KB initial gzip, existing warning) and 25 complete browser tests passed. Tests include source ID mismatch, leading-zero keys/order, date precision, safe images, 404 versus 503, production gating, 429 cooldown, API-off episode display/extras, source retry, condensed/touch/hover synopsis, first/last/custom paging, search focus, popup accessibility, branding and five widths. Final targeted source-flow rerun after the valid-title fetch guard passed 4 browser cases. Inspected desktop/mobile details and centered search screenshots; deterministic artwork/stubs are layout evidence only.

Live bounded evidence: AniZip ID 7054 returned 200 with matching mapping and CORS `*`; its 31 records differ from declared 26 episodes/2 specials, so no array-length completion inference is used. The updated AniList query for 7054 returned 200 with matching ID, banner/cover availability and no GraphQL errors. These are feasibility samples, not complete source validation. Provider permissions, staged authenticated browser flows and human acceptance remain pending. No remote DB changes or production deployment.

## Footer social icons

25 November 2026, A12 icon slice (L1). Added local GitHub and LinkedIn SVG icons with the pinned Lucide licence, retaining the supplied URLs, visible labels and accessible link names. No dependency or backend change. Executed frontend `npm run lint`, `npm run build` (passed, 207.76 KB initial gzip; existing chunk warning), and the footer browser regression (1 passed, including SVG load checks). Human review and production acceptance remain pending.

## Complete responsive media cards

25 November 2026, A12 card slice (L2). Added framed cards with two-line title space, format/year, source episode/chapter counts, up to two genres and aligned details/save actions. Save targets remain visible at 44px, including narrow screens; authentication and write behavior are unchanged. Added accessible failed-cover fallback and preserved legitimate zero scores without showing badges for absent scores. Grids use 2/3/4/6 columns to balance full 24-title pages, with matching card skeletons. Shorter source pages retain their actual records. No provider, dependency, ranking or database change.

Executed from `frontend`: `npm run lint` (passed); `npm run test` (57 passed, including unchanged account version/write assertions after E056); `npm run build` (passed, 207.81 KB initial JS gzip; existing 500 KB chunk warning remains); `npm run test:e2e` (31 passed). After the final neutral-color adjustment, repeated the build and `npm run test:e2e -- --grep "public layout is accessible|cards show complete|card actions stay|footer has"` (12 passed). All nine widths from 320px to 1920px passed no-overflow/Axe assertions. Browser checks verify six-column/four-row geometry for 24 items, equal card heights, visible save actions, sign-in focus restoration and no extra provider reads on hover/focus. Inspected wide and narrow card screenshots and the footer icons; artwork is deterministic test data. `git diff --check` passed. Backend tests were not rerun because no backend files or contracts changed. Human visual acceptance, authenticated staging and production release remain pending.

## Hover actions and mobile shelves

25 November 2026, A13; baseline `0a2cdd3`, L2. Desktop mouse/keyboard users see card actions over the poster on hover or focus, with no reserved bottom row. Screens below 768px and touch devices keep visible bottom actions. Homepage popular anime/manga sections use native horizontal scrolling below 768px, with next-card previews, snap alignment, labelled keyboard-focusable regions and matching loading shelves. Catalogue, search and account grids retain their layout and pagination. No dependency, provider, API, authentication, private-state or scientific changes.

Executed from `frontend`: `npm run lint` (passed), `npm run test` (57 passed on isolated final run), `npm run build` (passed; initial JS 207.86 KB gzip, existing chunk-size warning), `npm run test:e2e` (35 passed in final complete run). Four pre-implementation cases reproduced the old behavior; all passed afterward. Final browser evidence includes nine-width accessibility/no-document-overflow checks, desktop hidden/hover/focus actions and sign-in focus restoration, touch-tablet actions, horizontal shelves at 320/375/640px, partially visible next cards, native arrow-key scrolling, last-card focus, matching home skeletons and unchanged search/pagination/episode flows. Reviewed desktop overlay and mobile shelf screenshots using deterministic artwork. `git diff --check` passed.

E062 records an earlier unchanged progress test's loading timeout during concurrent checks; the isolated suite passed without changing its assertions or timeouts, and its timing cause remains unconfirmed. E064 records a new browser check waiting on detached skeletons; it now waits for real title links before the original grid assertion. Backend tests were not rerun; backend code/contracts are unchanged. Human visual acceptance, physical-device review and production release remain pending.

## Refined card hover controls

25 November 2026, A14; baseline `a3cd0f2`, L1 appearance/L2 hit testing. Replaced the shared white hover bar with a circular corner-save control and a separate dark details action. The transparent gap preserves poster navigation. Retained 44px targets, hover/focus reveal, contrasting focus rings, existing account actions and visible mobile/touch rows. Loading cards do not reveal interactive-looking controls. No application JavaScript, dependencies, provider, API or private-state changes.

Executed from `frontend`: `npm run lint` (passed), `npm run build` (passed; initial JS 207.86 KB gzip, existing chunk-size warning), and `npm run test:e2e -- --grep "public layout is accessible|desktop hover separates|cards show complete|touch devices retain|card actions stay|mobile home shelves|shows an aligned home skeleton"` (17 passed). The new test first failed on the previous shared-row geometry, then passed after the CSS change. Evidence covers separated controls, stable card dimensions on hover, artwork click-through, hover-state Axe checks, keyboard reveal/sign-in focus restoration, nine responsive widths, touch actions, mobile scrolling and the home skeleton. Reviewed idle/hover and mobile screenshots with deterministic artwork. `git diff --check` passed. Component and backend suites were not rerun for this CSS-only application change. Human visual acceptance, physical-device review and production release remain pending.

## Save-only media cards

25 November 2026, A15; baseline `d77b1b4`, L2 interaction/L1 layout. Removed the card-specific details link, bottom row and unused copy/styles. Existing cover/title links open details. The 44px circular save action sits at the upper-right on every card with an action slot: visible on small/touch screens, revealed by desktop hover or keyboard focus. Skeletons reserve the corner control instead of a bottom row. Source metadata, mobile shelves and account write/confirmation behavior are unchanged; no saved-state claim was added.

Executed from `frontend`: `npm run test` (57 passed), `npm run lint` (passed), `npm run build` (passed; final initial JS 207.83 KB gzip, existing chunk warning), `npm run test:e2e` (36 passed in the complete run). Owner-authorized assertions now verify the absence of card details buttons, top-corner geometry on desktop/touch, cover/title navigation and save independence. Retained hover/focus reveal, sign-in focus restoration, 44px targets, no extra provider reads, nine-width accessibility, mobile scrolling, source errors, search, pagination and skeleton coverage. Reviewed desktop and mobile screenshots using deterministic artwork. `git diff --check` passed. No new tooling, build, test or application failure was encountered. Backend tests were not rerun because backend code/contracts are unchanged. Human visual acceptance, physical-device review and production release remain pending.

## Sign-in options and backend startup feedback

25 November 2026, A16; baseline `5d298a2`. Added an always-visible Google option, shaped startup loading after explicit sign-in/save requests, immediate readiness retry, offline retry and OAuth handoff/error feedback. Readiness is shared with the dialog through a small context module and provider composition; existing probe intervals, deadline, private-write gate, PKCE parameters, token handling and account cache isolation are preserved. Missing Google configuration is reported independently and cannot enable a placeholder login. Late OAuth failures cannot erase a newer pending action. Updated local first-run and routine startup instructions, separating optional integration tests from startup.

Executed from `frontend`: `npm run test` (64 passed), `npm run lint` (passed), `npm run build` (passed; initial JS 208.22 KB gzip, existing chunk warning), `npm run test:e2e` (38 passed). After E070's copy-key correction, repeated the component/static/build checks and `npm run test:e2e -- --grep "sign-in keeps Google visible"` (2 passed). New evidence covers warming-to-ready Google enablement with test-only configured SDK mocks, no OAuth while unconfigured/waking, repeated-click suppression, returned/thrown SDK errors, stale attempts, pending-action clearing, existing account-switch/logout boundaries, five-minute readiness cutoff/retry and no private writes before readiness. Browser probes hold/release readiness explicitly at 375/1440px, verify no startup dialog before the user action, Google visibility, loading removal, missing setup, Axe checks, no document overflow and focus restoration. Inspected mobile startup and ready-option screenshots. `git diff --check` passed.

Local runtime evidence: existing PostgreSQL and Redis containers were healthy. Started FastAPI on 127.0.0.1:8000 with explicit loopback runtime settings using `python -m uv run uvicorn app.main:app --host 127.0.0.1 --port 8000`. GET `/api/v1/health` returned status ok/version 0.1.0; GET `/api/v1/ready` returned ready, including the final check. No database migration, remote write or credential setup was performed. Backend source/contracts are unchanged, so the backend suite was not rerun. Live Google OAuth, physical-device review, independent authentication/security acceptance and production release remain pending; real publishable-key and Google-provider configuration are still owner-deferred.

## Email account access

25 November 2026, A17 email slice. Added Supabase email/password login, registration, confirmation-required status, recovery email and password update. Removed the persistent Google setup paragraph. Passwords stay in form memory; Supabase remains the only password service. SDK session presence controls navigation, so an unconfirmed signup never becomes a signed-in account. Existing pending-action resume and code-exchange deduplication are shared with email completion; recovery cannot replay a library save. Account setup/dashboard routing is extended in the next A17 slices. No authentication bypass, credential, provider-console or remote database change.

Executed frontend lint, 69 component tests, production build (209.58 KB initial JS gzip; existing chunk warning) and four targeted browser cases for account forms/startup at 375/1440px. Tests verify password confirmation, no password persistence, actual SDK method arguments, neutral email messages, session-required signup completion, recovery deduplication, account-switch safety, Google-warning removal, error copy, focus and Axe/no-overflow checks. Source references: https://supabase.com/docs/reference/javascript/auth-signup and https://supabase.com/docs/reference/javascript/auth-signinwithpassword . Provider password policy remains authoritative; no new client-side password-strength threshold was invented. Real account creation, confirmation/recovery email delivery and live Google remain unverified because the owner chose to configure Supabase later. Independent security/release acceptance remains pending.

## Three-step personal profile setup

25 November 2026, A17 profile slice. Added nine optional questions across three steps, searchable anime favorites, explicit genre/story preferences, separate soft dislikes and strict exclusions, optional publication/episode preferences, skip/edit/back controls and page-shaped loading. Signup completion now opens setup. Profile editing links back to the questionnaire. No answer creates watch history. The account-owned intelligence profile lives in existing versioned preferences JSON; `/me/setup` verifies catalogue UUID favorites and atomically saves profile name plus preferences with both expected versions. The older preference-write path preserves an omitted new profile field and cannot bypass favorite validation. No new table or migration.

Executed backend Ruff format/check and `ALCOR_RUN_INTEGRATION=1 python -m uv run pytest -q` (42 passed against real local PostgreSQL/Redis). New tests verify owner isolation, atomic conflict behavior, no fabricated library entries, preserved legacy settings/profile fields, unverified favorite rejection, start-year validation and distinct negative preferences. Sequential OpenAPI/TypeScript generation completed. Frontend lint, 72 component tests and production build passed (210.82 KB initial JS gzip; existing warning). Two browser questionnaire cases passed at 375/1440px: all three steps, exactly nine legends, favorites, strict exclusion, keyboard focus, Axe and no document overflow. Inspected desktop/background and mobile/taste screenshots. The browser questionnaire is an explicit test-only component fixture, excluded from production entry points; SDK/account mocks are not live authenticated-browser evidence. A page integration test verifies canonical favorite resolution, both versions and preservation of timezone/motion/spoiler settings before navigation. `git diff --check` passed.

Live account setup remains pending the owner's Supabase configuration; independent security review, physical-device review and release are pending. Scoring, learned narratives, APEA and historical reconstruction remain unimplemented research features under the existing deferred contract. Dashboard composition follows in the next feature commit.

## Profile-aware dashboard

25 November 2026, A17 dashboard slice. Added the account dashboard, default post-login destination, conditional home navigation, profile setup prompt/summary, existing continue queues, favorites and wishlist previews, and a "You may like" shelf with its actual filter basis. Reused account-scoped catalogue exclusion batches before the displayed source page and removed known profile favorites from the shelf. Strict genre exclusions override liked genres; explicit publication/episode limits apply, unknown episode totals cannot satisfy an explicit limit, and soft dislikes remain preferences rather than hidden exclusions. No weighted scoring, inferred match percentage, historical release-year inference or learned narrative claim was added. Missing taste evidence gets a general discovery label; personal-service downtime leaves public browsing available. Shelves and loading states retain mobile horizontal scrolling. Header/footer navigation includes Dashboard.

Executed frontend lint, 77 component tests and production build (211.79 KB initial JS gzip; existing chunk warning). Eight browser cases passed for dashboard/setup/email/startup views at 375/1440px, with Axe and no-overflow checks. New model tests verify strict-over-like behavior, unknown episode counts, soft dislikes, favorite removal and anime/manga namespace separation. Dashboard component tests verify account sections and truthful cold-start fallback. Inspected mobile/desktop dashboard screenshots. Questionnaire/dashboard browser previews are explicit component fixtures and are not production authentication shortcuts or live account evidence. Backend contracts were unchanged in this slice; the previous 42-test real database evidence applies to the profile endpoint. `git diff --check` passed. Owner-reported auth-dialog alignment is a separate immediate follow-up. Live authentication, human security/visual acceptance and release remain pending.

## Consistent account-dialog alignment

25 November 2026, A18; baseline `b2c2464`. Grouped labels and controls into one column, normalized 48px input/primary/provider heights, 8px label gaps, 16px field gaps and equal mode tabs. Titles match login/signup/recovery; signup omits recovery. Feedback sits inside its form and one guest footer closes the dialog. The password visibility control and close icon are centered, mobile inputs use 16px text, and short viewports scroll inside the dialog. Mobile shelf edges now match their heading baseline. Updated account configuration and profile/dashboard runbooks without changing SDK, ownership or scoring contracts.

Executed from `frontend`: `npm run test` (78 passed), `npm run lint` (passed), `npm run build` (passed; initial JS 211.92 KB gzip, existing uncompressed chunk warning), and `npm run test:e2e` (49 passed). Geometry checks cover login/signup/recovery at 320/375/768/1440px, equal edges/heights, label gaps and close/title centers. Short-mobile scrolling, Escape/focus, missing-configuration feedback/no credential transmission, dashboard shelf alignment, questionnaire, accessibility and existing public regressions passed. Inspected the final mobile signup screenshot and earlier desktop/mobile account, setup and dashboard captures. `git diff --check` passed. No backend source changed after the 42-test integration run recorded above.

Refreshed only the owned loopback FastAPI process. Read-only checks confirmed `/api/v1/ready` reports ready, OpenAPI includes `/api/v1/me/setup`, and unauthenticated setup access returns 401. No migration, remote write or provider configuration occurred. Real email accounts, confirmation/recovery delivery and Google login remain unverified pending the owner's deferred Supabase configuration. Browser profile/dashboard fixtures are component evidence, not live authenticated workflows. Human visual/security acceptance, physical-device review and production release remain pending; repository integration/push is authorized.

## Supabase database connection verification

25 November 2026, A19; baseline `9058c56`. Used the existing `scripts/inspect_database.py` with credentials supplied only through stdin. A bounded TLS connection succeeded and its explicit read-only transaction inspected schema counts and role flags. Result: connected true, read_only true; the supplied role is not a superuser but has BYPASSRLS. Reported non-system schemas were auth, extensions, realtime, storage and vault; no public application tables were reported. No table rows, passwords or tokens were printed.

No remote schema/data/role changes, credential files or runtime database switch were made. The local restricted-role API remains unchanged. The supplied administrative identity does not satisfy the existing application RLS contract. Application provisioning and a restricted runtime role are still needed before remote private API use; browser registration also requires the separate publishable-key configuration. This read-only check verifies database access only, not registration, email delivery or a deployed application. Reviewed the documentation diff and ran `git diff --check`; application suites were not rerun because source and configuration are unchanged. Human security/release acceptance remains pending.

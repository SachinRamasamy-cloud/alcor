# ALCOR — Foundation V1 Remaining Implementation Plan

**Document:** Remaining-work execution specification and coding-agent instructions
**Baseline:** `ALCOR-source-2026-11-25-2a68599.zip` (supplied snapshot); branch recorded in repository: `finish-the-foundation`
**Date:** 25 November 2026
**Status:** Proposed continuation plan; not an implementation, test result, provider clearance or release approval.
**Authority:** Continue the approved Foundation V1 scope and later approved contracts. This document sequences outstanding work; it does not replace the original product requirements or grant approval for consequential new contracts.

## 1. Objective and scope

Finish the existing ALCOR application so that it is a reliable personal anime/manga library and discovery website **before** building the advanced intelligence engines. Do not rebuild the website. Do not restart F01–F07. Complete missing behaviors through small verified work orders that reuse the present React/Vite/TypeScript, FastAPI, PostgreSQL, Redis and Supabase architecture.

The immediate outcomes are:

1. Home, Anime, Manga and discovery consistently respect known personal history, including the featured title, while explicit search and personal management retain access to consumed titles.
2. Existing card management works from all relevant surfaces, with trustworthy completion and tracking semantics.
3. Based on Your Favourites, You May Like, Similar Anime/Manga and Trending operate as distinct, meaningful sections. Their View All pages preserve the corresponding feed and filters.
4. The user can search, organize and bulk-record previously consumed content without unnecessary clicks.
5. Trusted episode reconciliation, basic franchise relationships, release monitoring and in-app notifications work where verified metadata supports them.
6. Functional, integration, security, accessibility, operational and staged acceptance requirements are satisfied; deferred intelligence algorithms have a sound data foundation.

Do not equate “all code written” with “released.” Separate implemented, locally verified, live validated, human accepted and released states. No fixed completion percentage or development-time estimate is assumed.

## 2. Source of truth and baseline assessment

Read the following from the current checkout before editing. If it differs from this snapshot, reconcile changes and preserve subsequently approved work.

| Source | What it governs |
|---|---|
| `docs/product/ALCOR_FOUNDATION_V1.md` | Full Foundation scope, visibility truth table, feature requirements and 61 original acceptance scenarios |
| `docs/product/ALCOR_MASTER_IMPLEMENTATION_PLAN.md` | Original product requirements |
| `docs/product/ALCOR_CONTENT_AND_UX_WRITING_PLAN.md` | Content, editorial and UX requirements |
| `docs/product/PROFILE_ONBOARDING_PLAN.md` | Existing basic questionnaire |
| `docs/product/MULTI_PROVIDER_METADATA_PLAN.md` | AniList/AniZip/TMDB roles and M0–M7 delivery sequence |
| `docs/architecture/browser-first-catalogue.md` | Cold-start, public/private transport, pagination and source gates |
| `docs/engineering/foundation-contracts.md` | Approved F04/F05 interface and favourites rules |
| `docs/engineering/work-orders.md` | Owner approvals and F01–F07 work-order history |
| `docs/engineering/remaining-scope.md` | Open work and deferrals |
| `docs/engineering/recommendation-contract.md` | Weighted scoring specifically deferred |
| `docs/engineering/acceptance-record.md` | Prior executed tests, limitations and evidence |
| `docs/engineering/provider-validation.md` | Development smoke evidence and open provider gates |
| `docs/engineering/development.md` | Local services, locked dependencies, test and contract commands |
| `docs/engineering/DROMOLYS_STANDARD_SOFTWARE_BUILDING_PROTOCOL.md` | Mandatory engineering protocol (D-SSBP) |
| `docs/design/interface.md` and later UI work orders | Locked layout, typography, card geometry, responsive behavior |
| `contracts/openapi.json` and `frontend/src/shared/api/schema.d.ts` | Current API shapes; generated types |

The latest owner decisions and approved interface contracts supersede older proposals where they conflict. For example, the single 44px corner card control and existing management dialog are the later UI lock. Do not restore a multi-button card redesign merely because the earlier plan suggested one. New visual sections and altered interaction contracts must be frozen in their work orders, with approval where consequential. Do not treat a prior agent recommendation as owner approval.

### 2.1 Already implemented — preserve and regression-test

| Work | Snapshot evidence / preservation requirement |
|---|---|
| F01/F02 discovery exclusions and mode persistence | Signed-in New to Me, explicit URL override, guest Show All, explicit search Show All, account-owned preference versions |
| F03 card completion and committed state publication | Existing explicit completion confirmation, identity resolution, saved-status batching, tracking-aware path, private cache updates |
| F04 authoritative actions/session labels | `allowed_statuses`, `active_session`, exact ordinary transition sets, media-type and actual-repeat labels |
| F05 unified favourites | `favorite_media_ids` nullable legacy union vs authoritative explicit array; durable removals, versioned favourites endpoint, setup/library reconciliation, existing Favorites page |
| F06 failed offline writes | Shared mutation defaults prevent pause/replay; keep no retry of rejected private writes |
| F07 bounded shelf refill | 24 candidates per source window, up to three replacement windows; distinct limited/exhausted/error states, account-scoped eligible overflow |
| Personal foundation | Exact episode/chapter marks, tracking sessions, repeats, continue queues, library/wishlist, ratings, notes, collections, reporting and fixed questionnaire |
| Metadata baseline | Browser AniList catalogue; AniZip episode display; canonical AniList/MAL identities; migration 007; public access independent of private backend readiness |

These are source-present and previously locally verified as recorded in the repository, not a fresh runtime acceptance of the uploaded ZIP.

### 2.2 Current source gaps to address

| Area | Evidence in snapshot | Consequence |
|---|---|---|
| Featured qualification | `frontend/src/pages/public.tsx` selects eligible provider hero or first eligible anime; no explicit release/content/art qualification; hero uses `SaveButton` | Eligibility is not enough to qualify a hero; actions differ from cards |
| Incomplete Home | Same file renders hero, continue queues, popular anime/manga and genre links | Personal recommendation, trending, airing, upcoming and missed-release sections missing |
| You May Like | `frontend/src/features/discovery/taste.ts` builds `mode=new_to_me`, popularity/genre/status/length query; `pages/browse.tsx` uses it instead of Trending | No favourite-seed retrieval, limited profile use, independent shelves and exact View All missing |
| Completion | `backend/app/modules/tracking/service.py` sets `finished = complete or summary.completed`; `library/service.py` ordinary status mutation sets `ever_completed` when completed | Source-traced risk: manual ongoing completion and direct API library/session inconsistency; reproduce in integration tests before repair |
| Catalogue scope | `backend/app/main.py` selects FixtureProvider or DisabledProvider for general metadata service; separate browser/identity paths exist | Do not implement global recommendation, random or hidden-gem features on an 18-title development fixture |
| Tracking metadata | Browser AniZip display does not establish authoritative server mapping | Episode arrays, manual targets and provider identifiers need safe reconciliation |
| Remaining product scope | `remaining-scope.md` and latest F07 record | Bulk management/correction, relations, release jobs, privacy and operational acceptance open |

No application code was changed and no new application test suite was executed while preparing this continuation plan. The above code findings are source observations, not reproduced runtime defects in a staged account.

### 2.3 Previous recorded testing (not new results)

The F05 acceptance record reports 53 backend tests passed with integration enabled; F07 reports 154 frontend tests across 45 files before its final focused failure-case addition, six final focused refill tests, two new plus nine unchanged browser cases, lint/build and diff hygiene. Do not add these numbers together or report them as a fresh full regression after all subsequent changes. The source records that the running local API lacked newer F04/F05 fields/routes and a restart was blocked by approval review (E141). Recheck the actual runtime; a ZIP cannot establish the current process schema.

## 3. Execution order and dependencies

The `R01`–`R70` IDs below retain the remaining-work breakdown from the previous audit. They are traceability IDs, not equal-sized tasks. New work-order names `REM-00` onward are proposed identifiers; append or map them to the repository's actual numbering, avoiding collisions with F01–F07 and M0–M7.

| Order | Work order | Scope | Dependency / exit gate |
|---:|---|---|---|
| 0 | REM-00 | Baseline, runtime and provider feasibility (R42; prerequisite to R59–R70) | Source/test/contract baseline recorded; provider gates remain closed until clearance |
| 1 | REM-01 | Completion invariants (R07–R08) | Approved evidence/transition contract, real DB regression |
| 2 | REM-02 | Global discovery, hero, route controls and refill polish (R01–R06, R09, general part of R10) | Preserve F01–F07 and UI lock; all applicable D tests |
| 3 | REM-03 | Basic provider recommendations and personal feeds (R11–R19, R22–R23; finish personalized part of R10) | Provider capability + shared filtering; independent recommendation shelves, exact View All |
| 4 | REM-04 | Recommendation dismissal/restore and impressions (R20–R21) | Approved feedback contract, approved impression parameters, privacy/ownership tests |
| 5 | REM-05 | Library search, sorting, selection and bulk operations (R24–R31) | Completion invariants; per-item contract; repeat/history preserved |
| 6 | REM-06 | Historical correction and safe recovery (R32–R33) | Separate approved evidence contract; no unsupported Undo until verified |
| 7 | REM-07 | Trusted AniZip reconciliation and source coverage (R34–R37, R43) | M0/M1/M2 evidence, approved mapping contract, existing progress preserved |
| 8 | REM-08 | Remaining metadata and optional TMDB (R38–R41) | Approved provider support/terms and mapping; optional failures isolated |
| 9 | REM-09 | Basic typed franchise relationships (R44–R50; missed-release part of R10) | Identity/metadata contracts; no advanced graph reasoning |
| 10 | REM-10 | Calendar, follows, durable release monitoring and in-app notifications (R51–R58) | Trusted release identities, timezone and event contract; durable delivery tests |
| 11 | REM-11 | Account privacy/deletion (R64) | Explicit irreversible-operation contract and human security approval |
| 12 | REM-12 | Full validation, operations and release gates (R59–R63, R65–R70) | All mandatory work verified; conditional scope accepted; human release decision |

Start with REM-00 and REM-01. REM-02 and REM-03 are the next user-visible priorities. Provider feasibility and contract drafting can proceed in parallel without conflicting code edits. If provider clearance, runtime restart, or historical correction approval is blocked, continue unrelated authorized work using existing deterministic fixtures. A blocked stage is not a pass; no production operation or dependent unsupported behavior may proceed around its gate. Do not add more advanced features during this milestone.

## 4. REM-00 — Baseline, runtime and provider feasibility

**Risk:** L2 integration; L4 auth, credentials, ownership and database boundaries.
**Existing state:** Seven migrations through `007_source_identity`, existing locked dependency versions, browser-first catalogue, partial provider smoke evidence. No actual Git metadata or live services are established by the archive itself.

### Instructions

- In the actual checkout run `git status --short --branch`, `git rev-parse HEAD`, `git diff --stat`, `git diff` and inspect existing uncommitted changes. Confirm branch and revision. Do not reset or overwrite user modifications, recreate the branch or replay completed work orders.
- Read latest authority documents, route/schema definitions, migrations, service calls, test fixtures and CI. Record protected behavior, ownership and the actual baseline failures.
- Use documented Node 24, Python 3.12, locked packages, local PostgreSQL/Redis and the separate migration/runtime roles. Confirm database target is loopback/isolated before any migration. Do not apply a new migration to Supabase without separate explicit permission.
- Verify `/api/v1/health`, `/api/v1/ready` and the runtime OpenAPI against the current checkout. Confirm the already approved favourites routes and `LibraryEntry.allowed_statuses`/`active_session` fields exist on the running API. If not, request permission for the local reload and verify after restart. Do not bypass readiness or security to mask old runtime schema.
- Record current provider capabilities, permitted usage, terms, attribution, storage/cache rules, schema/nullability, CORS, error behavior, response limits and request budget. Preserve `VITE_ANILIST_USE_APPROVED` and server `ANILIST_USE_APPROVED` release gates. Personal use alone is not written permission for a tracker under the repository's recorded terms concern.
- Use AniList for catalogue and permitted title relationships/recommendations; AniZip for episode display/verified server metadata; TMDB only for reviewed enrichment/fallback with server-only token; Fribb only for reviewed mapping data. Do not switch to Tenrai/Jikan silently or assume another aggregator grants upstream rights.
- Use bounded permitted live smoke tests and independent sanitized fixtures. Never deliberately overload an external provider to test 429; simulate timeouts, 429 and malformed data in contract tests. Do not bulk-download the catalogue.
- Decide which backend production metadata capabilities are necessary for private discovery, identity verification and release jobs. The FixtureProvider/DisabledProvider path is not adequate as a production-wide catalogue. Extend a narrowly scoped provider adapter/query service rather than adding an unbounded `catalogue()` fetch. Keep browser public browsing independent of private backend readiness. Freeze any new provider/cache/interface contract first.

**Exit evidence:** baseline revision/diff; actual test counts/failures; local/runtime schema check; documented permitted or blocked capabilities; fixture-vs-live distinction; no secrets or remote writes. Provider permission and human acceptance remain separate release gates.

## 5. REM-01 — Fix completion and tracking invariants first

**IDs:** R07, R08. **Priority:** P0. **Risk:** L2 behavior/L4 personal integrity.
**Source targets:** `backend/app/modules/library/{policy,service,public,repository,schemas,routes}.py`, `backend/app/modules/tracking/{service,policy,repository,schemas,routes}.py`, `frontend/src/features/library/{actions,complete,cache}.tsx` (check actual extensions), tracking UI, existing tests. Use the actual files and module interfaces, not invented parallel services.

### 5.1 Contract to freeze before modification

The later F04 contract explicitly preserved ordinary transition sets. Do not quietly change these sets or use a frontend-only guard. Propose a narrow authoritative completion guard and route contract, obtain approval for any changed permitted action/evidence/response, and then implement consistently.

| Scenario | Required outcome / proposed clarification |
|---|---|
| Previously unrecorded or planned finished title | Deliberate historical completion assertion, no invented individual marks or original viewing date |
| Existing active initial/repeat session | Completion must validate the session and its captured version, atomically update session + library, preserve marks |
| Ordinary library request attempts completion while active session exists | Backend must not allow a bypass. Proposed minimal contract: reject with actionable conflict and require existing versioned session completion route; an atomic unified alternative requires approval |
| Reliably ongoing title | Preserve watched/read progress; caught-up is distinct from final completion. Proposed guard: do not allow an ordinary/manual final-completion assertion for verified still-releasing content |
| Unknown final total / unknown release state | Never auto-complete. Use only the expressly authorized historical assertion policy with honest unknown coverage; no assumed finished status. Freeze handling of stale/contradictory metadata before changing behavior |
| Existing completed/repeat title | Preserve earlier genuine `ever_completed`, even when a new repeat session is active or the entry is removed |
| On hold / dropped | Follow real allowed transitions and existing session policy; do not bypass restrictions |
| Already completed / same desired state retry | No duplicate completion event or version churn, subject to actual session/retry contract |
| Erroneous previous completion | REM-06 correction, not this operation or ordinary deletion |

Distinguish release state, final total and released coverage. An AniZip list length, known planned total or current episode number does not prove that all episodes have aired. Do not rewrite old historical assertions just because metadata later changes. Caught up is not a new persisted ordinary status unless approved; use the existing tracking summary.

### 5.2 Implementation instructions

1. Add failing tests for both paths before fixing: manual completion of known ongoing content; direct library completion while an active session exists. Verify actual fixture/data setup. Trace all existing routes, including bulk (when introduced), reactivation and repeat paths.
2. Establish one shared backend completion validation/invariant path. Read and validate owned state within the transaction. Use verified stored provider facts and existing tracking policy, not browser-supplied release metadata as authority. Network fetches, if required, occur outside long-held DB locks and follow reviewed freshness rules.
3. Keep consistent lock order (preference lock before library row lock where coupled; existing library/session ordering). Preserve expected versions. Re-read and validate current state after locking. Enforce no inconsistent final state from direct API calls, concurrent transitions or retries.
4. Do not fabricate watched/read unit marks to satisfy a historical assertion. Record assertion time as record time. Do not invent historical timestamps, duration or source coverage. Keep genuine completion evidence and repeat sessions.
5. Update `allowed_statuses`/capability output and card/detail/bulk UX only according to the frozen contract. Keep existing single 44px action/dialog layout. Show an honest reason when an action is unavailable; no hidden backend error details. Preserve success-only motion and private cache publication. No completion Undo in this work order.
6. After successful commit, invalidate current-account status aliases, library, continue queues, history/statistics and relevant private feeds; in Show All retain the card with status. Failed/no-op operations must not produce false success or remove cards permanently.

**Acceptance:** ongoing 8 of planned 24 episodes with only 8 released is not completed (example fixture, not real title); final 24-of-24 complete under existing skip/coverage rules; unknown final never auto-completes; historical assertion on eligible finished title creates no marks; direct library bypass fails safely; active/repeat completion and concurrent writes remain consistent; real PostgreSQL two-account isolation; original numerical oracle (9 watched, 1 skipped, 2 remaining, next 9) and decimal/special labels unchanged. Add independent expected outcomes and run T01–T08/T10 plus new direct-API tests.

## 6. REM-02 — Finish discovery and Home basics

**IDs:** R01–R06, R09, general R10. **Priority:** P0 (airing/new general shelves P1).
**Source targets:** `frontend/src/pages/public.tsx`, `pages/browse.tsx`, `features/catalogue/{policy,visibility,shelf-refill,personal-page,pagination,index}`, `shared/api/anilist.ts`, `entities/media/index.tsx`, existing card actions and content messages/tests. Extend shared code; avoid distinct implementations per page.

### 6.1 One policy across surfaces

Keep F02 rules: explicit URL mode overrides saved preference on discovery; signed-in default New to Me; explicit search defaults Show All; guests Show All. A saved-mode update uses its original preference version; a one-off URL override must not silently change saved preferences. Personal management and continue queues are not filtered by discovery. Apply the existing `ever_completed` evidence and soft-removal semantics.

| State | Show All | Hide Watched | New to Me |
|---|---|---|---|
| Unrecorded | Include | Include | Include, unknown history |
| Planned, never completed | Include | Include | Saved `include_planned` setting |
| In progress/on hold/dropped/not interested, never completed | Include | Include | Exclude |
| Ever completed (including rewatch/reread or soft-removed) | Include | Exclude | Exclude |
| Distinct unrecorded sequel | Include | Include | Include |
| Dismissed recommendation | General catalogue stays accessible | Apply history policy | Personal recommendation contexts additionally respect dismissal (REM-04) |

Retain all approved existing special cases for removed records. Do not substitute a status-only check. Normalize identities before filtering, including AniList/MAL aliases. Do not merge titles by similar names or merge seasons/adaptations. Batch status/exclusion calls (current max 100); reads never resolve/write canonical records just to render a card.

### 6.2 Featured title and common actions

Define and approve precise featured eligibility (release status, safe artwork and usable synopsis/content; any requirement for rating or release recency needs explicit definition). Select from verified eligible candidates in provider order or approved deterministic order. No upcoming title masquerading as available; no completed fallback in a mode that excludes it. If none qualifies, omit hero or show an approved truthful general state, not a broken poster or unrelated title.

Reuse common `CardActions`/completion controls for hero within the existing approved layout, after visual/interaction contract review. Do not add a new button row, typography or duplicate modal without approval. Preserve guest sign-in/save behavior, 44px touch targets and keyboard focus. Share confirmed-state updates across hero and grid; selection is recalculated after committed exclusion changes.

### 6.3 Home and Browse sections

This is the target content scope from the Foundation plan, **not authorization to rearrange locked existing UI**. Freeze the placement and copy of new sections while preserving alignment, typography, card geometry, scroll and existing sections. Keep Dashboard distinct from Home.

| Surface | Required sections |
|---|---|
| Member Home | Qualified Featured; Continue Watching; Continue Reading; Based on Your Favourites; You May Like; Trending Anime; Currently Airing; Popular Anime; Explore by Genre; Popular Manga; Upcoming Releases; Missed Seasons (after REM-09) |
| Anime | Existing Latest, Popular, Top Rated, Trending, Upcoming plus independent Based on Your Favourites, You May Like and Currently Airing |
| Manga | Existing general shelves plus applicable independent personal recommendations and currently publishing where supported |
| Guest | Public sections only; no personal labels or fabricated recommendation evidence |
| Details | Current title always accessible; Similar titles filtered as discovery; full Related Titles remains available after REM-09 |
| Search | Full results by default with correct personal labels; explicit carried mode honored |

Do not replace Trending with You May Like. Don't call popularity trending. For live/ongoing and upcoming data, distinguish provider state, confirmed release and unknown information. Preserve genre/season/filter links and supported catalogue routes. Add Home mode control using existing primitives if approved; no layout overhaul.

### 6.4 Bounded refill, deduplication and View All

Keep the F07 24-candidate windows and maximum three replacement windows, existing 12 anime/browse and six Home manga targets, existing public window cache (five minutes), current transport pacing/cooldown and private cache scope unless a separately approved measured change is needed.

- Within a shelf, deduplicate by canonical or verified namespaced identity. Across discovery shelves on a rendered page, reduce avoidable duplicates with a stable priority order (higher-priority personal sections first; exact priority is a presentation contract). Apply cross-shelf display deduplication separately from recommendation semantics. Continue queues, search results, management pages and relation views are not removed because of another shelf. If the hero consumes a discovery identity, use the approved display policy; no arbitrary global exclusion.
- Filter hard constraints, history and applicable dismissal before final shelf/page construction. Refilling after exclusions/deduplication must remain bounded; do not reset the budget repeatedly to force a full row. Keep eligible overflow and unread source position. Review current refill loops so exhausted sources are not needlessly requested again; retain explicit source state.
- Do not claim a full global catalogue scan. Distinguish verified exhaustion, budget-limited results, pending, source failure and actual empty. If first windows are all completed, continue via bounded source windows/cursor. Never refill with completed titles to hit a target.
- View All links must preserve exact source shelf, media type, sort, mode, genres/themes/status/length, relevant seed/context and additional supported predicates. Reset cursor on meaningful context change. Use same candidate and visibility policy for preview and full results. Cross-shelf display dedup alone need not suppress an otherwise eligible item in the dedicated feed; document this distinction. Do not drop `tasteItems`-only filtering when navigating.
- Preserve independent section skeletons, retry and empty states. If personal backend is unavailable, allow public browsing but show an explicit warning that personal filters are unavailable, and do not present unfiltered candidates as a personal result. A status lookup error is not a confirmed empty library.
- On a confirmed mutation, cancel stale private reads, publish committed state under identity aliases, refill only affected private pools. Public cache and other accounts remain untouched. No status request per card; no unnecessary upstream request on each render.

### 6.5 Other discovery completion (part of original Foundation §§11/14)

Complete studio and verified rating/length filters before pagination, preserve existing supported include/exclude genre/theme, date/year/season, format and release status. Extend saved-filter presets only with a reviewed schema that round-trips every supported value; reject unsupported combinations rather than silently losing fields. Reset to the correct surface default. Random discovery samples only a clearly defined eligible pool (do not claim uniform full-catalogue sampling). Hidden Gems uses explicitly configured score/vote/popularity criteria supported by the selected provider, not invented thresholds or MAL-vote equivalents from AniList popularity. Replace fixture-only production paths with approved real retrieval; label bounded coverage. Keep existing private saved-synopsis/notes search; semantic and interactive Recall remain deferred.

**Acceptance:** original D01–D21 applicable, all completed first window, duplicate alias and cross-shelf fixtures, qualified/rejected hero, guests, signed-in saved/URL precedence, pending/error/limited/exhausted, completion and refill race, route round-trip, same-state no-op, account switch, mobile (existing supported widths) and keyboard/axe. Verify no added unbounded source calls. The personal Home shelves and recommendation-specific View All are completed in REM-03; missed-season shelf after REM-09.

## 7. REM-03 — Complete basic recommendations, without custom scoring

**IDs:** R11–R19, R22–R23 and personal R10. **Priority:** P0.
**Reuse:** F05 effective favourites, existing `useSetup`/`usePreferences`, `tasteParams`/`tasteItems`, discovery policy, public AniList transport, private overlays, canonical identity resolver, media cards and generated contracts.

### 7.1 Three independent product functions

| Section | Input and candidate source | Initial deterministic order | Availability |
|---|---|---|---|
| Based on Your Favourites | Authoritative effective favourites; provider title recommendation edges of relevant media type | Provider order, deterministic bounded seed round-robin and dedup | Favourite-only user is enough if provider supports it |
| You May Like | Explicit preferred genres/themes and supported format/status/length/studio preferences; strict exclusions | Approved provider sort; combine separately retrieved groups, deterministic variety | Usable explicit preferences are enough; no ratings/favourites requirement |
| Similar Anime / Similar Manga | Current title's provider recommendation edges | Provider order; remove self and ineligible titles | Title detail, guest general results or signed-in personalized visibility |
| Trending | Actual provider trending sort | Provider order | Independent of personal shelves; filter by selected discovery mode |

**No weighted scoring.** The existing `recommendation-contract.md` is deferred. Do not implement learned taste, ratings-as-weights, soft dislike penalties, similarity percentages, exposure penalties, embeddings, Narrative DNA, AMRA or APEA. Preserve questionnaire answers that are collected but not yet usable; document their actual influence.

### 7.2 Recommendation data retrieval

- Validate AniList GraphQL recommendation capability, fields, pagination, null/deleted targets, adult-content filtering, source order and permitted use. Extend `shared/api/anilist.ts` and approved server adapter as required using small bounded calls. Do not assume sample field shapes or promise providers support all media types. Record sanitized fixtures and permitted live smoke evidence. If unavailable, display unavailable rather than fabricate results from popularity.
- Use `GET /api/v1/me/favorites` and existing owned membership/version interfaces. Read reconciled canonical favourites; the authoritative explicit empty list must not fall back to stale setup IDs. Do not alter F05 lock/order semantics, create history from a favourite, or query all 1,000 possible favourites on each load.
- Freeze a bounded seed rotation policy (size, cadence, page budget, stable order, pagination continuation) after measuring current provider limits. A proposal is a bounded rotating subset with stable seed context for each feed session, not a new approved numeric limit. Distinct source response caches contain only allowed public candidate metadata. Private feed cache includes account, media type, context/seed, mode, filters and relevant preference/favourite state. No user token, watchlist, private notes, rating history or entire favourite list sent to an external provider. Only required public title ID for a public recommendation lookup; review privacy of chosen-title requests.
- Normalize candidate identities, preserve actual source attribution and freshness, origin seed(s), provider order and votes if supplied. Votes are source metadata, not personal relevance. No write-side identity resolution on passive card reads; resolve and verify on actual personal operation using current resolver.
- Remove self and favourite seed titles from recommendation results; merge duplicate candidates once while keeping all supported origins. Apply strict preferences and discovery visibility before pagination. Use bounded additional source pages when eligible results are short. For personal recommendation dismissal apply REM-04 when its contract exists; until then do not claim it works.

### 7.3 Complete You May Like explicitly

Current `tasteParams` activates only for genres/exclusions/status/max anime episodes, uses hardcoded `new_to_me`, and `tasteItems` filters favourite duplicates after retrieval. Refactor to shared candidate rules, with correct chosen context/mode and before-page filtering. Preferred themes/studios and length/format constraints should be applied only when the provider has verified fields, honoring existing missing-value semantics. Use actual preference keys in `Preferences` and `IntelligenceProfile`; do not add invented story-trait mappings or confuse soft disliked genres with strict excluded genres. Keep anime length and manga chapter constraints distinct. Resolve include/exclude conflicts with strict exclusions taking precedence.

The basic version must behave honestly in different profile states:

| Available evidence | Required result |
|---|---|
| No profile or favourites | General discovery only; no falsely personalized label |
| Favourites only | Based on Your Favourites works independently; no requirement to invent genre preferences for You May Like |
| Explicit profile preferences only | You May Like works; Trending still present |
| Both favourites and explicit preferences | Both shelves independently populated using their respective sources, cross-shelf display duplicate reduction |
| Watched records only | History filters work. Completion by itself is not liking evidence; do not create a taste model from watch count |
| Highly rated titles or soft dislikes | Preserve data. Any use as a new positive recommendation seed or ordering requires a frozen additional contract; explicit threshold, no hidden scoring defaults |
| Preferences/owned API error | Personal shelf unavailable/retry; separately labeled general data allowed |

If the owner specifically wants You May Like to work with favourites-only or watched-only history, freeze an explicit alternate retrieval rule first (e.g., provider-related candidates for positive seeds with distinct accurate labeling). Do not silently copy the favourite shelf or infer preferences from consumption. This plan closes the known favourite-only discovery gap via the separate Based on Your Favourites section, as required by original R04. No extra questionnaire or model training is necessary.

### 7.4 Feed contract, reason and UI

Proposed logical contract (not existing endpoints or approved new API): feed kind, media type, explicit seed/context when relevant, effective mode, normalized filters, bounded limit/cursor; response items with canonical/safe provider identity, source/freshness, supported reason evidence and continuation/coverage/error state. Decide browser-composed feed using current public adapter + owned filtering vs a narrow server aggregation route after inspection; use one approach, not duplicate fetch paths. Existing API uses `/api/v1`; all new route names/schema changes require frozen contract and generated clients. Suggested internal names may be `recommendationCandidates`, `personalRecommendationFeed`; do not invent an API route merely to match these names.

Display only evidence-backed reasons, such as “Because you favourited [title]” for actual provider edge or “Matches your selected Fantasy genre” for verified selected genre. Do not generate story facts, “97% match” or presumed enjoyment. View All uses the same kind/seed/sort/filter/eligibility path and preserves unread offset; a preview must not route to generic popularity. A later preference/favourite mutation resets the affected feed context and prevents stale page continuation. Use deterministic ordering for unchanged candidate/seed snapshot, while acknowledging upstream may change.

Place separate sections on Home and Anime/Manga with existing `BrowseShelf`/media card primitives. Preserve Trending and all general sections. Independent loading and failure boundaries keep the rest of Home usable. Empty/no-favourites/no-profile/exhausted/provider-error states differ. Bounded source failure may retain permitted stale candidates **only after** current eligibility is verified; include freshness copy. Do not render fake placeholder anime as actual recommendations.

### 7.5 Tests

- Fake favourite A recommends X,Y; favourite B recommends X,Z; X completed; expect Y and Z once, accurate source reasons, X excluded. If X not completed, expect one X with both origins, not two cards. Provider self-edge removed.
- Favourite-only profile returns actual favourite recommendations. Profile-only query shows You May Like and Trending independently. No positive evidence never creates a personalized claim. Removing favourite changes source contribution, including after stale setup writes.
- Theme/genre strict conflicts, missing known-length field, different media types, provider empty/null/schema drift, unsupported manga, partial candidates, source limit and exact pagination, preference changes, account switch with pending query.
- Completed title during a pending refresh must not reappear; repeat history and soft-removed completion respected; unrecorded distinct sequel eligible. Show All behavior matches the approved recommendation policy, not a hidden new-mode override. Current private data missing means no false eligibility.
- Preview and View All produce equivalent filtered feed for same context; no duplicated canonical identities in page/session; higher-priority shelf dedup is display-only. Compare request counts to current transport budget; no N+1 reads, no private-token leakage.

**Exit:** R11–R19/R22–R23 complete; personal Home and Browse sections work with honest states and current provider gate. Run original R01–R06/R09–R10 and D01–D21 applicable, plus new feed tests. No performance or algorithm accuracy claim.

## 8. REM-04 — Recommendation feedback and exposure collection

**IDs:** R20–R21. **Priority:** P0. **Risk:** L2 behavior/L4 privacy.
**Reuse:** `personal.recommendation_feedback` from migration 006, existing account ownership, versioned writes and cache publication. No parallel duplicate feedback system.

### 8.1 Dismiss/restore

Freeze the owned feedback contract and scope (which recommendation contexts share a dismissal, explicit restore UI, version/no-op semantics). The proposal is recommendation-only dismissal with durable restore, separate from library `not_interested` or `completed`; do not silently change history or mark a title consumed. Apply before feed construction and reapply to stale public candidates. General title search, relation views and personal management remain accessible. Define exact behavior in Show All recommendation context; do not silently change the approved discovery truth table. Record actual action, source context and time only as needed. Account A's dismissal never affects account B. Reuse existing private auth/error/no-store boundaries and rate limits.

### 8.2 Approved exposure parameters — do not request approval again

| Parameter | Value approved in F02 |
|---|---|
| Minimum visible card area | 50% |
| Minimum qualifying dwell | 1 second |
| Deduplication | One title/context/day |
| Retention | 90 days |

Additional semantics to freeze: context vocabulary, day boundary/timezone (propose UTC server-validated day), continuous visible interval, clock tolerance, batch bounds/rates, deletion job and eligibility for recorded events. These details were not approved merely by setting the four parameters. A stable context must not contain a random page ID or timestamp that defeats deduplication.

- Use IntersectionObserver or equivalent in existing media card recommendation contexts; count only actual visible cards, with document visibility and component lifecycle respected. Hidden tab, unmounted card, prefetch, render outside viewport and short flicker are not qualifying impressions. Cancel timers on visibility drop, route/account switch and unmount. Require at least 50% for the full 1 second (proposed explicit implementation interpretation). Only personal recommendation surfaces; no unrelated browsing or cross-site tracking.
- Batch bounded events through authenticated backend; do not create new canonical rows merely to record passive exposure. Approve identity contract for unresolved public candidate IDs (validated namespaced reference or verified existing canonical mapping). Do not store unverified alias as definitive canonical identity. Stable event ID plus server uniqueness on owner/title/context/day enforce dedup across tabs/retries/devices; if canonical alias reconciliation affects uniqueness, specify merge behavior explicitly.
- Persist only necessary owned metadata: identity, context/seed if required, qualifying time and dedup day. Validate payload size, IDs, enum, clock bounds and ownership. Private/no-store response. No IP-level browsing profile or provider tokens. Exposure collection must not block catalogue display; no failed/offline private write replay. Bounded current-session batching and explicit retry behavior must honor F06; no hidden queue that uploads rejected writes later.
- Enforce 90-day retention with reviewed deletion job and test clock boundaries; no long-term retention of raw impression copies in logs. Ensure account deletion covers exposure/feedback. Do not implement ranking based on collected impressions yet. Preserve public cache isolation.

**Acceptance:** 49% or under one second -> no event; 50% for a full second -> one; scroll away before threshold -> none; hidden document/unmount -> none; same title/context/day from multiple renders/tabs/retry -> one; new context/day -> according to frozen policy; restore reverses recommendation-only state; never changes progress/favourite; old account event cannot write to new account; malformed/oversize/foreign IDs rejected; 90-day retention verified; no stale reappearance. Run R07–R08 plus real DB/RLS tests, UI observers with controlled clock and browser visibility fixtures. Additive migration only where necessary.

## 9. REM-05 — Complete library management and bulk actions

**IDs:** R24–R31. **Priority:** P0/P1.
**Source targets:** `backend/app/modules/library/{service,repository,routes,schemas}.py`, collections public service/routes, `frontend/src/pages/account.tsx`, existing library/favorites/actions/collections/management UI, API clients, tests. Current `list_entries` filters status and orders by UUID; add approved owned search/sort semantics without breaking current clients.

| Feature | Implementation instructions |
|---|---|
| R24 Search | Search saved title and aliases within account, type/status scope; parameterized query. Private notes only through existing owned search where applicable; never send notes to provider |
| R25 Sorting | Title, saved date, recorded completion date, personal rating, known progress as supported; define null order and stable canonical tie-break. Never invent historical watch date or unknown progress. Filter before count/page; cursor binds sort/filter or validated numbered page |
| R26 Grid/list | Reuse approved cards/list primitives and status/actions; freeze any new layout contract; preserve typography, alignment, touch and focus |
| R27 Multi-select | Individual/visible-page selection, explicit count and scope; clear on account or incompatible filter change; no hidden all-catalogue selection |
| R28 Bulk completion | Bounded manual selection from catalogue/library; explicit per-item historical completion; reuse REM-01 guards and session versions; no generated marks or AMRA |
| R29 Bulk status | Same backend state machine/capability as single item; no raw UPDATE over arbitrary IDs; per-item result |
| R30 Bulk collection | Reuse existing owned membership, ordering/version constraints; idempotent add; never delete library/history with collection |
| R31 Bulk wishlist removal | Reuse safe versioned removal and supported recovery; no erase of historical completion or other records |

Per-item outcomes were approved in F02. Freeze actual bulk API shape, max items, idempotency identity, captured library/session/collection versions, transaction boundary, processing concurrency, error codes and retry semantics before implementation. Use per-item transactions and single-item authorized service; a failure/conflict in one item must not erase unrelated committed successes. Avoid holding transaction/row locks during remote identity retrieval. Canonicalize input and deduplicate safe aliases; ambiguous identity is an item error, not automatic merge. Bounded verification of unrecorded candidate identities required only after explicit action.

Proposed response classifications: `succeeded`, `unchanged`, `conflicted`, `failed`, `unattempted`; exact names and schemas to freeze. Distinguish a committed result from an ambiguous lost response: re-read server state or use approved idempotency recovery; no silent retry on reconnect. Retry selected failures only with fresh versions after explicit user review. Display summary counts and safe item feedback; preserve selection for failed/unattempted items. Publish confirmed items only and batch private invalidation. No false global success or all-or-nothing claim.

**Acceptance:** search across saved aliases/status filters, deterministic pagination with nulls/ties, stale cursor rejected/reset, foreign owner denied; mixed bulk of eligible finished, known ongoing, stale version, invalid/ambiguous identity, already complete, repeat and planned entries returns per-item outcomes; unchanged items do not create events, retry no duplicate, all marks/history retained. Select visible page only, account switch clears selection, no cross-account mutation, mobile/keyboard action flow. Run T01–T04/T06–T08/T10–T13 and existing collection/recovery regressions. Do not use provider catalogue scan for owned search.

## 10. REM-06 — Historical completion correction and safe recovery

**IDs:** R32–R33. **Priority:** P0. **Risk:** L4 private integrity and potentially destructive history correction. **Approval gate:** original Foundation §7.4 and F04/F05 prohibit unapproved completion Undo. Implement only after explicit evidence contract and security/engineering approval. Continue other independent work if blocked.

### Required contract

- A correction targets a specific erroneous assertion or approved completion evidence, not the title's history wholesale. Distinguish assertion event, verified session completion, repeat completion, removal, recovery and original viewing record. Do not infer a prior event's meaning where historical evidence is insufficient.
- Preserve append-only original activity plus auditable correction record, reason (bounded optional or required as approved), actor/owner, event reference, before/after state, operation time and expected versions. Do not fabricate historical records to make legacy flags reconstructible. Legacy `ever_completed` with incomplete evidence remains protected and unresolved until deliberate approved review.
- Recompute `ever_completed` only under authorized corrected evidence semantics; if another genuine initial/repeat completion remains, retain true. Preserve exact marks, timestamps, repeat sessions, ratings, notes, collection membership. Do not bulk-clear flags or physically delete historical events. Define what current status/session state becomes after correction; preserve conflict checks and user-confirmed intent. Completed-session correction involving tracked marks requires specific policy; do not silently reopen/delete a session.
- Design an additive migration only if necessary, with backfill/provenance rules, RLS and recovery plan. Maintain original version rules; couple preference/favourite undo only where existing F05 contract does so. Distinguish ordinary remove/undo from correcting a mistaken completion.
- UI explicitly previews impact and asks confirmation, uses existing locked management primitives, exposes only supported operations. No optimistic clearing or misleading Undo. Failed/foreign/stale request leaves state unchanged. Backend authoritative; all private aliases/feeds/statistics updated from committed result.

**Acceptance:** wrong manual assertion corrected when sole evidence under approved rules; two genuine completions plus one incorrect assertion retains ever-completed; repeat and manual episode marks retained; legacy unknown evidence refuses unsafe correction; stale/foreign/duplicate correction fails or is no-op as specified; audited original/correction events remain; ordinary delete still preserves history; actual PostgreSQL transactional rollback/ownership; UI only offers permitted corrections. Run T09/T10/T14 and previous reporting/recovery tests. If contract or migration verification is unresolved, this remains an explicit Foundation blocker, not a hidden feature flag advertised as complete.

## 11. REM-07 — Trusted AniZip metadata and tracking reconciliation

**IDs:** R34–R37, R43. **Priority:** P0. **Risk:** L2 metadata/L4 personal history.
**Authority:** `MULTI_PROVIDER_METADATA_PLAN.md` M0–M7. Existing M1/M2 browser display slice must remain. M0 provider prerequisites, trusted M3 and subsequent steps open. No blind rewrite of sessions or canonical identities.

### 11.1 Normalize and verify

- Inspect current browser `shared/api/anizip.ts`, episode display components and backend metadata schemas/provider/identity and tracking repository/service. Preserve browser-first title + episode display with independent failure states. Add server-side trusted adapter to normalize bounded verified episode records, not trust browser metadata for writes.
- Freeze additive identity and coverage schema: immutable internal unit key, canonical media UUID, namespaced provider media/episode IDs and mapping version, original string provider key/label, regular/special classification, separate numbering/season/offset, nullable field provenance/retrieval time, release date/timestamp + precision, coverage complete/partial/unknown and conflict state. Use existing tracking identities where valid; do not create a second progress system.
- Verify source media mapping before persistence, preserve exact decimal/special/leading-zero keys. Never match by title, list index, longest list or episode number alone. Distinguish season and split cour, movie/OVA, alternate versions, absolute numbers and provider extras. A previous smoke record for ID 7054 had 26 episodes + two specials but 31 map records; array length is not a final or released total. Use actual recorded source evidence for independent fixtures, not guessed mappings.
- Validate field lengths, safe URL hosts, schema nulls, dates and provider IDs. Source-specific errors don't delete existing records or block other metadata sections. Separate known release timestamp/date-only/unknown. Missing runtime/filler remains unknown. No invented chapter counts from anime APIs.

### 11.2 Reconcile without destroying progress

Freeze mapping/reconciliation work order, migration and rollback. Preserve all manual targets, exact marks, old session keys, repeat history and `ever_completed`. Refresh metadata may enrich verified fields, add verified units and update trusted released coverage; it may not renumber or delete a tracked unit, rewrite manual targets or mutate consumption. Store conflicting mappings unresolved with reason/provenance. Require explicit review when a manual unit cannot be safely linked. Preserve release coverage policy and existing user skip semantics; no auto-final completion from partial/unknown coverage. Verify historical sessions on existing DB upgrade, repeat refresh idempotence and conflicting mapping rollback.

Connect trusted release state to tracking UI, continue queues and later release jobs. Show unknown/releasing correctly; permit manual tracking when provider metadata is absent. Existing chapter/reread flows remain independent. Do not introduce volume tracking or chapter-to-volume boundaries without reliable provider data and separate definition.

### 11.3 Production provider/cache coverage (R43)

Where backend needs metadata, use approved narrowly scoped adapters and existing identity boundaries, not the development fixture as production. Cache only allowed public source fields; key by provider/identity/language/mapping version/region as applicable. Existing current public queue/cache timings stay until reviewed; server Redis shared singleflight and quotas with separate provider budgets, bounded retries/negative cache and explicit freshness per approved terms. No tokens in shared data, private no-store. No upstream requests on every episode mark, no per-card N+1. Long-runner pagination, 429/timeout/malformed fixtures; stale data is clearly labeled and not authoritative for unsupported completion.

**Acceptance:** original M01–M05/T14 and M0–M7 applicable; finished single season, split cour, long runner, specials, movie/OVA, upcoming, missing/conflicting mappings, missing fields and existing manually tracked session. Real local PostgreSQL migration/ownership and before/after mark/session snapshots. Existing A04 oracle, skip, decimal/special labels and repeat tests. Verify browser-only episode display while API unavailable. No blanket catalogue completeness claim.

## 12. REM-08 — Remaining media metadata and optional enrichment

**IDs:** R38–R41. **Priority:** P1 / conditional.
**Instructions:** add independently loadable, bounded provider-backed characters, voice actors, supported staff/authors/publishers, safe trailers and additional artwork where documented. Preserve attribution, language, source freshness and existing non-spoiler display. Missing data stays null/unavailable. No unsupported generated synopsis, trailer link or episode classification. Reuse current title detail geometry and approved UI primitives; freeze placement of new sections. Do not block primary page on optional request.

For TMDB and Fribb, follow M4/M5/M7 only after permission, applicable licensing, credentials, region and exact mapping contract. TMDB token server-only, no `VITE_` secret or public bundle/log. Separate TMDB `tv` and `movie` namespaces; do not make TMDB series ID a unique alias of one AniList season. Store verified season/range/offset evidence where necessary, not guessed title matches. Merge only verified missing fields; never union two entire season lists. Region-specific legal availability only with explicit region, valid source/attribution and supported provider data. No streaming/playback hosting. A missing key, invalid mapping or outage leaves existing AniList/AniZip and manual tracking usable. If conditional enrichment cannot be delivered, record reason and obtain explicit scope disposition, not a fake completed state.

**Acceptance:** field missing/unsafe URL/error isolation, independent sections, bounded request count, no-key/outage, verified mapping/no blind overwrite, actual source attribution/region, no secret leak, mobile/accessibility, manual tracking unchanged. Record M4/M5/M7 evidence separately from M3; no live authenticated TMDB claim without actual permitted test.

## 13. REM-09 — Basic franchise relationships and missed releases

**IDs:** R44–R50; completes missed-season part of R10. **Priority:** P1.
**Goal:** provide useful provider-supported relations without implementing the advanced Continuity Engine.

- Add verified typed relation retrieval (sequel, prequel, source/adaptation, spin-off, side story, recap, alternative and other actual provider relation types). Normalize identities and direction; preserve source ID/freshness. Deduplicate directed edges by verified endpoints/type; unknown/conflicting endpoints stay unresolved. Do not collapse season, movie, OVA and source manga into one canonical title. Persistence/cache subject to permissions; freeze additive schema/indexes if stored.
- Provide previous/next and related-title sections in details, with personal labels from batched owned status lookups. Show completed related titles for context regardless of default discovery mode. Separate related works from community “Similar” suggestions; a recommendation is not a canonical sequel. Relation direction/label not proof of mandatory watch order.
- For Missed Seasons/Missed Releases, compare bounded related candidates of known personal titles against `ever_completed` and relevant eligibility. Distinguish released, upcoming, optional, unknown and source coverage. “Not recorded as completed” rather than “definitely unwatched.” A completed prior season never marks an unrecorded distinct sequel complete. Separate actual confirmed future announcement from already available content.
- Use small bounded retrieval of relevant personal titles and provider relationship pages, not unbounded transitive catalogue crawl. Store or return provenance/coverage; when missing, don't promise exhaustive franchise coverage. Reuse current filters, card actions and View All context for missing-release shelf. On completion/relationship refresh update affected private views. Do not implement topological/watch-order inference, graph optimisation, guessed canonical dependencies or cross-media chapter resume points.

**Acceptance:** directed sequel/prequel, alternate version/recap/OVA, source adaptation with independent IDs, two-account status, completed season + unrecorded sequel, repeated relation/alias dedup, upcoming/unknown coverage, source error/partial, valid Home missed-release link. Run original F01–F02 tests (acceptance IDs, not past work orders) plus metadata/history regressions. No franchise-wide completion assumption.

## 14. REM-10 — Release calendar, follows and durable notifications

**IDs:** R51–R58. **Priority:** P1. **Risk:** L2/L4 owned subscriptions and delivery.
**Prerequisites:** verified release identities/precision, provider permissions and reviewed schedule/notification contract. No recurring production polling until explicitly authorized. Existing notification preference defaults false; preserve default.

### 14.1 Product behavior

| Feature | Instruction |
|---|---|
| Calendar | Source-confirmed schedule, date range/pagination, timezone from validated existing IANA preference; date-only is date-only and unknown remains unknown. Countdown only when precise timestamp available. Distinguish scheduled, released and delayed/cancelled where source supports it |
| Follows | Owned follow/unfollow by canonical title, versioned and idempotent; no automatic opt-in merely by opening/wishlisting a title |
| Episode release notification | Only from approved verified release event for eligible followed title with appropriate notification preference; scheduled time passing alone is not proof of actual release unless approved reliable source semantics establish it |
| Season/sequel announcement | Separate event kind; source-confirmed related announcement, not an actual release notification |
| Wishlist release | Only eligible planned title and enabled preference, with reliable release transition |
| Centre | Account-owned paginated read/unread, dismiss and approved mark-read operations; clear loading/error/empty, safe title links |
| Settings | Respect existing notification toggle/default and timezone; additional granular preferences require frozen schema and compatibility rules |

### 14.2 Durable processing contract

Propose PostgreSQL-backed durable jobs/outbox and a bounded worker/scheduler integrated with existing app deployment; exact scheduler topology, lease/retry settings, tables, indexes, event identity and operating cadence require approval. Redis can support existing quotas/cache but must not be the only durable record of release deliveries. Do not assume a FastAPI in-process timer survives restarts or add an unapproved paid service. If existing hosting cannot run a durable job worker, document operational dependency and do not promise notifications.

- Model source observation separately from canonical release event and owned notification delivery. Proposed uniqueness: canonical media + verified unit/release identity + event type, and recipient + event identity/type for delivery. Exact identity/reschedule and announcement-revision behavior must be frozen; do not key only on wall-clock date or title string.
- Poll bounded due titles shared across subscriptions, not every title per user. Preserve provider budget/cooldown, scheduling precision, stale/unknown state and rate limits. Never crawl entire catalogue repeatedly. Leases/claim semantics with transactional coordination avoid simultaneous workers producing duplicates. Persist attempt/failure/next retry and recover from crash. Retry bounded with backoff and a reviewed final failure path, not tight loops; no private-user writes retried automatically via frontend F06.
- Commit release event and delivery state/outbox transactionally or use approved equivalent idempotent design. Recheck ownership/follow/preference at delivery time; disable/unfollow must stop future delivery according to contract. Read/unread changes are account-owned; no foreign ID mutation. Operational worker role must be narrow and separately reviewed, not superuser/service bypass for convenience. Include jobs/outbox cleanup and account deletion effects.
- Rescheduled event updates schedule without duplicate false release; distinguish update and notification policies. Missing data/429/outage cannot be interpreted as released. Use source provenance and actual timestamps in UI. In-app only; push/email remain conditional and excluded from this milestone unless separately authorized.

**Acceptance:** fake-clock scheduling across timezones/date-only/unknown, repeated upstream observations and retries -> one intended delivery, simultaneous workers, crash before/after commit then restart, rescheduled event, disabled/unfollowed user, foreign notification/read state, partial source/outage, quota budgets, no duplicate notifications, persisted job recovery, local DB/RLS tests and browser centre/read/unread. Run N01–N04 plus O02 and existing account/visibility regressions. Record evidence of actual scheduled job execution in isolated staging, separate from tests.

## 15. REM-11 — Privacy and safe account deletion

**ID:** R64. **Priority:** mandatory before production acceptance. **Risk:** L4 irreversible account/data operations.
**Status:** source records profile/settings/reporting already implemented; deletion and privacy workflow pending. Import/export remain deferred (operational backup/restore is separate).

Freeze explicit privacy/deletion contract with human security and owner review before implementation. Specify reauthentication, confirmation, cancellation policy if applicable, owned data scope (profile/preferences, library, progress, repeats, favourites, notes, collections, feedback/exposures, follows, notifications, pending jobs), Supabase account identity, operational backups/retention, dependency ordering and partial-failure recovery. No generic admin key in client, no unauthorized remote deletion. Separate account erasure from ordinary title removal and historical correction. Public metadata shared with others must not be deleted as part of removing one account.

Proposed implementation pattern: authenticated identity-bound deletion operation with reviewed confirmation/recent-auth and durable/idempotent coordinated cleanup of personal rows and auth identity; failure handling must reflect actual transaction boundaries between database and Supabase. Exact retention/deletion semantics must not be invented. Clear local private caches and session only as part of approved workflow; prevent stale/pending work from recreating records or delivering notifications. Never claim all backups instantly erased if retention policy says otherwise.

**Acceptance:** disposable test accounts only; wrong/expired identity denied, explicit confirmation, account A deletion cannot affect B/public catalogue, partial failure/retry/restart, no resurrection, private cache isolation, documented retention and backup policy. No live owner deletion or remote admin action without separate consent.

## 16. Database and API engineering rules (all work orders)

Current head `007_source_identity`. Add migrations sequentially from the actual head only as necessary; numbering/names below are intentionally not prescribed. Never edit already-applied migrations, truncate/reset data to make tests pass, regenerate canonical UUIDs or erase tracking evidence. Before each migration, inspect real schema and constraints, estimate impacted rows/locks, plan safe upgrade and recovery, verify upgrade from previous revision with representative records. No automatic remote migrations.

| Domain | Proposed data responsibility — freeze exact schema before use |
|---|---|
| Recommendations | Source-backed edges/metadata cache where permitted; candidate origin and cursor contract; no mandatory full catalogue download |
| Feedback | Extend migration 006 foundation, account/media/context lookup and idempotence |
| Exposures | Owned identity/context/day unique constraint and time index for 90-day cleanup; validated source reference when canonical identity not established |
| Bulk | Reuse existing services/idempotency; add operation ledger only if contract requires durable recovery |
| Corrections | Append-only authorized assertion/correction evidence and explicit legacy handling |
| Episodes | Verified source mappings, stable unit keys, source metadata/coverage and mapping version |
| Relations | Directed typed endpoints, source provenance, dedup, bounded lookup indexes |
| Release | Verified event identity, subscriptions, durable jobs/outbox, recipient delivery/read state |
| Account privacy | Approved deletion workflow/retention and cleanup state |

All private tables require ownership/RLS tests and least-privilege grants. Add composite ownership/foreign keys where required; unique constraints, intentional indexes for private filter, cursor and event identity; parameterize SQL, allow-list sort expressions; inspect relevant EXPLAIN plans with representative data. Preserve preference-before-library lock order for coupled favourites, existing session lock/version rules, transaction-before-success and no account mixing. No secrets in code, public Vite assets or reports.

API: reuse existing `/me/media-status`, `/me/discovery-exclusions`, `/me/library`, `/me/wishlist`, tracking session routes, `/me/setup`, `/me/preferences`, `/me/favorites`, collections and reporting/recovery. Freeze new inputs/outputs, safe validation/error codes, authorization, bounds, expected versions, idempotence, pagination, backward compatibility and no-store before coding. No schema change purely to satisfy a guessed frontend type. Regenerate OpenAPI + TypeScript and inspect diff. Public reads omit private tokens; private responses `Cache-Control: private, no-store`. No security-policy changes by agent without approval.

## 17. REM-12 — Full validation, security, performance and release readiness

**IDs:** R59–R63, R65–R70. **Priority:** mandatory. This is not a code-only checkpoint. Use isolated development/staging, live provider/account checks only where permitted. Production release is a separate human decision.

| ID | Gate | Required evidence |
|---|---|---|
| R59 | Backend | Full unit and integration suite with real local PostgreSQL/Redis, migration upgrade, ownership/RLS, stale/concurrent/idempotent cases |
| R60 | Frontend | Full Vitest suite, TypeScript, lint, generated contract compatibility, cache/account races |
| R61 | Browser | Full serial Playwright suite and affected regressions, real app components, preserve fixture vs live distinction; no weakened protected assertions |
| R62 | Authentication | Actual permitted staged email signup/confirmation, login/logout, recovery, callback allowlist, session expiry and two-device/account checks; Google remains deferred |
| R63 | Provider | Written clearance/approved usage gate, bounded live response/attribution/quotas, safe schemas and error contract, no fixture substitution in production |
| R65 | Accessibility | Existing supported widths (including 320/375/640/mobile, desktop as applicable), keyboard, touch, focus, reduced motion, screen-reader labels, Axe and visual review |
| R66 | Performance | Record baseline vs final for Home calls, candidates, batch sizes, query latency p50/p95/p99, rendering/network and cold-start separation with 300+ history; no invented targets/results |
| R67 | Security | Dependency/secrets scans, auth/ownership/no-store/CORS/rate-limit validation, unsafe URLs/malformed payloads, least privilege, independent review |
| R68 | Operational recovery | Backup/restore drill in isolated environment incl. new tables and original history; tested migration recovery/rollback plan; preserve personal data |
| R69 | Monitoring | Liveness/readiness distinction, provider failure/rate cooldown, job age/retry/failures, DB and error monitoring, privacy-safe logs and reproducible deployment/CI |
| R70 | Human acceptance | Record actual visual/editorial/code/security and product sign-off, scope exceptions and explicit release approval |

### 17.1 Commands and environment

Use actual repository `development.md` and CI; do not blindly execute against an unknown environment. Commands below are **planned**, not executed by this document's author.

```sh
# Root, real checkout
 git status --short --branch
 git rev-parse HEAD
 git diff --stat
 git diff
 docker compose -f compose.dev.yml up -d --wait
```

Initialize isolated local DB role and apply migrations using the documented development procedure and migration role; never use a remote connection or admin as runtime. Verify settings and loopback target first. In `backend/`:

```sh
python -m uv sync --locked
python -m uv run ruff check .
# Set ALCOR_RUN_INTEGRATION=1 with the documented local integration environment.
python -m uv run pytest -q
# Export with PYTHONPATH=. as documented.
python -m uv run python ../scripts/export_openapi.py
```

In `frontend/`:

```sh
npm ci
npm run contracts
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Use focused tests first and full applicable regression after integration. Browser fixtures and mocked transport do not prove live account/provider behavior. Use documented Playwright installation/configuration and supported widths. At root run `git diff --check`, inspect all generated diffs and dependency/secret changes, record exact pass/fail/skip counts. If dependency install or service restart is blocked, retain exact error, report not executed, continue independent authorized work. Never loosen dependencies or tests to obtain a green report. No automatic production deploy.

### 17.2 Acceptance matrix — preserve original Foundation IDs

The following supplements the existing 61 acceptance scenarios in original Foundation §16. Every original applicable ID must remain traced; additional tests are proposed below. Expected outcomes are design oracles, not results already achieved. Do not overwrite historical evidence.

| Group | Original IDs | Required focus |
|---|---|---|
| Discovery/card | D01–D21 | All mode/alias/route/hero/refill/ownership/mutation/mobile cases, including completed rewatch and separate sequel |
| Tracking/bulk | T01–T14 | Completion, ongoing/unknown coverage, A04 oracle, repeat, correction, stale/foreign writes, bulk and reconciliation |
| Recommendations | R01–R10 (original acceptance IDs; distinct from remaining-task R IDs) | Favourite union/removal, provenance, cold start, constraints, dismissal/exposure, provider failure and cache isolation |
| Metadata | M01–M05 | Exact keys, mapping conflict, source failure, API cold start, provider/key gates |
| Franchise | F01–F02 (acceptance IDs) | Typed relationships, partial coverage and independent consumption |
| Notifications | N01–N04 | Idempotent delivery, job restart/reschedule, timezone, preference and ownership |
| Operations | O01–O05 | Migration, backup, full regression, staged validation and accessibility |

| New ID | Specific additional oracle / required outcome |
|---|---|
| X01 | Direct ordinary library completion with active session cannot bypass transactional completion invariant |
| X02 | Known ongoing series with 8 released of 24 planned cannot become finally completed via manual or bulk path under approved guard; caught-up remains distinct |
| X03 | Same historical completion retried creates no duplicate event/marks; correction of sole erroneous assertion vs genuine repeat history distinguished |
| X04 | Eligible but unreleased/incomplete-art hero is rejected according to frozen featured contract; no suitable title means honest omission |
| X05 | Cross-shelf duplicate pressure and all-watched windows never relax exclusions or exceed bounded request budget; continue/search untouched |
| X06 | Favourite-only account receives actual seed-based shelf; profile-only account sees independent You May Like and Trending; no-evidence account not falsely personalized |
| X07 | Preview and View All share exact filters/seed/context; no stale cursor after favourite/profile/mode change |
| X08 | Recommendation candidate returned from two seeds deduplicates with truthful multi-origin reason; self-edge and known history excluded |
| X09 | Dismiss/restore persists without changing library status; old account feedback cannot apply to new account |
| X10 | 50%/1s exposure, hidden tab and unmount, duplicate tab/day/context, retention boundary; no exposure created from fetched-only data |
| X11 | Bulk mix of valid/invalid/stale/no-op/repeat/ongoing items returns per-item outcomes with no unauthorized partial item writes |
| X12 | Actual alias/title search plus stable sorting/ties/nulls before pagination; private notes never exposed to provider |
| X13 | Manual episode record remains exactly unchanged through verified metadata refresh, split cour/special/offset conflict; no fabricated release coverage |
| X14 | Source outage with no TMDB key retains available public detail/manual progress; no production fixtures presented as live |
| X15 | Release jobs survive crash/retry and reschedule without duplicate or false delivery; no delivery after applicable unfollow/disable |
| X16 | Account deletion isolation, idempotency and partial external failure; no unrelated metadata/history loss or resurrection |
| X17 | Old running API schema detected; current UI fails safely and reload verification proves new contract; no readiness bypass |
| X18 | Provider clearance absent -> production gate closed; development success does not open it |
| X19 | Representative 300+ history end-to-end; correct exclusion/status, bounded request count and measured p95; no false performance claim |
| X20 | Full migration/recovery with existing owned data and new records; backup restore to isolated environment; prior identity/marks intact |

## 18. Complete remaining-work traceability (R01–R70)

All are open or partially implemented at the supplied snapshot; status must be updated only on evidence from the current checkout. Conditional items require explicit scope acceptance if unavailable. The descriptions retain the previous audit's identifiers, with work-order grouping as proposed above.

| ID | Remaining deliverable | Work order | Priority |
|---|---|---|---|
| R01 | Featured qualification and honest fallback | REM-02 | P0 |
| R02 | Consistent discovery exclusions across remaining surfaces | REM-02 | P0 |
| R03 | Home discovery mode controls | REM-02 | P0 |
| R04 | Correct View All filtering and context | REM-02/03 | P0 |
| R05 | Cross-shelf duplicate reduction | REM-02/03 | P0 |
| R06 | Finish replacement/empty/error states, preserve F07 | REM-02 | P0 |
| R07 | Manual ongoing vs final completion guard | REM-01 | P0 |
| R08 | Backend library/session consistency | REM-01 | P0 |
| R09 | Dedicated Currently Airing/Publishing as supported | REM-02 | P1 |
| R10 | Remaining Home shelves including personal and missed release | REM-02/03/09 | P0/P1 |
| R11 | Provider recommendation retrieval | REM-03 | P0 |
| R12 | Based on Your Favourites | REM-03 | P0 |
| R13 | Full basic You May Like | REM-03 | P0 |
| R14 | Similar Anime | REM-03 | P0 |
| R15 | Similar Manga | REM-03 | P0 |
| R16 | Independent Trending and You May Like | REM-03 | P0 |
| R17 | Home personalized shelves | REM-03 | P0 |
| R18 | Evidence-backed reasons | REM-03 | P0 |
| R19 | Recommendation-specific View All | REM-03 | P0 |
| R20 | Dismiss/restore | REM-04 | P0 |
| R21 | Impression collection/retention | REM-04 | P0 |
| R22 | Account-isolated recommendation caching | REM-03/04 | P0 |
| R23 | Recommendation loading/error/empty states | REM-03 | P0 |
| R24 | Library search | REM-05 | P0 |
| R25 | Library sorting | REM-05 | P0 |
| R26 | Grid/list switching | REM-05 | P1 |
| R27 | Multi-selection | REM-05 | P0 |
| R28 | Bulk completion | REM-05 | P0 |
| R29 | Bulk status | REM-05 | P0 |
| R30 | Bulk collection assignment | REM-05 | P1 |
| R31 | Bulk wishlist removal | REM-05 | P1 |
| R32 | Audited historical correction | REM-06 | P0 |
| R33 | Broader safe recovery | REM-06 | P0 |
| R34 | Trusted AniZip reconciliation | REM-07 | P0 |
| R35 | Verified episode mappings | REM-07 | P0 |
| R36 | Preserve progress across metadata changes | REM-07 | P0 |
| R37 | Trusted released-episode updates | REM-07 | P0 |
| R38 | Characters/voice actors | REM-08 | P1 |
| R39 | Staff and supported additional metadata | REM-08 | P1 |
| R40 | Verified trailers | REM-08 | P1 |
| R41 | Optional TMDB/Fribb enrichment/mapping | REM-08 | Conditional |
| R42 | Provider validation and permissions | REM-00/07/08/12 | P0 |
| R43 | Shared metadata caching and production access/coverage | REM-00/07 | P0 |
| R44 | Typed relationships | REM-09 | P1 |
| R45 | Previous/next seasons | REM-09 | P1 |
| R46 | Movies/OVAs/spin-offs | REM-09 | P1 |
| R47 | Related adaptations | REM-09 | P1 |
| R48 | Missing seasons | REM-09 | P1 |
| R49 | Personal franchise status | REM-09 | P1 |
| R50 | Missing release identification | REM-09 | P1 |
| R51 | Calendar | REM-10 | P1 |
| R52 | Follow/unfollow | REM-10 | P1 |
| R53 | Durable release jobs | REM-10 | P1 |
| R54 | In-app notifications | REM-10 | P1 |
| R55 | Read/unread | REM-10 | P1 |
| R56 | Deduplication | REM-10 | P1 |
| R57 | Preference integration | REM-10 | P1 |
| R58 | Retry/recovery | REM-10 | P1 |
| R59 | Full backend integration | REM-12 | Mandatory |
| R60 | Full frontend tests | REM-12 | Mandatory |
| R61 | Full browser regression | REM-12 | Mandatory |
| R62 | Live staged authentication | REM-12 | Mandatory |
| R63 | Provider live validation | REM-12 | Mandatory |
| R64 | Privacy/account deletion | REM-11 | Mandatory |
| R65 | Accessibility/responsive verification | REM-12 | Mandatory |
| R66 | Performance verification | REM-12 | Mandatory |
| R67 | Security/dependency checks | REM-12 | Mandatory |
| R68 | Backup/restore/rollback | REM-12 | Mandatory |
| R69 | Monitoring/operations | REM-12 | Mandatory |
| R70 | Human acceptance/release approval | REM-12 | Mandatory |

Additionally, complete original outstanding discovery work (studio/preset, random, Hidden Gems, basic saved synopsis/notes search preservation) under REM-02. The original Foundation and provider addendum remain requirements even where a smaller audit ID groups several features. Do not close scope solely because 70 row labels were ticked.

## 19. Decisions already made vs required approvals

| Decision | State / action |
|---|---|
| Default signed-in New to Me; URL override; guest/search behavior | Approved, implemented; preserve |
| Unified favourites + durable removal | Approved, implemented; preserve |
| F04 server action capabilities/actual session labels | Approved, implemented; preserve ordinary transition table unless separately approved |
| Single 44px corner control, existing modal, locked layout | Approved later UI contract; preserve; new presentation changes reviewed |
| Per-item bulk outcomes | Approved; exact limits/schema/retry/transaction details freeze separately |
| 50% visibility, 1s, one title/context/day, 90 days | Approved; implement without re-asking these four values; clarify context/day/time/privacy details |
| No offline failed-write replay; F07 refill bounds | Approved, implemented; preserve |
| Current completion fix | Source risk identified; consequential guard/evidence/API contract requires approval and actual reproduced tests |
| Historical correction/Undo | Not approved for general completion; freeze dedicated evidence semantics before enabling |
| Featured criteria, new shelf order/placement and context-specific controls | Proposed, reconcile with layout lock before changing |
| Recommendation feed schema, seed rotation, source order, dismissal scope and optional positive-rated seeds | Proposed; no new scoring; approve bounded retrieval and interfaces first |
| Exposure day boundary/context, unresolved alias handling and batch/cleanup mechanics | Proposed, privacy/contract review |
| AniList/AniZip/Fribb/TMDB provider rights and verified capability | Unresolved; no production bypass or fabricated data |
| Metadata mapping/coverage migration and durable release jobs | Consequential contracts to approve separately |
| Account deletion/retention/auth boundary | Explicit owner/security approval required |
| Runtime local restart | Prior attempt blocked; recheck actual state, obtain required approval |
| Production migration/deployment/human release | Not authorized by this plan |

The proposal intentionally separates choices needing review from decisions already approved. Do not block all work by repeatedly requesting approval for completed F01–F07 decisions. Prepare the smallest precise work order for unresolved consequential decisions, continue safe independent work, and report blockers honestly.

## 20. Deferred scope — do not implement now

- AMRA/Active Search, APEA, adaptive preference elicitation, Narrative DNA, learned taste, weighted personalised recommendation scoring (including deferred six-factor scoring), MMR, exposure-penalty ranking, semantic embeddings/LLM integration, interactive title investigation, Compare/Compass/Pulse/Universe, advanced watch-order/decision optimisation, Time, Shield intelligence and automatic browser Capture.
- Google authentication configuration/live Google validation, user import and user export (owner deferrals). Operational secure backup/restore remains mandatory.
- Offline/PWA, push/email notifications, unsupported extra providers/languages and streaming availability unless reviewed conditional scope is accepted. Do not add a streaming platform, social features, microservices, new UI framework, model training or paid infrastructure.

A basic provider recommendation feed, typed relations, simple history filtering, explicit questionnaire and release scheduler are not the advanced algorithms. Collect valid evidence now; do not apply learning/scoring until a new approved milestone.

## 21. Mandatory implementation instructions and reporting

Apply D-SSBP §17.1 work orders and §17.2 standing directive. For each REM work order:

1. Inspect actual checkout, relevant code/tests/requirements and latest acceptance records; protect existing behavior. State objective, risk level, non-goals and exact allowed/protected paths.
2. Establish Definition of Ready: accepted contract and expected outputs, dependencies, bounds, ownership, errors, invariants, migration impact and independently defined tests. Escalate consequential ambiguity; do not invent approvals, scientific definitions or parameters.
3. Reproduce reported defects using tests/fixtures wherever possible. Make smallest coherent implementation using current services and component architecture. Add at least one independent test for every nontrivial function, plus integration/negative/edge cases as appropriate. Preserve existing assertions; changes to intentionally superseded assertions need documented owner authority.
4. Execute focused tests, inspect diff, run relevant integration/regression, generate contracts, verify actual database/role and UI consequences. Use existing dependency locks; no unapproved dependency/API/migration/security-policy changes. Fix real observed issues rather than fabricate bug-fix evidence.
5. Record exact results and blockers. Commit a focused verified change only in the authorized real checkout; do not fabricate Git commits for a ZIP. Update `docs/engineering/work-orders.md`, `acceptance-record.md`, `remaining-scope.md`, `error-log.md` for actual errors, `docs/product/implemented-features.md`, and relevant contracts/architecture. Keep prior records intact.
6. Continue next ready work order after the preceding dependent gate; independent approved tasks may continue while external approval is pending. Do not silently skip tests or mark blocked work done. No async promise, no “all tests pass” unless actually executed. No release without actual human acceptance.

### Stage report template

```text
Work order / R IDs:
Baseline revision and branch:
Authority / contract version and approvals:
Status: Not started | In progress | Implemented | Locally verified | Blocked | Live validated | Human accepted | Released
Requirements completed and independent expected behavior:
Files added/changed/removed:
Database migration and API contract changes:
Protected behavior preserved:
Tests added and exact commands executed:
Passed / failed / skipped / not executed:
Reproduced defects and fixes (actual evidence):
Ownership/security evidence:
Performance baseline/result where relevant:
Observed runtime/provider/dependency limitations:
Decisions made and remaining approvals:
Remaining scope and next eligible work order:
Human acceptance / production release status:
```

### Definition of Done

A feature is not complete because a route, table, button, fixture or document exists. The real input -> service -> persistence -> response -> UI path must satisfy the frozen contract, with failures, retries, permissions and old-client compatibility verified. Critical tests cannot be substituted with a mock or a skipped test. Locally verified is distinct from live validated and accepted. Conditional source features that cannot be delivered require explicit owner scope disposition; mandatory completion/history integrity, private isolation, correct labels and truthful degraded behavior cannot be silently waived.

## 22. Foundation acceptance journey

Before declaring the foundation accepted, use a staged account with representative data (including 300+ completed titles, rewatch, dropped, planned, unrecorded, favourite-only and preference-only cases), not the owner's production personal records without consent.

1. Sign in using permitted email flow and open Home; no known completed titles in default discovery. Public browsing remains usable if backend wakes, with clear private filtering notice.
2. Change mode and search a completed title; Show All reveals it with status. Library/history/favourites/collections still retain it; unrecorded distinct sequel remains independently eligible.
3. Mark a previously watched title complete from shared card/approved hero management; commit once, no fabricated marks, all relevant filtered feeds update without reload. Ongoing title cannot bypass caught-up semantics. Active session and library stay coherent.
4. Save favourites/wishlist, start/continue, mark sparse episodes/chapters, repeat, edit details and collections. Confirm cross-device consistent state and conflict handling. Bulk select known historical titles with mixed item outcomes and safe correction.
5. See Based on Your Favourites, You May Like and Trending as independent appropriate sections on Home/Browse; Similar on details. Open exact View All, dismiss/restore, collect valid exposure evidence without changing history or training scores.
6. See verified episode details and tracking reconciliation without losing existing marks; optional enrichment failures isolated. Find typed related seasons and missing releases with accurate coverage and status.
7. Follow supported release, verify calendar precision and deduplicated in-app delivery through actual durable staged job/retry, honor settings. Verify privacy/deletion in disposable accounts, not destructive owner actions.
8. Pass full required tests, staged account/provider checks, independent security/accessibility/visual review, operational backup/restore/rollback and monitoring. Obtain explicit owner acceptance or documented conditional-scope exception and explicit production release decision.

**Release boundary:** Do not move to advanced algorithms while mandatory Foundation work is unresolved unless the owner explicitly revises the milestone. Provider clearance and actual deployment approval remain separate even for personal use.

## 23. Copy-ready coding-agent directive

Continue ALCOR Foundation V1 on the existing `finish-the-foundation` branch, starting from the current verified checkout (supplied audit baseline `2a68599`). Read this continuation plan, the original Foundation V1 document, latest work orders/contracts, remaining scope, provider addendum and D-SSBP. Inspect current Git status/diff and existing tests first. Do not restart F01–F07, discard user changes, redesign the locked UI, duplicate services or implement deferred algorithms.

Execute REM-00 to REM-12 according to dependencies. First close the authoritative completion invariants, then finish global Home/Browse discovery and the three basic recommendation functions, including exact View All, independent Trending, feedback and impression collection. Complete library search/sorting/bulk operations, approved historical correction, trusted metadata reconciliation, related titles, release monitoring and privacy/operational validation. Use R01–R70 and original Foundation acceptance IDs for traceability. Preserve already approved discovery/favourite/bulk/impression decisions, exact tracking and repeat history, guest/cold-start browsing, account isolation, success-only cache publication and no failed-write replay. Use the existing single card control/dialog and current design; obtain consequential contract approval before changes to transitions, mapping, UI placement, schema, correction, jobs or deletion.

Do not treat public API reachability as usage permission or enable production provider gates without clearance. Do not use fixture data as live catalogue; do not fabricate metadata, reasons, watch dates, episode marks, coverage or scores. No weighted personalized scoring, AMRA, APEA, Narrative DNA, custom ML, Google configuration, import/export or unauthorized dependency, remote migration, production deployment or provider commitments.

After each work order, run applicable focused and integration/regression tests, update work-order/acceptance/remaining-scope/error records, report exact files changed, commands/results, failures/skips/not-executed tests, protected behavior, limitations and next eligible work. Never weaken existing tests. If approval, provider rights, credentials or local reload is blocked, stop the dependent operation, report the exact blocker and continue independent authorized tasks. Do not claim Foundation complete, human accepted or released until the respective gates actually pass.

## 24. References and preparation limits

Primary evidence: supplied `ALCOR-source-2026-11-25-2a68599.zip`, particularly the repository documents and source paths listed in §2. The baseline's approved F04/F05, F06 and F07 records were read directly; the earlier audit's R01–R70 list is retained for continuity. The original Foundation plan and metadata addendum were reopened. New work-order names, sequence, minimal completion guard approach, feed/correction/job contract sketches, exposure day semantics and test additions are engineering proposals, not already approved interfaces. No code change, migration, live provider call, service reload, test execution or release occurred while preparing this plan. Provider terms/limits listed in repository records are historical evidence; validate them before release.

Technical references (existing documentation and established engineering patterns; verify current provider terms in REM-00):

- AniList API: https://docs.anilist.co/ ; terms: https://docs.anilist.co/guide/terms-of-use ; rate limits: https://docs.anilist.co/guide/rate-limiting
- TMDB season details: https://developer.themoviedb.org/reference/tv-season-details ; application authentication: https://developer.themoviedb.org/docs/authentication-application
- Fribb mappings: https://github.com/Fribb/anime-lists (verify applicable licence/provenance before use)
- TanStack Query invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- IntersectionObserver: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- Alembic: https://alembic.sqlalchemy.org/en/latest/
- Supabase auth PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow
- Playwright: https://playwright.dev/docs/intro

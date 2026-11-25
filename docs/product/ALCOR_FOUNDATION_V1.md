# ALCOR Foundation V1

## Complete basic-functionality implementation specification and engineering instructions

| Document control | Value |
| --- | --- |
| Version | `ALCOR-FOUNDATION-V1.0` |
| Date | 25 November 2026 |
| Baseline source | `ALCOR-source-2026-11-25.zip` |
| Original requirements | `ALCOR_Implementation_Plan_v1.0.zip` and the product/engineering documents in the source repository |
| Status | Proposed execution plan; awaiting owner approval to implement |
| Primary objective | Complete and verify the basic product before introducing advanced intelligence algorithms |
| Immediate priority | Stop displaying known completed media in personal discovery and provide complete personal actions directly from media cards |

> **ALCOR should remember what the user has watched so that the user does not have to.** Every personal discovery page must respect confirmed consumption history, and every media card must make that history easy to maintain.

This specification consolidates the preceding basic-functionality completion plan into an executable work order. It is an additive plan for the current repository, not a replacement architecture or a claim that any new work has already been implemented. It preserves the existing tracking, identity, authentication, accessibility, and security contracts. Where a newly proposed default or layout changes an existing product contract, record explicit owner approval before changing the contract. Do not silently reinterpret earlier specifications.


## Contents

- [1. Objective and release boundary](#1-objective-and-release-boundary)
- [2. Source-of-truth documents and implementation rules](#2-source-of-truth-documents-and-implementation-rules)
- [3. Verified source baseline and preservation decisions](#3-verified-source-baseline-and-preservation-decisions)
- [4. Global personal discovery policy (P0)](#4-global-personal-discovery-policy-p0)
- [5. Home, Anime, Manga and discovery page completion (P0)](#5-home-anime-manga-and-discovery-page-completion-p0)
- [6. Shared media-card actions and status management (P0)](#6-shared-media-card-actions-and-status-management-p0)
- [7. Completion and historical correction contract (P0)](#7-completion-and-historical-correction-contract-p0)
- [8. Basic recommendation infrastructure (P0; no custom scoring)](#8-basic-recommendation-infrastructure-p0-no-custom-scoring)
- [9. Library and wishlist completion (P0)](#9-library-and-wishlist-completion-p0)
- [10. Metadata providers and trusted tracking (P0/P1)](#10-metadata-providers-and-trusted-tracking-p0p1)
- [11. Discovery controls and basic search (P0/P1)](#11-discovery-controls-and-basic-search-p0p1)
- [12. Basic franchise relationships (P1)](#12-basic-franchise-relationships-p1)
- [13. Release calendar, follows and notifications (P1)](#13-release-calendar-follows-and-notifications-p1)
- [14. Data, API, caching and security requirements](#14-data-api-caching-and-security-requirements)
- [15. Execution sequence and work orders](#15-execution-sequence-and-work-orders)
- [16. Mandatory acceptance-test matrix](#16-mandatory-acceptance-test-matrix)
- [17. Verification commands and environment](#17-verification-commands-and-environment)
- [18. Stage reporting and definition of done](#18-stage-reporting-and-definition-of-done)
- [19. Decisions and blockers requiring verification or approval](#19-decisions-and-blockers-requiring-verification-or-approval)
- [20. Implementation directive (copy into the coding-agent task if needed)](#20-implementation-directive-copy-into-the-coding-agent-task-if-needed)
- [21. References](#21-references)

---

## 1. Objective and release boundary

The first useful release of ALCOR must be a reliable, personal media library and discovery website. It must support anime, manga, manhwa, manhua and light novels to the extent that source metadata permits. The user must be able to discover new stories, record previously consumed titles, save content, maintain progress, find related seasons, and follow releases without unnecessary manual navigation.

The primary user has already watched more than 300 anime. The most immediate problems are duplicated discovery results and inefficient recording of historical completion. Fix these before attempting statistical inference or machine learning.

### 1.1 Definition of the foundation

The foundation consists of:

1. Consistent account-aware discovery exclusions across all public browsing surfaces when personal services are available.
2. Shared media-card actions and confirmed personal status.
3. Tracking-aware completion, correction, bulk management and synchronized personal state.
4. Basic provider-backed recommendation shelves, not custom recommendation scoring.
5. Reliable metadata, canonical identities, and trusted episode/chapter tracking.
6. Basic franchise relationship discovery and release monitoring.
7. Complete verification, documented limitations, operational readiness and human acceptance.

### 1.2 Non-goals

Do not implement, train or introduce any of the following in this milestone:

| Deferred item | Instruction |
| --- | --- |
| AMRA / Active Search | Do not implement adaptive memory reconstruction yet. Manual/bulk history recording is in scope. |
| APEA | Keep the existing fixed profile questionnaire; do not introduce information-gain questioning or pairwise learning. |
| Weighted recommendation scoring | Explicitly owner-deferred in `docs/engineering/recommendation-contract.md`. Do not implement the old six-factor formula or invent new weights. |
| Narrative DNA, semantic embeddings, custom ML | Defer semantic retrieval, learned story vectors, neural training and inferred taste models. |
| Advanced Discovery, Taste, Match, Compare, Compass, Recall, Pulse, Universe | Defer adaptive ranking, complex semantic matching, interactive title investigation, temporal modelling and visualization algorithms. Preserve basic existing search/filter features. |
| Decision and Time | Defer viewing optimization and scheduling algorithms beyond normal release calendars and existing continue queues. |
| Shield and Capture | Defer advanced progress-aware spoiler classification and automatic browser/playback capture. Preserve existing spoiler controls. |
| Google login, historical file import and user-facing export | Preserve explicit owner deferrals. Manual/bulk selection within ALCOR remains in scope. Operational backup/restore is still mandatory. |
| Streaming, social network, paid AI, LLM-generated copy, GPU infrastructure | Out of scope. |
| Optional push/email, PWA, additional providers | Conditional future extensions; do not add without separate approval. |

No advanced intelligence capability may be represented as working merely because a database table or UI placeholder exists. Record recommendation feedback and exposure data now so that future algorithms have a dependable foundation.

---

## 2. Source-of-truth documents and implementation rules

### 2.1 Read these repository files first

| File | Governing purpose |
| --- | --- |
| `AGENTS.md` | Mandatory project engineering instructions |
| `docs/engineering/DROMOLYS_STANDARD_SOFTWARE_BUILDING_PROTOCOL.md` | D-SSBP v1.0 lifecycle, risks, verification, acceptance and work orders |
| `docs/product/ALCOR_MASTER_IMPLEMENTATION_PLAN.md` | Original product and implementation requirements |
| `docs/product/ALCOR_CONTENT_AND_UX_WRITING_PLAN.md` | Editorial rules and user-facing content |
| `docs/product/PROFILE_ONBOARDING_PLAN.md` | Existing profile and explicit preferences |
| `docs/product/MULTI_PROVIDER_METADATA_PLAN.md` | Current AniList/AniZip/TMDB provider contract |
| `docs/architecture/browser-first-catalogue.md` | Browser-first reads, personal readiness and bounded pagination |
| `docs/engineering/catalogue-workflow-contract.md` | A26–A30 workflows, account isolation and cache publication |
| `docs/engineering/recommendation-contract.md` | Deferred scoring; binding scope restriction |
| `docs/engineering/remaining-scope.md` | Current outstanding work and existing contracts |
| `docs/design/interface.md` | Existing UI conventions, accessibility and motion |
| `docs/engineering/development.md` | Local setup, tests and generated contracts |
| `docs/engineering/acceptance-record.md` | Historical evidence, not a substitute for new verification |
| `docs/engineering/error-log.md` | Required record of tooling and application failures |

Later owner-approved contracts supersede older conflicting requirements only within their explicit scope. In particular, preserve browser-first public browsing instead of reverting to a mandatory backend proxy, and preserve the owner-deferred weighted recommendation scoring. This proposed foundation plan changes the default personal discovery presentation and adds card actions; it does not authorize unrelated changes to existing scientific or security contracts.

### 2.2 Mandatory instructions to the implementing engineer/agent

- Start by inspecting the current repository state. Run `git status --short`, `git diff --stat`, and `git diff` in the real working repository; inspect existing changes and untracked files. If using an exported archive without Git metadata, record that limitation and establish a file baseline. Never assume it is identical to the latest live repository.
- Do not restart or overwrite work that is already complete. Resume from the actual code, not an old task list or a claimed percentage.
- Follow D-SSBP: inspect → specify → plan → implement → verify/integrate → validate/accept. Classify each task's risk under the repository protocol (including L2 behavior and L4 private ownership/database boundaries where applicable). Freeze consequential contracts and record ADRs before implementation.
- Work in small, focused, verifiable feature changes. In a real Git checkout, create one focused commit per verified feature as required by `AGENTS.md`. Do not fabricate commits or rewrite history. Preserve unrelated working-tree modifications.
- Reuse existing modules, components, services, schema, migrations and tests. Remove superseded duplicate logic only after identifying references and verifying behavioral equivalence. Do not add a second library, status machine, identity resolver, or recommendation-filtering system.
- No remote production migrations, production writes, secret changes, new service subscriptions, new dependencies or parallel agents without the applicable explicit approval and repository procedures. Use local/staged services for tests. Never expose tokens, credentials, personal notes or internal errors.
- Every feature requires independent expected results, relevant tests and a trace of at least one realistic input. Do not weaken tests or mock around the feature being verified. Record failures, causes, corrections, retests and unresolved limitations in `docs/engineering/error-log.md`.
- Do not label a feature complete when it is only implemented. Track implementation, automated verification, live/staged validation, human acceptance and release separately.
- Report each completed stage with changed files, migration/contract changes, exact commands, test counts, observed failures and remaining scope. If a prerequisite blocks one part, complete safe independent work, keep the blocked capability disabled, and document the precise blocker. Do not promise a future completion or silently mark a blocked task done.

---

## 3. Verified source baseline and preservation decisions

The archive was reopened while preparing this plan. The following paths and behavior were inspected. These observations describe the supplied source, not a fresh runtime test of the application.

| Area | Current source behavior | Required foundation decision |
| --- | --- | --- |
| Home | `frontend/src/pages/public.tsx` uses `useHome()` and renders `home.data.featured`, `anime` and `manga` without the personal exclusion pipeline. `ContinueSections` already exists. | Filter discovery shelves and hero; preserve personal continue sections. |
| Browse | `frontend/src/pages/browse.tsx` renders general shelves and basic profile suggestions. | Introduce consistent discovery modes and both recommendation shelves. |
| Cards | `frontend/src/entities/media/index.tsx` owns shared media presentation; discovery calls compact `SaveButton` from `features/library/index.tsx`. | Add shared, context-aware quick actions and confirmed status. |
| Personal filtering | `features/catalogue/personal-page.ts` scans up to 3 source pages, preserves unread offsets, and calls `/me/discovery-exclusions`. | Reuse and generalize rather than implement a parallel filter. |
| Discovery service | `backend/app/modules/discovery/service.py` uses `ever_completed`, existing statuses and `include_planned`. The candidate endpoint accepts up to 100 AniList/MAL references per batch. | Preserve existing rules; align all surfaces and any new feedback exclusions. |
| Status | `backend/app/modules/library/schemas.py` exposes `planned`, `in_progress`, `completed`, `on_hold`, `dropped`, `not_interested`; history via `ever_completed`. | Do not create a second status enum for watching/reading/rewatching. Derive labels from media type and sessions. |
| Completion | `features/library/complete.tsx` uses active session completion or versioned library assertion, with account-change protection. | Reuse and extend for direct card/bulk workflows; no fabricated unit marks. |
| Profile | `features/discovery/taste.ts` uses preferred genres, exclusions, publication status and maximum anime length; setup favorite titles are filtered out. | Preserve the fixed questionnaire; use additional verified explicit metadata without weighted scoring. |
| Favourites | Setup selection and library favourite flag both exist. | Unify effective favorites and avoid conflicting sources. |
| Provider | Browser AniList catalogue, AniZip episode display, backend identity resolver. General backend provider can still be a fixture/disabled provider. | Complete permitted production paths; no hidden fixtures. TMDB remains conditional on valid mapping/credentials. |
| Personal data | Existing PostgreSQL/Alembic schema, Supabase Auth, Redis readiness/rate limits, collections, personal detail and tracking services. | Preserve stack and personal data; use additive migrations and existing contracts. |
| Release monitoring | Notification preference exists; calendar, follows and durable delivery are outstanding according to remaining-scope documentation. | Implement verified in-app release monitoring, not a decorative preference-only control. |

The working stack remains React + TypeScript + Vite, React Router, existing Radix/Tailwind UI, TanStack Query, FastAPI, async SQLAlchemy/PostgreSQL, Alembic, Redis and Supabase Auth. Do not migrate to a new framework or database for this work.

---

## 4. Global personal discovery policy (P0)

### 4.1 Discovery modes

Introduce one shared, documented policy for all discovery entry points. Retain the existing query values `hide_watched` and `new_to_me` and existing representation of all-mode; do not invent incompatible URL values.

| Mode | Required behavior |
| --- | --- |
| Show All | Display the available catalogue subject to explicit user filters and source restrictions. Show known personal status without excluding it solely because it was consumed. |
| Hide Watched | Exclude every title with confirmed historical completion, including rewatching/rereading or soft-removed historically completed titles. |
| New to Me | Exclude historically completed, started, on-hold, dropped and not-interested titles. Planned inclusion follows the saved `include_planned` preference. Personal recommendation dismissals are also respected in recommendation contexts. |

Proposed default requiring approval as part of this plan: signed-in discovery surfaces use **New to Me**. On discovery surfaces, explicit URL mode overrides the persisted discovery preference, which overrides the surface default. Explicit title search defaults to Show All unless a mode is explicitly selected or carried from a discovery shelf. Personal management surfaces are not subject to discovery exclusions. Preserve guest public browsing as Show All.

### 4.2 Authoritative eligibility truth table

The current status alone is insufficient. `ever_completed=true` overrides current status for Hide Watched and New to Me. An anime on a rewatch may have an `in_progress` library status and an active repeat session; it is still a historically completed title.

| State/evidence | Show All | Hide Watched | New to Me |
| --- | --- | --- | --- |
| No personal record | Include | Include | Include (unknown history, not proven unwatched) |
| Planned, never completed | Include | Include | Include iff `include_planned` permits |
| In progress, never completed | Include | Include | Exclude |
| On hold, never completed | Include | Include | Exclude |
| Dropped, never completed | Include | Include | Exclude |
| Not interested, never completed | Include | Include | Exclude |
| Completed | Include | Exclude | Exclude |
| Rewatch/reread after completion | Include | Exclude | Exclude |
| Soft-removed, ever completed | Include catalogue item | Exclude | Exclude |
| Unrecorded sequel of completed title | Include | Include | Include; independent identity |
| Explicit recommendation dismissal | Include in general catalogue | Follow history policy | Exclude from personal recommendation shelves; distinguish from library status |

Preserve current backend historical handling for soft-removed nonplanned entries until any change is explicitly specified and approved. Do not equate removal from the visible library with erasing prior history. A mistaken historical completion needs a dedicated correction contract, not ordinary removal.

### 4.3 Route policy

| Surface | Default for signed-in member | Required treatment |
| --- | --- | --- |
| Home `/` | New to Me | Filter all discovery shelves and hero; do not filter continue queues. |
| Bare `/anime`, `/manga` | New to Me | All discovery shelves use same policy. |
| Filtered Anime/Manga, Discover and seasonal browse | New to Me | Preserve explicit mode and all active filter parameters. |
| Recommendations / View All | New to Me | Apply recommendation dismissal and user hard constraints; preserve seed/context. |
| `/search` | Show All | Explicit search must find completed media; show status; honor explicit selected mode. |
| Title details | No discovery exclusion for current title | Personal state remains visible; apply policy to Similar Anime, not to the complete Related Titles list. |
| Library, Wishlist, Favourites, Collections, History | Not applicable | Show the saved records relevant to the page, even if consumed. |
| Continue Watching/Reading | Not applicable | Show valid unfinished/continuation entries. |
| Release calendar and franchise detail | Contextual | Do not hide followed or relevant completed records when needed to understand schedules/relationships. Personal discovery sublists are filtered. |

Guests see public data without claims of personal exclusion. A signed-in user can explicitly choose Show All. Recommendations intended to discover something new must remain honestly labeled if personal filtering is unavailable; never silently repurpose them as personalized.

### 4.4 Candidate processing and pagination

1. Retrieve provider candidates through the existing approved browser-first transport or verified backend adapter, according to the source contract. Keep source sort and filter parameters.
2. Normalize supported provider identities. Deduplicate by verified canonical UUID or safe namespaced identities, not title strings. Preserve media-type namespace so an anime and its manga cannot be accidentally merged.
3. Batch owned personal-state lookup and/or exclusion calls using existing endpoints. Maximum current candidate batch is 100. Reads must not create canonical rows or spend the metadata identity-write quota.
4. Apply explicit hard filters, personal visibility rules and relevant recommendation dismissals before building the displayed page.
5. Fill the requested shelf/page from additional bounded source windows if necessary. Preserve unread offset and `has_more`; use the existing three-source-page bound per personal request unless a new bounded contract is approved. Do not create unbounded fetching to fill a row. Continue via cursor or More when more source data may exist.
6. Distinguish source exhaustion from budget-limited partial results. Do not invent global counts or pagination totals for an incompletely scanned upstream catalogue.
7. Return fewer items, an honest empty state, or a continuation action rather than relaxing the exclusions. Do not silently reinsert completed titles.
8. Invalidate/reset appropriate cursor and cache state when the mode, query, filters, account or relevant personal status changes. Exclusion results must not be shared between accounts.

### 4.5 Data readiness and failure behavior

Preserve the existing browser-first contract: public metadata can render while the backend is asleep or unavailable. Personal data requires authenticated backend readiness. Do not make public browsing wait for private services. When account history cannot be verified, suppress the personal discovery claim and show an explicit unavailable/ retry state; a separately labeled general catalogue may remain available, with an explicit warning that watched-title filtering is not applied. Do not treat a failed status request as confirmed absence. Never queue a private write or automatically replay a failed write merely because readiness returns.

---

## 5. Home, Anime, Manga and discovery page completion (P0)

### 5.1 Proposed member Home order

| Order | Section | Content and behavior |
| ---: | --- | --- |
| 1 | Featured | Eligible released title with reliable content/artwork; omit if none qualifies. The hero must pass the same exclusion policy. |
| 2 | Continue Watching | Existing account-owned tracking queue; independent of discovery exclusions. |
| 3 | Continue Reading | Existing account-owned reading queue. |
| 4 | Based on Your Favourites | Provider-backed title recommendation candidates. |
| 5 | You May Like | Explicit profile-based candidate retrieval. |
| 6 | Trending Anime | Actual provider trending metric only. |
| 7 | Currently Airing | Verified releasing anime. |
| 8 | Popular Anime | Provider popularity, not falsely labeled trending. |
| 9 | Explore by Genre | Navigate with inherited discovery mode and selected genre. |
| 10 | Popular Manga | Eligible reading content with correct classification. |
| 11 | Upcoming Releases | Verified upcoming content; no claims of already available episodes. |
| 12 | Missed Seasons | Not-confirmed-completed related releases, once Stage 5 is available. |

This order is a proposed presentation change. Keep the existing Home and Dashboard separation. Do not turn the Home page into an administrative dashboard. For guests, show clearly labeled general sections and existing public browsing, not empty personal shelves or fabricated personal recommendations.

### 5.2 Browse page requirements

- Anime and Manga landing pages retain horizontal sections and the existing filtered catalogue routes.
- Show Based on Your Favourites and You May Like independently when supported. Do not replace Trending with You May Like.
- Retain Latest, Popular, Top Rated, Upcoming, Trending where currently supported; add dedicated Currently Airing/Currently Publishing where reliable.
- Every View All link must preserve source shelf type, media type, explicit filters, discovery mode and, for personal recommendations, the correct seed/context. Do not route a personalized shelf to a different generic popularity query.
- Use shared MediaCard actions and status rendering across all shelves, search and grids. Keep native horizontal scrolling, next-card preview, responsive grid and existing skeleton conventions.
- Prevent duplicate identities inside a shelf. Suppress avoidable duplicates between discovery shelves on a single rendered page, preferring higher-priority personal sections. Do not remove a necessary Continue Watching item, explicit search result or franchise entry merely because another context displays it. Use bounded refill and do not claim globally exhaustive deduplication.
- Profile changes, status changes, favorite changes, recommendation feedback and account changes refresh only the relevant private shelf data. Preserve public caches and avoid repeated provider requests.

### 5.3 View mode UX

Expose Show All / Hide Watched / New to Me using existing filter controls or a compact accessible segmented selection. Persist the chosen discovery preference for signed-in users using the existing preferences service and version checks; do not silently overwrite existing saved presets. Specific URL filters remain explicit. No additional permanent sidebar.

### 5.4 Home acceptance examples

- Provider hero A and popular row [A, B, C] where A is ever completed and B is in progress: under New to Me, neither A nor B may appear in discovery; C remains eligible. A/B may appear in the appropriate personal continue or library sections.
- A source page with zero eligible candidates but `has_more=true` must allow continuation. If the next allowed page contains D, D is eligible. If the bounded window is exhausted, show a partial/empty-with-More state.
- Unrecorded Season 2 of a completed Season 1 remains eligible; neither title's identity/status is copied to the other.

---

## 6. Shared media-card actions and status management (P0)

### 6.1 Design requirements

Preserve the existing monochrome editorial website, horizontal navigation, poster artwork, reserved 2:3 poster ratio, responsive layout and no permanent sidebars.

Use the authoritative repository design tokens: white `#FFFFFF`, ink `#171717`, surface `#F5F5F5`, border `#E5E5E5`, accessible muted `#626262`, black primary buttons with white text. Retain the pinned self-hosted Inter typography for headings and body, using weight/size hierarchy. The preceding discussion proposed Geist headings and `#111111`/`#737373` accents; those are not the current repository's authoritative design tokens. Do not introduce a new font dependency or redesign the theme without approval.

Extend the existing poster-corner controls into a compact action group/menu rather than a permanent detached action row. Provide an immediately accessible Mark Watched/Mark Read action and wishlist action when appropriate, plus a More menu. Use existing Radix dropdown/dialog and shared Button primitives. On narrow screens, prioritize a compact accessible menu if needed to avoid overlap, but keep completion reachable without opening the detail page. No hover-only critical action: touch and keyboard users must have access. Use 44px targets, visible focus rings, correct labels and menu focus restoration. Card body links remain independent from buttons; no invalid nested interactive controls. Keep personal status in the card body.

### 6.2 Action matrix

| Action | Where available | Required semantics |
| --- | --- | --- |
| Open details | All cards | Existing canonical/provider route; no status mutation. |
| Mark watched / Mark read | Eligible discovery, wishlist and library cards | Confirm and use the appropriate completion path. |
| Add to wishlist | Eligible unrecorded/planned contexts | Reuse wishlist service; do not move completed/active entries back to planned. |
| Start watching / reading | Eligible noncompleted entries | Use existing tracking/session start workflow; preserve past marks. |
| Continue | Active sessions | Resume next valid unresolved unit. |
| On hold / Resume | Allowed state transitions | Preserve progress; no destructive restart. |
| Dropped | Allowed transitions | Preserve records and remove from New to Me. |
| Not interested | Appropriate discovery contexts | Use authorized library status; distinguish title-wide rejection from recommendation-only dismissal. |
| Favourite / Remove favourite | Personal actions | Explicit positive preference; must not fabricate consumption. |
| Rate | Personal actions | Reuse existing versioned 1–10 rating contract. |
| Add to collection | Personal actions | Reuse collection membership service; preserve independent ownership. |
| Edit progress | Started/tracked media | Open existing exact tracking workflow. |
| Correct status | Personal management | Dedicated correction with auditable history and safe transition rules. |
| Remove from library | Personal management | Existing soft removal/recovery, not historical erasure. |
| Dismiss recommendation | Recommendation contexts | Recommendation feedback only, not an implicit dropped or completed record. |

Show only valid or meaningfully disabled actions. Use the real status/session transition table, not an independent frontend truth table. For anime/manga language differences, derive labels from media type. Rewatch/reread is a session concept; do not add unsupported enum values to `LibraryStatus`.

### 6.3 Shared mutation and status lifecycle

- Reuse `SaveButton`, `readSavedStatus`, `CompleteTitle`, the tracking and personal-details modules where suitable. Refactor shared behavior into a single action controller/hook/service rather than copying mutations into each page.
- Resolve canonical identity through the existing verified backend identity mechanism for writes. Never trust client-supplied title, metadata or arbitrary source mapping for persistence.
- Batched status reads distinguish loading, confirmed absence, known state, and failed/unavailable lookup. No one-request-per-card pattern.
- A status action captures account ID, media identity and expected version. Recheck account when confirmation is submitted and before applying late callbacks. Do not permit stale dialogs or responses to mutate a new account's state.
- Disable duplicate submissions for the same title/action while pending; retries follow existing idempotency and conflict contracts.
- Publish confirmed server state to all applicable account-scoped cache aliases before background invalidation. Update library, wishlist count, details, discovery eligibility, continue queues and relevant statistics. Invalidate/recompute affected private recommendation shelves. Never remove the title from shared catalogue metadata.
- Do not show success, animate or permanently hide a card until the server confirms a committed change. A failed or no-op write must preserve truthful state; no duplicate celebration.
- Existing confirmed-save motion, reduced-motion preferences and shared toasts remain intact. Avoid excessive motion when a completed card disappears; preserve focus on a logical neighboring action or heading.
- Guests remain able to browse. Personal actions prompt sign-in. If extending pending-action replay to completion, specify a short-lived account-bound desired action, re-resolve current state and require appropriate confirmation. Do not silently auto-complete after sign-in or recovery. Preserve existing pending-action expiry/single-use protections.

### 6.4 UX copy requirements

All new user-facing copy goes through `frontend/src/content/en/common.json` and typed content helpers. Preserve existing language and editorial rules. Examples of intended meaning (final keys/copy subject to editorial review):

| Context | Suggested copy |
| --- | --- |
| Completion action | Mark watched / Mark read |
| Confirmation | Mark this title as completed? This records your completion without adding individual episode or chapter viewing records. |
| Ongoing title | Caught up, where verified coverage and existing policy support it |
| Status lookup failure | Couldn't check your library. Try again. |
| No eligible content | No new titles match these filters. |
| Partial personal discovery | More titles may be available. |
| Private service unavailable | Personal filtering is temporarily unavailable. |
| Write failure | Couldn't save your change. Try again. |
| Conflict | This title changed on another device. Refresh and try again. |

Do not expose SQL, exception stacks, auth tokens, API codes, provider-specific internals or raw server exception text. Use central error mapping and a meaningful recovery action.

---

## 7. Completion and historical correction contract (P0)

### 7.1 Completion is a personal assertion, not fabricated tracking

| Situation | Required operation |
| --- | --- |
| Never recorded finished title | Resolve identity and create confirmed completed record using the existing library assertion semantics. |
| Planned title, no active session | Authorized versioned library completion. |
| Active watch/read session | Existing versioned session completion operation; session and library must remain consistent. |
| On hold/dropped | Inspect current session and transition policy; route through allowed completion or explicit correction. Do not bypass the state machine. |
| Already completed, no active repeat | Idempotent/no-op. Do not create duplicate completion history. |
| Ongoing release | Distinguish caught up from finished. Use verified release coverage and existing completion policy; no automatic final completion based on current released count. |
| Unknown final total | No automatic completion; only explicit user assertion where current contract allows, with honest unknown coverage. |
| Active rewatch/reread | Use repeat-session rules. Preserve original completion and unit marks. |
| Incorrectly marked completed | Dedicated correction path; ordinary delete/wishlist action cannot clear historical evidence. |

A historical completion may assert that a person finished a title without knowing each episode's date or mark. Do not invent unit progress, watch durations, timestamps of the original viewing, episode counts, or chapter coverage. The time of recording the assertion is not the historical watch date. Preserve known/unknown distinctions in history/statistics.

### 7.2 Transaction and concurrency

The backend owns completion validity. Use existing versioned library and session endpoints and shared services. Where a new operation is necessary, freeze the additive contract under D-SSBP before changing API/storage. For an active session, update the relevant completion state and library state transactionally. Preserve exact session history, marks, previous repeats, versions and activity events. Validate ownership at every boundary; no cross-account ID trust. Handle concurrent update, repeated submit, network interruption and retry without corrupting progress.

### 7.3 Immediate discovery consequence

After a confirmed completion, the title must disappear from all active private discovery surfaces whose mode excludes it, including a cached featured candidate and all identity aliases. If explicitly viewing Show All, leave the card visible with Completed status. Keep it accessible in search, library, history, favourites and collections as appropriate. A card removed from a shelf triggers bounded refill; do not block the confirmation on a slow provider refresh.

### 7.4 Corrections and undo

The current recovery contract deliberately excludes unsupported completion undo. Do not expose Undo Completion until a safe backend correction/recovery operation has been specified, approved and tested. A correction must distinguish an erroneous assertion from true historical completion and from repeat sessions. Recompute `ever_completed` only from authorized corrected evidence while retaining auditable original/correction events. Never bulk-reset historical flags or remove true historical marks to fix the UI. If this contract is unresolved, do not ship the correction/undo control as working; report it as a foundation blocker.

---

## 8. Basic recommendation infrastructure (P0; no custom scoring)

### 8.1 Three separate user-facing functions

| Section | Inputs | Retrieval | Initial ordering |
| --- | --- | --- | --- |
| Based on Your Favourites | Effective favorite anime/manga IDs | Provider title-to-title recommendation relationships, where permitted and supported | Provider order, deterministic merge/round-robin across bounded seeds; no inferred score |
| You May Like | Explicit profile genres, themes, format/status/length preferences and strict exclusions | Provider catalogue filter queries; combine eligible groups | Provider sort and deterministic variety; no invented taste weights |
| Similar Anime / Similar Manga | Current title | Provider recommendation relationships for that title | Provider order, personal eligibility where applicable |

Do not use a generic popularity list under a personalized label. Do not call provider similarity a calculated ALCOR match percentage. If the source cannot provide a recommendation capability, label it unavailable rather than inventing relationships.

### 8.2 Effective favourites

The current profile stores `intelligence_profile.favorite_anime_ids`; library entries have a `favorite` flag. Implement one effective favorite-resolution service. Both existing sources must be considered, deduplicated by canonical identity. Define update/removal semantics before implementation so an explicit removal is not undone by stale setup selection. Proposed behavior for approval: present a unified effective list; reconcile the two sources transactionally or migrate to one authoritative source with explicit override/tombstone semantics. Preserve setup choices, existing favorites and ownership; do not mark a title watched simply because it is a favorite. Do not quietly change setup semantics or overwrite concurrent profile edits.

### 8.3 Retrieval and reasons

1. Retrieve a bounded, deterministic subset of current favorites (a rotating batch is acceptable; choose the limit against measured source budget, not an unbounded query per favorite).
2. Fetch recommendations only from an approved provider interface. Extend the existing AniList GraphQL adapter if its current use, fields and terms allow; do not assume Tenrai is the active source. Validate live schema/quotas in Stage 0. Use sanitized fixtures for development.
3. Normalize candidates and retain source ID, originating favorite(s), source rank/votes when actually supplied, source and freshness. Provider vote counts are not the user's personal preference score.
4. Combine and deduplicate candidates. Exclude known favorite seeds from their own suggestions, apply strict preferences and the shared discovery policy before constructing the shelf.
5. For You May Like, use existing `tasteParams`/`tasteItems` logic as a foundation. Extend explicit theme filters and other reliably supported fields. Separate hard exclusions from soft dislikes; do not turn an unselected/unknown attribute into a negative. Do not use weighted ratings, soft-dislike weights, learned narrative traits or inferred taste until the scoring contract is approved. The profile can collect information not yet used; document that honestly.
6. Candidate retrieval must work for a favorite-only profile where recommendations are supported. No profile/no favorites means general discovery with accurate labeling. A preferences-only profile may support You May Like even without ratings.
7. Display a truthful reason such as `Because you favourited [title]` or `Matches your selected Fantasy genre` only when supported by actual retrieval evidence. Do not generate plot claims, personal predictions, or match percentages.
8. View All must retrieve the same recommendation kind with preserved filters and bounded pagination; no generic substitution.

### 8.4 Feedback and exposure data

Extend the existing `personal.recommendation_feedback` foundation in migration 006 rather than duplicating it. Freeze a contract for recommendation-only dismissal, explicit reversal, and any additional feedback supported by this milestone. A dismissal does not silently change the library status. Preserve existing ownership/version rules.

Add account-owned recommendation exposure recording for the future Discovery Engine. An impression means a card was actually visible, not merely present in a fetched response. Define the visibility threshold, dwell time, deduplication window and retention as explicit implementation parameters; test them and avoid collecting unnecessary browsing data. Batch and deduplicate impression submissions using a stable event identifier; limit payload sizes and rates. Store media identity, recommendation context/seed where necessary, and observed time. Do not record other websites or unrelated browsing. Do not store impression data in public caches. Do not penalize exposure or infer preference yet; this milestone collects evidence only.

### 8.5 Empty, stale and failure states

No favorites: omit the shelf or offer an appropriate setup prompt. No eligible results: show a truthful empty state. Provider error: independent retry or permitted stale data with freshness label; do not claim absence. No personal readiness: use the policy in section 4.5. Apply current exclusions even to stale public recommendation candidates. Bounded refill must never reintroduce completed/rejected titles to satisfy a target count.

---

## 9. Library and wishlist completion (P0)

| Feature | Required instruction |
| --- | --- |
| Library-specific search | Search owned title/aliases, preserve status and filter scope. Private notes stay private. |
| Sorting | Title, saved date, recorded completion date, rating and progress where known; deterministic tie-breakers; unknown values explicitly handled. |
| Status tabs | Use existing status contract and type-aware labels, with historical completion views preserving repeat history. |
| Grid/list view | Reuse shared card/actions and existing accessible primitives; no alternate theme. |
| Multi-select | Select individual titles or visible page; explicitly identify selection scope and count; no accidental global all. |
| Bulk historical completion | Allow selecting many remembered anime/manga and confirming completion without opening each title. Available on appropriate catalogue and personal selection surfaces. |
| Bulk status updates | Validate every item against the same single-item state machine and expected versions. |
| Bulk collection assignment | Reuse owned collection memberships; independent from library status. |
| Bulk wishlist removal | Only affect eligible planned records; preserve historical evidence. |
| Corrections | Explicit correction contract from section 7.4. |
| Duplicate prevention | Canonical identity and owned uniqueness constraint. |
| Cross-device state | Use versioned server state and normal refresh/invalidation on focus/reconnect; do not claim realtime synchronization unless actually implemented. |

### 9.1 Bulk execution contract

Before implementation, decide and document transaction semantics. Proposed foundation behavior: bounded per-item processing with per-item outcomes for large bulk actions, since one conflict should not erase unrelated valid completions. Each item must use the same transactional service as a single action; no blind SQL updates. Clearly distinguish succeeded, unchanged, conflicted, failed and unattempted items. Preserve retry idempotency, account identity and audit history; return safe error codes per item. Refresh confirmed results only. Do not claim an all-or-nothing transaction unless it is actually guaranteed. If an operation must be atomic, define that separately.

Bulk selection must make the original problem practical: a person can review 20 historical titles, select those they remember, and mark those selected titles as completed in a single workflow. This is manual confirmation, not AMRA or import from an external file.

---

## 10. Metadata providers and trusted tracking (P0/P1)

### 10.1 Provider rules and open prerequisites

Follow the updated `MULTI_PROVIDER_METADATA_PLAN.md` and browser-first contract. The supplied repository uses AniList for public catalogue/discovery and identity resolution, AniZip for browser episode display, and plans TMDB for enrichment/fallback with optional Fribb mapping evidence. Do not silently switch back to the earlier Tenrai/Jikan proposal.

Before any production metadata feature, record permitted use, attribution, caching and display rights, endpoint/field coverage, nullability, schema drift, rate limits, CORS, error behavior and sanitized bounded sample evidence. AniList production clearance remains an open gate in the repository; a personal-use statement does not establish approval for a competing tracker. Preserve `VITE_ANILIST_USE_APPROVED` and backend `ANILIST_USE_APPROVED` gating. Verify AniZip terms and quota separately. TMDB credentials must be server-only. Confirm Fribb license and mapping provenance before use. Do not circumvent usage restrictions with another aggregator.

Do not hardcode temporary quotas as guaranteed permanent rates. Retain the current paced queue, request deduplication, cancellation and 429 handling, then validate any change against documented limits and existing regression tests. Cache only permitted public data. No bulk scraping or catalogue-wide recurring collection. Production must never silently use the development fixture catalogue as live content. Unsupported services/fields remain explicitly unavailable.

### 10.2 Media details

| Feature | Foundation work |
| --- | --- |
| Existing title, aliases, poster, banner, synopsis, scores, genres/themes, studios | Preserve normalized content and attribution; improve only required shared presentation. |
| Episodes | Retain existing browser AniZip display and independent failure state; connect verified episode identities to backend tracking. |
| Chapters/volumes | Preserve exact chapter labels and manual fallback; dedicated volume tracking only where independently defined and supported. Do not infer volume/chapter correspondence. |
| Personal controls | Share common card/detail actions and current confirmed status. |
| Characters, voice actors, staff | Add supported metadata sections; preserve attribution, nulls and spoiler caution. |
| Manga authors/publishers | Add where source provides reliable fields; otherwise unknown. |
| Trailers | Only verified supported links/embeds; safe URL validation. |
| Related titles | Add typed provider relationships, separately from Similar titles. |
| Legal streaming availability | Conditional on approved TMDB/source support, region and mapping; no unauthorized streaming links. |

### 10.3 Trusted episode reconciliation

Follow M0–M7 in the existing metadata addendum. The current browser episode list is not authoritative tracking data. Create verified normalized episode records in the server path and reconcile them with existing tracked units without deleting or renumbering progress.

- Preserve immutable internal unit keys and exact provider keys (including decimal/special labels and leading zeros). Separate display number from identity.
- Keep season, split cour, absolute episode number, specials, movies and media namespaces distinct. Do not join by array position or episode number alone.
- Verify provider title/episode mappings before writing; conflicting or ambiguous mappings require explicit resolution. A longer fallback list is not proof of correct coverage.
- Preserve manual targets and every existing episode/chapter mark, session, repeat and `ever_completed` record. Refresh metadata without silently rewriting progress.
- Store source, freshness, coverage (complete/partial/unknown), nullable release dates/precision and mapping version. A provider-reported final count does not establish released coverage. Missing runtime/filler classification stays unknown.
- Do not auto-complete ongoing or unknown-final titles based on a partial metadata response. Preserve existing skip, caught-up, and completion policy.
- Optional TMDB enrichment: require verified mapping and server secret; merge only missing fields where identity is confirmed. A missing token or provider outage must not break valid AniList/AniZip display or private manual tracking.

Use independent source-backed examples covering single seasons, split cours, long runners, specials, movie/OVA, upcoming titles, absent/conflicting mapping and an existing manually tracked session. No fabricated expected chapter or episode boundaries.

---

## 11. Discovery controls and basic search (P0/P1)

Complete the existing filter architecture rather than introducing a new query model.

| Control | Required behavior |
| --- | --- |
| Include/exclude genres and themes | Preserve normalization and any/all semantics. Strict exclusions override conflicting likes. |
| Multiple formats, years, seasons, publication status | Preserve repeated URL parameters and existing OR-within-field, AND-across-fields behavior. |
| Rating and score range | Validate bounds and actual provider rating scale. Unknown is not zero. |
| Episode/chapter length | Known-only when a strict bound is selected. Unknown totals remain unknown. |
| Studio | Complete supported bounded filtering; do not pretend exhaustive global results. |
| Popularity, trending, top rated, latest | Preserve actual provider definitions. AniList popularity count is not a MAL popularity rank or rating-vote count. |
| Hidden gems | Replace fixture-only behavior with a supported, explicitly defined eligible candidate pool and user-approved score/popularity/vote thresholds. Do not invent missing vote counts or rank semantics. |
| Random | Sample from a clearly defined eligible pool or wishlist. Do not claim uniform sampling of the entire external catalogue if only a bounded window is sampled. |
| Saved presets | Preserve all supported combinations; explicitly reject unsupported fields rather than silently dropping them. Versioned and account-owned. |
| Basic search | Exact/partial title and aliases where supported; preserve URL, debounce, cancellation and pagination. Saved synopsis/notes remain account-scoped. |
| Basic fuzzy search | If needed to satisfy original catalogue requirements, implement bounded conventional fuzzy title matching against permitted available metadata, not semantic/interactive Recall. |
| Age/content rating | Use verified source fields only; preserve existing adult-content restriction. Do not infer age classifications. |
| Reset filters | Reset to appropriate surface default, not accidentally Show All for signed-in discovery. |

Existing presets deliberately reject unsupported trending/released-only combinations until the contract supports them. If extending that contract, update schema, API and regression tests together. No silent serialization loss.

---

## 12. Basic franchise relationships (P1)

This stage does not implement the advanced Continuity Engine. It implements the provider relationship foundation.

1. Retrieve and normalize supported sequel, prequel, adaptation, source material, spin-off, side-story, recap, alternative and other typed edges with source attribution.
2. Store/retrieve canonical endpoint identities and relation type; deduplicate edges and preserve direction. Reject unresolved/ambiguous cross-provider merges. Do not equate a franchise with a single media record.
3. Show complete related-title context on details/franchise pages, with account-aware status where available. A completed season must not hide its own presence in the franchise view.
4. Compare released continuations against personal history and show a Missing Seasons/Missed Releases shelf. Label unrecorded content as not confirmed completed, not definitely unwatched. Exclude known completed continuations and separate optional material where the source supports it.
5. Separate upcoming from already released content. Release order may be shown when reliable; do not claim a verified watch order from a simple relation graph or invent manga continuation chapters.
6. Use bounded retrieval with explicit partial coverage. Do not implement graph-optimization, story-path inference, adaptation-boundary prediction, or advanced franchise intelligence in this milestone.

---

## 13. Release calendar, follows and notifications (P1)

| Feature | Required behavior |
| --- | --- |
| Public calendar | Show verified scheduled releases in the selected timezone; unknown or date-only values must not become precise release instants. |
| Follow/unfollow | Versioned, account-owned subscriptions for relevant titles. Idempotent changes. |
| New episode | Notify only from a verified release event for a followed title and enabled preference. |
| New sequel/season | Notify from verified related announcements; distinguish announcement from actual release. |
| Wishlist release | Notify when source-confirmed planned content becomes available, if enabled. |
| Notification centre | Private in-app list, read/unread, dismissal and clear loading/error states. |
| Preferences | Preserve notification defaults and controls; do not enable delivery without appropriate settings. |
| Jobs | Durable scheduling, bounded polling, transactional event/outbox or equivalent approved repository design, safe retries and deduplication. |

Design deduplication around canonical media, release identity, event type and recipient. Repeated provider observations, retries or worker restarts must not create duplicate notifications. Respect provider rate/caching conditions and avoid per-user catalogue-wide polling. Preserve existing user timezone semantics. Rescheduled dates must not create misleading duplicates; define the event policy in the work order. Record stale/unknown data honestly. Push/email remain deferred. No background job may bypass auth/ownership or use production credentials in tests.

---

## 14. Data, API, caching and security requirements

### 14.1 Existing interfaces to reuse

The current API route prefix is `/api/v1`. The paths below omit that prefix for readability. Verify exact schemas against `contracts/openapi.json` and current route modules before extending them.

| Interface | Purpose |
| --- | --- |
| `/ready` | Personal backend readiness; separate from liveness `/health`. |
| `GET /me/media-status` | Batched saved-status read by existing verified IDs/aliases. |
| `POST /me/discovery-exclusions` | Account-owned candidate exclusion, currently max 100 AniList/MAL candidate references. |
| `PUT /me/library/{media_id}` | Existing versioned library state operation. |
| `PATCH /me/library/{media_id}` | Existing personal details mutation. |
| `PUT/DELETE /me/wishlist/{media_id}` | Existing wishlist workflow. |
| `/me/watch-sessions`, `/me/reading-sessions` and their completion routes | Existing exact tracking, repeat and completion policies. |
| `GET/PUT /me/setup`, `/me/preferences` | Existing explicit profile/preferences and versions. |
| Existing collections, reporting and recovery routes | Reuse corresponding owned services. |
| `GET /me/discover` and existing discovery endpoints | Saved metadata/notes and fixture/general discovery; extend only with approved production behavior. |

### 14.2 Proposed additions (contract review before implementation)

Use existing module structure. Exact route names and schema are to be frozen after inspection, not claimed as existing APIs.

| Capability | Proposed interface/data responsibility |
| --- | --- |
| Effective favorites | Account-owned unified read/write or existing preference/library extension. |
| Provider recommendations | Public, attributed title-to-title candidates and relation data where permitted. |
| Personal recommendation retrieval | Account-owned favorites/profile candidate context, exclusion and pagination; preserve browser-first public transport. |
| Feedback/exposures | Extend existing feedback schema; batched impression recording with idempotent IDs. |
| Bulk library actions | Bounded versioned item operations with explicit result per item. |
| Historical correction | Auditable explicit assertion correction, not normal removal. |
| Verified episode mappings | Additive source identity/mapping and coverage contract. |
| Release follows/notifications | Owned subscriptions, event delivery/deduplication and read state. |

If using a browser-composed feed rather than a backend aggregation route, document its privacy and failure boundary. In either architecture, private state and write authority remain in the backend. Do not send private watchlists, notes, ratings or account tokens to public metadata providers. A public recommendation request for an individual title may use its public ID; private history stays within ALCOR.

### 14.3 Persistence and migrations

Reuse existing canonical catalogue and personal schema, seven baseline migrations, source aliases, status/version rules, preferences and recommendation-feedback foundation. Add only necessary data structures after checking the real schema:

- Source-backed recommendation edges and typed franchise relations, where caching/persistence is permitted.
- Account-scoped exposure events and any necessary feedback extension.
- Explicit status-correction evidence and bulk operation records where required by the approved contract.
- Verified episode mapping, source provenance and coverage.
- Follow subscriptions, release event identities, notification delivery/read state and durable job/outbox records.

All schema changes require additive Alembic migrations, intentional indexes, foreign-key/unique constraints and RLS/ownership tests on real PostgreSQL. Do not modify historical migrations already applied, truncate personal tables, erase `ever_completed`, or regenerate canonical IDs. Inspect query plans for new hot paths; use appropriate indexes for account/media, event identity, cursors and relationships. Validate migration from the prior revision with representative existing personal records and a documented recovery/rollback plan. No unauthorized remote migration.

### 14.4 Performance and cache contracts

| Concern | Required behavior |
| --- | --- |
| Public content | Shared/public cache only for permitted nonpersonal metadata; preserve source and age. |
| Private data | Account-scoped keys, no-store/shared-cache isolation, explicit mode, relevant filters and source context. |
| Status/exclusions | Batch reads; avoid N+1; no metadata-resolution writes on read. |
| Provider calls | Bound concurrency, deduplicate in-flight requests, cancel abandoned queries, preserve 429 cooldown and pacing. |
| Recommendation seeds | Bounded rotation; reuse permitted source responses instead of querying all favorites on every render. |
| Pagination | Preserve source cursor and unread offset; unknown total remains unknown. |
| Mutations | Confirmed-state publication then targeted invalidation; keep unrelated accounts and public cache untouched. |
| Source failure | Independent section error, permitted stale label, bounded retry; no false empty/success. |
| Artwork | Reserved space, lazy loading, safe source URLs and accessible fallback; preserve reduced motion. |

Do not adopt arbitrary 24/72-hour cache TTLs without verified provider permission. Keep current approved cache timings until an explicit reviewed change. Measure provider calls per Home load, status batch sizes, page-fill request counts, API p50/p95/p99, and rendering behavior on representative history size (300+ watched). Record a baseline before optimization, then compare. No unsupported numerical performance claims.

### 14.5 Security

Preserve Supabase JWT validation, account scoping, PostgreSQL RLS, least-privileged runtime roles, expected versions, rate limits and existing readiness checks. Public provider reads must omit account credentials. Reject unsafe URLs, malformed IDs, invalid enums, oversize payloads and ambiguous mappings. Store no secrets in source, Vite bundles or logs. Test two accounts, expired session, stale writes, account switch during a pending confirmation and late responses. Account deletion/privacy workflows remain original outstanding account scope; specify them and validate before public production acceptance, without unauthorized remote destructive actions. User-facing import/export remains deferred, distinct from secure operational backup.

---

## 15. Execution sequence and work orders

Use the following seven-stage delivery plan (Stage 1 through Stage 7). Stage 0 is a mandatory preflight for the sequence, not an excuse to defer all local work. Provider-independent fixes may proceed with deterministic fixtures while external clearance is unresolved, but no production provider acceptance can be claimed.

| Stage | Scope | Dependencies and exit gate |
| --- | --- | --- |
| 0 — Preflight | Inspect baseline, read contracts, verify provider gates, establish local tests and risk/ADR/work-order records. | Source and scope understood; no hidden service bypass; blockers documented. |
| 1 — Global discovery and card actions | Shared visibility policy, Home/Browse hero and shelf filtering, View All, card status/action controller, tracking-aware completion, immediate synchronization and basic discovery controls. | All eligible routes apply consistent modes; confirmed writes update all views; account safety, history and pagination tests pass. |
| 2 — Basic recommendations | Effective favorites, provider title recommendations, You May Like, Similar, truthful reasons, cross-shelf dedup, feedback/exposure storage. | No custom scoring; no watched leaks; correct empty/error handling and account isolation; provider support verified or blocked explicitly. |
| 3 — Library management | Search/sort, grid/list, selection, bulk actions, safe corrections/recovery, wishlist/collection integration. | Bulk per-item correctness, version handling, history preservation, responsive/keyboard workflow. |
| 4 — Media metadata and tracking | Approved provider adapter gaps, AniZip trusted reconciliation, supported details enrichment, optional verified TMDB/Fribb paths. | Existing exact tracking oracle and identity regressions pass; mappings verified; optional unsupported fields remain unavailable. |
| 5 — Basic franchise relationships | Typed related titles, personal status, missing releases, release-vs-optional distinctions. | Correct identity/direction, no false completeness, correct missing-sequel eligibility. |
| 6 — Release monitoring | Calendar, follows, durable jobs, in-app notifications, settings and deduplication. | Retry/restart/timezone/ownership tests pass; no duplicated or fabricated releases. |
| 7 — Production validation | Full test suites, contract generation, dependency/security review, responsive/accessibility review, live staged auth/provider checks, operations/backup/restore/rollback, human approval. | All required in-scope gates passed and reviewed; any conditional exclusions explicitly approved. |

### 15.1 Stage work-order template

For every focused task, create the D-SSBP work order using the repository's required template, including at minimum:

- Task ID, baseline revision/file manifest, requirement reference, risk level, permitted file/module scope, dependencies and non-goals.
- Current behavior, reproducible defect or missing capability, expected behavior, independent oracle/examples and relevant edge cases.
- API/data/identity/status contracts, affected privacy/ownership boundaries, migration and compatibility impact.
- Proposed smallest coherent change, preserved behavior, explicit decisions needing approval, rollback/recovery approach.
- Tests to add and exact commands to run; evidence needed for implementation, verification, validation and release separately.
- Actual changed files, commands/results, failures/corrections, unresolved items and owner/human review status.

Stage 1 is the immediate delivery priority. Do not start the advanced intelligence engines after merely adding a quick action or one new shelf. Complete the full agreed foundation gate, or obtain an explicit revised scope.

### 15.2 Suggested source ownership (inspect before editing)

| Concern | Existing paths to inspect/reuse |
| --- | --- |
| Home/Browse/Details | `frontend/src/pages/public.tsx`, `browse.tsx`, `dashboard.tsx`, `app/index.tsx` |
| Cards/actions | `frontend/src/entities/media/`, `features/library/index.tsx`, `features/library/complete.tsx`, `features/library/status.ts`, `features/library/details.tsx` |
| Catalogue/pagination | `frontend/src/features/catalogue/index.ts`, `personal-page.ts`, `pagination.ts`, `custom-filters.ts`, `episode-list.tsx` |
| Discovery/profile | `frontend/src/features/discovery/`, `features/profile/`, `features/preferences/`, `widgets/profile-setup.tsx` |
| Library/collections/reports | `frontend/src/pages/account.tsx`, `collections.tsx`, `reports.tsx`, associated feature modules |
| Private client/auth/readiness | `frontend/src/shared/api/client.ts`, `backend.tsx`, `identity.ts`, `shared/auth/`, `shared/feedback/` |
| Provider adapters | `frontend/src/shared/api/anilist.ts`, `anizip.ts`, `backend/app/integrations/metadata/`, `backend/app/modules/catalogue/` |
| Backend authority | `backend/app/modules/library/`, `tracking/`, `discovery/`, `preferences/`, `collections/`, `reporting/` |
| DB/API contracts | `backend/migrations/versions/`, `contracts/openapi.json`, `frontend/src/shared/api/schema.d.ts` |
| UI/copy | `frontend/src/styles.css`, `content/en/common.json`, `shared/ui/`, `shared/motion/` |
| Verification | Existing backend/frontend test files, `frontend/tests/e2e/`, `docs/engineering/` |

These are source anchors, not permission to rewrite whole directories. Create new narrowly scoped modules only when needed; match existing architecture.

---

## 16. Mandatory acceptance-test matrix

The following are expected results, not tests already executed. Add automated tests at the correct layer, with real DB/Redis and browser workflows for consequential behavior. Use independent hand-calculated fixtures and preserved historical records, not assertions derived from the implementation under test.

### 16.1 Discovery, cards and personal history

| ID | Scenario | Expected result |
| --- | --- | --- |
| D01 | Provider returns completed title in Home popular/trending shelf | Excluded under default New to Me. |
| D02 | Provider returns completed title as featured | Eligible replacement or omitted hero. |
| D03 | Same title appears under AniList/MAL aliases | One canonical recommendation; all aliases respect history. |
| D04 | Completed title currently rewatching | Excluded from Hide Watched and New to Me even if current status is in progress. |
| D05 | Completed season and unrecorded sequel | Only completed season excluded; sequel independently eligible. |
| D06 | Unrecorded title | Eligible but not labeled confirmed unwatched. |
| D07 | Planned inclusion preference toggled | New to Me behavior matches persisted preference. |
| D08 | Explicit search for completed title | Visible in Show All with correct personal status. |
| D09 | Personal library/collection/history opened while New to Me is active elsewhere | Relevant saved records still visible. |
| D10 | First source page fully excluded | Bounded scan/refill or correct continuation; no false exhaustion. |
| D11 | Source budget ends with further source pages | Honest partial state, valid next cursor, no fabricated totals. |
| D12 | Source truly exhausted | Honest empty state; no watched fallback. |
| D13 | Mode/filters changed, then View All and page navigation | Mode and all intended filters/seed context retained; no stale cursor. |
| D14 | Authenticated backend unavailable | Public browsing survives; no false personalized label or silent history-filter claim. |
| D15 | Mark Watched from Home card | Committed completion, all aliases updated, title removed from filtered discovery without manual refresh. |
| D16 | Mark Watched from Browse/Similar/search | Same underlying operation; other pages reflect state; Show All retains title with status. |
| D17 | Wishlist/favourite/card action | All relevant confirmed labels/counts update; no duplicate records; no implicit completion. |
| D18 | Failed or no-op mutation | No false success, celebratory motion or permanent removal. |
| D19 | Rapid repeated clicks/retry | Idempotent/controlled behavior; no duplicate completion or conflicting actions. |
| D20 | Account switch while menu/dialog open or mutation pending | Captured action cannot execute for another account; late result cannot update new account UI. |
| D21 | Touch, keyboard and narrow viewport actions | Accessible labels, focus, no overlap, no hover-only completion; card links remain functional. |

### 16.2 Tracking and bulk management

| ID | Scenario | Expected result |
| --- | --- | --- |
| T01 | Unrecorded finished title completed | Single historical assertion; no invented episode marks/dates. |
| T02 | Planned title completed | Correct versioned transition; wishlist and history consistent. |
| T03 | Active watch/read session completed | Session and library update consistently; marks retained. |
| T04 | Rewatch/reread completed | Original history remains; repeat preserved. |
| T05 | Ongoing title / unknown final count | No automatic final completion; caught-up and explicit assertion follow existing policy. |
| T06 | Existing tracking numerical oracle | 9 watched, 1 skipped, 2 remaining, next 9, as specified in repository A04 contract. |
| T07 | Decimal/special chapter identities | Distinct keys preserved; no rounding/coalescing. |
| T08 | Soft-remove previously completed title | Historical exclusion retained. |
| T09 | Incorrect completion correction | Only authorized erroneous evidence corrected; genuine prior completions/marks retained; auditable. |
| T10 | Stale write or foreign account session reference | Rejected safely; no partial unauthorized change. |
| T11 | Bulk selected titles with mix of valid/invalid/stale states | Contract-defined item outcomes; only confirmed successes reflected; bounded/idempotent retry. |
| T12 | Collection deletion/bulk wishlist removal | No accidental deletion of unrelated library/tracking history. |
| T13 | Cross-device progress update | Correct server state after refresh/sync; stale version conflict handled truthfully. |
| T14 | Refresh verified episode metadata after manual tracking | No renumbered/lost marks, sessions or history. |

### 16.3 Recommendations, metadata, releases and operations

| ID | Scenario | Expected result |
| --- | --- | --- |
| R01 | Two favorite sources contain same title | One effective seed. |
| R02 | Favorite removed or setup edited | Effective list changes correctly; stale source does not resurrect removed favorite. |
| R03 | Same recommendation from multiple seeds | One result with truthful provenance. |
| R04 | Favorite-only profile | Favourite-based shelf works where provider supports it. |
| R05 | Profile-only user / no profile | Appropriate explicit-filter suggestions / clearly labeled general discovery. |
| R06 | Strict genre/theme/length constraint | Verified mismatch excluded; unknown handled according to documented filter semantics. |
| R07 | Dismiss a recommendation | Hidden from applicable personal recommendation contexts; not recorded as watched. |
| R08 | Card never visible, then visible, repeated event retry | Only qualifying exposure recorded; no duplicated impression; correct ownership. |
| R09 | Recommendation provider fails | Accurate error or permitted stale candidates re-filtered; no fabricated recommendations. |
| R10 | Personalized cache inspected after account switch | No foreign account data, exposure, status or recommendation leak. |
| M01 | AniZip regular/special/leading-zero/unknown fields | Exact keys and nullable metadata retained. |
| M02 | Split cour, long runner, ambiguous TMDB mapping | Correct verified mapping or unresolved state, never blind merge. |
| M03 | Provider malformed response, timeout or 429 | Safe bounded failure handling; no fixture substitution; accurate source status. |
| M04 | Backend asleep; public catalogue/details available | Existing browser-first behavior preserved; private writes gated. |
| M05 | No source permission or missing TMDB credential | Production gate remains closed/conditional feature unavailable; no credential leak. |
| F01 | Related season, recap, adaptation, alternate version | Independent identities and correct typed relation; no inferred completion. |
| F02 | Incomplete relation coverage | Explicit partial state; no exhaustive franchise claim. |
| N01 | Followed episode observed repeatedly/retried | Exactly one intended notification per deduplication contract. |
| N02 | Job crashes/restarts, or date changes | Durable recovery, no duplicate or misleading notification. |
| N03 | Timezone/date-only/unknown release | Correct local display and precision; no invented timestamp. |
| N04 | Notifications disabled/unfollowed/foreign account | No unauthorized delivery or read-state access. |
| O01 | Existing database migrated with saved history | IDs, progress, personal records and isolation preserved. |
| O02 | Backup/restore rehearsal | Required operational data restored to isolated environment; outcome recorded. |
| O03 | Build/contract/lint/typechecks/full regression | Actual recorded successful results or explicit blockers; no weakened tests. |
| O04 | Staged authentication/email and provider workflows | Live validation separately recorded; fixture tests do not establish production acceptance. |
| O05 | Responsive/accessibility and reduced motion | Existing design retained; keyboard/touch/focus/error states reviewed across supported widths. |

---

## 17. Verification commands and environment

Use the exact current setup instructions in `docs/engineering/development.md` and CI. The supplied repository specifies Node 24, Python 3.12, Git and Docker. Do not upgrade or substitute dependencies just to make a failing test green. The commands below are the planned verification sequence, not commands executed to prepare this document.

### 17.1 Local environment and baseline

From the real repository root:

```sh
git status --short
git diff --stat
git diff
docker compose -f compose.dev.yml up -d --wait
```

In `backend/`:

```sh
python -m uv sync --locked
```

In `frontend/`:

```sh
npm ci
```

Use the existing documented local runtime-role initialization and Alembic migration commands from `docs/engineering/development.md`; inspect the actual environment before applying anything. Apply only to the isolated local test database using the correct migration role. Do not copy production connection strings, use an administrative role as runtime, or reset volumes to hide a migration problem.

### 17.2 Backend verification

From `backend/`, with local PostgreSQL and Redis available and the test environment configured:

```sh
python -m uv run ruff check .
python -m uv run pytest -q
```

Run focused tests after each change, then the complete suite. Validate migration upgrade from the previous revision and real ownership/RLS/transaction tests. Record skipped tests and collection failures; a skipped critical test is not a pass.

### 17.3 API contract and frontend verification

From `backend/`, export the API schema using the existing documented `PYTHONPATH=.` setup:

```sh
python -m uv run python ../scripts/export_openapi.py
```

From `frontend/`:

```sh
npm run contracts
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Inspect generated `contracts/openapi.json` and `frontend/src/shared/api/schema.d.ts` diffs; do not hand-edit generated types to conceal a contract mismatch. Run the existing Playwright/axe workflow with the repository's documented configuration and dependencies. Test the actual card actions, shelf filters, route navigation, two-account isolation, readiness behavior, errors and responsive layouts. Use targeted visual checks at narrow mobile, tablet and desktop widths and the repository's existing supported widths. Preserve existing protected assertions and regression tests.

At root:

```sh
git diff --check
```

### 17.4 Live validation and release checks

Separate deterministic unit/integration/browser-fixture tests from bounded live provider samples and staged authenticated workflow validation. Verify actual email registration/confirmation/recovery, provider rights and response contracts, CORS, rate limits, secrets configuration, backup/restore, rollback, service readiness and monitoring. Do not publish private test data or secrets in reports. Human visual/security/code acceptance and production release must be recorded as pending until actually performed. No deployment is authorized by this document alone.

---

## 18. Stage reporting and definition of done

### 18.1 Required report after each stage

Use a report with the following structure:

```text
Stage / work order:
Baseline revision or archive:
Status: Not started | Implemented | Verified | Validated | Blocked | Accepted | Released
Requirements completed:
Files added/changed/removed:
Migration and OpenAPI changes:
Behavior preserved:
Tests added (with independent expected outcomes):
Exact commands executed:
Actual passed / failed / skipped counts:
Observed defects and corrections:
Provider / infrastructure / dependency limitations:
Security and cross-account evidence:
Performance baseline and measured result (where relevant):
Remaining work and approval decisions:
Human acceptance / release status:
```

Do not report an arbitrary percentage as a substitute for test evidence. Update `docs/product/implemented-features.md`, `docs/engineering/remaining-scope.md`, `acceptance-record.md`, `error-log.md` and relevant architecture/contracts as required by the repository workflow. Keep prior evidence intact. Use a focused verified commit when a real Git checkout is available.

### 18.2 Definition of Done for an individual feature

- The frozen requirement and contract are satisfied, with no unrelated changes.
- The source implementation, real data path, UI behavior, error states and migration/contract changes are coherent.
- Independent tests cover normal, failure, boundary, retry and ownership cases applicable to the feature; relevant existing tests remain intact.
- Documentation reflects actual behavior and all limitations; no fake data path is presented as production.
- Verification results are recorded. Live validation/human acceptance are separate and not claimed prematurely.

### 18.3 Foundation release gate

The following user journey must work end to end in a properly configured staged environment:

1. Sign in and open Home.
2. See eligible discovery content without known completed anime in the default personal mode.
3. Change mode and search for a known completed title; correctly see its status.
4. Mark remembered titles completed directly from cards, including a bounded bulk workflow.
5. Add genuinely interesting titles to wishlist or start watching/reading.
6. Track individual episodes/chapters, continue where appropriate, preserve unknown totals and repeat history.
7. Complete a title and see the confirmed status propagate immediately across discovery, library, wishlist and details.
8. See favorite-based and profile-based recommendations with truthful reasons, dismiss unwanted recommendations and collect valid exposure evidence.
9. Find related seasons and released continuations without corrupting independent histories.
10. Follow releases and receive deduplicated in-app notifications where metadata and settings support them.
11. Reopen on another device and retrieve consistent private records, with conflicts safely handled.
12. Pass applicable full regression, security, accessibility, operational recovery and staged provider/auth validation gates; obtain human acceptance.

If a conditional metadata field or service is unavailable, document the reason and obtain explicit scope acceptance instead of inventing a working capability. Mandatory personal-history correctness, private isolation, completion semantics and error handling cannot be waived silently. No advanced algorithm development until the owner accepts the foundation or expressly approves a revised scope.

---

## 19. Decisions and blockers requiring verification or approval

| Decision / dependency | Status and instruction |
| --- | --- |
| New to Me as signed-in discovery default | Proposed by preceding plan; changes older preserve-default contract. Confirm in stage work order. |
| Home order and card layout | Proposed; retain actual design system, no new font or detached action row without approval. |
| Effective favorite removal semantics | Needs a frozen contract; proposed unified authoritative list with explicit reconciliation. |
| Historical correction and bulk outcomes | Need explicit transactional and evidence contracts; preserve existing completion/undo restrictions until verified. |
| Recommendation exposure threshold/retention | Needs explicit parameter approval and privacy review. No ranking based on it yet. |
| AniList production use | Clearance still unresolved in supplied documents; retain release gate. |
| AniZip use/quotas and mapping | Confirm official conditions and representative source-backed mappings. Browser display is not trusted tracking coverage. |
| TMDB and Fribb | Conditional on credentials, terms/licenses and verified mappings. No assumed availability. |
| Test environment | This document was prepared by inspecting the archive, not running a new application suite. Prior test records are historical evidence only. |
| Deferred items | Preserve owner deferrals for scoring, Google, import/export and the advanced engines. |

---

## 20. Implementation directive (copy into the coding-agent task if needed)

Implement ALCOR Foundation V1 against the **actual current repository**, following the complete plan above and `AGENTS.md`. First inspect existing changes, read D-SSBP and all relevant contracts, record the baseline and freeze Stage 1 requirements. Do not rebuild the application or duplicate existing services. Fix the global discovery policy, Home and Browse exclusions, featured selection, shared media-card completion and personal actions first. Preserve exact tracking, historical completion, canonical identity, versioning, RLS, readiness, browser-first public browsing and account-scoped cache behavior. Use committed server state, never optimistic success or invented history. Verify normal and failure cases before reporting a stage complete.

Then complete Stages 2–7 in order, reporting actual work and test evidence after each stage. Use provider-supported recommendations and explicit filters only; do not implement custom weighted scoring, AMRA, APEA, Narrative DNA or other deferred intelligence. Keep provider restrictions and all previously deferred scope intact. Do not apply remote migrations or deploy without separate authorization. If a genuine blocker appears, record its cause, preserve safe working behavior, continue independent tasks where possible and report the incomplete item explicitly. Never claim that an unimplemented or untested feature is done. Deliver the exact changed files or focused commits, migrations, generated contracts, tests, documentation and final evidence record when implementation is authorized and executed.

The purpose of this milestone is to make ALCOR dependable before making it intelligent.

---

## 21. References

### Repository sources

- `AGENTS.md` and the D-SSBP protocol (mandatory engineering authority).
- Original ALCOR master and UX writing plans; updated profile and multi-provider plans.
- Browser-first catalogue, catalogue workflow, recommendation and remaining-scope contracts.
- Current source paths listed in sections 3 and 15.2.

### External technical references already relevant to the design

- AniList API: https://docs.anilist.co/
- AniList usage terms: https://docs.anilist.co/guide/terms-of-use
- AniList rate limits: https://docs.anilist.co/guide/rate-limiting
- TMDB developer documentation: https://developer.themoviedb.org/docs/getting-started
- TMDB season details: https://developer.themoviedb.org/reference/tv-season-details
- TMDB application authentication: https://developer.themoviedb.org/docs/authentication-application
- Fribb mapping reference: https://github.com/Fribb/anime-lists
- TanStack Query invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- Radix accessible dropdown: https://www.radix-ui.com/primitives/docs/components/dropdown-menu
- Existing visual references: https://linear.app/ · https://vercel.com/ · https://www.raycast.com/ · https://resend.com/ · https://ui.shadcn.com/
- Playwright: https://playwright.dev/docs/intro

External links are reference material, not evidence that this document independently tested or cleared any live provider. The implementation specification was prepared from the supplied source and existing discussion. No application code or database was changed, and no new runtime acceptance tests were executed.

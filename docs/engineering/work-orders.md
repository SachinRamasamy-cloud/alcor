# Implementation work orders

Date: 24 November 2026. Source: master and editorial plans v1.0; D-SSBP §§4–6, 8–12, 16–17. The owner's request authorizes implementation using that stack, feature-sized commits, documentation and pushing to GitHub. It does not establish production rights or independent approval.

## Definition of Ready

Baseline inspected: README-only repository at `12b945b`. Both plans and the full protocol read. No existing protected tests. Interfaces and dependencies are specified below. No scientific model changes. Missing credentials/provider rights are isolated from fixture development. Changes may add the planned dependencies; no scope or security-policy changes outside the plans are authorized.

| ID | Task and risk | Allowed scope | Acceptance behavior and checks |
| --- | --- | --- | --- |
| A01 | Reproducible foundation, L2 | Root tooling, frontend/backend bootstrap, config, CI, contracts, docs | Frontend builds; API health and standard errors work; typed config rejects unsafe production fixtures; generated contract is reproducible; no secrets |
| A02 | Public catalogue vertical slice, L2 | Provider boundary, catalogue/search routes, public pages, content registry | Guests browse anime/manga/details/search without login; filters live in URL; metadata provenance and fixture coverage visible; failure differs from empty; pagination bounded; provider failure tests |
| A03 | Account and library, L4 security boundary | JWT/PKCE, RLS migrations, private library/wishlist, auth guard | Invalid claims/signatures rejected; no runtime dev bypass; real PostgreSQL two-account isolation/context reset; duplicate wishlist PUT idempotent; start removes wishlist; confirmed writes only show success |
| A04 | Exact progress, L2 with L4 ownership controls | Sessions, sparse progress, versioned writes, episodes/chapters UI | Required 9 watched/1 skipped/2 remaining/next 9 example; no false completion; rewatch preserves history; chapter 10.5 distinct; stale writes 409; cross-owner/media rejected |
| A05 | History recovery, L2 | Import preview/commit, export, history | Ambiguous matches require selection; repeat import no duplicates; existing progress preserved; unknown historical dates null; export retains exact progress; malformed input rejected |
| A06 | Discovery and organization, L2 | Filtering, relations, collections/ratings/notes/statistics as implemented | Ever-completed excluded before pagination; unwatched sequel remains; cold start uses general labels; no invented recommendations/coverage; collections do not delete history |
| A07 | Release and operational readiness, L2/L4 release gate | Jobs/notifications when supported, deployment/CI/runbooks, accessibility QA | No unsupported schedule controls; dedup and bounded retry when implemented; responsive/keyboard/reduced-motion checks; local integration evidence; production gates stay pending without human approval and services |

## Execution and stop conditions

### A09 - Three-provider plan addendum

Owner supplied a new AniList/AniZip/TMDB architecture and requested further planning. Scope: versioned plan, bounded public feasibility reads and ADR; no AniZip/TMDB runtime adapter or new credential requirement in the existing build. Evidence: AniZip mappings response fields/CORS/cache headers, primary Fribb mapping documentation and official TMDB references. Exact episode contracts and outstanding provider conditions remain next-stage prerequisites. Risk L2 planning with L4 credential/identity constraints identified. Original plans remain unchanged.

### A10 - Pagination, search and branding refinements

Owner explicitly requests separate commits for pagination and search/copy, followed by a generated celestial logo and black footer with full navigation, GitHub, LinkedIn and creator credit. Risk L2 UI/read pagination; preserve L4 account bounds. Scope: additive numbered-page API reads where totals are known, shared First/Previous/numbers/Next/Last/custom-page controls, tracked cursors where totals are unknown; stable search input with 300 ms debounce and cancellation; remove implementation copy from product flows; generated image asset, star branding and responsive dark footer. Do not invent totals, expose credentials, alter recommendation scoring or make placeholder social links. Acceptance: real PostgreSQL page boundaries/isolation, page-jump/keyboard tests, search edit/focus/debounce regression, existing errors preserved, five-width accessibility/alignment and image inspection. No private writes are added. Owner's LinkedIn URL: https://www.linkedin.com/in/m-sachin-ramasamy-5146092b5/.

### A11 - Modern details and public episode metadata

Owner requests a banner/poster details layout, initially condensed synopsis with hover and explicit Read more/Show less controls, a centered wide search with aligned controls, app-owned advanced filtering, and diagnosis/correction of missing episodes. Risk L2 public reads/UI; no change to L4 private progress policy. Diagnosis: the current provider-reference episode hook deliberately returns an empty list without an upstream call. Authorized scope: a bounded direct AniZip adapter, additive nullable episode display/banner fields, separate source errors, exact preserved provider keys and source attribution. Coverage remains incomplete and confirmed final total stays null; public display enrichment cannot modify saved marks or authenticate writes. Server reconciliation/TMDB remain next-plan milestones. Contract: verify the returned AniList/MAL mapping, keep missing fields null, accept only safe image hosts, respect cooldowns, and distinguish missing mapping from provider failures. Acceptance: real bounded source smoke plus mocked parser/error/CORS-independent tests, browser API-off episode display, preserved retry behavior, keyboard/touch/hover synopsis controls and five-width layout/accessibility. Production usage clearance remains pending.

### A08 - Browser-first catalogue and backend cold starts, 25 November 2026

Owner explicitly authorized direct frontend AniList reads and backend-dependent personal operations. Risk L2 public integration, L4 identity/private boundaries. Scope: separate public GraphQL transport, bounded request scheduling, accurate source labels, stable provider references, verified server-side identity resolution, nonblocking backend readiness, and responsive alignment. No change to progress mathematics, authentication or deferred recommendation scoring. Existing MAL identities and personal history must remain intact. No frontend metadata is trusted for persistence. Acceptance: browser-only home/search/details with the ALCOR API unavailable; failed source requests distinguished from empty data; no bearer token sent to AniList; 429 cooldown respected; personal writes require backend readiness; identity regression tests and five-width browser/layout checks. Dependencies: existing HTTPX, browser fetch and current test tools. No new dependency required.

AniList terms reviewed at https://docs.anilist.co/guide/terms-of-use and rate limits at https://docs.anilist.co/guide/rate-limiting. Personal/noncommercial use does not resolve the separate competing-tracker restriction. Owner reports personal use, not written provider permission. Production provider clearance and human release review remain pending; implementation and mocked local verification may proceed.

### A03-F — Account frontend, 25 November 2026

Baseline `bcba4a9` inspected. Risk L4 at session/account boundaries; ordinary UI L2. Authority: existing plan §§8, 10.1 and owner resume request. Scope: frontend auth, library/wishlist, shared transport, copy and tests only; no new dependencies, remote migrations, security-policy changes or live OAuth configuration. Contracts: existing generated LibraryPage/LibraryMutation; Supabase PKCE; no runtime auth bypass. Acceptance: malformed/expired/external pending actions rejected, callback exchange/replay deduplicated, logout/account switch cancels/removes private queries, wishlist writes only after authentication, success feedback only after changed server response, API failures never shown as empty data, version supplied on status changes. Verify unit/component tests, lint/build and existing guest browser regressions. Live Google and independent security/editorial acceptance remain pending; user explicitly deferred credentials.

Branch: `build/alcor-v1`. One integration owner; no parallel implementation agents. Each feature gets source, tests and documentation in its own commit after applicable checks. Generated contracts are reviewed as diffs. All error incidents go in the error log without secrets.

Stop the affected feature for conflicting authoritative requirements, unapproved consequential contract/security/dependency change, missing critical identity evidence, or two unsuccessful repair attempts without diagnostic progress (D-SSBP §8.3). Continue independent authorized work. Human engineering/security/editorial acceptance and production release remain pending until supplied; do not fabricate approval.


### B01 ? Episode error feedback, 25 November 2026

Risk L2. Scope: details episode section and its browser test. Authority: product ?11 and editorial error/empty-state rules. Reproduced at 7d75845: HTTP 503 episode lookup renders the missing-metadata branch with no error or retry. Expected: keep title/synopsis visible, show contextual error and Retry for failed episode fetch, show loading during actual fetch; successful missing coverage still uses the existing missing-metadata message. No API/schema changes or altered assertions.

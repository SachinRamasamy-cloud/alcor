# Implemented features

This record describes actual source behavior. The master plan remains the roadmap; this table does not turn pending release gates into completed work.

| Area | Implemented | Limitations |
| --- | --- | --- |
| Public website | Home, anime/manga browsing, universal title/alias search, genre/format/sort filters, details and attribution, public trust pages, not-found page | Finite 18-title development snapshot; source rights and production provider not approved |
| Navigation | Sticky top navigation, mobile disclosure menu, library/wishlist access, search, footer | Unsupported notifications/calendar controls are omitted |
| Catalogue API | Normalized UUID identities, separate anime/manga namespaces, bounded cursor pagination, source timestamp, explicit partial coverage | No remote production adapter; no exhaustive catalogue or live trending claims |
| Personal access | Guest personal actions open contextual sign-in dialog; public browsing stays available | Auth configuration and persistent personal workflows implemented in subsequent slices |
| Private API checkpoint | JWT validation, PostgreSQL RLS and restricted role, persistent library/wishlist, version checks, activity events and shared Redis limits | Backend verified locally; personal frontend, OAuth callback/resume and production security review remain pending |
| Interface | Monochrome Inter tokens, original source artwork, responsive grids, shared buttons/dialogs/errors, Motion with reduced-motion preference | No persistent decorative animation; success-only account effects require account implementation |
| Content | Typed central English registry, named parameters, plural/unknown-count formatting, mapped API errors | Human rendered editorial sign-off pending |

## Public slice acceptance

Guest browse/search/details and URL reload tested. A failed provider response renders an error, never an empty result. Wishlist invocation performs no unauthenticated write. Closing the dialog restores opener focus. Automated accessibility and overflow checks passed at 320, 375, 768, 1024 and 1440 pixels with reduced motion. Source metadata is development-only and explicitly labelled throughout.

Account frontend (25 November): library/wishlist pages, versioned start/remove, configurable Google PKCE, pending-action validation/replay, account-scoped caching and logout cleanup are implemented. Real Google configuration remains deferred; signed end-to-end private browser validation and human security review remain pending.

Tracking slice (25 November): sessions, sparse episode/chapter progress, manual string/decimal targets, skips, bounded bulk marking/unmark, optimistic versions, explicit completion, preserved repeat history and continue queues are implemented and locally tested. The details page has a shared tracker. Further scope remains in `docs/engineering/remaining-scope.md`.

Collections slice: private create/rename/reorder/add/remove/soft-delete, paginated collection pages and a title-page picker are implemented. Real PostgreSQL tests verify ownership and preservation of library/history when deleting a collection.

Personal details slice: title and episode/chapter ratings/notes, favorites, tags and wishlist priority/reason are implemented with ownership and version checks. Unit notes remain independent of progress.

Reporting/recovery slice: private history pages, saved-record statistics, soft library removal and version-aware undo for supported details/removals/non-completing progress are implemented. Original activity is retained; unknown durations are not estimated.

Profile/preferences slice: private display name, IANA timezone, explicit discovery preferences, notification opt-in, reduced motion and synopsis spoiler controls are implemented. User-set evidence thresholds do not imply a completed recommendation algorithm.

Foundation F01: explicit personal modes now also filter Home's hero/rows and Browse shelves; failures/loading cannot claim confirmed eligibility. Public fallback is labelled. Existing layout/alignment is locked by the owner's 25 November Foundation request. Default-mode persistence and direct card completion follow separately; later Foundation stages remain outstanding.

Foundation F02: signed-in discovery defaults to New to Me; explicit URL mode takes precedence over the saved discovery preference. Explicit search defaults Show All. The existing filter dialog saves mode with preference version checks; no layout change. Old clients cannot erase the saved mode by omitting the additive field. Human/live acceptance remains pending.

Foundation F03: signed-in cards expose direct confirmed completion, wishlist/start, existing personal details and collection controls through the existing corner/dialog pattern. Public grids retain their layout. Confirmed status and discovery eligibility update before refresh; no fabricated episode marks or completion replay. Broader transition/correction, bulk, recommendation and metadata/release stages remain outstanding; Foundation is not release-complete.

Foundation F04: saved-state batches include owned active-session context and server-derived ordinary transitions. Card/library dialogs now expose permitted hold/drop/resume/not-interested actions; completion retains its separate workflow. Type-aware Watching/Reading and recorded repeat labels use the same card context. Dialog versions remain frozen through background refresh. Local verification is recorded in F04; broader Foundation stages and human/live release gates remain outstanding.

Foundation F05: setup favourites and library flags reconcile into one versioned preference list. Removals persist; favourite-only titles do not become planned, started or completed. Card dialogs expose a toggle and `/favorites` uses the original card/grid/pagination presentation; the existing Dashboard favourites position and account menu link use the effective list. Old-client/stale-write/Undo ownership cases are locally verified. No CSS, migration, dependency or production change. Provider recommendations, feedback/exposure, bulk management, trusted metadata and release monitoring remain outstanding.

Foundation F06/F07: shared private mutations fail through the API/readiness guard offline without replay on reconnect. Home and Browse refill personal shelves after exclusions using at most three public source windows, retain eligible overflow for acknowledged completion replacement, and keep View all filters. A scan limit, source exhaustion, replacement failure and loading have distinct copy; the unconditional more-titles notice is removed. Account/mode eligibility pools remain private, source metadata remains public, and layout/CSS are unchanged. Local deterministic verification does not establish provider clearance or full Foundation acceptance.

Remaining-plan REM-01 (owner-approved): known releasing/unreleased titles cannot be finally completed; active sessions require their versioned completion route. Exact progress is retained and automatic completion also requires finished release state. Unknown-state historical assertions remain explicit, without invented unit marks or original dates. Focused local verification is recorded in acceptance-record.md; no live runtime/release acceptance is implied.

Remaining-plan REM-02a: qualified hero with shared member management, URL-only surface mode controls, independent Trending/You May Like positions, additive member Home Trending/Airing/Upcoming and member Anime Airing are implemented. Existing guest surfaces and CSS/card geometry remain. Fresh equivalent public popularity windows are reused with new owned eligibility checks; exhausted/filled shelves stop requesting later windows. Dedicated recommendation feeds, cross-shelf diversity and full remaining discovery scope are not yet complete.

Remaining-plan REM-03: independent favourites/Similar source-edge feeds and explicit-profile You May Like, factual reasons, explicit seed rotation and matching /recommendations pagination are implemented with bounded eligibility scanning. Single-seed public metadata is reusable; owned combinations/continuations remain private. Deterministic focused checks and mobile/desktop browser flows passed; live source support/rights and current API reload remain pending. Dismissal/exposure, cross-shelf display diversity and later remaining work are not claimed complete.

# Remaining implementation scope

Authority: owner instruction, 25 November 2026: defer Google login, import and export; complete the other planned work. The owner subsequently deferred recommendation scoring as well. Preserve the original plans as requirements. This is a delivery checklist, not a completion claim.

| Workstream | Required remaining behavior | State |
| --- | --- | --- |
| Exact tracking | Sparse episode/chapter marks, manual targets, bulk ranges, gap/skip counts, sessions, rewatch/reread, continue, completion and history | Core implemented/locally verified; richer provider episode integration and reconciliation are next |
| Personal organization | Status corrections/recovery, wishlist priority/reason/count/undo, bulk actions, collections, ratings, notes, favorites, preferences | Collections, personal details, preferences, removal and bounded undo implemented; bulk/correction polish remains |
| Discovery | Exclusions before pagination, advanced filters/presets, memory search, random, hidden gems, relations and missing sequels | Partial: direct public AniList, bounded personal exclusion paging, owned presets and saved-note search; studio filter, full random/hidden-gem/franchise UI remain; personalized scoring deferred |
| Release monitoring | Calendar, follows, durable jobs/outbox/scheduler, deduplicated in-app notifications, announcements and operational notices | Pending |
| Provider/cache | Validated adapter, canonical persistence, safe URLs/schema bounds, shared cache/singleflight, distributed budgets and degraded behavior | Browser AniList/AniZip display, title aliases and readiness implemented; trusted episode reconciliation, TMDB, shared enrichment cache and production clearance pending |
| Reporting/account | History/statistics, profile/settings, privacy controls and safe account deletion | History, recorded statistics, profile and settings implemented; account deletion/privacy workflow pending |
| Polish/operations | Success-only motion, responsive/accessibility checks, performance, secrets/dependency scans, reproducible containers, CI/contracts, monitoring, backup/restore and rollback | Page-shaped skeletons, numbered pagination, stable centered search, popup filters, generated branding/dark footer and modern condensed details implemented; release operations and human validation remain |
| Deferred | Google configuration/live Google validation, user import, user export and recommendation scoring | Explicitly excluded by owner |
| Conditional extensions | Offline/PWA, push/email, streaming availability, extra providers/languages | Only where supported and independently reviewable; no invented capabilities |

## A04 execution contract

Risk: L2 tracking behavior; L4 private ownership/DB boundaries. Baseline `459a036`. Scope: tracking module, additive migration, library public integration, generated contracts, tracking UI and tests. No auth bypass, remote production migrations, new scientific formulas or unapproved dependencies. Use the supplied §4.2 numerical example as the independent oracle. Required tests: 9 watched/1 skipped/2 remaining/next 9; unknown final never auto-completes; reliable ongoing coverage yields caught-up; skips obey explicit policy; decimal/bonus chapter keys stay distinct; stale writes fail; real PostgreSQL ownership and composite references reject foreign sessions; repeat preserves original records and ever-completed evidence. Source-derived release metadata stays separate from manual targets. Writes commit before success; bulk change produces one activity event. Reuse existing auth, transaction, API error and content primitives. Human acceptance and production release remain pending.

## Collections execution contract

Risk L2 behavior/L4 private ownership. Scope: additive migration 003, collections module, narrow library metadata integration, collection UI and tests. Existing plan requires create/rename/delete/reorder/add/remove, independent membership and retained history. Acceptance: creation retry deduplication, no-op item idempotence, optimistic conflicts, real PostgreSQL RLS isolation, and collection deletion never deleting library/history. Soft deletion preserves recovery potential. No new dependency or production mutation.

## Personal details execution contract

Risk L2/L4 ownership. Reuse existing library/session version controls. Add explicit title rating, notes, favorite, tags, wishlist priority/reason, and independent episode/chapter details. Expectations: edits do not change progress; notes never enter public metadata; stale versions fail; two-account overlay/details cannot leak; rating bounds and text/tag limits validated; no-op writes do not increment versions. Additive local migration 004 only; no new dependency or remote write.

## Reporting and safe recovery contract

Risk L2 reporting/L4 ownership. Add history keyset pages, recorded statistics, soft library removal and idempotent undo for metadata edits/removals/non-completing progress. Original events remain append-only. Strict original version prevents overwriting later edits. Do not offer undo for unsupported completion/release cases. Unknown duration remains null, not zero or fabricated watch time. Test actual PostgreSQL owner isolation, duplicate undo, stale undo refusal, retained history and restored progress gaps.

## Preferences and profile contract

L2/L4 ownership. Private, versioned display name and explicit discovery preferences; timezone uses IANA validation, notifications default off, motion defaults to system, no inferred preferences from watch frequency. Quality/minimum-positive evidence thresholds remain optional user choices rather than invented defaults. Save drafts against original versions, preserve private caches per account, and test actual database isolation/stale writes. Additive local migration 006; Google/import/export remain excluded.

## Discovery/filter execution contract

L2 discovery/L4 personal isolation. Extend existing filters without changing prior defaults. Include/exclude genres/themes, year ranges, source score, studio, season, publication status and known-length filters run before pagination. Hide watched excludes ever-completed; New to me excludes recorded started/dropped/not-interested and optionally planned. Memory search covers available synopsis and account-private notes only. Saved presets are owned/versioned; random picks from eligible available data. Hidden-gem thresholds are explicitly supplied, not invented defaults. No personalized scoring (owner-deferred). Fixture metadata is enriched only from existing attributed source snapshots; coverage stays partial. Tests must verify exclusions before page, missing-value behavior, private-note isolation and preset ownership/idempotence.

## Provider architecture update

The owner requested AniList for discovery, AniZip for episode metadata and TMDB for enrichment/fallback. Follow the [implementation addendum](../product/MULTI_PROVIDER_METADATA_PLAN.md) next. Preserve browser-first cold-start browsing, exact existing progress and server-only TMDB credentials. The addendum is a plan, not evidence that AniZip/TMDB integration is complete.

## Foundation V1 execution

Working branch: `finish-the-foundation`. Owner-approved attachment: [Foundation V1](../product/ALCOR_FOUNDATION_V1.md), subject to the newer UI/alignment lock. F01/F02 filtering and mode persistence are locally verified; F03 direct completion/shared confirmed cache state is locally verified. Stage 1 remains incomplete for broader server-derived actions and all-route/refill polish. Stages 2-7 remain outstanding. Owner approved reconciled favourites, per-item bulk results and impression parameters in chat; this approval is not live validation, a provider clearance or a release. Keep status correction/undo unavailable until its evidence contract is approved and verified.

F04/F05 update: ordinary server-derived actions, active-session labels and unified favourites are implemented/locally verified. The `/favorites` management page reuses the locked layout. Stage 1 bounded shelf refill/all-route polish and Stages 2-7 remain open; no full Foundation acceptance is claimed. The new favourite mutation explicitly fails offline without queued replay. Shared older mutation defaults require the separately recorded no-replay follow-up before foundation acceptance.

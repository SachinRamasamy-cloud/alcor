# Browser-first catalogue

Owner-authorized change: 25 November 2026. Risk L2 public integration/L4 private identity. This supersedes the original requirement to route every metadata read through FastAPI. It does not change tracking arithmetic or authentication.

| Operation | Connection | Backend asleep |
| --- | --- | --- |
| Home, anime, manga, title search, details | Browser to AniList | Available if AniList is available |
| Personal library, progress, notes, collections, saved searches | Browser to ALCOR API | Wait for readiness; no write is queued or reported successful |
| Personal discovery exclusions | AniList results plus account-scoped API overlay | Unavailable; the interface explains that personal filtering is not applied |
| Saved synopsis/private-note search | Account-scoped API and saved metadata | Requires personal services; never leaks notes into public requests |
| Episode details | Browser to AniZip after a valid title loads | Available if AniZip responds; missing/failed data has its own state; full coverage is not assumed |

## Transport and readiness

Public requests use a separate fixed GraphQL endpoint, omit credentials and do not receive Supabase tokens. One request queue per tab spaces distinct requests by 2.1 seconds, deduplicates active requests, drops abandoned searches and observes 429 cooldown headers. TanStack Query caches home for five minutes, search for two and details for fifteen. These budgets cannot control other tabs or applications sharing the same IP. Source failures remain errors, not empty results.

Readiness probes `/api/v1/ready` with an eight-second client timeout, retry after twelve seconds, and stop automatic attempts after five minutes. Manual Retry remains available. Readiness requires PostgreSQL and Redis, separately from process liveness at `/health`. Public rendering does not await readiness. Personal controls become usable after readiness and authentication; becoming ready does not replay rejected writes.

## Identity and pagination

Public links use `anilist-<id>` or legacy `mal-<id>` references. Existing opaque UUID links remain supported through the legacy API while it is online. A verified backend lookup resolves an AniList reference before personal operations. Migration 007 adds immutable namespaced aliases and backfills MAL identities. Existing personal foreign keys, versions and history remain intact. Exact MAL aliases preserve their deterministic canonical UUID; ambiguous associations raise a conflict. Client titles, descriptions and source mappings are never trusted for persistence.

Personal discovery filters run before constructing a displayed page. Each request scans at most three source pages and retains the unread source offset in its cursor. A batch with no eligible results can still offer More when source data remains. No claim of a transactionally frozen upstream catalogue is made.

## Source limits and release

AniList popularity is not a MAL popularity rank or rating-vote count. Scores retain their AniList label. Metadata descriptions render as text; source image hosts are constrained. Adult entries are excluded. App-side studio/all-or-any-genre/known-score/cover-art filtering scans bounded source windows and retains unread offsets; it does not claim a complete global result count. AniZip supplies separate episode display metadata with exact source keys; authoritative reconciliation into existing tracking sessions and TMDB enrichment remain later milestones.

The owner reports personal use, not written provider clearance. [AniList terms](https://docs.anilist.co/guide/terms-of-use) include a separate restriction on competing trackers; the noncommercial clause does not remove it. Production reads require recorded clearance (`VITE_ANILIST_USE_APPROVED` and server `ANILIST_USE_APPROVED`). Development and mocked tests do not constitute clearance or release acceptance. [Rate limits](https://docs.anilist.co/guide/rate-limiting) currently document a temporary 30 requests/minute limit.

# ALCOR — Master implementation specification

**Version:** 1.0 | **Date:** 24 November 2026 | **Status:** Approved requirements consolidated; implementation pending

**Companion:** `ALCOR_CONTENT_AND_UX_WRITING_PLAN.md` is a required editorial specification, not an optional enhancement. Both documents must be used when implementing the product.

## 1. Product mandate and scope

ALCOR is a public anime and manga discovery website with authenticated personal media management. Its primary purpose is to stop previously watched titles from repeatedly appearing in discovery and help a user reconstruct and maintain a history of 300+ anime, eventually thousands of titles. It is a website, not a dashboard: no persistent left or right sidebar. It is not a streaming service, manga hosting site, social network or paid AI application.

- Public: home, browse anime/manga and related categories, search, filters, title and episode information, general discovery, release schedules, franchise relations and verified legal viewing destinations where available.
- Authenticated: library, wishlist, episode/chapter tracking, watch sessions, ratings, notes, collections, personal history, preferences, recommendations, missing sequels, notifications, import/export and account controls.
- Support anime TV, movies, OVA, ONA, specials and donghua; manga, manhwa, manhua and light novels where data supports classification. Never infer nationality or format from a name alone.
- Personal data is independent of third-party availability. No video/chapter hosting or unauthorized source integrations. No LLM, runtime generated copy, paid AI or GPU dependency.
- All product functionality described below is planned. Feature gates distinguish the first useful release from the complete roadmap; incomplete features must not appear as working controls.

## 2. Stack and decisions

| Concern | Selection |
|---|---|
| Web | React + TypeScript + Vite, React Router |
| CSS, components | Tailwind CSS, Radix/shadcn primitives, Lucide React |
| Motion | Motion for React (Framer Motion), `motion/react` |
| Server state | TanStack Query; URL params for filters; local React state for UI; Zustand only if justified |
| API | Python FastAPI, Pydantic, HTTPX, async SQLAlchemy 2 + PostgreSQL driver |
| Data | Separate Supabase PostgreSQL project; Alembic migrations; pg_trgm and PostgreSQL FTS |
| Identity | Supabase Auth, Google OAuth/PKCE, verified Supabase JWTs |
| Shared cache and limits | Redis; dedicated instance or strong namespace/ACL isolation |
| Jobs | Dramatiq (proposed), worker + scheduler, PostgreSQL transactional outbox |
| Contracts | FastAPI OpenAPI, openapi-typescript generated client types |
| Tests | Vitest, React Testing Library, Playwright, Pytest; real PostgreSQL/Redis integration tests |
| Delivery | GitHub Actions, Cloudflare Pages, Linux container runtime, Uvicorn, Nginx |
| Observability | Structured logs, metrics, Prometheus/Grafana, alerts |
| Catalogue | Configurable Jikan-compatible provider; Tenrai candidate, self-hosted Jikan/MAL alternatives |

Use a modular monorepo and modular monolith. The API, worker and scheduler share Python modules and one migration history but run as separate processes. No microservices, Kafka, separate search cluster or Kubernetes initially. Prefer one backend image with different commands. Use lockfiles, pinned production images and versioned contracts. Use Python and Node versions supported by all selected dependencies at implementation time.

### 2.1 Provider validation is a release gate

Jikan's maintainer states the public API was discontinued on 1 October 2026: https://github.com/jikan-me/jikan-rest/issues/613 . Do not use the discontinued `api.jikan.moe/v4` as a production dependency. Self-hosted Jikan can be evaluated; public Tenrai v1 (`https://api.tenrai.org/v1`) is a candidate with a Jikan-compatible schema, currently beta: https://api.tenrai.org/documentation . No live API integration has been tested for this plan. Provider quotas, endpoint coverage, commercial/public usage, caching and artwork/synopsis rights must be verified before launch. Public accessibility does not itself grant redistribution rights.

Gate P0: run bounded smoke requests for search (anime/manga), details, long paginated episodes, season, schedules, genres/themes, relations, top titles and recommendations; check auth, rate-limit headers, nulls, HTTP 429, timeouts and schema drift; review terms and attribution; save sanitized fixtures; measure latency; document unsupported capabilities. Verify that MAL IDs correspond across providers. Select one production provider only after the gate. If unavailable, implement local fixtures and manual catalogue entries for development, not pretend live data. Production discovery must not launch without a working compliant source.

## 3. Product navigation and pages

Desktop navbar: **ALCOR | Home | Anime ▾ | Manga ▾ | Discover ▾ | My library | Wishlist | Search | Notifications | Profile / Sign in**. Guest links to personal pages open sign-in only when invoked. Mobile uses a collapsible top navigation menu; search, bookmark and profile remain accessible. No permanent sidebar on any page. Filters appear above grids; compact mobile filter dialog. Dedicated details pages, not side panels. Footer: About, Help, Privacy, Terms, Data sources, Contact, service status. No forced sign-up banners or blocking guest auth.

| Route | Access | Purpose |
|---|---|---|
| `/` | Public | Featured artwork, popular/current/upcoming titles, genre browsing, manga; personalized sections after sign-in |
| `/anime` | Public | All anime, format, season, genres, themes, status, ratings, studio, episode length, sorting |
| `/anime/:id` | Public | Overview, episodes, characters, staff, related titles, recommendations; personal actions |
| `/manga`, `/manga/:id` | Public | Manga categories, details, chapters/volumes if available, reading actions |
| `/discover` | Public | Popular, hidden gems, genres/themes, random, seasonal; personal recommendations and missing sequels after login |
| `/search` | Public | Universal title/alias search and filters |
| `/calendar` | Public | Airing schedules and upcoming titles; personal follow filters after login |
| `/franchise/:id` | Public | Related titles, release order, verified watch order where available; individual progress |
| `/library`, `/wishlist` | Private | Personal statuses, search, sorting, grid/list, saved priority, bulk actions |
| `/collections`, `/collections/:id` | Private | User-managed collections |
| `/history`, `/statistics` | Private | Activity, viewing and reading insights |
| `/notifications`, `/profile`, `/settings` | Private | Notifications, preferences, import/export, privacy, deletion |
| `/auth/callback` | OAuth | Exchange authorization code, resume valid pending action |
| `/privacy`, `/terms`, `/about`, `/help`, `/status` | Public | Trust, support, legal and service information |
| `*` | Public | Accessible not-found page |

Homepage order for guests: featured title (actual synopsis or approved summary), Popular anime, Currently airing, This season, Upcoming anime, Browse by genre, Popular manga, Hidden gems. For members, introduce Continue watching, Continue reading, Recommended for you and Unwatched sequels where populated. Avoid repeated hero/tagline content. Statistics live in the profile area, not on the homepage. A featured section is omitted if no reliable artwork/content exists. Do not label popularity as live trending unless the source actually measures time-based trends.

## 4. Feature catalogue and acceptance

| Feature | Required behavior |
|---|---|
| Catalogue | Normalized metadata, alternative names, posters, synopsis, format, ratings, release dates, studios, authors, publishers, characters/staff, trailers where verified; source attribution and freshness |
| Search | Exact/partial English/Japanese/alternative names; fuzzy matching; scoped personal search; keyboard accessible global search, URL state, debouncing, cancellation, pagination |
| Advanced filters | Include/exclude genres/themes, year/range, season, format, studio, rating, popularity, length, airing/publication status, age/content rating, personal status, franchise; saved filter presets |
| Discovery | Popular/top rated, seasonal, upcoming, hidden gems, related titles, random picker (wishlist or eligible catalogue), broad and narrow discovery modes |
| Library | Watching, reading, completed, on hold, dropped, rewatching/rereading, not interested; searchable grid/list; bulk updates, ratings, notes, favorites, tags |
| Wishlist | Plan to watch/read, priority high/normal/low, optional reason, saved date, sort, bulk remove, cross-device sync, undo, navbar count |
| Episode tracker | Individual watched/skipped/unwatched records, release status, titles, dates, filler/recap, mark up to, mark all, unmark, ratings/notes, next episode, missing gaps, rewatch sessions |
| Chapter tracker | Individual chapters including decimal/special labels, volumes, manual tracking, unknown totals, bulk progress and reread sessions |
| Continue | Resume earliest eligible unresolved released episode/chapter; distinguish caught up/waiting, last activity; quick next-item action |
| Franchise | Independent season/cour/movie/OVA identities; sequel/prequel/adaptation/side-story edges; missing sequels; release order and curated watch order if verified |
| Recommendations | Deterministic score from user ratings/preferences, genre/theme, studio, similarity, popularity/quality and length; diversity and dismissal; truthful explanations |
| Collections | Create, rename, delete, reorder, add/remove titles; same title can belong to multiple collections; deletion does not delete library entries |
| Releases | Public calendar, personal follow/unfollow; notifications for release/new season/finished airing, wishlist releases where reliable; configurable time zone and channel |
| History/statistics | Chronological activity; completed titles, unique episodes, total viewing events, estimated time with known durations, ratings, genre/studio counts, year trends, rewatch counts |
| Historical import | Bulk text, CSV, MAL XML, compatible AniList export, quick-add poster selection, manual entry, preview/ambiguity resolution, idempotent commit |
| Export/backup | JSON complete versioned archive, CSV summary, account export, restore procedure, recovery and soft deletion where appropriate |
| Search from memory | Search known local synopsis/keywords, character/studio data and personal notes; no paid AI; do not promise coverage of entire external catalogue |
| Notifications | In-app center, read/unread, dismissal, deduplication; optional web push/email later |
| Global warnings | Offline, rate limit, maintenance, stale metadata, partial failure, save failure, expired session, confirmation, toast with undo |
| Accessibility | Keyboard navigation, accessible controls/dialogs, focus restoration, readable contrast, reduced motion, touch targets, screen reader announcements |
| PWA/offline | Optional installation and read-only cached public data/library later; no unimplemented offline writes or guaranteed background sync |
| Legal viewing | Verified source links if supported by region-specific data; otherwise links to official services without claiming title availability |

### 4.1 Personal status state machine

Use one canonical library entry per user/media. Persist statuses `planned`, `in_progress`, `completed`, `on_hold`, `dropped`, `not_interested`; presentation chooses watching/reading/planned labels by media type and rewatching/rereading by active session kind. No entry means not started/unrecorded, not proof of never watched. Caught up/waiting is a derived state, not a duplicate database status. Wishlist is a projection of `planned` plus optional one-to-one priority/reason metadata, not a competing second status store. Default transition from planned to in progress removes active wishlist membership in the same transaction; use a collection if the user wants persistent independent bookmarks. Favorite flag/collection membership are independent. Completion history persists through rewatches and status changes. Separate `ever_completed` evidence from active session status so rewatching does not reintroduce previously completed titles into new discovery.

Allowed transitions: no entry -> planned/in_progress/completed/not_interested; planned -> in_progress/completed/dropped/not_interested; in_progress -> on_hold/dropped/completed; on_hold/dropped -> in_progress; completed -> new rewatch session or deliberate status correction; not_interested -> deliberate clear/change. Deleting from a collection is not deleting library/history. User corrections have an explicit undo or audited recovery operation; destructive reset requires confirmation.

### 4.2 Exact episode/chapter rules

An episode belongs to a canonical anime entry (season/cour, not entire franchise). Distinguish provider episode key, sequence order, displayed label and release timestamp. Specials may be separate media or special episode types depending on source. Unique `(media_id, episode_key)`. Reading chapter keys are strings/normalized decimal or stable custom labels, not floats; maintain order separately. Use sparse progress records per session: no row = unresolved, watched/read and skipped are explicit states. Avoid pre-inserting thousands of unwatched rows. Allow manual placeholders for missing metadata and reconcile later with confirmed provider mapping without losing progress. Unknown episode total remains null; distinguish released count, scheduled future count and confirmed final total.

Example: 12 released episodes, watched 1–4, 6–8, 10–11; skipped 5; 9 and 12 unresolved. Actual watched=9; skipped=1; resolved=10; remaining released=2; next=9. Completion based on all required released and confirmed-final episodes resolved according to user-selected skip policy; actual watch count never includes skips. An airing anime with no outstanding released episodes is caught up, not completed. If no reliable final total or release coverage, never auto-complete; permit explicit user completion with audit. User marking an entire old title completed may record title-level completion assertion without inventing episode dates or implying exact episode evidence; offer mark all known episodes or leave detailed history unspecified. If user confirms all episodes, create bulk progress for known episode keys. A newly detected episode reopens active tracking/alerts without destroying history. Preserve initial and rewatch/reread sessions; multiple active sessions for same media only if intentionally supported, default one active session per account/media/type. Record UTC timestamps with unknown historical dates null. Bulk operations target bounded explicit ranges and produce one transaction and activity event with per-episode changes; optimistic version check or serialized session updates prevent stale writes.

### 4.3 Discovery filtering semantics

- Show all: catalogue results with personal state overlay for authenticated users.
- Hide watched: exclude ever-completed media, including active rewatches; do not hide unrelated sequels.
- New to me: exclude known started, completed, dropped and not-interested titles; planned titles optionally included (default include; explicit preference). Unrecorded means no matching history, not proof of never watched.
- Personal filter must execute before final local pagination/ranking. For remote results, fetch bounded additional pages, deduplicate canonical IDs, apply exclusions, return cursor and `is_partial`/coverage rather than pretending exhaustive search. Explicit title lookup can override exclusion to locate a watched title, with visible status. No personal filtering for guests; show sign-in hint if requested, never force login just to search.
- Search ranks exact alias, prefix, trigram/FTS similarity and quality tie-breakers. Handle Unicode/case, Japanese aliases, ambiguous titles and season/year. `pg_trgm` for indexed local data; upstream search only within budget. Never infer exact identity from fuzzy name alone.

### 4.4 Recommendations, hidden gems and release monitoring

Initial weighted score (tunable): genre 30%, theme 20%, similarity to highly rated titles 20%, community quality 15%, studio 10%, length 5%. Normalize available factors, avoid treating missing ratings as zero; minimum evidence and popularity thresholds are configurable. Explicit dislikes and completed/dropped/not-interested are filtered before ranking. Avoid overfitting frequently watched genres (frequency is not preference). Use diversity by franchise/genre; allow exploration of unfamiliar genres and dismissals. Cold-start users see general curated/popular catalogue with no personalized claim. Explanation templates are based on actual matching factors; e.g. “Matches your Fantasy preferences.” No generated AI prose. Hidden gems uses source rating, sufficient rating count and relatively low popularity; define thresholds and label coverage. Watch order from verified curated data only; generic relation graph is not chronological truth. Follow a franchise, title or wishlist; jobs poll only relevant active items, respect quota, persist source provenance, dedup event keys and notify on observed changes. Distinguish schedule estimate from confirmed release; chapter alerts unavailable unless reliable source supports them.

## 5. Visual and interaction system

### 5.1 ALCOR Monochrome

| Token | Hex | Usage |
|---|---|---|
| `background` | #FFFFFF | Pages |
| `surface` | #F5F5F5 | Secondary surfaces |
| `border` | #E5E5E5 | Separators |
| `muted-foreground` | #737373 | Secondary text (check contrast on intended surface) |
| `foreground` | #171717 | Primary text |
| `primary` | #000000 | Primary buttons |

Inter for all UI, weights 400/500/600; no decorative typography. Headings 28–36px, section 20–24px, body 14–16px, metadata 12–13px. Use 4px spacing increments, 6–8px controls/card radius, modest shadows only for overlays, clean white canvas, original full-color artwork, no gradients/glassmorphism/neon. Semantic critical warning red permitted sparingly, but text/icons always convey meaning. Navbar sticky, max content width 1440px, generous spacing. 2 columns <640px, 3 at 640, 4 at 768, 5 at 1024, 6–7 at 1280+ subject to actual card min-width. Poster aspect ratio 2:3, reserve dimensions; localized title truncation with full accessible name. Touch targets approximately 44px, visible keyboard focus, body/metadata contrast meets WCAG AA; muted text on grey may require darker token. Mobile filters open a dialog; no sidebars. Respect original cover colors. Design inspiration: Vercel, Linear, Raycast, Resend, shadcn and Apple TV; do not copy branding.

### 5.2 Reusable design system and motion

Use base Button/IconButton, Input, SearchInput, Select, Checkbox, Radio, Switch, Dialog, Popover, Dropdown, Tooltip, Tabs, Accordion, Progress, Pagination, Carousel, Image, Skeleton, EmptyState, ErrorState, Container, Section, Badge, Avatar. MediaCard receives actions as slots, never embeds account mutations. Generic Motion primitives own shared durations and variants; `Button` integrates press animation rather than two incompatible base buttons. Use global `MotionConfig`, `AnimatePresence`, layout transforms, `useReducedMotion`. Centralize z-index and animation tokens. No CSS keyframe/GSAP animation competing with Motion; CSS remains for static layout and focus styles. Loading shimmer also Motion; reduced motion uses static placeholder.

| Event | Motion target |
|---|---|
| Route/section entrance | Fade + small translation 180–250ms |
| Hero/decorative background | Slow neutral geometric/artwork movement 8–20s, no distraction |
| Poster hover | Scale 1.02, 150–200ms, pointer devices only |
| Button press | Scale 0.96 and recover 100–150ms |
| Wishlist/library add | Fly-to-target 500–650ms; target pulse 150–220ms |
| Remove wishlist | Icon transition 150–200ms |
| Mark watched | Checkmark reveal and restrained pulse 200–300ms |
| Completed | Progress animation 300–450ms |
| Episode/chapter update | Checkmark and progress 150–250ms |
| Hide watched/filter | Animated card exit/reflow 200–300ms |
| Dialog/dropdown/mobile nav | Fade/scale or collapse 150–200ms |
| Toast | Fade/slide 180–250ms |
| Loading | Subtle shimmer when permitted |

Fly-to-target: register navbar wishlist/library targets by logical key; capture source rectangle/image at click; on confirmed server mutation use fixed, pointer-events-none portal overlay, animate poster clone position/scale/opacity along a gentle path; shrink into destination, pulse icon, show authoritative count and success toast. Do not trigger success on failed writes, duplicate no-op or canceled sign-in. Handle source unmount, hidden mobile target, resize/scroll/route change by recalculating or gracefully degrading to checkmark/toast. After OAuth redirect, original source may no longer exist; use fallback. Queue/cap concurrent effects, clean up on navigation, no focus capture, aria-hidden clone. Respect reduced motion and pause decorative motion when hidden/offscreen. Provide pause/disable control for persistent motion, and avoid movement longer than 5s without pause option. Do not delay authoritative UI state or navigation for animation. Use a single generic FlyToTarget for wishlist, library, collection and favorite; not separate custom engines. Watched animation only after server success; card removal in Hide watched happens after successful state update, with undo option.

## 6. Folder architecture and dependency rules

Create files only when their feature is implemented; the tree is a target, not an instruction to scaffold hundreds of empty directories.

```text
alcor/
├── frontend/
├── backend/
├── contracts/                 # OpenAPI v1, examples, generation instructions
├── infrastructure/            # Containers, Nginx, Cloudflare, deployment, monitoring
├── scripts/                   # Local setup, migration, contract generation, smoke tests
├── docs/
│   ├── product/               # Requirements, feature spec, roadmap
│   ├── architecture/          # System, frontend, backend, database, boundaries, provider
│   ├── design/                # Tokens, components, responsive layout, motion, accessibility
│   ├── content/               # Style guide, vocabulary, copy catalogue, QA
│   ├── engineering/           # API, security, testing, performance, workflow
│   ├── operations/            # Deploy, monitoring, backup, incidents
│   └── decisions/             # ADRs: modules, provider, auth, DB, motion
├── tests/                     # Cross-app E2E, load and deployment smoke
├── .github/workflows/
├── .editorconfig
├── .gitignore
├── .env.example               # No real secrets
├── compose.dev.yml
├── Makefile
└── README.md
```

Frontend:

```text
frontend/
├── public/                    # Favicon, approved fonts/assets, robots, manifest, fallbacks
├── src/
│   ├── app/                   # bootstrap, config, providers, router, layouts, boundaries
│   ├── pages/                 # home, anime, anime-details, manga, manga-details,
│   │                          # discover, search, library, wishlist, calendar, franchise,
│   │                          # collections, history, statistics, profile, settings,
│   │                          # notifications, auth-callback, legal, not-found
│   ├── widgets/               # navbar, footer, featured-media, media-grid/carousel,
│   │                          # global-search, continue-watching/reading, notification-center,
│   │                          # global-announcements
│   ├── features/              # authentication, catalogue, search, discovery, library,
│   │                          # wishlist, episode-tracking, chapter-tracking, franchises,
│   │                          # recommendations, collections, ratings, notes, releases,
│   │                          # notifications, imports, exports, statistics, preferences
│   ├── entities/              # media, episode, chapter, character, genre, franchise, user
│   ├── shared/
│   │   ├── api/               # transport, auth token injection, errors, generated contracts
│   │   ├── query/             # QueryClient, cache/retry policy, session cleanup
│   │   ├── auth/              # Supabase client, session, guarded-action primitive
│   │   ├── ui/                # canonical accessible primitives
│   │   ├── motion/            # config, components, effects, providers, hooks
│   │   ├── feedback/          # toasts, confirmation, banners, error map, queue
│   │   ├── content/           # global registry/schema/formatters, locale message access
│   │   ├── hooks/             # truly domain-independent hooks
│   │   ├── icons/             # approved icon semantics
│   │   ├── validation/ formatting/ storage/ telemetry/ accessibility/
│   │   └── constants/ types/  # only shared technical definitions
│   ├── content/en/            # canonical editorial dictionaries; imported by shared/content
│   ├── styles/                # tokens.css, theme.css, typography.css, globals.css, index.css
│   └── main.tsx
├── tests/                     # test setup, shared fixtures, integration
├── package.json / package-lock.json
├── vite.config.ts / tsconfig.json / eslint.config.js / vitest.config.ts
└── .env.example
```

Use feature-owned `api/` (client methods, query keys/options), `components/`, `hooks/`, `model/` (display rules, types/selectors), `motion/` only for feature-specific choreography, `tests/`, `index.ts` public interface. A small feature can remain a few files. Example: wishlist owns `WishlistButton`, `WishlistGrid`, `useAddToWishlist`, `useRemoveFromWishlist`, `wishlistKeys`, `wishlistRules`; episode tracking owns `EpisodeTracker`, `EpisodeGrid`, `EpisodeList`, `EpisodeBulkActions`, `WatchSessionSelector`, progress queries and display rules. Entities own `MediaCard`, `MediaPoster`, `MediaTitle`, `MediaMetadata`, `MediaScore`, `MediaGenres`, `MediaSynopsis` and status presentation. Shared components cannot import feature/domain code. App -> pages -> widgets -> features -> entities -> shared (lower layers allowed directly); static locale assets are imported via shared content. Cross-feature composition belongs in widgets/pages or explicitly documented integration interfaces, not circular private imports. Use ESLint restrictions and dependency-cycle checks. Avoid wildcard mega-barrels that defeat code splitting; public interfaces remain narrow.

Backend:

```text
backend/
├── app/
│   ├── main.py
│   ├── bootstrap/             # application factory, lifespan, router/middleware registry
│   ├── core/
│   │   ├── config/            # typed settings, environments, flags
│   │   ├── security/          # JWT, JWKS, authentication, authorization
│   │   ├── errors/            # codes, exceptions, handlers
│   │   ├── middleware/        # request ID, access log, headers, limits, CORS
│   │   ├── logging/           # structured formats, redaction
│   │   └── pagination/ validation/ observability/
│   ├── infrastructure/
│   │   ├── database/          # engine, sessions, base, transaction, user_context, registry
│   │   ├── cache/             # Redis, keys, policies, invalidation, singleflight
│   │   ├── rate_limit/        # shared policies, atomic limiter, metrics
│   │   └── http/ queue/ events/ storage/
│   ├── integrations/
│   │   ├── metadata/          # protocol, registry, capabilities, normalized models, errors
│   │   │   ├── tenrai/        # only if validated
│   │   │   ├── jikan/         # only if self-hosted selected
│   │   │   └── myanimelist/   # future adapter
│   │   ├── authentication/supabase/
│   │   └── notifications/     # optional email/web_push
│   ├── modules/               # catalogue, search, discovery, users, library, wishlist,
│   │                          # tracking, franchises, collections, recommendations,
│   │                          # releases, notifications, statistics, imports, exports, system
│   ├── workflows/             # start watching, complete media, update progress,
│   │                          # import library, delete account
│   ├── jobs/                  # metadata/episode/release sync, notifications, cleanup
│   ├── workers/               # queue entrypoint, job registry, lifecycle
│   └── scheduler/             # schedule entrypoint, schedules, distributed lease
├── migrations/versions/
├── tests/                     # unit, integration, API, security, provider, architecture, fixtures
├── alembic.ini / pyproject.toml / uv.lock
├── Dockerfile
└── .env.example
```

Each business module: `routes.py`, `schemas.py`, `service.py`, `repository.py`, `models.py`, `public.py`; add policies/calculations/events only as needed. Route handles HTTP; service validates domain and authorizes; repository performs SQL; service/workflow owns transaction. Module-owned tables are written by their repository. Cross-domain operations use explicit workflows with shared transaction and narrow interfaces; avoid service cycles. Infrastructure is not aware of business routes. Integrations normalize third-party schemas at boundary, never import feature routes. Import Linter and tests enforce rules. No direct SQL in routes, no credentials in code, no external calls from arbitrary services bypassing provider rate limiter. No global miscellaneous utility dumping ground.

## 7. Data architecture and constraints

Use schemas `catalogue`, `personal`, `operations`, plus Supabase-managed `auth`. One separate Supabase project per environment as budget permits. UUID internal media IDs, explicit external namespace (e.g. MAL + anime vs manga), stable episode/chapter keys. Tenrai and Jikan exposing the same MAL anime ID map to one canonical record. No deletion of personal progress due to provider disappearance. Table list below is logical; combine one-to-one fields in a table until separate lifecycle requires a table.

| Table | Key fields and constraints |
|---|---|
| `catalogue.media` | UUID PK, type/format, title, synopsis, image reference, official status, total episodes/chapters nullable, dates, score/rating count, freshness/source |
| `media_external_ids` | unique(namespace, media_type, external_id), FK media; provider-specific fetch provenance separate |
| `media_titles` | FK media, title, language, alias type; normalized search index |
| `genres`, `themes`, `studios`, `media_genres`, `media_themes`, `media_studios` | vocabulary and unique join pairs |
| `franchises`, `franchise_members`, `media_relations` | relation type, source, confidence/curation, unique directed edge; adaptations not automatic same-season merge |
| `episodes` | FK media, episode key/label/order, title, date, filler/recap, duration nullable; unique(media_id, episode_key) |
| `chapters` | FK media, chapter key/label, sort order, volume nullable, provenance; unique(media_id, chapter_key) |
| `characters`, `media_characters`, `staff` (as needed) | source IDs and associations |
| `release_events` | source key, title/episode/chapter association, date precision, timezone, estimate/confirmed, revision |
| `metadata_sync_state` | resource, provider, attempted/success times, error, next refresh |
| `personal.profiles` | user_id PK referencing auth.users, locale, display name |
| `user_preferences`, `saved_filters` | user_id, visibility, skip policy, locale/time zone, motion, notifications |
| `library_entries` | unique(user_id, media_id), status, completion assertion/evidence, favorite, rating, dates, version, deleted_at if needed |
| `wishlist_details` | unique(user_id, media_id), priority/reason/saved_at; only active when library status planned |
| `watch_sessions`, `reading_sessions` | UUID, user_id, media_id, kind, start/end, version, active; partial unique active session per user/media/kind policy |
| `episode_progress`, `chapter_progress` | session_id + episode/chapter_id unique, status, watched/read/skip timestamps, version; ownership and matching media enforced with composite FK or equivalent DB checks |
| `media_ratings`, `episode_ratings`, `personal_notes` | ratings/notes with owner and target; media rating may live in library entry instead of duplicate table |
| `collections`, `collection_items` | owner, name, position; unique(collection_id, media_id); ownership enforced |
| `user_activity` | append-only event, user, entity, action, occurred_at, before/after relevant state, mutation id; retention/privacy policy |
| `recommendation_feedback` | user/media, dismissed or preference feedback |
| `followed_media`, `notifications` | followed title/franchise, event key, read_at; unique(user_id, event_id, type) |
| `operations.import_jobs`, `import_items` | owner, status, file/source checksum, match, preview/commit state, error |
| `sync_jobs`, `outbox_events` | dedup key, state, attempt, next_run, lease, payload version |
| `system_announcements`, `audit_events` | operational notices and redacted security events |

Indexes: external identity unique; media type/status/year, popularity/score for common sorts; GIN FTS and trigram on title/alias (appropriate language config; Japanese tokenization limitations documented); relation source/target; episode/chapter media and order; library(user,status,updated_at), library(user,media); progress(session,episode), active sessions by user/last activity; collections owner; notifications(user,read_at,created_at) or partial unread; activity(user,occurred_at desc); releases date; pending outbox/job partial index. Use cursor tie-breaker ID; inspect EXPLAIN ANALYZE on realistic data before adding more indexes. Date/time UTC storage, locale presentation. Avoid N+1; use bounded joins and batch queries. No unnecessary denormalized counts; derive from records or transactional summaries with reconciliation.

Migrations: initial schemas/roles/extensions -> catalogue/identity -> personal library/ownership -> progress/session/activity -> collections/preferences -> release/notification -> jobs/outbox/imports -> search indexes and performance tuning. Migration role separate from runtime non-owner NOBYPASSRLS role. Backend opens one SQLAlchemy engine/pool per process, request scoped sessions, explicit transaction for writes. For private schema, revoke browser/Data API access, enforce RLS with transaction-local user context and fail-closed policies; privileged internal jobs use narrowly scoped separate role. Test pooled context reset, two-account isolation and worker privileges. Never assume auth.uid() works with direct SQLAlchemy connections without setting verified context. Establish identity from verified JWT subject only. Composite keys or DB checks prevent cross-user/session/media reference corruption. Use direct connection when supported or session pooler if required; total pool budget = sum of all processes and overflow, leave headroom. Region near API. Back up and restore-test data; separate destructive account deletion workflow removes private data and revokes sessions according to retention policy.

## 8. API contract and auth

Version `/api/v1`. JSON Pydantic schemas; UTC ISO dates; opaque cursors; bounded page size (default 24, max 100 for catalogue, episodes may use 100). Validate allowlisted sort/filter enums; no arbitrary upstream URL. Standard error: `{"error":{"code":"UPSTREAM_UNAVAILABLE","message":"Catalogue information is temporarily unavailable.","retryable":true,"request_id":"..."}}`. Machine error codes are stable; frontend maps to approved copy, not raw backend exceptions. HTTP 400/422 invalid request, 401 invalid/expired auth, 403 forbidden, 404 absent/hidden resource, 409 version conflict, 429 rate limit, 502/503 upstream/unavailable. Responses may include `source`, `last_updated_at`, `is_stale`, `is_partial`, `next_cursor`, `has_more` as applicable. No false empty results on failure. Private responses `Cache-Control: private, no-store`; public anonymous metadata may be cached, optional-auth enrichment either separate endpoint or guaranteed private cache policy.

| Public route (GET unless noted) | Purpose |
|---|---|
| `/home`, `/anime`, `/manga`, `/search` | Aggregated bounded home, catalogue, global search |
| `/anime/{id}`, `/manga/{id}` | Canonical details |
| `/anime/{id}/episodes`, `/anime/{id}/episodes/{episode_id}` | Public episode metadata |
| `/anime/{id}/characters`, `/anime/{id}/staff`, `/anime/{id}/relations` | Lazy-loaded tabs |
| `/manga/{id}/relations`, `/manga/{id}/chapters` | Related media, chapters if supported |
| `/genres`, `/themes`, `/seasons`, `/studios` | Filter taxonomy |
| `/discover/popular`, `/discover/hidden-gems`, `/discover/random`, `/calendar`, `/franchises/{id}` | Discovery and schedule |
| `/system/status`, `/system/announcements` | Service status and global notices |

| Protected route | Operation |
|---|---|
| GET/PATCH `/me`, GET/PATCH `/me/preferences` | Profile and preferences |
| GET `/me/library`, PUT/DELETE `/me/library/{media_id}` | Library and status; removal confirmation in UI |
| GET `/me/wishlist`, PUT/DELETE `/me/wishlist/{media_id}` | Planned membership and details |
| GET `/me/media-status?ids=...` | Bounded batch state overlay |
| GET `/me/discover`, `/me/recommendations`, `/me/missing-sequels` | Personal filtered discovery |
| GET `/me/continue-watching`, `/me/continue-reading` | Resume queues |
| POST `/me/watch-sessions`, `/me/reading-sessions` | Create session or rewatch; idempotency key |
| GET `/me/watch-sessions/{id}/episodes`, `/me/reading-sessions/{id}/chapters` | Session progress |
| PUT `/me/watch-sessions/{id}/episodes/{episode_id}` | Set desired status + expected version |
| POST `/me/watch-sessions/{id}/episodes/bulk` | Bounded range/IDs action |
| PUT `/me/reading-sessions/{id}/chapters/{chapter_id}`, POST `/me/reading-sessions/{id}/chapters/bulk` | Chapter state updates |
| POST `/me/media/{id}/manual-episodes`, `/me/media/{id}/manual-chapters` | Personal/manual progress target, no unreviewed global metadata changes |
| PUT `/me/ratings/{media_id}`, `/me/notes/{target_id}` | Ratings/notes with target authorization; episode ratings analogous |
| GET/POST `/me/collections`, PATCH/DELETE `/me/collections/{id}`, PUT/DELETE `/me/collections/{id}/items/{media_id}` | Collections |
| GET `/me/history`, `/me/statistics` | Personal reporting |
| GET `/me/notifications`, PATCH `/me/notifications/{id}`, PUT/DELETE `/me/follows/{target_id}` | Notices/following |
| GET/POST `/me/saved-filters`, PATCH/DELETE `/me/saved-filters/{id}` | Filter presets |
| POST `/me/imports`, GET `/me/imports/{id}`, POST `/me/imports/{id}/commit` | Preview/resolve/commit imports; job status |
| GET `/me/export` or POST `/me/exports` + GET status | Direct small export or async large export |
| POST `/me/actions/{id}/undo` | Version-aware authorized undo |
| DELETE `/me/account` | Confirmed account deletion job |

JWT and OAuth: use `supabase-js` with PKCE, Google OAuth, exact redirect allowlist and minimal openid/email/profile scopes. Google provider token is not needed by ALCOR; do not store it. Supabase issues and refreshes session tokens; FastAPI verifies signature using project asymmetric JWKS, expected issuer/audience, exp/nbf, allowed algorithms and subject; reject service/admin tokens as end-user credentials. Cache keys with rotation handling and bounded refresh. For legacy HS256, follow Supabase verification guidance rather than accepting unverified claims. Missing auth permitted only on public endpoints, invalid supplied token rejected or explicit public unauthenticated request. JWT does not replace per-resource authorization. Use bearer token, HTTPS, CSP, no unsafe HTML, strict CORS, no custom duplicate token storage; browser token persistence is a trade-off to review before public rollout. Clear/cancel private caches and pending actions on logout/account switch. If cookie-based auth chosen later, implement CSRF safeguards.

Login-on-action: capture typed action (wishlist/mark/track), target internal ID, internal return path, expiry, nonce/idempotency key in session-scoped storage; no credentials or arbitrary URL. Show one sign-in dialog; callback exchanges code once, verifies current account, validates pending action and submits once, then clear. If user cancels/changes intent/target invalid, no mutation. Retry uncertain network response with same idempotency key or fetch authoritative state. Direct protected route redirects only on access. Google consent branding and privacy/terms configured before launch.

Generate OpenAPI from FastAPI in CI and TypeScript types using openapi-typescript; generated output checked for drift. Central API client owns transport, request IDs, auth injection, refresh coalescing, cancellation, timeouts, error normalization and retry policy. Feature-specific TanStack Query keys own data; use public keys and account-scoped private keys; prevent personalized catalogue in public cache. No duplicate server state in Zustand/localStorage. Optimistic updates with rollback/reconciliation, no success animation until commit. Serialize conflicting mutations per entity/session or use version checks.

## 9. Provider, cache and rate-limit implementation

`MetadataProvider` contract exposes search, details, episodes, relations, genres/themes, seasonal/top, schedule and recommendations; capabilities declare unsupported operations explicitly. Adapter uses fixed allowlisted base URL, validated route params, HTTPX connection pool, connect/read timeouts, bounded response size and schema validation. Normalize title aliases, classifications, scores (unrated -> null), episode dates, images, relationships and source provenance. Do not overwrite good cached values with nulls from a failed or incomplete fetch without a verified reason. Provider-specific ID is mapped to canonical identity before persistence. Persist useful permitted metadata, not indiscriminately mirror the entire catalogue; record freshness, partial coverage and source rights. Provider tests cover paginated episodes and alternate names, missing/invalid values and mismatched IDs. No public provider calls from the browser.

Request path: TanStack Query -> FastAPI shared Redis cache -> PostgreSQL normalized metadata -> provider as needed. Cache public queries by normalized filter/locale/provider/version, not raw arbitrary URL. Redis singleflight lock with short lease, bounded waiting, owner-token release, double-check cache; avoid cache stampede. Stale-while-revalidate and stale-if-error with explicit source timestamp; cap stale retention according to provider terms. Never cache private responses under public keys. Redis may cache personalized recommendations scoped by user/version only; authoritative personal state always PostgreSQL. For cold search, remote request budgets and cursor coverage are explicit; background refresh jobs are lower priority than interactive calls. Search debounce ~400ms, abort obsolete requests, avoid fetching all details/character/episode tabs for every card. Batch status overlay and reserve aspect ratio to minimize UI work.

| Data | Browser stale time (initial) | Shared refresh/TTL target |
|---|---:|---:|
| Search | 2 min | 10 min |
| Home | 5 min | 30 min |
| Details and relations | 15 min | 24 h |
| Finished episode lists | 30 min | 24 h |
| Airing episode list | 10 min | 1 h |
| Top lists | 15 min | 6 h |
| Schedule/season | 15 min | 1–6 h |
| Taxonomy | 24 h | 7 days |
| Characters/staff | 30 min | 24 h |
| Private library/progress | 30 s | No shared public cache |
| Recommendations | 5 min | 30 min user-scoped |

These are ALCOR policies, not promises of upstream freshness. Cache TTLs depend on source terms and actual data volatility. Do not refetch stable queries on every window focus; refresh private state on sign-in/resume where useful. Do not retry 401/403/404/422 blindly; retry bounded idempotent transient reads, respect Retry-After for 429; retry writes only with stable idempotency/desired state semantics. On timeout after a mutation, confirm authoritative state before reporting success or failure. Do not claim previous progress unchanged until known.

### 9.1 Dual distributed rate limiting

Redis atomically enforces separate inbound website limits and outbound provider limits across all API replicas/workers/schedulers. Use atomic token/sliding-window implementation supporting second and minute budgets; choose scope IP/user/route and provider egress IP/key as documented. Do not trust arbitrary forwarded IP headers; trust only configured reverse proxies and protect origin from bypass. Inbound limits initial proposal:

| Request class | Scope | Limit |
|---|---|---:|
| Public reads | IP | 120/min |
| Public search | IP | 30/min |
| Member catalogue | User | 180/min |
| Member search | User | 60/min |
| Library writes | User | 60/min |
| Episode/chapter writes | User | 120/min |
| Wishlist writes | User | 30/min |
| Bulk updates | User | 10/min |
| Import submission | User | 5/hour |
| Export | User | 5/hour |
| Account deletion | User | 3/hour |

Apply aggregate IP/account abuse safeguards, body size limits, pagination caps, expensive query budgets and concurrency caps; Supabase Auth has separate login limits. Outbound starting cap **2/sec and 45/min or lower according to validated provider limits**, configurable per provider and not a claim about Tenrai quota. Historical Jikan public quota was 3/sec, 60/min, no longer a live public allowance. Reserve capacity for browsing, constrain jobs, circuit-break on repeated 429/5xx, use jitter/backoff with capped retry, respect Retry-After; never evade upstream rate limits. HTTP 429 with `Retry-After` and stable error code; no client retry loop. If Redis fails, do not bypass upstream quota: serve permitted stale/local metadata or return degraded error; apply conservative edge limits for cached/public reads and restrict expensive operations. Personal updates remain safe if DB available and approved local abuse safeguards exist, otherwise fail closed for affected endpoints. Record metrics and warn only when user impact exists.

## 10. Cross-module workflows, consistency and workers

### 10.1 Wishlist and progress

Guest -> public media page -> wishlist click -> centralized auth guard -> Google OAuth if needed -> validated pending action -> FastAPI token verification/rate limit -> library/wishlist service -> idempotent transaction -> canonical response -> update private queries/count -> fly-to-target -> toast with version-aware undo. Duplicate save no extra animation/count. Start watching: transaction changes planned to in_progress, removes active wishlist metadata or marks inactive, creates first session, records activity; no partially applied state. Episode mark: verify user/session/episode matches, lock or compare session version, set sparse progress state, derive aggregate/next, apply completion policy, record activity and optional outbox event, commit; return canonical version. On rewatch, create new session, do not overwrite original progress. Marking watched, skipped, undo and bulk changes follow same path. Conflict HTTP 409 triggers refresh and clear copy; undo never blindly overwrites later changes from another device.

### 10.2 Importing the existing 300+ titles

Support newline text/CSV/MAL XML/compatible AniList exports; rapid poster marking and manual titles. Stage upload with type/size/row limits, strict CSV/XML parsing (no external entities), checksum/owner, detect duplicate inputs. Resolve exact canonical IDs first, then exact normalized alias/year/format, then fuzzy suggestions requiring review. Do not silently match ambiguous seasons. Display matched/already saved/unmatched/ambiguous summary, allow mapping and select desired status, import only confirmed rows. Never fabricate historical completion dates or progress; use source dates when available. Define conflict policy: default preserve existing richer personal progress, preview overwrite explicitly. Commit in bounded transactions with per-item idempotency and durable job state; partial failures visible and retryable without duplicating committed rows. Progress counts and results accessible after reload. Quick-add loads pages within provider budgets and saves selected titles in bulk. Export full personal data (including sessions, exact episode/chapter marks, dates, preferences, collections, ratings, notes, source IDs, schema version); CSV summary is not full restore fidelity. Protect exports, expire any download links, avoid CSV formula injection. Restore test validates round-trip identity and progress.

### 10.3 Workers and release delivery

API handles reads and small mutations; worker processes imports, periodic metadata/episode/release refresh, notification dispatch, optional recommendations and large exports; scheduler only enqueues due work. Use shared rate limiting and DB pool budget, job idempotency key, bounded retries, lease/visibility timeout, stale lease recovery, failure metrics and dead-letter state with operator retry. Single scheduler lease or DB uniqueness avoids duplicate schedules. Transactional outbox records durable notification/job events with originating transaction; worker claims with locks, publishes and handles at-least-once delivery idempotently. No network calls inside DB write transactions; fetch upstream before short commit. Use per-user event keys to deduplicate notifications. Schedule intervals configurable (e.g. hourly relevant airing items, daily franchise checks); source freshness and provider budget determine actual cadence. No guarantees of immediate release detection. Notification permissions opt-in, web push/email optional, respect local time zone and preferences. Disable unsupported schedules instead of inventing dates.

## 11. Global warning and operational feedback

Global FeedbackProvider with ToastViewport, WarningBanner, OfflineBanner, ConfirmationDialog, RateLimitNotice and error boundary. Queue/dedup identical errors; contextual failure stays in affected section unless site-wide. User-visible copy from companion editorial registry. Show error states separately from empty states, skeleton from actual loading, retry only when supported. Announcements schema: ID, severity, title/message key or reviewed text, starts_at/ends_at, dismissible, affected features, approved internal action URL, status, audit author. Server status endpoint reflects actual dependency health; do not expose DB topology or secrets. Public cache banners with short TTL; maintenance may allow reads while disabling affected writes with explicit 503. Offline read-only cached content is optional; no claim of a successful save offline. Success toast after commit, Undo where safe. Reduced-motion announcements still readable and aria-live polite; critical blocking errors announced appropriately. Internal alerts go to operators, not user-facing notifications.

## 12. Security and privacy

- Separate dev/staging/prod project credentials and namespaces; `.env.example` contains names only, validate config at startup. Frontend env only API base, Supabase URL/publishable key; never service role/DB password/Google secret. Backend uses restricted runtime role, secret manager, rotation.
- Strict HTTPS/CORS/CSP, no `dangerouslySetInnerHTML` for upstream synopsis, safe text rendering, validate allowed media URLs, safe `rel` for external links; SSRF protection for any future image proxy. Restrict upload types and sizes, safe parser and rate limits, no external XML entities. Sanitize filename, store private temporary uploads with expiry.
- JWT validation and RLS as Section 7–8, authorization by user/resource, least privilege workers, no cross-account cache leak. Short access-token lifetime and session revocation policy; deletion and logout clear pending actions/private cache. Audit sensitive changes without logging tokens, passwords, private notes, full query strings with user data or unnecessary email/IP. Privacy notice, terms, attribution, account deletion/export, retention rules. Personal profiles/libraries private by default.
- Public age/content filters; default exclude explicit adult content from general discovery, allow only appropriately designed policy-compliant preferences. Do not promise reliable age ratings where source unknown.
- Supply-chain lockfiles, automated dependency and secret scans, Python/JS lint and tests. CSRF if using cookies, clickjacking protection, trusted proxy config, secure headers, no production debug exceptions. Operational endpoints restricted; announcement editing via authorized operator tooling and audit, not a public dashboard.
- If offline personal caching enabled later, isolate per-account and clear on logout; browser device access risk disclosed. No unauthorized scraping or unlicensed video/chapter hosting. Review metadata/image usage and public product terms before launch.

## 13. Performance, accessibility and scalability

Targets (measure, not guarantees): Core Web Vitals p75 LCP <=2.5s, INP <=200ms, CLS <=0.1; cached catalogue and private read p95 <=300ms near origin; mutation p95 <=500ms (exclude OAuth/upstream cold miss, measure separately); ~60fps motion on capable devices; initial JS <=250KB gzip excluding route lazy chunks (verify actual build). Route lazy loading, Motion lazy features, fixed poster ratios, lazy responsive images, prioritize hero asset, no endless animation on all posters, paginate/virtualize long episode grids only if keyboard access preserved, avoid N+1 and unnecessary exact count queries. Use stable cursor/keyset pagination and deterministic sort. Co-locate FastAPI/DB/Redis; CDN for static public assets; no private CDN caching. Public SEO: distinct page titles/descriptions/canonical URLs, sitemap limited to verified indexable catalogue routes, robots noindex private pages; React SPA not guaranteed server-rendered indexing, consider prerender/SSR later only if SEO metrics justify it. Accessible keyboard menus, dialog focus trap/restore, headings, labels, aria-live, contrast, screen reader test, keyboard and touch motion fallback.

Scale by metrics: initial one API, one worker, scheduler, DB and Redis; add API replicas and worker concurrency separately, tune pool sum and cache; optimize query plans; adjust provider quota only with permission. Later separate high-load modules only when measurable throughput/failure isolation requires it. Global frontend via CDN, single backend region initially; multi-region DB unnecessary until justified. Cost target low/free within tiers but FastAPI host, Redis, domain, backup, egress and provider hosting may cost; verify quotas at deployment. Avoid affecting existing unrelated production workloads.

## 14. Deployment and operations

```text
infrastructure/
├── docker/                    # shared API/worker image; production compose
├── nginx/                     # API reverse proxy, trusted proxy/security configuration
├── cloudflare/                # static hosting, SPA routing, DNS/TLS, cache rules
├── monitoring/                # Prometheus, Grafana, alert rules
└── deployment/                # migrate, deploy, health checks, rollback
.github/workflows/
├── frontend-ci.yml
├── backend-ci.yml
├── contract-check.yml
├── architecture-check.yml
├── security-scan.yml
├── integration-tests.yml
├── deploy-frontend.yml
├── deploy-backend.yml
└── database-migrations.yml
```

Dev: reproducible compose for PostgreSQL and Redis (Supabase local stack when Auth tests require it), fixture provider; pinned dependencies; `make` targets for setup/lint/test/contracts/migrate/run. Stage: separate Supabase project, OAuth redirects, isolated Redis, real selected provider smoke within quota. Prod: Cloudflare Pages static Vite build (`npm ci`, `npm run build`, output `dist`, SPA fallback); FastAPI container(s) Uvicorn behind Nginx, restricted origin and TLS; same image for scheduler/worker with separate commands. Use a single release migration lock/step before activation; backward-compatible expand/contract migration where possible. Deploy new API then compatible frontend, health/readiness and smoke, rollback image if checks fail. Do not blindly downgrade DB schema; migration recovery documented. Liveness process, readiness DB/critical dependencies; provider failure is degraded catalogue, not necessarily total API unready. Stop job claims and drain on graceful shutdown. Separate production logs, environment identifiers and secret management. CI paths trigger relevant tests; contract/shared changes run both. Manual approval for sensitive production changes if needed, required branch checks.

Config examples (names only): `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; backend `APP_ENV`, `DATABASE_URL`, `MIGRATION_DATABASE_URL` only migration runner, `REDIS_URL`, `SUPABASE_URL`, `JWT_ISSUER`, `JWT_AUDIENCE`, `METADATA_PROVIDER`, `METADATA_BASE_URL`, `PROVIDER_API_KEY` if required, `PROVIDER_RPS`, `PROVIDER_RPM`, `ALLOWED_ORIGINS`, `LOG_LEVEL`, job intervals. Never log values for secret settings.

Monitor request volume, p50/p95/p99, HTTP 4xx/5xx/429, provider status/latency/429/outbound quota, Redis hit/miss and availability, DB latency/connections, queue age/failure, job lag, metadata age, auth failures, wishlist/progress save failures, frontend errors, deployment health and usage/cost. Use bounded labels (not per-user IDs in Prometheus), correlation/request IDs, redacted logs. Alerts for sustained high error rate, DB saturation, queue lag, provider quota incidents and backup failures; tune thresholds based on baseline. Backups: scheduled encrypted restricted logical exports or managed backups within plan, retention and restore drills; suggested initial RPO 24h/RTO 4h subject to budget and verified recovery, not a guaranteed SLA. Maintain incident runbook and status announcements. No public operator metrics.

## 15. Implementation order and acceptance gates

| Phase | Deliverables | Exit gate |
|---|---|---|
| P0 Provider and product contract | Confirm provider, endpoint capability, terms, fixtures, ALCOR brand/name, product and content spec | Required anime/manga/episode/search/relations capabilities tested or explicit fallback; no unverified live dependency |
| P1 Foundation | Monorepo, dependency boundaries, typed config, CI, migrations, core auth/security, UI tokens, Motion/Feedback/Query/Content providers, API errors, provider abstraction, Redis limits, test setup | Reproducible local boot, health, CI, contract generation, no secrets, provider stub tests |
| P2 Public website | Navbar, home, anime/manga catalogues/details, search, genre/season, episode metadata, public filters, cache, warnings | Guest browses all public pages without login; real provider validated; mobile/keyboard checks; no fake metadata |
| P3 Account and library | Google OAuth/PKCE, JWT, guarded actions, wishlist, library state, hide watched, quick-add/import, export | Guest action resumes exactly once, two-account isolation, repeated import no duplicates, canonical identity and persistent history |
| P4 Exact progress | Episode/chapter tracking, manual targets, skipped, bulk marking, sessions, rewatch, continue sections, completion rules, history | Missing-gap and skip tests, caught-up vs completed, cross-device conflict, history and backup restore |
| P5 Discovery expansion | Advanced filters/presets, local search, franchise/missing sequels, recommendations, hidden gems, collections, ratings/notes, statistics | No watched results in intended mode; related unwatched season remains; explanations justified; no misleading coverage |
| P6 Releases and notifications | Calendar, follows, jobs, outbox, notifications center, global announcements, operational alerts | Dedup, retry, outage, schedule freshness; user can disable notifications |
| P7 Polish | Final Motion interactions, poster animation, responsive layouts, accessibility, performance, content/editorial QA | Reduced motion, failure-safe animations, approved copy, tested layout at all breakpoints |
| P8 Production readiness | Security/load tests, restore drill, staging smoke, CI/CD, observability, deployment and rollback | All release gates pass; operator runbooks, rights and privacy reviewed |
| P9 Optional extensions | PWA/offline read access, optional push/email, verified streaming lookup, enhanced synopsis/character search, additional providers/languages | Per-feature provider coverage, privacy, performance and editorial review |

P0–P4 plus applicable P7/P8 gates are mandatory for the first public usable release; design, content, security, motion and tests begin in P1, not postponed to P7. P5–P6 deliver the full core roadmap; P9 is optional/conditional. Each phase includes working vertical slices, DB migration and tests, not mass folder generation. No placeholder buttons or fake data in production.

## 16. Mandatory test matrix

| Area | Test and expected result |
|---|---|
| Guest access | Home/search/details/episodes work without login; personal action opens sign-in only |
| OAuth | Successful callback resumes action once; canceled/expired/tampered return path creates no mutation |
| JWT | Invalid signature/issuer/audience/expiry/algorithm rejected; rotate keys; no service token accepted as user |
| User isolation | User A cannot fetch/update B; direct DB RLS and pooled identity reset tested with real PostgreSQL |
| Media identity | English/Japanese alias and provider migration resolve same title; anime/manga numeric ID collision remains distinct |
| Wishlist | Double PUT creates one entry/count; start watching removes active membership atomically; retry after timeout reconciles |
| Progress | Episodes 1–4,6–8,10–11 watched; 5 skipped; next 9; watched 9, skipped 1, remaining 2 |
| Progress ownership | Cross-media/session update rejected; missing future/unreleased metadata handled without false completion |
| Completion | Airing caught up != completed; confirmed final total required for automatic completion; manual assertion supported |
| Rewatch | Original session survives new rewatch; ever-completed title remains hidden |
| Chapters | 10.5 and bonus chapters keep distinct stable keys; unknown total supported |
| Concurrency | Stale mutation returns 409 or serializes safely; undo never overwrites newer state |
| Import | Ambiguous title review; duplicate input/repeated import idempotent; preserve existing progress; malformed/XXE rejected |
| Discovery | Exclusion before final pagination/rank; bounded remote partial result labeled; sequel still shown; explicit title lookup works |
| Recommendations | No excluded titles; cold start generic; missing score not zero; diversity, deterministic explanation and dismissal |
| Provider | Contract fixtures, pagination, nulls, timeout, 429, 5xx, malformed schema; cached fallback; no false empty state |
| Cache | 100 simultaneous same key coalesced under test; private cache not shared; sign-out clears private data |
| Rate limits | Multi-worker shared budgets; second/minute limit; Retry-After; Redis failure does not flood provider |
| Jobs | Duplicate execution harmless, retries bounded, lease recovery, notification dedup, scheduler no duplicate jobs |
| Warnings | One incident banner not repeated toasts; offline/rate-limit/maintenance accurate; failed write no success |
| Motion | Success-only fly-to-target, fallback hidden target, reduced motion, repeated click, route change cleanup |
| UI | 320px+ mobile, desktop/tablet, no horizontal overflow, keyboard/focus/contrast, screen reader manual smoke |
| Content | All keys exist, pluralization, no AI promotional phrases, missing metadata not invented, no false availability |
| Deployment | Migrations forward/rollback-compatible, staging smoke, health checks, secrets scan, backup restore with session progress |
| Performance | p75 Core Web Vitals, p95 latency, query plan and DB pool budget, poster loading, realistic concurrent load |

Unit tests for every non-trivial policy/calculation; API integration tests use real PostgreSQL and Redis where semantics matter (SQLite is not a substitute for PostgreSQL RLS/index tests); provider contract tests use recorded fixtures plus bounded live smoke; end-to-end Playwright with fixture Auth in CI and real staging OAuth smoke; accessibility automated and manual; no load testing against third-party provider without permission (use stub). Test with realistic 300, 1,000 and 2,000+ title personal libraries and long episode series. Release requires all critical tests passing, no known critical security defects, documented limitations, measured performance and editorial sign-off. This is a specification, not evidence any test has passed yet.

## 17. Definition of done and implementation boundaries

A feature is complete when user workflow, authorization, schema migration, API contract, responsive UI, loading/empty/error states, approved wording, accessibility, motion behavior, metrics and tests are integrated; docs updated; no hidden duplicate logic. Reuse the one canonical button, API client, auth guard, content registry, motion/feedback engine, DB migration history and provider interface. Review dependencies and avoid speculative abstractions. Keep local and remote metadata separate from private state. No production claims beyond measured capability.

Open decisions/blockers: final provider selection and data reuse rights; actual Supabase/Redis/backend quotas and cost; domain availability and ALCOR naming/trademark check before public launch; notification delivery channel; hosting region; exact skip completion preference; optional offline private storage security; verified watch order/streaming/chapter providers. Defaults proposed here are initial engineering values, not load-tested. The repository, application, migrations and API integration have not been created or executed in this planning task. No live credentials or server access needed to use this spec.

## 18. References

- Jikan shutdown: https://github.com/jikan-me/jikan-rest/issues/613 ; source: https://github.com/jikan-me/jikan-rest
- Tenrai: https://api.tenrai.org/documentation ; https://tenrai.org/ (candidate, beta)
- React: https://react.dev/ ; Vite: https://vite.dev/guide/ ; React Router: https://reactrouter.com/
- Tailwind: https://tailwindcss.com/docs/theme ; shadcn: https://ui.shadcn.com/ ; Lucide: https://lucide.dev/ ; Inter: https://rsms.me/inter/
- Motion: https://motion.dev/docs/react ; https://motion.dev/docs/react-accessibility
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- FastAPI: https://fastapi.tiangolo.com/tutorial/bigger-applications/ ; Pydantic: https://docs.pydantic.dev/ ; HTTPX: https://www.python-httpx.org/
- Supabase Google: https://supabase.com/docs/guides/auth/social-sign-in/auth-google ; PKCE: https://supabase.com/docs/guides/auth/sessions/pkce-flow ; JWT: https://supabase.com/docs/guides/auth/jwts ; DB: https://supabase.com/docs/guides/database/connecting-to-postgres ; RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- PostgreSQL: https://www.postgresql.org/docs/ ; SQLAlchemy: https://docs.sqlalchemy.org/en/20/ ; Alembic: https://alembic.sqlalchemy.org/ ; Redis: https://redis.io/docs/latest/ ; Dramatiq: https://dramatiq.io/
- OpenAPI types: https://openapi-ts.dev/introduction ; Import Linter: https://import-linter.readthedocs.io/ ; ESLint: https://eslint.org/docs/latest/rules/no-restricted-imports
- Cloudflare Pages: https://developers.cloudflare.com/pages/ ; Playwright: https://playwright.dev/ ; Vitest: https://vitest.dev/ ; Pytest: https://docs.pytest.org/ ; WCAG: https://www.w3.org/WAI/standards-guidelines/wcag/
- Design direction: https://vercel.com/ ; https://linear.app/ ; https://www.raycast.com/ ; https://resend.com/ ; https://tv.apple.com/ ; https://ui.shadcn.com/

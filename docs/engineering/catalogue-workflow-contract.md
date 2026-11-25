# Catalogue and account workflow changes — A26–A29

Authority: owner's 25 November request. Risk L2; existing authenticated ownership boundaries remain protected. Work proceeds serially on `fix/wishlist-readiness`, in focused commits. No dependency, migration, scoring or authentication-policy changes.

## A26 — Consistent saved state and completion

Read saved membership by verified canonical/provider identities, in batches of at most 100. Reads must not resolve/create metadata or spend the identity-write quota. Reuse the owned media-status endpoint with an additive AniList-ID filter and existing RLS. Buttons show confirmed current status across home, details and lists, use the current version when starting a planned title, and never move a completed title back to planned. Pending/error reads cannot be presented as confirmed absence. Existing changed-response-only animation remains intact.

Library management exposes completion with explicit confirmation. Active tracking sessions complete through the existing versioned tracking assertion endpoint; a planned title with no session uses the existing versioned library assertion. Neither path invents unit marks, dates or final coverage. Tests: cross-account lookup isolation, source identity matching, shared button state, write version, confirmation and preserved failure/no-op feedback.

## A27 — Custom multi-select filters

Reuse the installed accessible dropdown primitive. Genre, format, year, season and publication status support repeated URL values; sort remains single choice. Multi-select changes are collected locally while open and applied once on close, preserving fast consecutive choices and reducing source requests. Choices within format/year/season/status match any selected value; fields combine with AND. Genre uses the existing all/any contract. App-owned matching occurs before displayed-page construction, with bounded source scanning and cursor navigation where global totals are unknown. Never silently discard selections or invent totals. Existing advanced-filter and memory-search contracts remain; unsupported combinations must be explicit.

## A28 — Anime and manga browse shelves

Bare `/anime` and `/manga` become horizontal shelf pages: new releases, popular, top rated, upcoming anime/currently publishing manga, and preference-based discovery. Reuse explicit preference filters; weighted recommendation scoring remains deferred. Guests receive clearly labeled general discovery with a profile-setup invitation, not fabricated personalization. Each View all opens the full search/filter grid with matching parameters and pagination. Existing filtered anime/manga URLs remain functional. Search supports an explicit media type. Skeletons follow the shelf layout; no pagination on bare landing pages.

## A29 — Profile navigation

Home stays accessible for signed-in users. Dashboard moves from the primary navigation into a rounded account menu with profile, settings, wishlist, completed, library, collections, history, statistics and sign out. Guest sign-in and existing wishlist flight/count target remain. Menu must support keyboard, Escape, outside dismissal and focus restoration. No new account data or security policy.

## Verification and acceptance

Run relevant unit, real local PostgreSQL/Redis integration, lint/type/build and headless-browser workflow/layout checks. Inspect source and generated contract diffs. Preserve protected assertions while updating route expectations for the explicitly requested navigation changes. Record actual failures in the error log. Human visual/code acceptance and production release remain pending; automated fixtures do not establish live authenticated acceptance.

## A30 ? Resolver pacing regression

L2 follow-up to the existing A22 quota contract. A full browser run observed arrivals 2497ms apart despite the existing 2501ms scheduling floor. An independent delayed-preflight unit case reproduced compressed dispatches (2464ms). Anchor the unchanged floor after each response, preserving deduplication, account checks, one cooldown retry and all server thresholds. Verify that unit case and the unchanged browser arrival assertion; do not raise quotas or relax the test.

# Development handover

Updated: 25 November 2026, Asia/Calcutta. Review branch: `build/alcor-v1`.

## Implemented checkpoint

- Public AniList home, anime/manga browsing, stable centered search and modern provider-reference details work independently of the personal backend. AniZip now supplies separate episode display data after a valid title loads. Read scheduling, cancellation, deduplication and 429 cooldowns use a separate credential-free transport.
- Personal services have explicit PostgreSQL/Redis readiness. Saves do not queue or claim success while the server wakes up.
- Page-shaped skeletons cover public and account routes. Added numbered/custom pagination, compact discovery popup, condensed hover/touch synopsis, generated celestial logo and black footer with the supplied social links. Mobile/desktop alignment and reduced-motion behavior are supported.
- JWT/RLS-backed library/wishlist, exact tracking sessions and manual targets, collections, ratings/notes, private history/statistics, bounded undo, profile/preferences, owned saved filters and saved-note search are implemented.
- Local migrations 001-007 are applied. Namespaced provider references preserve existing MAL identities and personal history. No remote Supabase migration or data write occurred.

## Verification

Latest backend checkpoint: 40 Python tests passed with real local PostgreSQL/Redis, formatter/lint passed. Frontend: 54 unit/component tests, lint and production build passed. Public browser checks passed 25 tests, including API-off browsing, source errors, legacy episode retry, five widths and loading skeletons. Exact final evidence and any later rerun belong in acceptance-record.md.

Browser screenshots use explicit mocked AniList responses and deterministic test artwork; they are layout evidence, not live-provider completeness or licensing evidence. A bounded live AniList query succeeded; a separate AniZip mapping probe succeeded. TMDB authenticated integration was not exercised. Initial entry gzip is 207.71 KB; the existing uncompressed chunk-size warning remains.

## Next work

Follow product/MULTI_PROVIDER_METADATA_PLAN.md: settle provider-use/cache conditions, reconcile verified episode identities into tracking without changing old marks, then add optional TMDB enrichment and permitted shared caching. Public AniZip display is implemented; it deliberately does not assert complete release coverage or rewrite private tracking targets. AniList/AniZip/TMDB usage conditions, TMDB secret configuration and episode mapping references remain prerequisites for those respective stages.

The full roadmap remains incomplete. remaining-scope.md records unfinished organization/discovery, release monitoring, privacy/account deletion and operational work. Google configuration, import, export and personalized scoring remain deferred by the owner.

## Release state

No production deployment, default-branch merge or independent human acceptance is claimed. Provider clearance, staged critical flows, independent engineering/security/editorial review and operational release checks remain pending. The remote administrative database role must not become the API runtime identity. Do not commit credentials or replace missing production services with a development login bypass.

Local dependencies were running during verification; no shutdown is implied by this handover. The in-app browser host was unavailable earlier; automated browser tests and inspected screenshots provided the available UI evidence. Real OAuth and screen-reader validation remain pending.

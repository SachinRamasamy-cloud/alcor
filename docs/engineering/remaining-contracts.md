# Remaining Foundation contracts for owner review

25 November 2026; baseline 2a68599; branch finish-the-foundation. Owner explicitly approved REM-01 safeguards, REM-02 presentation and the local API reload in chat. These approvals apply to the concrete sections below; other proposals still require their own review. Existing F01-F07 approvals stand. No new dependency, remote migration, production polling/deployment or provider clearance is implied.

## REM-01: Authoritative completion invariant

Authority: remaining plan sections 5 and 19; D-SSBP section 8.2. Keep ordinary transition sets, exact mark/skip mathematics and historical evidence. Add a backend guard to existing paths; no new persisted status/table/endpoint.

- Use stored, server-verified catalogue metadata inside the existing locked transaction. Recognize finished, releasing and not-yet-released provider states; no browser metadata is trusted for writes and no upstream call occurs while holding locks.
- Explicit final completion of known releasing or unreleased titles returns 422 COMPLETION_UNAVAILABLE. Progress remains available. Existing ever_completed is never cleared by this guard.
- Ordinary library completion while an owned active session exists returns 409 COMPLETION_REQUIRES_SESSION. Use the existing session-completion route with captured session version, atomically closing the session/updating the library. An already completed same-state retry without an active session stays unchanged.
- Automatic completion additionally requires stored finished release state and existing complete/final coverage evidence. Unknown/contradictory release evidence never auto-completes; marks still commit and caught-up remains the existing summary concept. No new stale-age cutoff is invented. An explicit historical assertion for unknown state remains allowed under the existing policy, without marks or a claimed original viewing date. Known releasing/unreleased state remains blocking even if its snapshot is old; future freshness relaxation needs separate review.
- For the ordinary library route, remove completed from allowed_statuses when release state blocks it or an active session requires its versioned route. The transition table itself is unchanged. The separate completion control can still use a permitted active-session route. UI gives the safe unavailable explanation for known releasing/unreleased metadata; backend remains authoritative.
- Capture library then session locks consistently; recheck owned active state under locks. Preserve stale-write conflicts, repeats, deleted-history exclusion, marks, ratings and favourites. Existing outputs remain compatible; mapped error codes are additive. No unsupported completion Undo.
- Acceptance: reproduce ongoing manual completion and active-session bypass before repair on disposable local DB users; finished/unknown assertion, 8 released of 24 planned, repeat, stale/concurrent requests and no-op retry; original exact progress oracle retained. Run only focused affected tests, with one consolidated type/static check after integration, not repeated full builds.

## REM-02: Featured eligibility and additive presentation

Authority: remaining plan sections 6.2-6.4 and 19; locked existing typography/alignment/card geometry remain protected.

- Hero requires explicit FINISHED or RELEASING status, a nonempty title and synopsis, and a safe HTTPS cover from the existing approved image host set. No rating, popularity or recency threshold. Select first qualified personally eligible source candidate, omit if none qualifies. No genre/title-string inference or upcoming fallback.
- Keep the existing two hero action positions. For members, replace the existing Save action with a labelled Manage button opening the same CardActions dialog; guests keep the same Save/sign-in behavior. No extra button row or card action redesign.
- Preserve existing Home sections' relative order. Insert new favourites, You May Like, Trending Anime and Currently Airing sections after Continue queues and before Popular Anime; Upcoming follows Popular Manga. Missed Releases is added later after verified relations. Reuse existing shelf/card primitives. Keep Dashboard separate.
- Anime/Manga retain all existing general shelves in their present order. You May Like no longer substitutes for Trending; append independent favourites and preference shelves after the existing general shelves. Anime Currently Airing follows those; existing Manga publishing shelf remains. New details Similar/Related sections follow the existing details content, keeping current overview/tracker positions.
- A compact mode selector uses the existing SelectMenu primitive and existing heading/toolbar classes; explicit URL change does not save a preference silently. Exact source/feed filters survive View all. Personal sections load/error independently; no false personalized general fallback.
- Stable display duplicate priority: favourites, You May Like, then general shelves in current order. Hero remains independently displayed; continue/search/management/related context unaffected. Dedup uses verified identities only, within the existing three-window budget. Dedicated feeds do not inherit cross-shelf display-only omissions.

## REM-00: Local runtime reload

If the loopback API still exposes the old schema, request owner permission to reload only the verified workspace uvicorn process, preserving ignored identity settings and explicit loopback DB/Redis. Check health/ready/OpenAPI afterward. No remote service/migration, dependency install or deployment. A previous policy rejection is not authority to bypass tool controls.

Other new contracts (feeds/feedback/exposures/bulk/correction/mapping/jobs/deletion) will be frozen concretely before their dependent implementation. The four impression parameters and per-item bulk outcome decision are already approved and will not be asked again.

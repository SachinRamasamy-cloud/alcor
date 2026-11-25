# Provider-label and Similar-control cleanup

Task PROVIDER-UI-20261126; risk L2 presentation simplification. Authority: owner explicitly requests removing the Similar load button and AniList mentions except credits. Reuse the unchanged governing protocol read in this development session and approved catalogue/recommendation contracts. This supersedes earlier per-title provider-name presentation and in-place Similar continuation controls, without changing data provenance or provider permissions.

Scope: recommendation views/internal hook, visible/common copy, Home/details/card score labels, obsolete control styles and this record. Keep AniList attribution in footer credits and the Data sources credit page. Keep source URLs/identity/provenance, provider gates, source score values and retrieval behavior intact; use the neutral Community score label so scores remain distinct from personal ratings. Remove provider branding from hero/detail/card accessibility labels, recommendation reasons and other ordinary UI copy. Preserve source-record links and freshness without branded text.

Similar keeps its horizontal rail and every item in the existing first feed page (up to 24); View all remains the route to further context-bound pages. Remove the Load more control, in-place token/history state and its unused strings/style. No replacement automatic crawl, backend/API/schema/dependency change, user-data mutation or protected-test edit. Sticky sidebar and episode preview remain untouched.

Acceptance: source scan finds AniList-facing literal copy only in credits; no regular UI interpolates source.name. Similar has no load button or stale continuation observer, while cards/reasons/View all/history filtering remain. Execute focused static/diff checks only; no tests/build per owner. No computer interaction after the previous Escape. Human visual acceptance/release pending.

## Result and evidence

Removed the in-place Similar load control and its token/history observers, unused hook return, strings and style. The carousel retains its complete loaded first feed page and View all for existing exact-context pagination. Updated ordinary copy and all source.name renderings in Home, details and card accessibility labels; source score now reads Community score and Similar reason reads Similar to the source title. Footer and Data sources credits retain AniList attribution. Internal provider identifiers, score values, source-record links, metadata provenance and approval gates are unchanged.

Executed `npx tsc --noEmit --pretty false`, scoped ESLint for recommendation views/hook, media cards and public pages, plus `git diff --check`: passed. Source scan confirmed only the two credit areas retain user-facing AniList literals; remaining technical imports/IDs/URLs are internal integration references. No tests/build, private writes or browser interaction. Human visual acceptance/release pending.

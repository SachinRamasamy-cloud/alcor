# Details episode preview and Similar carousel

Task DETAIL-PREVIEW-20261126; risk L2 presentation/pagination. Authority: owner's current screenshot/request explicitly changes the details layout despite the earlier general UI lock. Governing protocol read; existing source and approved REM-03 bounded feed/eligibility inspected. Dependencies unchanged.

## Ready scope and behavior

Show an initial three rows of episode cards: six in the existing two-column layout, three in the existing single-column layout (1100px breakpoint). A noninteractive bottom fade and labelled Show more episodes button appear only where additional episodes exist. Expansion retains the existing 24-item episode pages and source order; Show fewer resets to the initial preview. Switching Episodes/Extras resets preview and page. Exact provider keys, source counts, metadata, spoiler controls and tracking are untouched.

Move Similar anime/manga directly below the episode/chapter section, before personal tracking. Reuse the existing horizontal BrowseShelf rail, card actions and View all. Similar displays every eligible item in its loaded feed pages rather than truncating to 12; explicit Load more adds existing context-bound continuation pages until actual exhaustion, with identity deduplication. Each request retains REM-03's source budget/queue and account/history/dismissal/strict-filter rules. No unbounded automatic source crawl or claim of exhaustive provider coverage. Reset accumulated pages on title/account/mode/preference/favourite context changes; cancelled/failed reads cannot become success or an empty result. Retain earlier pages through read-only cache observers so confirmed private publication can remove newly excluded titles from them too.

Allowed paths: episode-list.tsx, details markup, recommendation view/hook, common strings, scoped styles and this record/error log. Existing uncommitted recommendation cleanup is preserved, not reverted. No backend/API/schema/dependency changes, user-data mutation, protected-test edit or deployment.

## Acceptance and checks

Check initial preview/fade/button at wide and narrow layouts, expand/collapse, Episodes/Extras and long-list pagination; Similar placement, horizontal scrolling, all loaded items, explicit continuation, source errors/exhaustion and account/context resets. Existing card dimensions/navigation remain. Per owner's standing instruction, no test suite or build; use source/diff inspection and a focused static check, recording actual evidence and any live-validation limitation. Human acceptance/release remain pending.

## Implementation evidence

Implemented responsive episode preview/fade/expand/collapse while retaining the existing long-list pagination and Extras partition. Similar moved immediately beneath episodes/chapters, with all loaded results in the existing horizontal rail and explicit context-bound Load more. The loading control stays mounted while fetching and becomes disabled at source exhaustion, preserving keyboard focus.

Executed `npx tsc --noEmit --pretty false`, focused ESLint for episode-list/recommendation hooks/views/details and `git diff --check`: passed. No test suite or build. The current Chrome accessibility tree for Log Horizon showed exactly six preview episodes, Show more episodes, then Similar anime with 24 actual source-backed cards and Load more, followed by Your progress. Browser-host access was unavailable; native Chrome inspection recovered through Raise after missing geometry. The user stopped computer control with Escape before further interaction; no expansion/scroll/manual paging or narrow-screen visual verification is claimed. User subsequently confirmed the other changes are working and requested the sticky sidebar separately. No private mutation was performed. Human review and production release remain pending.

## Sticky sidebar follow-up

Owner's next screenshot/request explicitly authorizes keeping the left image/actions/facts visible during scroll; owner confirms the preceding episode/Similar changes work. Risk L1 layout-only. Reuse the current sidebar/grid: desktop sticky top 96px (80px navigation plus 16px clearance), constrained to its details grid so it stops before the footer. Limit sidebar height to the viewport minus top/bottom clearance and allow internal vertical scrolling when content is taller. Existing mobile flow below 768px stays unchanged. No tracking/feed/API change. Acceptance: inspect sticky/grid/overflow/header rules, CSS syntax and diff; no browser input after the user's Escape, no tests/build. Runtime visual acceptance of the new sticky behavior remains pending.

Sticky follow-up implemented with desktop-only CSS; the sidebar stays within the existing details grid and gets its own scrollbar only when taller than the available viewport. Mobile rules and content/actions are unchanged. Installed PostCSS syntax parse passed after correcting command quoting (E169); diff inspection and `git diff --check` passed. No tests/build or additional computer-use action. User visual acceptance of the sticky follow-up is pending.

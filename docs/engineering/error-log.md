# Error log

Actual incidents only. No credentials, tokens, personal notes or raw sensitive payloads. Dates use Asia/Calcutta. A resolved development failure does not imply production validation.

| ID / date | Symptom | Cause | Correction | Verification / status |
| --- | --- | --- | --- | --- |
| E001 / 2026-11-24 | `git status` and `git remote -v` failed in the workspace | Directory had no Git repository | Cloned the owner-specified remote into the empty workspace | `git status --short --branch` and log succeeded; resolved |
| E002 / 2026-11-24 | `gh auth status` command not found | GitHub CLI is not installed | Use ordinary Git for the authorized commit/push workflow | Remote read/clone succeeded; push authentication still to verify |
| E003 / 2026-11-24 | Docker named-pipe connection failed | Docker Desktop engine was not running | Started Docker Desktop; launched isolated ALCOR compose services | Both PostgreSQL and Redis passed compose health checks; resolved |
| E004 / 2026-11-24 | Combined specification output was truncated | Read budget smaller than combined output | Reread protocol and plans in bounded sections | Full governing protocol and both plans read; resolved |
| E005 / 2026-11-24 | Specification copy failed; whitespace check flagged README EOF | Destination directory was missing; initial shell sequence continued after non-terminating errors | Created directory, copied unchanged plans, removed blank EOF; use explicit exit checks before commits | Documentation rechecked before amending the unpublished documentation commit |
| E006 / 2026-11-24 | npm dev dependency resolution failed | Latest TypeScript 7 exceeded the supported peer ranges of contract generation and typescript-eslint | Selected TypeScript 5.9.3; no force/legacy peer override | Installation, typecheck and build passed; resolved |
| E007 / 2026-11-24 | Pytest could not import `app`; async fixture warning | Unpackaged module path and future fixture-loop default were unspecified | Declared pytest pythonpath and explicit function-scoped fixture loops | 2 foundation tests passed; resolved |
| E008 / 2026-11-24 | npm warned ESLint 9 is unsupported | Current peer ranges now support ESLint 10 | Checked peer metadata; upgraded ESLint and config package to supported 10 | Lint/build rerun before foundation commit |
| E009 / 2026-11-24 | Public UI lint failed on filter update and caught error | Side-effect ternary violated lint rule; wrapped network error lost its cause | Used explicit conditional and preserved `cause` without rendering raw exceptions | Rerun UI checks |
| E010 / 2026-11-24 | Contract export and generation were launched concurrently | Dependent checks were incorrectly grouped as independent work | Reran generation after completed API export; keep contract pipeline sequential | Generated types then typecheck/build |
| E011 / 2026-11-24 | In-app browser could not open local preview | Browser access host unavailable in this session | Continue executable browser tests; retain screenshots for visual review and report interactive-preview limitation | No interactive browser inspection claimed |
| E012 / 2026-11-24 | Browser test found focus lost after closing sign-in | A programmatically opened Radix dialog had no Trigger reference | Canonical Modal captures opener and restores focus when it still exists | Original Escape/focus assertion retained for rerun |
| E013 / 2026-11-24 | Axe reported insufficient genre-number contrast at multiple widths | #777 on white narrowly missed AA for small text | Use the darker shared muted color #626262 | Original zero-violation assertions retained for rerun |
| E014 / 2026-11-24 | Real PostgreSQL concurrent wishlist test hit a secondary unique constraint | Targeting only the catalogue primary key did not cover simultaneous conflicts on external identity | Handle all insert uniqueness conflicts, then explicitly verify the canonical identity; keep the original concurrent test | 3 integration tests and final 17-test suite passed; resolved |
| E015 / 2026-11-24 | Draft frontend auth patch was rejected | Patch attempted delete/add operations for the same file in one patch | No part of that patch was applied; frontend account work remains pending when owner requested stop | Existing unconfigured sign-in UI retained; documented in handover |

| E016 / 2026-11-25 | ESLint scan raced Playwright removing generated test-results | Generated browser output was not excluded from lint traversal | Excluded test-results/playwright-report; source test files remain checked | Lint and all 7 browser checks passed; resolved |

Final checkpoint: E006–E010 and E012–E014 were resolved by the recorded passing checks. E011 remains an environment limitation. E002 remains a missing optional CLI; ordinary Git push succeeded. No error or warning is evidence of production acceptance.


## 25 November follow-up

- E017: Vite warned that the initial uncompressed chunk exceeds 500 KB after adding the Auth SDK. Build succeeded at approximately 199 KB gzip (within the plan's 250 KB initial gzip budget). Warning retained; no limit raised. Production field measurements remain pending.
- E018: Source inspection found that an account-scoped request could acquire a different account's token while queued. Added expected-account validation before fetch and a regression proving no request is sent after an account switch. Verified in the 16-test frontend suite.

- E019: Browser regression reproduced a 503 episode fetch falling through to the missing-metadata branch, without contextual error or Retry. Added loading/error branches ahead of successful episode rendering. The original failing assertion is retained; verification recorded in acceptance evidence.

- E020: Tracking UI count test found question marks instead of separators. Windows shell piping replaced non-ASCII characters in generated copy. Corrected the registry using explicit Unicode escapes; the original text assertion is retained.
- E021: A test patch was rejected after its expected context had been reformatted. No files were changed; reread the formatted context and reapplied the bounded patch.

- E022: A documentation patch used stale context and was rejected without changing files. Reapplied the record at its actual location.
- E023: Collection UI typecheck exposed an omitted OpenAPI collection-list response model. Added the explicit CollectionList response, regenerated contracts sequentially and reran typecheck/build successfully; no hand-written substitute for generated types was introduced.

- E024: A per-unit query patch expected an outdated quoting style and was rejected without changing files. Used `rg` to locate the actual query, applied the bounded change and reran the database tests successfully.

- E025: Python lint flagged compressed test statements with semicolons. Applied the repository formatter before lint; no assertions changed.
- E026: Real database undo tests rejected SELECT FOR UPDATE on the append-only activity table, whose runtime role deliberately lacks UPDATE. Replaced that lock with a transaction-scoped advisory lock per user/action and a plain read; did not broaden database permissions. Original undo tests retained.
- E027: The first repair command used a root-relative path from the backend directory, so no patch was applied and tests repeated the original failure. Corrected the working directory and applied the diagnosed repair before rerunning.

- E028: A real PostgreSQL regression reproduced provider key `001` being normalized to `1`, causing a false invalid-target error. Preserve provider keys exactly; apply decimal aliases only as a fallback for explicitly manual targets. Original provider-key regression and decimal-manual tests now pass.

- E029: IANA timezone validation failed for Asia/Kolkata on Windows because the host lacked timezone data. Added CPython-maintained tzdata as a locked runtime dependency, following the official zoneinfo data-source guidance; original timezone tests passed.
- E030: A history error test reused a single Response body across both preference/history fetches, exhausting its stream. Updated the fixture to return a fresh HTTP response per call; original error/empty assertions retained and passed.
- E031: Final typecheck found an unsupported RTL `exact` option in a history test and an optional generated preference array. Used an anchored accessible-name matcher and a null-safe array fallback; no assertion was removed.

- E032: Discovery integration fixture attempted a transition on the same already-completed title used for exclusion testing. Used distinct source identities for the two cases; original exclusion/transition assertions retained. Full local suite: 33 passed.
- E033: Direct documentation opens returned HTTP 403 for AniList guide pages. Official indexed documentation supplied the terms and rate-limit evidence; no claim of successful direct-page retrieval.
- E034: Inspection attempted `catalogue/router.py`; this repository names the file `routes.py`. Read the actual route file; no source change or application failure.

- E035: A draft patch again attempted delete/add of one path in the same patch, which this editing tool rejects. No changes applied; used an in-place update. This repeats E015's tooling restriction.
- E036: Intermediate TypeScript checks found the new source/readiness copy keys before their registry entries existed. Added the central registry entries; subsequent typecheck/build passed.
- E037: A new integration test imported `SessionStart`; the existing contract is `StartSession`. Corrected the import and constructor; the full suite passed. Several inspection commands also used root-relative paths from `backend`/`frontend`, or assumed filenames that do not exist (`001_private_library.py`, `test_api.py`, `backend/.env.example`). Reread actual paths; no application files were lost or changed by those failed reads.
- E038: Readiness correctly failed because default Redis access through `localhost` timed out on this Windows host. A direct dependency probe isolated Redis, while PostgreSQL succeeded. Changed development defaults to explicit IPv4 loopback; the original live readiness test now passes and still verifies Redis loss returns 503. No production configuration or timeout was weakened.
- E039: Skeleton browser assertions expected generic Loading text while the registry still said Loading titles. Generalized the screen-reader copy for all page types; original skeleton/hidden-text assertions passed.
- E040: The cold-start browser test briefly matched two status regions (readiness plus a skeleton). Scoped the assertion to the readiness banner, preserving its expected text and behavior. All 17 browser tests subsequently passed.
- E041: AniZip root and documentation URLs were unavailable through web retrieval; direct API inspection returned 404 for `/` but 200 for `/mappings?anilist_id=1`. Record endpoint evidence only; no official quota or usage licence was inferred. TMDB markdown aliases were also unavailable; official HTML and indexed reference documentation provided the relevant evidence.

- E042: Pagination typecheck exposed a newly required `page` in two fixture/partial-page returns and repeated E031's unsupported RTL `exact` option. Supplied the actual page and anchored accessible-name matchers; original paging assertions retained. Build passed; no generated types were hand-edited.
- E043: Logo alpha inspection used integer dictionary keys unsupported by PowerShell JSON serialization. Repeated the read-only inspection with string keys; verified transparent pixels and a visible opaque mark. The generated asset was not modified.
- E044: An already-completed image-generation cell was polled again and returned cell-not-found. Used its completed output path; no image was lost and no generation was repeated.

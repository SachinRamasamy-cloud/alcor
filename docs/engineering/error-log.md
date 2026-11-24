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


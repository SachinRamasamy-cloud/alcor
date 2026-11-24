# Error log

Actual incidents only. No credentials, tokens, personal notes or raw sensitive payloads. Dates use Asia/Calcutta. A resolved development failure does not imply production validation.

| ID / date | Symptom | Cause | Correction | Verification / status |
| --- | --- | --- | --- | --- |
| E001 / 2026-11-24 | `git status` and `git remote -v` failed in the workspace | Directory had no Git repository | Cloned the owner-specified remote into the empty workspace | `git status --short --branch` and log succeeded; resolved |
| E002 / 2026-11-24 | `gh auth status` command not found | GitHub CLI is not installed | Use ordinary Git for the authorized commit/push workflow | Remote read/clone succeeded; push authentication still to verify |
| E003 / 2026-11-24 | Docker named-pipe connection failed | Docker Desktop engine was not running | Start the existing Docker Desktop engine, then rerun health check | Pending |
| E004 / 2026-11-24 | Combined specification output was truncated | Read budget smaller than combined output | Reread protocol and plans in bounded sections | Full governing protocol and both plans read; resolved |
| E005 / 2026-11-24 | Specification copy failed; whitespace check flagged README EOF | Destination directory was missing; initial shell sequence continued after non-terminating errors | Created directory, copied unchanged plans, removed blank EOF; use explicit exit checks before commits | Documentation rechecked before amending the unpublished documentation commit |


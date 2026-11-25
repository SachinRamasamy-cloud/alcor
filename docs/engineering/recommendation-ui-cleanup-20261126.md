# Recommendation UI cleanup

Task REC-UI-CLEANUP-20261126. Risk L2 (removing visible navigation controls). Authority: user's screenshot/request to remove recommendation helper text, Dismissed recommendations links and bottom Next favourites controls everywhere. Keep recommendation headings and cards. No tests/builds per standing user instruction.

## Ready contract and plan

Inspect the shared recommendation views, catalogue shelf, full recommendation page, content dictionary and callers. Remove generic recommendation shelf subtitles (favourites, taste and similar), the repeated dismissed-management link in shared shelves/full feed headings, and both bottom Next favourites buttons. Remove only the now-unused local seed-window switching state/imports, preserving the existing initial three-seed selection, feed filtering, actual recommendation reasons, feedback actions, direct dismissed-management route, View all and result pagination. Empty/error/loading states and provenance/failure limits remain truthful. No API/dependency/auth/scientific changes or protected-test edits. Update the empty seed message so it no longer instructs users to use a removed control.

Allowed paths: recommendations/views.tsx, catalogue/shelf.tsx, pages/recommendations.tsx, content/en/common.json and this record. The matching protocol copy has the same SHA-256 as the already-read persistent protocol. Reviewed relevant Foundation V1 recommendation/editorial contracts, the master plan context and catalogue/library guidance. Existing content/UX plan explicitly avoids generic subtitles below every section. Earlier tests expecting the removed links are superseded by this user-authorized presentation change; do not weaken them in this task.

Acceptance: Home, Anime/Manga, dashboard, title-detail Similar shelves and full recommendation headers have no removed subtitle/links/Next favourites controls; titles/cards/card reasons, View all, errors and standard pagination remain. Source/diff and `git diff --check` only. Runtime acceptance, human review and release pending.

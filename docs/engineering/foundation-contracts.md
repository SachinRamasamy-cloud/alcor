# Foundation V1 contracts awaiting owner review

25 November 2026. Baseline `e62debd`, branch `finish-the-foundation`.
The owner approved New to Me, reconciled favourites with durable removal,
per-item bulk outcomes, and the proposed impression parameters in chat.
Those approvals are recorded in F02. The following **additive interface
contracts** are proposed for the next two focused features; they have not
yet been implemented or approved. Existing UI/alignment remains locked.

## F04: Authoritative card actions and session labels

Risk L2 API behaviour; existing L4 ownership boundaries stay protected.

- Extend the existing `LibraryEntry` response with read-only
  `allowed_statuses: LibraryStatus[]` and nullable
  `active_session: {id, kind: initial | repeat, version}`.
- Derive allowed statuses from the exact existing backend transition
  table; do not change its transitions. Deleted entries expose no ordinary
  status actions. Completion/repeat/correction stay distinct workflows.
- Read active session context inside the same owned query/transaction,
  using the existing unique active-session index. No provider call or
  per-card session request is needed to render status labels.
- The UI offers only server-supplied ordinary transitions in the existing
  management dialog. Watching/Reading and Rewatching/Rereading derive
  from media type and actual session kind. No new persisted status enum.
- Keep existing version checks and backend transactional authority.
  Session completion still requires its captured session version.
- Existing clients may ignore the new response fields. Older responses
  lacking capabilities do not enable speculative transition controls.
- No new endpoint, database migration, dependency or production operation.
- Verify transitions against independent fixed expected sets, real
  PostgreSQL two-account/session isolation, repeat history, stale writes,
  generated contracts and existing browser/card geometry checks.

## F05: One effective favourites list

Risk L2 preference behaviour/L4 private ownership. Reuse existing
preferences JSON, catalogue identities and library favourite flag.

- Add nullable `favorite_media_ids: UUID[]` to preferences. `null` means
  legacy resolution: the union of setup favourite IDs and active library
  favourite flags. An explicit array, including an empty one, is the
  reconciled authoritative list. A bounded maximum of 1,000 IDs is proposed
  as an input-abuse limit, not a required user target.
- `GET /api/v1/me/favorites` returns a UUID-ordered, bounded cursor page
  of verified media plus the preferences version. No history/progress is
  created by a read or favourite action.
- `PUT /api/v1/me/favorites/{canonical_media_id}` accepts
  `{favorite: boolean, expected_preferences_version: integer >= 0}`.
  Return the current preferences version, effective membership and
  `changed`. A same-desired-state retry is a no-op; an actual stale change
  returns 409. Verify canonical metadata on the server.
- Under the existing account preference advisory lock, reconcile the
  legacy union on first mutation, apply the explicit choice, and retain
  the resulting authoritative list. Explicit removals cannot be restored
  by a stale setup list or old library flag.
- Existing personal-detail favourite writes update this list and the
  library flag transactionally. They increment the preferences version,
  making old setup/preference drafts conflict. Acquire preference lock
  before library row lock consistently across affected workflows.
- Setup changes apply only explicitly changed setup selections to the
  effective list and preserve favourites outside the questionnaire.
  Keep the fixed questionnaire and its existing ten-anime input limit.
- Older preference clients cannot clear the authoritative list by
  omitting the new field. New clients cannot bypass verified-ID, ownership
  or version checks by editing JSON directly.
- No new table, migration, subscription, provider switch, score or
  consumption assertion. Existing owned activity records provide the
  mutation trace. Public metadata caches remain public and unchanged.
- Verify legacy union/deduplication, empty authoritative list, removal
  through both paths, concurrent setup/detail edits, unrecorded favourites
  without watch history, exact read/write ownership and generated API.

Human code/security/visual acceptance and release remain pending for all
features. Provider clearance remains a separate gate. This record does not
approve unsupported completion undo or future metadata/job interfaces.

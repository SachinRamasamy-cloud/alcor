# ALCOR — Content, UX writing and editorial implementation plan

**Version:** 1.0 | **Date:** 24 November 2026 | **Companion:** `ALCOR_MASTER_IMPLEMENTATION_PLAN.md`

This is an independent workstream and a release gate. ALCOR should read like a professionally edited media website, not a generated marketing landing page or technical dashboard. No runtime AI-generated wording, invented anime facts, exaggerated claims or unreviewed placeholder content. All interface copy below is proposed editorial copy; human approval of rendered screens is required before production.

## 1. Editorial voice

- Neutral, concise, plain English; direct action labels; sentence case for headings and labels. ALCOR always uppercase. Use “anime” as mass noun when appropriate, “titles” for counts. Use Inter; no decorative text or emojis in UI. No exclamation marks unless a title itself contains one.
- Remove unnecessary headings/subheadings, sales slogans and repetitive explanatory text. Do not write generic descriptions below every section. A title's actual synopsis and artwork are the main content. Guest users can browse freely; explain sign-in only for personal actions. Never nag after dismissal.
- Use exact status, action and outcome. “Added to wishlist.” only after commit. Never say “All episodes watched” if skips exist. Unknown means unknown, not zero. Do not imply exhaustive search or live updates unless supported.
- Error message: what happened + what user can do, only facts known. No internal code, stack trace, JWT, SQL or provider implementation details. Technical request ID can be shown in support details on demand. ALCOR is not a streaming website: “View details” rather than “Watch now” unless actual verified external playback destination exists.
- Avoid: unlock, unleash, elevate, seamless, immersive, ultimate, revolutionary, curated for your unique journey, dive into a world of, powerful intelligence, magic, handpicked by AI, “Oops!”, “Hooray!”, “Sit tight”. Avoid invented popularity, match percentages or user stats. Do not label source popularity as trending without time-based evidence.

| Avoid | Approved alternative |
|---|---|
| Unlock endless anime possibilities | Browse anime |
| Your ultimate anime companion | My library |
| Embark on a new journey | Discover anime |
| Experience seamless tracking | Track your progress |
| Our AI has handpicked these titles | Recommended for you |
| Elevate your anime experience | Find something to watch |
| Oops! Something went wrong | Couldn't load anime. |
| Hooray! You completed your journey | Marked as completed. |
| Sit tight, magic is happening | Loading anime… |
| Proceed / Execute | Save changes / Apply filters |
| Watch now (no actual video destination) | View details |

## 2. Approved vocabulary and state mapping

| Concept | Display label / rule |
|---|---|
| Private collection of tracked titles | My library |
| Planned title | Wishlist; Plan to watch / Plan to read in status selector |
| Active anime/manga | Watching / Reading |
| Finished personal title | Completed (title status); Watched / Read (individual progress) |
| Paused | On hold |
| Discontinued | Dropped |
| Active repeat session | Rewatching / Rereading |
| No recorded history | Not started / Not in your library; not proof of never watched |
| All currently released episodes resolved, ongoing | Caught up |
| Future release | Waiting for next episode / Next episode not announced |
| Skipped item | Skipped; never counted as watched |
| Exclusion | Not interested |
| Official anime status | Currently airing / Finished airing / Upcoming |
| Official manga status | Publishing / Finished publishing / On hiatus (if source supports) |
| Missing info | Not available; Not rated; Not announced only when appropriate |
| Personal rating | Your rating |
| Source rating | MyAnimeList score (if MAL source); other source explicitly labeled |
| Discovery mode | Show all / Hide watched / New to me |
| Filter metadata | Genres / Themes / Format / Release year / Season / Studio |
| Franchise | Related titles / Unwatched sequels; Watch order only if verified |

Example display: “Airing status: Finished airing” and “Your status: Watching” with “8 of 24 episodes watched”. Do not use a single ambiguous Completed chip for publication and personal status. Show “9 watched · 1 skipped · 2 remaining” rather than “10 watched”. For a historical completed title without exact progress use “Completed · Episode history not recorded”.

## 3. Page copy and content hierarchy

| Page/section | Heading | Supporting text or rule |
|---|---|---|
| Navbar | ALCOR, Home, Anime, Manga, Discover, My library, Wishlist | Search, Notifications, Sign in, Profile have accessible labels |
| Home hero | Featured anime | Actual title and source synopsis/approved summary; View details |
| Home public | Popular anime; Currently airing; This season; Upcoming anime; Browse by genre; Popular manga; Hidden gems | No redundant copy; Hidden gems may say “Highly rated, less popular titles.” |
| Home signed-in | Continue watching; Continue reading; Recommended for you; Unwatched sequels | “Based on your library” only where true |
| Anime | Browse anime | Filters, title grid, count only if known |
| Manga | Browse manga | Category filters and title grid |
| Discover | Discover | Show all / Hide watched / New to me; saved filters; hidden gems |
| Search | Search results | Search anime and manga; “Results for {query}” (escaped) |
| Details | Actual title | Alternate title, metadata, synopsis, Episodes/Chapters, Characters, Staff, Related titles, Similar titles |
| Episode tracking | Episodes | Watched/Skipped/Unwatched; Mark episode {number} watched; Mark up to episode {number}; Next unwatched episode |
| Chapter tracking | Chapters | Mark chapter {label} as read; Total chapters unknown if appropriate |
| Library | My library | “Manage your watching and reading history.” optional; status tabs |
| Wishlist | Wishlist | Sort, priority, Remove from wishlist |
| Franchise | Actual franchise name | “{done} of {known} listed titles completed” if coverage partial |
| Collections | Collections | New collection; Add to collection; Rename collection |
| Calendar | Release calendar | Local time zone; dates/times clearly estimated/confirmed |
| History | Watch and reading history | Date filters, activity, correction where supported |
| Statistics | Your statistics | Known counts; “Estimated watch time”; source of estimate |
| Notifications | Notifications | Mark as read; Mark all as read; Notification preferences |
| Profile | Profile | Personal account, private by default |
| Settings | Settings | Discovery preferences, notifications, motion, privacy, import/export |
| Imports | Import library | Choose a file or paste titles; Review matches; Import selected titles |
| Export | Export library | JSON complete archive, CSV summary; explain differences |
| Auth | Sign in / Save to your wishlist / Track your progress | Context-specific reason; Continue with Google; Cancel |
| Legal/status/help | Privacy; Terms; Data sources; Help; Service status | Human-reviewed factual content; no unsupported legal guarantees |

Do not show dashboard KPI cards on the home page. No promotional text when guest opens a title. Show recommendations only when enough evidence; otherwise show general titles without personalization claim. Only present cards as popular/top rated if data source supports that label. Use actual media titles without changing capitalization/spelling arbitrarily.

## 4. Buttons, controls and tooltips

Approved labels: View details, View all, Browse anime, Browse manga, Search anime and manga, Apply filters, Reset filters, Save filters, Add to wishlist, Remove from wishlist, Add to library, Mark as watched, Mark as completed, Start watching, Start reading, Mark episode as watched, Mark chapter as read, Skip episode, Unmark episode, Mark all episodes watched, Mark up to episode {number}, Update progress, Start rewatch, Start reread, Add to collection, Remove from collection, Follow franchise, Unfollow, Mark as read, Import library, Review matches, Confirm import, Export library, Save changes, Continue with Google, Sign out, Retry, Undo, Cancel, Dismiss, Delete account.

Use “Continue tracking” or “View progress”, not “Play” if there is no playback. For next episode button show “Mark episode {number} watched”. Icon-only buttons require accessible names, e.g. “Add {title} to wishlist”, “Remove {title} from wishlist”, “Mark episode {number} as watched”, “Open filters”, “Close menu”, “Show notifications”. Tooltips short and only when useful, not substitute for labels. Primary buttons black white text, secondary white with grey border, active states text/checkmark not colour alone. Standard Lucide icons: bookmark, check/check-check, search, sliders-horizontal, bell, circle-user-round, calendar-days, book-open, history, settings, triangle-alert, wifi-off, x, chevron-down. Use official Google button branding (exception to monochrome). Never invent visual cues that imply unavailable functionality.

## 5. Success, failure, loading, empty and warning catalogue

All values below are approved draft patterns. Dynamic placeholders use named parameters, safe rendering and locale pluralization. Success only after acknowledged durable save; uncertain outcome uses neutral verification copy. Avoid error duplicates; Undo only when the backend supports version-aware undo.

| Key | Text |
|---|---|
| wishlist.added | Added to wishlist. |
| wishlist.removed | Removed from wishlist. |
| library.added | Added to your library. |
| library.completed | Marked as completed. |
| library.removed | Removed from your library. |
| episode.watched | Episode {number} marked as watched. |
| episode.skipped | Episode {number} skipped. |
| episode.unmarked | Episode {number} marked as unwatched. |
| chapter.read | Chapter {label} marked as read. |
| progress.saved | Progress saved. |
| progress.bulk_saved | {count, plural, one {# episode updated.} other {# episodes updated.}} |
| rating.saved | Rating saved. |
| note.saved | Notes saved. |
| collection.created | Collection created. |
| preferences.saved | Preferences saved. |
| imports.completed | Library imported. |
| imports.partial | Some titles couldn't be imported. Review the results. |
| export.ready | Your library export is ready. |
| undo.completed | Change undone. |
| auth.required_wishlist | Sign in to save this title and access your wishlist on any device. |
| auth.required_progress | Sign in to save your progress. |
| auth.required_library | Sign in to manage your library. |
| auth.guest_hint | You can browse without signing in. |
| auth.cancelled | Sign-in canceled. |
| auth.expired | Your session has expired. Sign in again. |
| errors.search_failed | Couldn't load search results. |
| errors.details_failed | Couldn't load anime details. |
| errors.manga_failed | Couldn't load manga details. |
| errors.episodes_failed | Episode information is unavailable. |
| errors.wishlist_failed | Couldn't save to wishlist. Try again. |
| errors.progress_failed | Couldn't save progress. Try again. |
| errors.progress_unchanged | Your previous progress is unchanged. (Only if verified.) |
| errors.save_uncertain | Checking whether your changes were saved. |
| errors.save_unverified | Couldn't confirm the save. Refresh to check your progress. |
| errors.conflict | Your progress changed on another device. Review the latest progress and try again. |
| errors.permission | You don't have access to this item. |
| errors.rate_limited | Too many requests. Try again in {seconds} seconds. |
| errors.rate_limited_unknown | Too many requests. Try again in a moment. |
| errors.service_unavailable | The service is temporarily unavailable. |
| errors.import_invalid | This file format isn't supported. |
| errors.import_size | This file is too large. Choose a smaller file. |
| errors.import_duplicates | Some titles are already in your library. |
| errors.import_ambiguous | Some titles have more than one match. Review them before importing. |
| errors.undo_conflict | Couldn't undo this change because the item has been updated. |
| errors.not_found | This title isn't available. |
| warnings.catalogue_delayed.title | Catalogue updates delayed |
| warnings.catalogue_delayed.body | Some title information may be out of date. |
| warnings.library_available | Your library is still available. (Only if confirmed.) |
| warnings.library_unavailable | Library updates are temporarily unavailable. |
| warnings.offline.title | You're offline |
| warnings.offline.body | Reconnect to update your library. |
| warnings.partial_results | Some results could not be loaded. Try again or adjust your filters. |
| warnings.local_coverage | Results are limited to available catalogue data. |
| warnings.maintenance.title | Scheduled maintenance |
| warnings.maintenance.body | Library updates will be unavailable from {start} to {end} {timezone}. (Only for verified schedule.) |
| warnings.stale | Last updated {date}. |
| loading.anime | Loading anime… |
| loading.results | Loading results… |
| loading.progress | Loading progress… |
| loading.import | Importing selected titles… |
| loading.save | Saving… |
| loading.export | Preparing export… |

### Empty states (only after a successful empty response)

| State | Heading | Description / action |
|---|---|---|
| Wishlist | Your wishlist is empty | Save titles to find them here later. / Browse titles |
| Library | Your library is empty | Add titles or import your watching history. / Import library |
| Search | No matching titles | Try another title or adjust your filters. / Reset filters |
| Hidden watched | No matching unwatched titles | Try different filters or show all titles. / Show all |
| Continue watching | Nothing to continue | Start tracking an anime to see your next episode here. / Browse anime |
| Caught up | You're caught up | No released episodes are waiting to be watched. (Only if release coverage reliable.) |
| Collections | No collections yet | Create a collection to group titles. / New collection |
| Notifications | No notifications | New release alerts will appear here if enabled. |
| History | No recorded activity | Your watching and reading activity will appear here. |
| Recommendations | Not enough library information | Rate or add titles to improve recommendations. / Browse anime |
| Episodes missing | Episode information unavailable | You can still track episodes manually. / Add episode (if supported) |
| Chapters missing | Chapter information unavailable | Track your reading progress manually. / Add chapter (if supported) |

Never show “No matching titles” on an upstream timeout. Display error or partial results instead. If there is no action applicable, do not invent a CTA. Do not show every empty state on the homepage; omit unused optional sections.

### Confirmations and destructive actions

| Action | Title | Body | Primary button |
|---|---|---|---|
| Remove wishlist | Remove from wishlist? | {title} will be removed from your wishlist. | Remove |
| Reset active session | Reset progress? | This resets the current session. Previous sessions remain in your history. | Reset progress |
| Complete entire title | Mark as completed? | Record this title as completed. You can also mark all known episodes as watched. | Mark as completed |
| Delete library entry | Remove from library? | Explain actual effect on progress/history and recovery before confirmation. | Remove from library |
| Delete collection | Delete collection? | Titles in this collection will remain in your library. | Delete collection |
| Import overwrite | Replace existing progress? | Show affected titles and fields; preserve by default. | Replace selected progress |
| Account deletion | Delete your account? | Explain which data will be deleted, export option and verified retention/recovery policy. | Delete account |

Do not force confirmation for every reversible wishlist change; use Undo if safe. Require explicit confirmation for destructive/reset/delete operations. Final copy for account deletion must match implemented retention and backup policy; no fabricated permanence timing.

## 6. Metadata and recommendation editorial rules

Source-provided fields or independently verified approved summaries only. Anime/manga titles, aliases, official format, genre/theme, score, studio, staff, release dates, episode totals and chapter counts come from provider/verified correction. Store source, source ID, retrieval timestamp and date precision. Do not conflate source score and personal score. Unknown rating -> “Not rated”; unknown count -> “Episode count not available” / “Total chapters unknown”; missing date -> “Release date not announced” only when the source indicates not announced, else “Release date not available”; absent synopsis -> “Synopsis not available”; absent image -> neutral placeholder and accessible label. If future date estimate, explicitly label “Expected”. Source-provided content rendered as text, not unsafe HTML. Verify media rights before redistributing artwork/synopses and honor attribution. User notes never turned into public content.

Recommendation text must be deterministic and traceable: “Matches your {genre} preferences.”, “Similar to {title} in your library.”, “An unwatched sequel to {title}.”, “Highly rated titles with fewer popularity votes.” (only if metrics support it). Do not show generated explanations, “98% match”, invented confidence or claims that watching frequency means liking. Show “Popular anime” for cold start. Watch order not inferred from every relation; label “Release order” vs “Watch order” based on provenance. If provider lacks legal streaming data, “Visit official platform” link may be shown without claiming title availability in user's region. No unauthorized streams. Spoiler controls hide synopsis/episode title details by preference; do not promise full spoiler detection.

## 7. Central content architecture and developer contract

```text
frontend/src/
├── content/en/
│   ├── common.json
│   ├── navigation.json
│   ├── home.json
│   ├── anime.json
│   ├── manga.json
│   ├── discovery.json
│   ├── search.json
│   ├── library.json
│   ├── wishlist.json
│   ├── episodes.json
│   ├── chapters.json
│   ├── franchises.json
│   ├── collections.json
│   ├── releases.json
│   ├── notifications.json
│   ├── authentication.json
│   ├── imports.json
│   ├── exports.json
│   ├── history.json
│   ├── statistics.json
│   ├── warnings.json
│   ├── errors.json
│   ├── confirmations.json
│   ├── empty-states.json
│   ├── accessibility.json
│   └── settings.json
└── shared/content/
    ├── registry.ts
    ├── schema.ts
    ├── formatting.ts
    └── index.ts
```

Use typed message keys with explicit parameters and ICU-compatible plural formatting (or equivalent proven locale formatter). All common UI copy, accessibility labels, errors, toasts, confirm dialogs and warnings retrieved from registry; metadata and user input remain data, not translation keys. API error codes map to message keys centrally; unrecognized errors map to neutral fallback, optional request ID in support UI. No raw backend exception messages. Allow locale files and UTC-to-user timezone formatting; initial language English. Registry loaded efficiently, feature bundles may lazily load dictionaries later. No hardcoded strings in feature JSX except technical values/test fixtures and proper data titles. Use schema checks for duplicate/missing keys, placeholder parity, plural forms and fallback. Use one approved terminology table, one central copy catalogue; no duplicate independent copy sources. Store editorial docs in `docs/content/` and maintain revision history.

Example JSON (illustrative contract, not runtime-tested):

```json
{
  "wishlist": {
    "add": "Add to wishlist",
    "remove": "Remove from wishlist",
    "added": "Added to wishlist.",
    "removed": "Removed from wishlist.",
    "saveFailed": "Couldn't save to wishlist. Try again."
  },
  "episodes": {
    "markWatched": "Mark episode {number} watched",
    "watched": "Episode {number} marked as watched."
  }
}
```

## 8. Editorial workflow and acceptance gates

1. Inventory page routes, UI elements, states and accessibility labels before building. Record source and capability for factual metadata.
2. Draft only necessary text. Define canonical vocabulary and exact behavior. Use approved content registry keys and avoid new variants unless justified.
3. Review copy independently of code: remove AI-sounding phrases, redundancy, false outcomes and technical jargon; verify factual statements and provenance.
4. Implement with actual state/API contracts. Test loading, empty, partial, stale, errors, authorization, success and uncertain-save states.
5. Inspect rendered desktop and 320/375/768/1024/1440px screens, long English/Japanese titles, wrapping, ellipsis, dialog actions and screen reader names. Test plural 0/1/many, chapter decimal, time zone and unknown fields. Check contrast and black/white design consistency.
6. Editorial sign-off before merge: no placeholder/lorem ipsum, invented data, false release/streaming claim, inconsistent terminology, unnecessary tagline, forced sign-in text, unresolved message key, misleading completion counts or raw errors.
7. Maintenance: any new feature must include new or reused copy keys, reviewed source rights, before/after screenshots where relevant, and updated style guide if vocabulary changes. Monitor support feedback for unclear wording. Global announcements human-reviewed with actual start/end times; expire on schedule.

## 9. Editorial QA test scenarios

| Scenario | Expected copy behavior |
|---|---|
| Guest opens anime | No login requirement or intrusive prompt |
| Guest saves wishlist | Context-specific sign-in message |
| Mutation fails | No success toast or animation; accurate retry copy |
| Mutation timeout | No false claim of unchanged state; reconcile first |
| 9 watched, 1 skipped, 2 missing | Counts distinct; next missing episode correctly named |
| Historical title completed only | No fabricated episode/date records |
| Airing title caught up | Caught up, not Completed |
| API failure | Error/stale notice, not no results |
| API returns unknown score | Not rated, not 0/10 |
| Missing chapter data | Manual tracking available only if implemented |
| Upcoming date unconfirmed | Estimated or unavailable, no invented date |
| Recommendation unsupported | Generic discovery instead of personalized claim |
| 429 with Retry-After | Actual remaining retry interval; no auto spam |
| Two-account conflict | Clear latest-state/review instruction |
| Long title/mobile | No broken layout; accessible full title |
| Reduced motion | Text and status feedback still complete |
| Account deletion | Wording matches tested deletion and retention policy |

## 10. Decisions and references

All copy is proposed for human editorial approval. The application has not been implemented or reviewed in rendered production screens. Provider metadata rights and coverage remain conditional, so content cannot be certified for public redistribution yet. English-only launch is proposed; future languages are supported by architecture, not delivered here. No runtime LLM or generated marketing copy.

References: https://www.w3.org/WAI/standards-guidelines/wcag/ ; https://motion.dev/docs/react-accessibility ; https://ui.shadcn.com/ ; https://vercel.com/ ; https://linear.app/ ; https://www.raycast.com/ ; https://resend.com/ ; https://api.tenrai.org/documentation ; https://rsms.me/inter/ .

# Browse, search and your library

## Finding titles

- **Anime / Manga:** five horizontal shelves. New releases, most popular, top rated and upcoming anime/currently publishing manga are public. Trending is replaced by **You may like** when your explicit profile choices are available.
- **Search:** the full filterable grid. Choose All titles, Anime or Manga. Each shelf's **View all** opens this grid with the matching filters and pagination.
- Previous filtered anime/manga links still work. Bare anime/manga pages have no pagination.

## Filtering

Genre, format, year, season and publication status accept multiple choices. Sort has one value. Different fields combine with AND; format/year/season/status accept any selected value. The advanced genre all/any choice remains available. Filters applied by ALCOR use bounded cursor pages, so an unknown global total is not shown as an exact count.

Saved presets and saved-note search currently support a single format/year/season/status; unsupported combinations are explained rather than silently reduced to one choice. Public filters keep working while personal services start.

## Saved state and completion

Bookmark buttons read your current saved status. A title already planned shows **In wishlist**; titles started or completed show their actual library state. Reads batch visible identities and do not create catalogue records. If a status read fails, **Retry saved status** refreshes it before another write.

Open **My library**, select the title's corner management icon, and choose **Mark as completed**. Confirm the assertion. An active session is finished through the existing tracking workflow; this does not manufacture episode/chapter marks or viewing dates. Version conflicts require reviewing refreshed state.

## Account menu

The rounded profile button opens Dashboard, Profile, Settings, My library, Wishlist, Completed, Collections, History, Statistics and Sign out. Home remains in the main navigation. Guests retain Sign in. Popup menus support keyboard navigation, Escape and outside dismissal.

Implementation and verification records: [task contracts](../engineering/catalogue-workflow-contract.md), [acceptance evidence](../engineering/acceptance-record.md), [error log](../engineering/error-log.md).

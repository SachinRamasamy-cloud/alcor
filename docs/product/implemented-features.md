# Implemented features

This record describes actual source behavior. The master plan remains the roadmap; this table does not turn pending release gates into completed work.

| Area | Implemented | Limitations |
| --- | --- | --- |
| Public website | Home, anime/manga browsing, universal title/alias search, genre/format/sort filters, details and attribution, public trust pages, not-found page | Finite 18-title development snapshot; source rights and production provider not approved |
| Navigation | Sticky top navigation, mobile disclosure menu, library/wishlist access, search, footer | Unsupported notifications/calendar controls are omitted |
| Catalogue API | Normalized UUID identities, separate anime/manga namespaces, bounded cursor pagination, source timestamp, explicit partial coverage | No remote production adapter; no exhaustive catalogue or live trending claims |
| Personal access | Guest personal actions open contextual sign-in dialog; public browsing stays available | Auth configuration and persistent personal workflows implemented in subsequent slices |
| Private API checkpoint | JWT validation, PostgreSQL RLS and restricted role, persistent library/wishlist, version checks, activity events and shared Redis limits | Backend verified locally; personal frontend, OAuth callback/resume and production security review remain pending |
| Interface | Monochrome Inter tokens, original source artwork, responsive grids, shared buttons/dialogs/errors, Motion with reduced-motion preference | No persistent decorative animation; success-only account effects require account implementation |
| Content | Typed central English registry, named parameters, plural/unknown-count formatting, mapped API errors | Human rendered editorial sign-off pending |

## Public slice acceptance

Guest browse/search/details and URL reload tested. A failed provider response renders an error, never an empty result. Wishlist invocation performs no unauthenticated write. Closing the dialog restores opener focus. Automated accessibility and overflow checks passed at 320, 375, 768, 1024 and 1440 pixels with reduced motion. Source metadata is development-only and explicitly labelled throughout.

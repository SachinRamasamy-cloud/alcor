# Interface and content

The supplied monochrome design is authoritative: white background, #171717 text, #F5F5F5 surfaces, #E5E5E5 borders and black primary actions. Small muted text uses #626262 to preserve contrast. Inter is self-hosted from the pinned font package; source cover artwork retains its original colors.

Navigation is horizontal, with a collapsible top menu on smaller screens. Filters sit above grids and open in a mobile dialog. Detail pages are dedicated routes. Poster space reserves a 2:3 ratio; images load lazily except the featured/detail poster. Grids use 2 columns below 640px, 3 from 640px, 4 from 768px and 6 from 1280px. A full 24-title catalogue page fills those rows; shorter source pages keep their actual count. There is no persistent sidebar.

Media cards have bordered frames, two-line title space, format/year, available episode or chapter counts and up to two source genres. On screens at least 768px wide with a fine hover pointer, details/save actions appear over the poster on hover or keyboard focus; no bottom action row is reserved. Smaller screens and touch devices retain visible bottom actions with 44px save targets. Hover/focus feedback requires no extra metadata request. Failed artwork displays a labelled fallback; missing scores do not produce an empty rating badge. Card skeletons use the same layout rules.

Below 768px, the homepage's popular anime and manga sections use native horizontal scrolling with snap alignment and a next-card preview. Labelled scroll regions support keyboard focus and arrow-key scrolling; card links remain reachable in order. Loading shelves keep the same horizontal shape. There is no autoplay. Catalogue, search and account grids retain their existing columns and pagination.

`shared/ui` owns canonical Button, Modal, loading and error states. Modal focus is captured/restored for programmatic triggers. `shared/feedback` owns offline and polite toast feedback. `MotionConfig` respects the device reduced-motion preference; transforms are limited to brief entry/press/hover feedback. No unpausable movement is introduced.

`content/en/common.json` owns interface copy. `shared/content` supplies typed keys, named interpolation, locale-aware counts and dates. Metadata and user values remain plain data. Errors map centrally from stable codes; raw provider/server exception text is never displayed.

All copy follows the owner's editorial plan. Production editorial review and manual screen-reader validation remain pending even when automated accessibility checks pass.

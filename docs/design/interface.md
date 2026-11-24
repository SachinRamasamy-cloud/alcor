# Interface and content

The supplied monochrome design is authoritative: white background, #171717 text, #F5F5F5 surfaces, #E5E5E5 borders and black primary actions. Small muted text uses #626262 to preserve contrast. Inter is self-hosted from the pinned font package; source cover artwork retains its original colors.

Navigation is horizontal, with a collapsible top menu on smaller screens. Filters sit above grids and open in a mobile dialog. Detail pages are dedicated routes. Poster space reserves a 2:3 ratio; images load lazily except the featured/detail poster. Layout uses 2/3/4/5/6 columns according to available width. There is no persistent sidebar.

`shared/ui` owns canonical Button, Modal, loading and error states. Modal focus is captured/restored for programmatic triggers. `shared/feedback` owns offline and polite toast feedback. `MotionConfig` respects the device reduced-motion preference; transforms are limited to brief entry/press/hover feedback. No unpausable movement is introduced.

`content/en/common.json` owns interface copy. `shared/content` supplies typed keys, named interpolation, locale-aware counts and dates. Metadata and user values remain plain data. Errors map centrally from stable codes; raw provider/server exception text is never displayed.

All copy follows the owner's editorial plan. Production editorial review and manual screen-reader validation remain pending even when automated accessibility checks pass.

# Footer star background

FOOTER-STARS-20261126; risk L1 cosmetic CSS. Owner requests the hero's dot/star effect in the footer. Reuse the same decorative pseudo-element background and establish an isolated footer stacking context so it remains behind text and links. Preserve footer layout, logo, copy, credits, navigation and static reduced-motion-friendly behavior. No new assets, dependencies, requests, animations or application logic. The unchanged protocol was read in this session and its L1 scope guidance reconsulted.

Plan/acceptance: inspect existing hero/footer styles, share their star background rule, parse CSS and inspect the diff. Verify public footer rendering at desktop/mobile widths if available. No tests or build under the owner's standing instruction. Human visual acceptance and release remain pending.

Implemented one shared hero/footer decorative gradient rule and an isolated footer positioning context. The layer is static, behind content and pointer-events:none. Installed PostCSS CSS parse and `git diff --check` passed. Isolated headless rendering of the existing public About page at 1280px and 390px confirmed the five shared gradient layers, all 24 footer links and no horizontal overflow. Inspected the desktop footer screenshot for text contrast and placement. Only local frontend assets were loaded; API/external requests were blocked. No test suite/build, application logic, dependency or provider change. Owner acceptance/release pending.

## Four-point star correction

Owner clarifies that the previous effect does not look like stars. L1 cosmetic correction: replace the circular points in the shared hero/footer background with a local SVG of recognisable curved four-point sparkles matching the existing mark's shape, at several visible sizes/opacities. This supersedes the previous no-new-asset detail; the asset is decorative code-native vector artwork, not a new dependency or external source. Retain the subtle glow, static behavior, layering and pointer transparency. Scope: shared CSS rule, local brand SVG and evidence/error record. Parse CSS/SVG and inspect the actual public rendering; no tests/builds.

Implemented /brand/stars.svg with a reusable curved four-point star path and 14 varied-size sparkle placements. Both backgrounds share the same tiled SVG and original soft glow. CSS parsing, SVG XML parsing and `git diff --check` passed. Isolated public-page rendering confirmed the asset loaded in both computed backgrounds, 1280px document/viewport widths matched, and screenshots of both hero and footer visibly show four-point stars. API/external traffic was blocked for inspection, so the hero's source-error state in that screenshot is deliberate and not a live service diagnosis. No tests/builds or runtime configuration changes. Owner visual acceptance/release pending.

## Subtle point sizing

Owner now requests much smaller particles that read as dots rather than prominent stars. L1 styling adjustment: keep the existing four-point vector path and varied placements, shrink every use instance and lower opacity so the shared hero/footer field reads as tiny, subdued points. Preserve all layout, copy, links, static behavior and data policies. This explicitly supersedes the prior prominent-star appearance. Acceptance: inspect SVG changes, parse the vector and visually check the shared background; no tests/builds.

Reduced every particle to 22% of its previous size (about 1.8-3.7 CSS pixels) and 60% of its previous opacity (19-30%). SVG XML parsing and `git diff --check` passed. Inspected the rendered public footer screenshot: particles now read as faint points; the hero uses the same asset. API/external requests were blocked during inspection. No tests/builds; owner acceptance pending.

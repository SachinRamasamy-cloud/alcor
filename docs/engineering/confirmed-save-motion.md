# Confirmed-save feedback

Authority: master plan §5.2 and the owner's 25 November 2026 request. Implementation uses the installed Motion package; no CSS keyframe engine or dependency was added.

## Save sequence

1. Capture the clicked control and its cover element in memory. No write or success feedback occurs yet.
2. Resolve identity and perform the existing authenticated, versioned mutation.
3. A changed response for the same account triggers the success toast and generic fly-to-target signal. Failed, no-op, removed and stale-account responses do not trigger add feedback.
4. A loaded cover flies toward the registered header target for 600ms. The source button and arriving target pulse for 180ms; a temporary +1 appears for 1200ms.
5. Existing query invalidation refreshes the account wishlist total. The header displays that response, never a locally incremented counter.

The generic engine lives in `frontend/src/shared/motion/index.tsx`. Wishlist and library targets are registered in the header. It performs no persistence, navigation or authentication. Callback saves have no retained source element and use the fallback signal after their actual changed response.

## Fallback and cleanup

- OS or account reduced-motion preference: no cover flight or scale pulse; static +1 and the existing success toast remain.
- Missing, unloaded or detached artwork/source: header feedback without a cover flight.
- Hidden/offscreen target: keep ordinary confirmed feedback; do not fly toward an invisible coordinate.
- Navigation, account change, resize, scroll or hidden document: cancel active decorative effects. Stale animation completion cannot recreate a canceled badge.
- Concurrent additions: one active flight maximum; a newer confirmed effect replaces the older decoration. Authoritative data and mutation completion are never delayed or dropped.

The clone is fixed, pointer-events-none, aria-hidden and rendered in a portal. It captures no focus. Artwork/source coordinates are remeasured after confirmation, so a slow request does not reuse an old click rectangle. Controls and query state remain independent of animation.

## Verification limits

Component tests verify real mutation callback wiring, response gating, no-op/failure handling, account switching, callback deduplication and authoritative count rendering. Explicit browser fixtures simulate changed responses without calling private endpoints; they verify actual poster movement, source/header scale changes, +1/count display, cleanup and reduced-motion fallbacks. They do not prove a live Supabase account workflow or physical-device acceptance. The execution record includes the one intermittent existing skeleton check and its unchanged passing rerun.

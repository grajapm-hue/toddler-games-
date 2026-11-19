# SaNa Beta v2.05 - creative part sizing and default canvas movement

Target only `grajapm-hue/toddler-games-`, maintained `docs/beta`, Pages `main` / `docs`. Toddler Main, MathMatrix, PWA identity/icons, welcome, raw images and saved-data keys are preserved.

At Canvas 100%, a new part lands at half the visible width and height of its current Stores picture. A stable per-placement baseline preserves its aspect ratio. Part 100% is that dropped size; later camera zoom or orientation changes do not rewrite existing designs. New drops use the current Stores layout.

Selecting a placed part shows a gently flashing dotted outline and makes the shared plus/minus buttons resize only that part. Both/Width/Height, rotation, Flip, Original, Grid, Fit and the remaining assembly actions are all visible above the canvas. Part sizes range from 25% to 400%. Original restores dropped size and direction while preserving position. Magnetic joining preserves the child's chosen size, rotation and flip; it no longer restores the old reference geometry. Heads, hands and legs can be independently enlarged.

Empty-space dragging pans by default. Empty-space selection and two-finger gestures return plus/minus to camera zoom. There is no Move canvas mode or Tools popup. Both the toolbar label and coach hint identify whether the target is a part or Canvas. The Machines hint bar has stable height so caption changes do not disturb the working area; leaving Machines restores other games' layout.

Two-finger view changes use the gesture's original camera and finger separation, preventing incremental clamp-induced false zoom. Stores image columns remain stable during image decoding. Transparent hit testing, previews, selection bounds, world bounds and PNG exports include both landing scale and creative transforms. Grid and the selection border are excluded from PNGs.

Release/cache: `sana-little-hands-beta-v205-creative-controls`. Fresh updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.05.html . Previous inside-Beta v2.03/v2.04 recovery routes remain cached; all existing recovery pages target v2.05.

## Naren-PC verification

- Failing assertions first demonstrated the old landing ratio, missing baseline preservation, stale cancelled Stores selection and misleading coach caption after switching to Canvas.
- 512 creative-model assertions cover all 16 parts, both poses and ages 4/5: landing ratio calculations, independent sizing beyond the old cap, immutable dropped baselines, creative joining and 25%-400% limits.
- Chromium and WebKit each pass 64 part/pose/age cases and 524 assertions across four scenarios: standing age 4 phone portrait, standing age 5 phone landscape, waving age 4 tablet and waving age 5 phone fullscreen. Every part is dragged from Stores, measured at half size, enlarged, independently reshaped, rotated, flipped, dragged away, directly rejoined without losing changes and reset. Each scenario restores the full robot and verifies enlarging its head does not alter the other 15 parts. Chromium uses trusted touch; WebKit uses mouse input.
- Browser integration: 24 Chromium and 23 WebKit checks for contextual plus/minus, dotted/animated selection, control placement, default pan/deselection, cancellation, camera-independent PNGs, actual alpha/landing-area preservation, Look, keyboard movement, Demo, landscape and layout cleanup. Chromium also exercises trusted two-finger translation.
- The fresh review added 18 passing regressions per engine for paging/resizing pending choices, aborted source drags, preview cleanup, contextual accessible names and 320x568/568x320/360x640 layouts. Pending sizes are measured at placement; a remembered Store picture remains valid when paged away.
- Existing model/movement/canvas/camera checks pass 60/28/356/48 assertions. Existing Chromium robot/Blocks flows pass 29 checks. The v2.04 tests that require shape-reset-on-fit and popup/mode controls describe behavior explicitly superseded by this request.
- Published v2.04-to-v2.05 upgrade checks pass 22 manual-update/failed-install assertions and 19 fresh-updater assertions, preserving photo/settings/open game, incomplete-download rollback, unrelated caches and offline cutouts/references/controls.
- 323 deployment references, 42 release invariants, generated offline digests, syntax and focused lint pass. Screenshots/logs are under ignored `artifacts/robots-v205/`.

Browser coverage does not establish the installed physical-device result.

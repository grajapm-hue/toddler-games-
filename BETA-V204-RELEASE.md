# SaNa Beta v2.04 - reference 100% and assembly tools

Target only `grajapm-hue/toddler-games-`, maintained `docs/beta`, Pages `main` / `docs`. Toddler Main and MathMatrix are outside this release.

100% now means the original 848 by 1264 robot reference fitted to the current canvas. Previously the camera retained its initial viewport-shaped basis; after changing from phone to tablet, 100% measured only 68.48% of the Look reference scale. The original reference basis now stays fixed. The percentage button returns to the centered reference at 100%; Fit shows the entire assembly and reports its actual zoom. Resizing changes the view without moving or resizing parts.

Look and the assembly now share the same zoom and pan. Parts enter at their original reference proportions throughout the visible canvas. Camera plus/minus changes the whole view and preserves model dimensions.

Tools reuses the existing Blocks controls: part Size for Both/Width/Height (50%-150% of the original), 45-degree turns in either direction, Flip, Original and a view-only Grid. Original resets the selected part's size and direction. A magnetic fit restores the supplied original dimensions and orientation. A short direct drag from a joint remains free, including a resized part. Transparent-pixel hit testing, drag previews, bounds and saved PNGs all account for part transforms. Grid is excluded from saved pictures.

PWA identity/icons, welcome, raw cutout assets, saved-data keys and Blocks behavior are preserved. No data clearing or uninstall is required for this update.

Release/cache: `sana-little-hands-beta-v204-reference-scale-tools`. Fresh updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.04.html . Existing recovery URLs target v2.04.

## Naren-PC validation

- Red tests reproduced the changing 100% reference scale and resized pieces snapping back during small direct moves before the corrections.
- 386 new model assertions cover both poses, ages 4/5 and all 16 parts: transforms, bounds, inverse hit coordinates, limits, free dragging and magnetic restoration. Existing 60 model, 28 movement, 356 canvas and 48 camera assertions pass.
- Chromium and WebKit each pass 28 UI/export assertions: 100% across portrait/tablet/landscape, shared Look zoom, controls, PNG changes, alpha/ink-area preservation, camera-independent exports, rotation, popover closing, direct return-to-joint dragging and keyboard panning in Look.
- Each engine passes 64 transformed-part cases / 324 assertions across four scenarios: standing age 4 phone portrait, standing age 5 phone landscape, waving age 4 tablet and waving age 5 phone fullscreen. Every part is resized, rotated, flipped, grabbed on an opaque pixel, moved and magnetically restored. Each scenario ends with the full 16-piece assembly. Chromium uses trusted touch for cutout dragging; WebKit uses mouse input.
- Earlier precision gestures remain valid: 40 Chromium and 38 WebKit assertions, including cancellation, overlapping transparency, small moves, resize during drag, Demo and Chromium pinch/pan. Existing robot/Blocks browser flows pass 29 assertions per engine.
- Actual published v2.03-to-v2.04 worker upgrades pass 22 manual-update/failed-install assertions and 19 fresh-browser-updater assertions. Saved photo/settings/open game, unrelated caches, rollback and all 32 cutouts/two references are preserved. Zoom, Size, Rotate, Grid and Original work offline. The preceding v2.03 recovery route remains cached.
- 322 deployment asset references, 40 release invariants, offline integrity, JavaScript syntax and focused lint checks pass. Browser screenshots and logs are in ignored `artifacts/robots-v204/`.

Browser checks do not establish the installed physical phone/tablet result.

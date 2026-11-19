# SaNa Beta v2.03 - precise robot dragging and canvas zoom

Target only `grajapm-hue/toddler-games-`, maintained `docs/beta`, published from `main` / `docs`.

Small intentional moves previously returned fitted parts to their magnetic joints immediately. Tapping an occupied joint could also override the part explicitly chosen in Stores. Dragging empty canvas could move the last-selected part. The controller now distinguishes part selection, part movement and camera movement. A fitted part can be lifted a short distance without snapping back; leaving and returning to its joint permits fitting again. Magnetic distance scales with zoom.

The Assemble toolbar adds minus, plus, a zoom percentage, Fit and Move canvas. Zoom ranges from 50% to 800%. Empty-space dragging or Move canvas pans in every direction. Two fingers pan and pinch to zoom. These camera operations never alter part coordinates. Fit includes loose parts as well as the complete robot. Selecting a used part in Stores brings it into view and provides an explicit choice when parts overlap.

Hit testing uses the transparent PNG pixels rather than their rectangular bounds, with a small touch tolerance. The tolerance search examines actual opaque pixels, avoiding gaps from sparse sampling on thin cutout edges at high zoom. The selected part name stays visible. A correctly sized drag preview follows the original grip point. Cancelled gestures clear stale selection, and resizing during a drag defers camera layout changes until release. Demo temporarily fits its example and restores the previous camera. Saved transparent PNGs always use the complete assembly bounds, regardless of zoom or pan.

Both robot variants, all 32 supplied cutouts, age 4/5 availability, pending categories, welcome image, PWA icons/identity and saved-data keys are preserved. Blocks, toddler Main and MathMatrix are outside this release.

Release/cache: `sana-little-hands-beta-v203-zoom-pan-precision`. Labels and snapshots show v2.03. Fresh updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.03.html . Existing recovery links target the complete release.

## Naren-PC verification

- Reproduced the three selection/movement defects on v2.02 before implementing the repair. Additional regressions covered cancelled selection and Demo while zoomed.
- Camera and placement model: 48 assertions, covering anchored zoom, all pan directions, minimum/maximum zoom, short free moves and refitting for both robots and ages.
- Precision browser flows: 40 Chromium assertions and 38 WebKit assertions. Chromium also checks trusted two-finger pinch/pan. Both cover overlapping pieces, transparent corners, cancellation, resize during dragging and Demo camera restoration.
- All-part zoom matrix: 256 part cases and 784 assertions per engine across all 16 parts, both robots, ages 4/5, phone normal/fullscreen, phone landscape and tablet. Checks cover exact fitting, tiny free moves, Stores reselection, removal and full 16-piece assemblies. Chromium uses trusted touch input; WebKit uses mouse input.
- Complete-assembly overlap checks: all 64 part/robot/age cases per engine can be gripped directly on a visible pixel, moved a small distance without disturbing any other part and refitted to restore 16/16.
- Save-picture checks in both engines confirm identical PNG bytes before and after zoom/pan, unchanged assembly coordinates and transparent backgrounds.
- v2.02-to-v2.03 worker upgrade: 18 assertions for manual update/failed-install recovery and 15 for the fresh browser updater. Both cover retained photos/settings/open game, all cutouts/references decoding offline and offline zoom/pan.
- Existing robot model/movement/canvas/browser checks, release invariants, deployment integrity, syntax and focused lint validation.

Screenshots and results are under ignored `artifacts/robots-v203/`. Browser checks do not establish the physical phone/tablet's installed-app result.

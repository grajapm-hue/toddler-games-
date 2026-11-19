# SaNa Beta v2.02 â€” full Assemble canvas

Target only `grajapm-hue/toddler-games-`, maintained `docs/beta`, published from `main` / `docs`.

The all-parts audit reproduced a second placement problem: the SVG preserved the robot's original 848 Ã— 1264 aspect ratio inside a wider visible pane, but accepted input only inside that original rectangle. Visible side areas rejected drops. The source coordinate space now expands to match the entire pane while keeping the original robot and part proportions unchanged. Every corner accepts loose pieces, and magnetic targets remain at the original source coordinates.

Loose pieces preserve their relative canvas positions when the pane changes size, so rotation and entering/leaving fullscreen keep them visible. Fitted pieces keep their exact target coordinates and fitted count. Keyboard placement uses the same full bounds. Transparent snapshots cover the full current canvas, including pieces outside the old source rectangle, without clipping edge pieces.

Both robot variants and their 32 original PNG assets, snap distances, welcome, PWA icons/identity and saved-data keys are unchanged. Other machine collections remain pending; ages 2/3 retain their current invitation to choose age 4 or 5. Blocks, toddler Main and MathMatrix are outside this repair.

Release/cache: `sana-little-hands-beta-v202-full-assembly-canvas`. Labels and snapshot names show v2.02. Fresh updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.02.html . Existing updater URLs target the complete new release.

## Naren-PC verification

- Full-canvas model: 356 checks for every part in both variants and ages 4/5, including four corners, exact magnetic targets, loose-piece resizing, completed assemblies and invalid dimensions.
- Browser matrix covers all 16 parts Ã— two variants Ã— ages 4/5 Ã— phone portrait, phone landscape and tablet Ã— normal/fullscreen. Each part visits four canvas corners, fits, moves away and refits; every piece is also re-grabbed inside the completed 16-piece assembly. Rotation retains loose pieces and restores completion.
- Complete matrix results: 384 part/viewport/level cases and 5,065 assertions per engine, with zero script errors.
- Chromium uses trusted touch input; WebKit uses mouse input. Browser traces, per-scenario screenshots and results are saved under ignored `artifacts/robots-canvas-v202/`.
- Full-canvas PNG checks confirm expected expanded dimensions, genuine alpha transparency and an unclipped piece in the formerly unusable left-side area in Chromium and WebKit.
- Existing 60 robot-model checks, 28 fitted-piece movement checks and 29 existing robot browser flows per engine remain valid.
- Actual v2.01-to-v2.02 worker upgrade retains saved photos/settings and an open game. An incomplete changed-script download keeps the old release usable. All 32 cutouts and both references decode offline after upgrading.
- Deployment integrity, release invariants, syntax and focused lint checks.

Browser coverage does not establish the physical phone/tablet's installed-app result.

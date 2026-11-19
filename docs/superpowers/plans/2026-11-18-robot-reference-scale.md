# Robot reference scale and tools implementation plan

> Execute sequentially using test-driven development; no delegated agents are needed.

**Goal:** Keep original reference proportions at a stable 100% and provide the requested assembly controls in toddler Beta.

**Architecture:** The camera's immutable reference basis is separate from visible canvas bounds and per-part transforms. Existing transparent cutouts and original magnetic targets remain authoritative. Look uses the same camera as placed pieces.

**Tech Stack:** Existing vanilla JavaScript UMD modules, SVG/canvas, Node assertions and Playwright Chromium/WebKit on the user-approved Naren-PC.

**Spec:** docs/superpowers/specs/2026-11-18-robot-reference-scale.md

1. Add failing tests for stable 100% after rotation, Fit percentages, selected-part transforms and magnetic restoration.
2. Correct robot-viewport.js and add tested geometry/transform functions to robot-machines.js. Keep default legacy placement data compatible.
3. Add accessible Tools and percentage reset controls; apply transforms consistently to rendering, hit testing, drag previews, world bounds and transparent exports. Synchronize Look with the same camera.
4. Exercise every cutout in both poses/ages, transformed dragging, controls, portrait/landscape/tablet, snapshots, Demo, offline upgrade and saved-data retention. Preserve existing regression flows.
5. Prepare v2.04 labels, cache/digests, recovery links and release notes. Review and merge only to the canonical toddler Beta repository. Verify the exact Pages commit, live files and runtime controls.

## Review Focus

Review transformed hit testing and bounds, drag previews and releases near joints, restoration of original dimensions on magnetic fitting, Look input/zoom alignment, honest Fit percentages and reset-to-100 behavior. Check that offline asset integrity and the app identity remain correct and other repositories are untouched.

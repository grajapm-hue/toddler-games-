# Beta v2.08 Landing and Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Stores size on landing at default 100% and provide wider, inset zoom controls without taller toolbars.

**Architecture:** Change only the initial size factor in the robot model/controller, then layer responsive, robot-scoped toolbar rules on the existing compact control stylesheet. Preserve the two rows, geometry editing and app identity. Publish a fresh Beta cache release.

**Tech Stack:** Static HTML/JS/SVG/CSS, local Node/Playwright Chromium and WebKit, GitHub Pages main/docs publication.

**Spec:** `docs/superpowers/specs/2026-11-19-beta-v208-landing-controls-design.md`

## Global Constraints

- Beta repository only: `grajapm-hue/toddler-games-`, maintained source `docs/beta/`.
- Starting commit `32605b0e58670441c8822fb83127ec289bd9bbdc`; visible release v2.08.
- New Stores-to-canvas size ratio at camera 100%: 1.0, with part size 100%.
- Keep existing 30/28/26px heights and two toolbar rows. Keep all 14 controls functional and accessible.
- Preserve later custom sizes/transforms, camera, magnetic behavior, images, PWA identity and user data.
- Keep all Main sites unchanged. Use local Naren-PC tests; no Actions test dispatch.

## Review Focus

- New drops after camera zoom retain a consistent 100%-camera baseline without resetting the view.
- Narrow breakpoint layouts and longest percentages do not clip labels, overlap targets or create a third row.
- Wider landed pieces remain draggable, including when joints or other cutouts overlap.
- Old installed caches upgrade transactionally to the new release without losing photos/settings.
- Only the Beta publication source changes; Main repositories and live identities remain intact.

### Task 1: Full Stores-size landing

**Files:** `docs/beta/robot-machines.js`, `docs/beta/parent-guide.js`; new v208 model, creative and all-parts browser checks.

**Interfaces:** `landingScale(part,width,height,canvasScale)` and controller pending scale produce the full Stores ratio at the camera's 100% baseline. Existing state and transform APIs stay unchanged.

- [ ] Copy the meaningful v205/v207 geometry checks for v208 and assert full-size landing plus initial 100%; run them and observe the half-size baseline fail.
- [ ] Remove the half-size factors and update How to Play to explain equal Stores size and retained creative sizing.
- [ ] Run all-parts, model and creative checks for both poses/ages; verify direct dragging, joins, camera and dimensions. Commit the narrow change.

### Task 2: Compact, finger-friendly toolbar and Beta release

**Files:** `docs/beta/compact-controls.css`; v208 toolbar and release/upgrade tests; version markers, worker/integrity data and fresh Beta updater following existing release conventions.

**Interfaces:** Existing control IDs, actions, accessible labels and heights are retained. Responsive width/padding rules produce the spec's target widths, edge inset and two rows.

- [ ] Add layout assertions for width, edge/neighbor spacing and unchanged heights to the existing meaningful toolbar flow; run them against v207 styling and observe failure.
- [ ] Add scoped responsive rules, reducing excess padding and wrapping long percentages inside compact labels; verify all boundary layouts in normal/fullscreen mode and unchanged Blocks controls.
- [ ] Advance Beta to v2.08, regenerate digests and fresh updater, verify upgrade/offline/source guards and the appropriate smoke suite.
- [ ] Obtain one fresh whole-branch review, fix material findings with regressions, then publish the tested PR and verify the exact Pages commit and live content while checking Main preservation.

Expected: all named checks pass with evidence; report any browser-simulation limits separately from physical-device confirmation.

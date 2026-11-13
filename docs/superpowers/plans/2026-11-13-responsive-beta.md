# SaNa responsive Beta Implementation Plan

> Execute inline using systematic debugging, TDD and verification-before-completion. The user asked to correct the reviewed defects and unify orientation with the previous app.

Goal: publish a responsive upright SaNa Beta with recoverable Picture loading and protected maintained sources.
Architecture: keep existing DOM, SVG interaction and storage. Adapt viewport fitting and add a focused final responsive stylesheet.
Tech: static HTML, CSS, JavaScript, local Playwright Chromium and WebKit.
Spec: ../specs/2026-11-13-responsive-beta-design.md

Constraints: edit docs/beta directly; no legacy regeneration, new dependencies, MathMatrix changes, storage clearing, native fullscreen or orientation locks.
Review focus: image failure/retry; short landscape chrome; portrait control wrapping; game progress across rotation; real cached update/offline play.

- [x] Add and run failing regression checks for retry, upright portrait and guarded legacy builder.
- [x] Fix Picture's retained rejected promise and expose retry; guard builder and correct docs. Re-run regression.
- [x] Replace rotated/locked frames with visible viewport sizing; reflow chooser, shared controls and Picture panels without resetting rounds.
- [x] Verify all six games on phone/tablet/laptop, both orientations, rotation with progress, immersive and guide dialogs, Chromium/WebKit. Capture screenshots and get an independent visual review.
- [x] Increment all maintained release identifiers to v1.61 and precache the new stylesheet. Verify old-worker update and offline reopen with settings/photos preserved.
- [ ] Review branch, commit, open/attach/merge PR, verify remote tip and served Beta assets.

Ruling: compact sound/music/vibration into a Settings popover during games, retain direct controls at home and existing immersive vibration. Review reproduced unusable 320x568 boards with always-visible wrapped controls. Short portrait Picture uses side-by-side panels when the available stage is below 360px; tall portrait stacks them. Tablet portrait starts three columns at 700px.

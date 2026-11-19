# Machines two-row tools implementation plan

> Use superpowers:executing-plans to implement inline with one fresh whole-branch review.

Goal: remove requested visual clutter and fit Machines tools in two rows without changing assembly mechanics.
Architecture: change only robot room template, scoped compact CSS and Machines guide text; release through existing Beta worker/recovery flow.
Tech stack: existing static HTML/CSS/JavaScript, Playwright on Naren-PC.
Spec: docs/superpowers/specs/2026-11-19-two-row-tools.md
Base: 9bf84b7376202e9148d35cd2e7532858cee0cdbe

Global constraints: Beta only; both Main repositories preserved; keep manifest identity and photos/settings; no gameplay-controller logic edits; no Actions tests.
Review focus: long unequal dimension percentages, Build replacing Look, short landscape and phone widths, accessible hidden announcements, guide previews using visible targets.

## Task 1: Two-row assembly tools
- [ ] Add layout/interaction regressions; observe failure on current layout.
- [ ] Rearrange room template and add scoped styles; hide Original/progress/selection text visually; shorten Save label with full accessible name.
- [ ] Explain 100%, selected-part controls and canvas pan/zoom in How to Play; remove obsolete Original reference.
- [ ] Verify both engines over viewport/fullscreen matrix and current all-part interactions.

## Task 2: Release v2.07
- [ ] Update metadata/recovery routes/cache, retain older updater URLs, regenerate offline digests.
- [ ] Assert unchanged controller logic and unrelated game code; run source/deployment/offline upgrade checks.
- [ ] Commit and obtain one fresh whole-branch review; fix concrete findings with targeted red/green checks.
- [ ] Publish only canonical Beta, verify Pages commit, served source and browser flows; verify both Main SHAs unchanged.

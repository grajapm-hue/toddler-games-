# Glossy Blocks Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish an integrated Glossy Blocks game in SaNa Beta for group review.

**Architecture:** A focused module owns the catalogue, collision-safe construction model and responsive game room. The maintained app owns settings, navigation, age, hints, Demo/Again and shared completion timing. Existing games retain their implementation.

**Tech Stack:** Static HTML/CSS/JavaScript, SVG artwork, local Node and Playwright checks; GitHub Pages branch publication.

**Spec:** The approved integration order is recorded in the attached `glossy-blocks-plan/PLAN.md`: match current controls/theme first, expand ages 2–5 before release, Beta first.

## Global Constraints

- Edit maintained `docs/beta`; do not regenerate from the older archive or root prototype.
- Preserve the manifest, install identity, storage keys and free orientation.
- Keep all six current cards on the first page; use a More games entry for the new page.
- Nine categories, expanded age inventories; no remote artwork or platform emoji dependence.
- All tests run locally. Publication is main branch → docs, not a dispatched workflow.

## Review Focus

- Cancelled or interrupted gestures must not add/move blocks.
- Rotation/settings/Demo must preserve construction; game navigation must cancel pending replay.
- Category changes must preserve mixed-category builds.
- Tap and keyboard paths must work without dragging.
- New room controls must fit both orientations and short phone viewports.

### Task 1: Construction model and expanded catalogue

**Files:** Create `docs/beta/glossy-blocks.js`, `check-glossy-core.cjs`.

**Interfaces:** `core.items(category, age)`, `core.patterns(age, level)`, `core.create()`, `core.place(board,item,x,y,index?)`, `core.remove(board,index)`, `core.ink(hex)`; mount exposes `start(age,level)`, `leave()`, `reset()`, `demo()`, `cancel()`.

- [x] Write/run a failing core check for missing module, all nine increasing inventories, range completeness, board bounds, collision rejection, moving and removal.
- [x] Implement pure model and local SVG object illustrations. Numbers grow 1–5/10/15/20; letters A–F/L/T/Z; other sets grow from 4 or 6 to 10 or 12 familiar items.
- [x] Run `node check-glossy-core.cjs`; expect all assertions pass.

### Task 2: Responsive room and shared app integration

**Files:** Modify `docs/beta/app.js`, `play.html`, `responsive.css`, `parent-guide.js`; create `glossy-blocks.css`, `check-glossy-beta.cjs`.

**Interfaces:** `SaNaGlossyBlocks.mount({app,scene,hint,feedback,complete,onReset})`; app calls module lifecycle and shared `scheduleNextRound` completion. More games changes chooser page without page navigation.

- [x] Write/run browser checks expecting a reachable Glossy Blocks card and working room; expect failure before integration.
- [x] Implement category paging, recolour, tap/drag/keyboard placement, safe cancellation, Remove/Clear/Finished, pattern guide, non-destructive Demo and age reset.
- [x] Reuse shared settings and nav; add chooser pagination with correct return page.
- [x] Render Chromium/WebKit phone/tablet portrait/landscape and laptop. Check text/control bounds, actual drag/tap/keyboard, replay cancellation, rotation, native touch and existing six games.

### Task 3: Beta release

**Files:** Update `docs/beta/index.html`, `play.html`, `sw.js`, README; record evidence.

- [x] Bump to v1.63, cache all module assets, retain manifest unchanged.
- [x] Run core/browser regression checks, installed-worker upgrade/offline check and fresh review. Expect no important unresolved findings.
- [ ] Commit, push branch, create/attach/merge PR, wait for branch Pages publication.
- [ ] Verify live served source identity and new-game launch/interaction; report Beta link and device-verification limits.

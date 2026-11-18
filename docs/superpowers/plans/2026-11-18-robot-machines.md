# Robot Machines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship transparent standing/waving robot assemblies with magnetic fitting in toddler Beta v2.00.

**Architecture:** A dedicated robot catalogue/model/view replaces Machines' use of Glossy Blocks. Existing Blocks stays on its current controller. Copy the verified user assets unchanged and include them in the existing digest-verified offline release.

**Tech Stack:** Existing vanilla JavaScript UMD, SVG, CSS, Node assertions and Playwright.

**Spec:** docs/superpowers/specs/2026-11-18-robot-machines.md

## Global Constraints

- Target only grajapm-hue/toddler-games-, maintained docs/beta. Advance v1.99 to v2.00.
- Preserve PWA identity/icons, welcome artwork, user data and all unrelated apps/games.
- Use 16 transparent pieces for each of the two supplied matching robot sets.
- Naren-PC local validation; no GitHub Actions test/build dispatch.

## Review Focus

- A wrong-location drop must not count as a fitted part; fitted parts cannot duplicate.
- Orientation changes and pointer cancellation must preserve the build and clear drag ghosts.
- Pose/age/navigation changes must cancel pending demonstrations and gestures.
- Transparent snapshots and live pieces must preserve proportions and layer order.
- An old installed v1.99 app must receive the complete new release while keeping saved photos/settings.

### Task 1: Catalogue and fitting model

**Files:** Create docs/beta/robot-catalogue.js, docs/beta/robot-machines.js, docs/beta/glossy-art/v200/robots/{standing,waving}/ and check-robot-model-v200.cjs.

**Interfaces:** catalogue.poses holds canvas, parts, asset URLs and reference. core.create(poseId,age), core.drop(state,id,cx,cy), core.remove(state,id), core.fittedCount(state), core.isComplete(state).

- [x] Write/run failing assertions for both 16-piece sets, near/missed drops, age radii, duplicates, boundaries and completion.
- [x] Copy supplied PNG/reference bytes and generate labelled metadata in source drawing order.
- [x] Implement the pure model; run the same assertions to green.

### Task 2: Machines screen and integration

**Files:** Extend robot-machines.js; create robot-machines.css; modify app.js, play.html and parent-guide.js. Create check-robot-browser-v200.cjs.

**Interfaces:** mount({scene,hint,feedback,complete,onReset}) returns start(age), leave(), cancel(), demo().

- [x] Write/run failing browser checks for the dedicated screen and disabled legacy collections.
- [x] Implement raw Stores cutouts, two variants, magnetic drag/tap, Look, reset, completion, demo and transparent export.
- [x] Integrate lifecycle and replace the Machines menu thumbnail with supplied artwork.
- [x] Run browser checks in Chromium and WebKit; inspect phone and tablet renders, pointer cancellation, navigation, demo preservation and exported PNG alpha.

### Task 3: Version, offline release and delivery

**Files:** Update Beta version labels, pwa.js, sw.js, old recovery aliases and add fresh v2.00 recovery pages; add BETA-V200-RELEASE.md.

- [x] Preserve manifest/icon/source-data invariants; update release labels and fresh updater entry.
- [x] Refresh offline asset list and SHA-256 digests; run deployment validation.
- [x] Prove old-worker upgrade, saved-data retention, offline robot/reference loading and incomplete-download recovery.
- [ ] Review scoped diff, rebase onto origin/main, create one squashed commit/PR, merge authorized Beta update and verify live served release.

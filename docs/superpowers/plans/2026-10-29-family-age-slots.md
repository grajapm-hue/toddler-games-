# Flexible Family Age Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four freely selectable family starting sets to the existing five games.

**Architecture:** Share a small browser profile registry between the welcome and game page. The existing game registry and rendering remain intact; profile settings supply object counts, pace, painting targets and optional collections. Preserve common-play behavior when no age has been chosen.

**Tech Stack:** Existing HTML/CSS, JavaScript IIFEs, Node build scripts and Playwright Chrome/WebKit checks.

**Spec:** ../specs/2026-10-29-family-age-slots.md

## Global Constraints

- Parent choices are ages 2, 3, 4 and 5; every game and sub-level remains open.
- Preserve visual portrait welcome, landscape rooms, camera-safe controls and card sizes.
- No rankings, age grading, accounts, DOB collection or new games.
- Keep all 100 abacus beads and full bubble collections available.
- Publish Beta v0.30/cache v30; preserve manifest identity and scope.
- User has authorized execution and update; implement inline without another approval gate.

## Review Focus

- Missing, malformed or denied storage must not prevent play or lose an age selection during navigation.
- Age changes must restore separate preferences and never interrupt a running game in another tab.
- Smaller phone layouts must keep parent choices reachable without shrinking game cards.
- Reduced bubble collections must use matching tokens, totals and completion checks; full sets stay reachable.
- The new shared script must be present in both offline caches and the self-contained HTML.

### Task 1: Parent selection and shared profiles

**Files:** Create age-profiles.js and check-age-profiles.mjs; modify welcome-preview.html, index.html, app.js and build scripts.

**Interfaces:** window.SaNaProfiles exposes getAge(), select(age), preset(level), and a navigation helper that carries a selected age in the query string. Presets expose shapeCount, snapDistance, sliderCount, bubbleCount, bubbleSpeed, bubbleSize, brushSize, picture, paintTarget, dirtHealth, numberCount, letterCount and shapeTokens. Unselected age returns the existing common-play preset.

- [x] Add a browser regression for four age buttons, persistence/navigation, common-play compatibility and no disabled game cards.
- [x] Run it and observe the missing-age-chooser failure.
- [x] Implement the registry, optional welcome buttons, home-only selector and per-age preference storage. New selections start in Explore; query age takes precedence over saved age.
- [x] Check Chrome/WebKit selection, keyboard access, blocked storage and portrait/landscape layout.

### Task 2: Existing games use age starting sets

**Files:** Modify app.js and index.html; extend check-age-profiles.mjs.

**Interfaces:** Game renderers consume SaNaProfiles.preset(state.level). A Full set button toggles starter/full bubble tokens. All age slots provide three abacus levels, while common play retains its original single-stage navigation.

- [x] Add literal expected shape/slider/bubble counts for ages 2–5; verify failure before implementing.
- [x] Apply profile counts, touch tolerance, brush defaults, picture/paint targets and bubble defaults. Keep manual overrides per age.
- [x] Apply starter collections consistently to spawn, tracker and completion. Full set exposes all 20 numbers, 26 letters and six shapes.
- [x] Add optional abacus prompts by level, preserving unrestricted rows and beads; include all three in age-slot Back/Front navigation.
- [x] Verify all five games at every age/level, collection completion, preferences, card sizes, navigation and storage failures.

### Task 3: Offline release and regression verification

**Files:** Modify build.mjs, build-beta.mjs, sw.js, beta-runtime/sw.js, BETA-RELEASE.md, README.md and generated artifacts.

- [x] Embed/copy/precache age-profiles.js; update age-range copy and Beta v0.30/cache v30, prototype cache v21.
- [x] Build both outputs; run syntax and diff checks.
- [x] Run focused age checks and existing game, layout, parent, carousel, update and offline checks in Chrome/WebKit; record any harness changes required by the intentional UI change.
- [x] Verify a real cached v0.29 to v0.30 transition retains settings and works offline.
- [ ] Obtain a fresh whole-branch review, fix material findings, publish through a PR and verify exact Pages commit and live flows.

## Execution ledger

- Ruling: leave unselected/common play available to preserve existing families and direct links; selecting any age activates the new independent preset.
- Ruling: preserve all abacus beads; sub-levels offer optional suggestions, not gates or scores.
- Ruling: shared age query travels between welcome/play so blocked storage does not block the current session.
- Ruling: below 350 logical pixels of play height, hide the redundant game header and use a slim companion row; retain Show me, Again and board navigation. The new 320-pixel-phone check found a five-pixel-high bubble field otherwise. Home card dimensions remain unchanged.
- Validation: focused browser regressions were first observed failing for missing age controls, stale welcome age query, mismatched starter collection label, stale cross-tab saves and age-only preferences leaking into Family play. Each has been repaired and is covered by check-age-profiles.mjs.
- Review: the fresh whole-branch reviewer found the Family play migration issue; its red/green browser regression and the follow-up review confirm the repair. No further material findings.
- Offline: real committed v0.29 assets updated to v0.30 in Chrome/WebKit, preserving legacy settings separately from new ages, precaching age-profiles.js, and opening every existing game offline.

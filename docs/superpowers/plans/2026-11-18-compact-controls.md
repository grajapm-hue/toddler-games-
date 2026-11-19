# Compact toddler Beta controls plan

Spec: docs/superpowers/specs/2026-11-18-compact-controls.md
Base: 8c126556004824d7da0631beffbafeedc960c45f

Global constraints: Beta only, no gameplay JavaScript changes; preserve all existing PWA identities, data, images and interaction logic. Use Naren-PC as previously authorized. No Actions test dispatch.

## Task 1: Compact shared game controls

Interfaces: final CSS layer loaded by play.html; eight games and responsive app shell.
Inventory current controls and capture baseline screenshots. Add meaningful browser layout checks that fail on existing oversized controls. Implement compact-controls.css scoped to toolbar/navigation controls, reducing row sizing and padding while preserving targets, hidden elements and stable captions. Verify responsive canvas gain, content fit and interactions.

## Task 2: Release Beta v2.06

Interfaces: Task 1 stylesheet must be precached with a new cache and recovery route.
Bump release metadata and recovery pages without changing JavaScript logic. Regenerate offline integrity; validate deployment, source fingerprints, robot/browser interaction regressions and app-wide browser checks. Commit, obtain one fresh whole-branch review, fix concrete findings, publish authorized Beta via PR/merge and verify Pages plus served bytes. Preserve both Main repositories.

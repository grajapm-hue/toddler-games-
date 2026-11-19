# Beta v2.09 original fit implementation

> REQUIRED: superpowers:executing-plans; implement natively with one fresh final review.

Spec: `docs/superpowers/specs/2026-11-19-beta-v209-original-fit-design.md`
Base:918d80249b76bdff102431711ea822ff2329daee. Beta only; no Main changes, image changes or saved-data resets.

## Review Focus

- Stores uses one native proportional scale across all pages; parts remain inside their card without being independently stretched or clipped.
- Default assembled pixels match the supplied full references, rather than merely reporting all joints fitted.
- Current camera and customized geometry survive paging, layout changes and repeated placement; camera zoom does not change Stores size.
- Original PNG/SVG assets, controls, PWA identity and all Main sources remain unchanged.
- Installed v2.08 upgrades transactionally to v2.09, including saved photos/settings and offline play.

### Task 1: Original proportions and exact full fit

Interfaces: existing Stores DOM, SVG camera and landing scale; preserve model/snap/geometry APIs.
Files: robot-machines.js, robot-machines.css, parent-guide.js, new original-fit audit/browser tests.

- [ ] Add original asset/coordinate checks and a real default full-assembly pixel comparison; observe the current independently enlarged parts fail.
- [ ] Size Stores images from original pixel dimensions at the canvas100% scale, recomputing after paging/layout/camera rendering; retain whole-card targets and custom geometry.
- [ ] Verify original full-image fits, every part, manual sizes, zoom and responsive controls in Chromium/WebKit; commit.

### Task 2: Beta v2.09 release

Interfaces: version labels, offline cache digests and recovery bootstrap.
Files: version/cache/updater files and release/upgrade checks.

- [ ] Advance only Beta to v2.09; preserve identity/artwork and unrelated controllers; regenerate digests.
- [ ] Verify real v2.08-to-v2.09 upgrade, failed install/retry, saved photo/settings, offline play and release/source guards.
- [ ] Commit; obtain one fresh final review, fix material findings with regressions, publish authorized Beta and verify exact Pages/source/live behavior. Preserve all Main SHAs.

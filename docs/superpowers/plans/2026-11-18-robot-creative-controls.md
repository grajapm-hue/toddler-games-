# Creative robot controls implementation plan

**Goal:** Implement half-size landing, contextual part/canvas plus-minus, default panning and inline controls in toddler Beta.

**Architecture:** Add immutable per-placement landing scale to the existing tested part geometry; keep editable dimensions independent. Selection chooses the toolbar target, while empty space and two-finger gestures always control the camera. Existing raw source anchors remain magnetic positions but preserve creative shape.

**Spec:** docs/superpowers/specs/2026-11-18-robot-creative-controls.md

1. Write failing model/browser tests for half-size landing, larger independent parts, preserved transforms on magnetic joining, selection outline, default panning and toolbar placement.
2. Implement landing geometry consistently in rendering, hit testing, ghosts, bounds and PNGs. Replace popup/mode controls with compact inline controls and contextual buttons.
3. Check every part in both poses and ages 4/5, phone/tablet/fullscreen/landscape, pointer cancellation, creative joining, exports, upgrades, saved data and offline controls on the user-approved Naren-PC.
4. Prepare v2.05 labels/cache/recovery links and release notes. Obtain a fresh code review, fix findings with regressions, publish only Beta, and verify the exact Pages commit/files and live interaction.

## Review Focus

Check reference-versus-landing scale calculations, custom transforms surviving join/remove/reselection, contextual controls while selected/pending/finished/Look, transparent hits and outline bounds, empty-space/pinch pan behavior, unclipped exports, compact toolbar visibility, offline assets and strict repository boundaries.

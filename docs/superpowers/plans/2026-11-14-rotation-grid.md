# SaNa Beta v1.64 corrections

User approved correction and Beta deployment after reviewing v1.63 feedback.

1. Rotation: explicitly release pointer capture before cancelling a Glossy drag; retain source touch nodes during the gesture; avoid rebuilding idle boards on resize. Schedule frame fitting after the viewport settles, while cancelling a gesture immediately. Verify capture release, subsequent control input, preserved construction and delayed viewport metrics. This corrects reproduced event-state defects; desktop-engine tests alone cannot establish the installed-iPhone symptom is gone.
2. Chooser: override legacy 150/166 px fixed widths with content sizing and non-shrinking text. Check glyph bounds in both orientations.
3. Glossy layout: landscape 50/50 Stores/Assemble columns, portrait 50/50 stacked panes, stable DOM. Keep headers and controls visible, with an internally scrollable board only on short portrait screens to preserve minimum touch size.
4. Grid: exact 180-unit cells on a 900×540 board, optional toggle, one origin for cell placement and pattern guides. Preserve existing work when toggled. Improve free edge attachment with a screen-scaled reach, collision checks, and no drawn seam gap.
5. Test first: `check-glossy-alignment.cjs` and `check-rotation-grid.cjs` must reproduce the defects before correction. Re-run existing model, new game, colour/help review, responsive interaction and worker-upgrade checks in Chromium/WebKit. Fresh review before publication.
6. Publish v1.64 to Beta via PR and main→docs Pages, preserving the manifest and saved data; verify the live build commit and served files plus browser launch/input.

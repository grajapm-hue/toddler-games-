# SaNa Beta v2.01 — movable fitted robot parts

Target only `grajapm-hue/toddler-games-`, maintained `docs/beta`, published from `main` / `docs`.

The reported hips had magnetically fitted and were blocked by two locks: the fitting model returned immediately for an already fitted piece, and pointer gestures refused to move fitted pieces. Remove both locks so every placed part remains movable until Done. Dropping away makes the piece loose and decreases the fitted count; dropping back near its matching position fits it again without duplication. Done is disabled during an active drag. Cancelled gestures preserve the child's assembly.

The moving source is dimmed while its transparent drag preview follows the pointer. Fitted pieces show the same grab cursor as loose pieces. How to Play explains that fitted parts can still move. Artwork, snap distances, robot variants, welcome, PWA identity/icons and saved-data keys are unchanged. Toddler Main and MathMatrix are outside this patch.

Release/cache: `sana-little-hands-beta-v201-movable-cutouts`. Labels and snapshot names show v2.01. Fresh updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.01.html . Existing updater links target the same complete release.

Validation on Naren-PC:

- Reproduced the fitted-hips freeze in model and browser tests before changing code.
- Movement model: 28 assertions across both variants and ages 4/5, including undoing/restoring full completion.
- Movement browser checks: mouse dragging away and back, correct fitted counts, no duplicates and continued loose-piece movement in Chromium/WebKit; trusted Chromium touch sequences also lift and refit pieces.
- Existing 60 model checks and the 29 robot browser flows in each engine remain green.
- Actual v2.00-to-v2.01 worker upgrade preserves saved photos/settings and the open game. A deliberately missing changed script rejects the incomplete install and retains the old complete cache. Both robot references and all 32 pieces decode offline after upgrading.
- Release invariants, deployment integrity, JavaScript syntax and focused lint checks pass.

These browser checks do not establish the physical phone's installed-app result.

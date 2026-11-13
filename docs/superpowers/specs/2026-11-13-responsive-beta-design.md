# SaNa responsive Beta

Implement the user's requested corrections in maintained `docs/beta/` only.
Use the existing vanilla HTML/CSS/SVG games and the MathMatrix screen-fit approach.

- Welcome, chooser and games stay upright in both device orientations, with no orientation lock. Fit the current visible viewport and respect physical safe areas.
- Show all six games together: two columns on narrow portrait screens, three on tablets and laptops. Keep the familiar colours and game illustrations.
- Reflow shared controls for portrait; retain all games, ages, settings, galleries, progress and in-page immersive play. Do not reset a round on rotation.
- Retry the built-in Picture image after a failed load, with an explicit retry action.
- Block the obsolete generator before it can touch maintained Beta files; correct the release instructions.
- Publish SaNa Beta v1.61 after local Chromium/WebKit, offline/update and visual checks. SaNa general release remains deferred. MathMatrix is outside scope.

Approaches: native responsive reflow follows the user's MathMatrix reference. Keeping the rotated landscape frame conflicts with that request; a new framework or rewritten game engine adds unnecessary risk.
Physical installed-device rotation remains a user trial after publication.

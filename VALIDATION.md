# Prototype validation — 28 October 2026

## Welcome preview 01

Fresh checks passed in Chromium and Playwright WebKit at 1280×800, 1024×768, 844×390, 390×844 and 667×375:

- Title and action controls stay within the screen, including the rotated portrait frame.
- About and Install dialogs open and close; keyboard focus stays in the dialog and returns to the opening button.
- Reduced motion disables the SaNa bob.
- Tap to play opens the existing four activities, defaults to the Play level, and starts the four-shape matching round.
- Opening the welcome page as a local file also launches the games in both engines.
- No page errors occurred. Screenshots are retained locally in `artifacts/welcome/`.

The game source and self-contained game file were copied byte for byte from the accepted prototype. They have not been changed for this welcome preview.

## Accepted activity baseline

The following results are from the original prototype validation before this repository was prepared:

- Chromium: 60 passing checks.
- Playwright WebKit: 60 passing checks.
- Viewports: laptop 1280×800, tablet 1024×768, landscape phone 844×390, and portrait phone 390×844 with the landscape frame rotated.
- Activities: matching shapes, popping bubbles, reveal sliders, brushing dirt, finger-paint strokes, and painting reset.
- Levels: the default ages-2–4 Play level, simpler Explore level, and harder Challenge level. Challenge bubbles follow the indicated color group.
- Input: mouse/trackpad-style pointer gestures, Chromium touch swipes, touchscreen taps, rotated-coordinate mapping, and pointer cancellation followed by a new successful drag.
- Offline: Chromium uses network-offline emulation; WebKit uses an actual local-origin shutdown because its offline flag has a documented service-worker navigation limitation. Both engines open and play the self-contained HTML with HTTP unavailable.
- Settings: selected level persists across an offline reload.
- Presentation: rendered screenshots retained under `../artifacts/toddler-playroom/chromium/` and `../artifacts/toddler-playroom/webkit/`.

These are automated browser checks. Actual iPad/iPhone and Android installation, device-specific fullscreen/rotation, and a child's hands-on play remain to be tried on physical devices. The HTML prototype is intended for that review.

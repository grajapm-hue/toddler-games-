# SaNa Little Hands Beta v1.20

The published Beta is `docs/beta/`. The v1.17 release was uploaded directly there;
the older root prototype and `beta-runtime/` build inputs have not caught up.
This upgrade therefore edits the current published source without regenerating it
from those older inputs. Running `build-beta.mjs` would replace newer features.

## Counting changes

- Age 2 keeps the counted apples in the basket; Age 3 keeps the carrots beside the rabbit.
- On reaching the requested count, SaNa says **Well done! Wait for the next count.**
- The collection and its completed numeral remain visible for 3,000 milliseconds.
  Further drops and Demo are paused. The current thumbnail stays unticked.
- After that pause, the thumbnail ticks and the next count begins. The last
  collection stays visible until Again, rather than restarting automatically.
- The five apples and ten carrots are now one running collection. Items stay
  collected between consecutive thumbnails; source and receiver tabs show both
  sides of the count in the unused picture space without resizing the illustrations.
- Age 4 has a large bold carriage instruction.
- The selected source item is removed exactly once. Again, Games, age changes,
  and game navigation cancel the pending transition.

The counting illustrations are separate transparent assets generated with the
built-in image generator. No fruit is baked into the tree, soil, basket, or rabbit,
so the visible collection always agrees with the counter. Assets and the exact
generation prompts are in [docs/beta/count-art](docs/beta/count-art/generation.json).

The install manifest and original illustration dimensions remain unchanged.
The Beta worker precaches the six illustrations and the exact versioned game script.

## Demo lessons

Every activity demonstrates one successful action in the current room. An adaptive
finger points at the target centre, the finished action holds for one second, and
its preview thumbnail ticks. The real board, progress and saved settings are then
restored. Count ledgers and abacus labels also update in the virtual copy.

## Verification

Run `node check-count-adventures.cjs` with Playwright's test module available.
`MM_PLAYWRIGHT` may point to an existing installation, and `MM_CHROME` may select
an installed Chromium executable. `PLAYROOM_BROWSER=webkit` selects WebKit.
`COUNT_URL` can target the published Beta; otherwise a local server serves `docs/`.
`COUNT_EVIDENCE` selects the evidence directory.

Checks cover every Age 2 and Age 3 count, the full three-second hold, delayed ticks,
extra/invalid/canceled drops, reset and age navigation, phone/tablet/desktop and
rotated touch input, immersive praise, Age 4/5 and Slide/Paint smoke flows, and
offline images/play. WebKit's local offline check stops the real local origin;
Chromium uses offline network emulation. Browser checks do not certify a physical
device installation.

`node check-lessons-demo.cjs` checks every counting stage, carriage, shape, cave
room, drawing in both art modes, age/bubble mode and abacus colour. It uses the
browser clock to exercise all those lessons quickly; geometry checks use rendered
targets, including rotated screens. The separate counting test measures the real
three-second play hold, cancellation and offline behaviour.

## v1.20 feedback corrections

- Carrot stock is explicitly ten, with both picking orders checked from ten to five to zero.
- Count tabs sit directly under the tree/farm and basket/rabbit. Illustrations move upward without resizing.
- The engine is labelled Train Engine. The larger blue demo pointer contrasts with the carriage.
- Age 5 shows all ten compact colour/count tabs in one row without scrolling, and uses TOTAL BEADS MOVED →.
- Slide Demo opens the door, pauses, closes it, then holds for one second before its preview tick.
- Bubble Demo sizes its pointer to one third of the current bubble. If no whole bubble is onstage, it brings only a preview copy into view; real bubbles remain untouched.

Run `node check-v120-feedback.cjs` for the feedback-specific stock, placement, responsive tabs, door sequence, pointer size and contrast checks. `FEEDBACK_EVIDENCE` selects its evidence directory.

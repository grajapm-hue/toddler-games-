# SaNa Little Hands Beta v1.23

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
finger points at the target as the spoken instruction starts. Demonstrated objects wait;
SaNa completes the praise and holds it before the preview thumbnail ticks. The real board, progress and saved settings are then
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

## v1.21 carrot visibility correction

The lower row overlapped the orange front boards, so five carrots were hard to distinguish from the farm artwork. The two rows now sit staggered on the dark soil. Carrot touch areas fit between neighbouring roots; apples and all illustration dimensions remain unchanged.

`node check-carrot-visibility.cjs` checks three points on every visible orange root against the farm soil, verifies actual hit targets, and completes all ten counts in both picking orders across six viewport layouts. Chromium uses native touch input at the root rather than the sprite origin; WebKit uses pointer input. Screenshots include ten carrots and the five remaining after count five. This catches the visual failure missed by the previous centre-point tests.

## v1.22 calm spoken Demo lessons

Demo messages appear first. Speech uses rate 0.65, prefers an available Indian English voice, and retains the device's English fallback. Short spoken phrases finish completely, with 500 ms between phrases and 1,200 ms after the instruction. Both the pointer and demonstrated object wait for the instruction and pause before moving. SaNa's complete message remains visible throughout.

Well done finishes and holds for another 2,000 ms before the preview thumbnail ticks. Muted/unavailable speech keeps a readable text pause. Stop, Again, Games and age navigation cancel speech and pending steps; muting immediately stops the voice. A stalled engine has a bounded text fallback. Real counting retains its separate three-second completion hold.

`node check-demo-voice.cjs` controls delayed completion/error events to check no interruption, slow voice selection, deferred object motion, phrase gaps, praise timing, cancellation and fallback. Actual installed voices depend on the device. The full room-by-room Demo suite also checks the longer silent reading/praise timing.

## v1.23 simultaneous finger and voice

The finger points at the item as the instruction starts, with the SaNa message shown at the same time. Dragged objects still wait until the instruction and its short pause finish. The demo speech rate is 0.74, between the original 0.82 and v1.22's 0.65. The extra lead-in before speech is removed. Phrase gaps, readable text fallback, cancellation and the two-second pause after spoken praise remain.

Voice regression checks capture finger visibility and target alignment at the actual speech call, as well as its midpoint rate and uninterrupted completion.

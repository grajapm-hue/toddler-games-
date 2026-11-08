# SaNa Little Hands Beta v1.31

The published Beta is `docs/beta/`. The v1.17 release was uploaded directly there;
the older root prototype and `beta-runtime/` build inputs have not caught up.
This upgrade therefore edits the current published source without regenerating it
from those older inputs. Running `build-beta.mjs` would replace newer features.

## Counting changes

- Age 2 keeps the counted apples in the basket; Age 3 keeps the carrots beside the rabbit.
- On reaching the requested count, SaNa says **Well done! Wait for the next count.**
- The collection and its completed numeral remain visible for 1,500 milliseconds.
  Further drops and Demo are paused. The current thumbnail stays unticked.
- After that pause, the thumbnail ticks and the next count begins. The last
  collection stays visible for the celebration, then a fresh round starts automatically.
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

## v1.31 sky painting, balloons and shared object feedback

Finger Paint keeps its cream colouring shape and clipped strokes, while the
area outside the shape is transparent over the same sky as Brush Clean. The
outer white board has been removed for every drawing and starting age.

All Bubble modes and ages use shaded balloon bodies, highlights, knots and
strings. Responsive radii fit the playfield; replacements enter partly visible
after 50 ms instead of travelling from entirely below the board. Fixed lanes
still prevent horizontal overlap and uncollected content remains available.

One `popObject()` helper reuses the selected object for a 300 ms growth/spark
response. It covers shapes, collected fruit, numbered carriages, balloons,
Abacus beads, Cave discoveries, finished pictures, drawing and colour choices.
Visible thumbnail updates follow the pop. Train holds its number/target until
the feedback ends and rejects repeated answers during that interval. Again,
navigation and new rounds cancel pending feedback. Existing 1,500 ms round
pauses include the Train pop rather than adding another delay. Reduced-motion
settings receive a static, smaller emphasis.

`node check-room-feedback.cjs` checks the sky outside Paint's object, clipped
strokes, each room's feedback/tick order, repeated Train input, cancellation,
fullscreen transitions and native animation. Its balloon matrix covers ages
2-5, four modes, three sizes and four screen layouts, including a visible
replacement in the same lane within 300 ms.

## v1.30 shared 1.5-second play pause

The “Well done! Wait for the next count.” hold is now 1,500 milliseconds.
Counting, final celebrations, shape batches, completed art pictures, Bubble
rounds, Number Train and Abacus replays use the same `PLAY_PAUSE_MS` constant.
The round scheduler accepts only a preparation callback, so individual games
cannot silently choose a different delay. Again/navigation still cancel it.
Cave retains its child-controlled open/close sequence; Demo narration retains
its spoken pacing.

`check-auto-replay.cjs` verifies progress is held at 1,400 ms and advances at
1,500 ms for every counting step and each kind of automatic play transition.
Set `REPLAY_IMMERSIVE=1` to repeat these checks in fullscreen. The real-time counting checks also measure the shorter hold.

## v1.29 ready artwork and fullscreen transitions

The same readiness function now covers every game's SVG pictures and board
background. A first visit shows a short loading message until the required images
have decoded; incomplete boards cannot receive gestures or start Demo. Failed
downloads offer Try again, and Games/navigation remain available. Completed image
decodes are retained and reused across layout changes and rounds. Leaving a room
invalidates its pending callback. Fullscreen preserves the current round and stops
an active Demo safely before changing its geometry.

The twelve counting/train PNG originals remain in the repository. Runtime WebP
copies retain full dimensions and exact alpha, reducing those downloads from
25,404,698 to 3,914,888 bytes (84.6%). Run `node optimize-game-art.cjs` to reproduce
them. The worker precaches the exact runtime copies. Board background URLs now
match the precache URL, avoiding a separate query-string fetch.

`node check-fullscreen-ready.cjs` checks delayed/failed downloads, retry, navigation
during loading, every age and game mode, repeated normal/fullscreen switches,
progress preservation and asset reuse in four viewports. It also measures real
animation-frame timings, with a four-times CPU slowdown in Chromium. Existing
counting, train, carrot-visibility, replay, Demo and offline checks use the new
runtime pictures.

## v1.28 automatic replay and visible Drag shapes

Completed rounds use one cancellable `scheduleNextRound()` function. Apple Basket
and Feed the Hungry Rabbit now celebrate their final collection and refill after
two seconds; each individual count still retains its three-second hold. Train,
Abacus, Drag, all four Bubble modes, and both art modes keep their previous replay
or next-picture delays. Cave retains its open/close sequence and wraps from the
last room to the first. Again remains an optional manual restart in every game.
Age/mode changes, Games, navigation, and Again cancel a pending replay. Finishing
an art collection clears its completion ticks before starting the first picture.

Shape Bubble thumbnails previously inserted duplicate `sanaShapeShadow` and
`sanaShapeSheen` IDs into every thumbnail. After leaving that game, browsers could
resolve Drag's effects to those now-hidden definitions, making its left-hand
pieces disappear even though their hit targets still existed. Flat thumbnails now
render only their geometry, leaving Drag's own effects as the unique definitions.

`node check-auto-replay.cjs` tests completion/replay across ages and modes, repeated
Shape Bubbles → Drag navigation, actual screenshot pixels, Demo cancellation,
cancelled gestures, portrait/landscape layouts, and timer cancellation. It uses
the same Playwright configuration as the counting checks; `MM_SHARP` optionally
selects the installed Sharp module for screenshot pixel checks.

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

Checks cover every Age 2 and Age 3 count, the full 1.5-second hold, delayed ticks,
extra/invalid/canceled drops, reset and age navigation, phone/tablet/desktop and
rotated touch input, immersive praise, Age 4/5 and Slide/Paint smoke flows, and
offline images/play. WebKit's local offline check stops the real local origin;
Chromium uses offline network emulation. Browser checks do not certify a physical
device installation.

`node check-lessons-demo.cjs` checks every counting stage, carriage, shape, cave
room, drawing in both art modes, age/bubble mode and abacus colour. It uses the
browser clock to exercise all those lessons quickly; geometry checks use rendered
targets, including rotated screens. The separate counting test measures the real
1.5-second play hold, cancellation and offline behaviour.

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

Well done finishes and holds for another 2,000 ms before the preview thumbnail ticks. Muted/unavailable speech keeps a readable text pause. Stop, Again, Games and age navigation cancel speech and pending steps; muting immediately stops the voice. A stalled engine has a bounded text fallback. Real counting uses the shared 1.5-second completion hold from v1.30.

`node check-demo-voice.cjs` controls delayed completion/error events to check no interruption, slow voice selection, deferred object motion, phrase gaps, praise timing, cancellation and fallback. Actual installed voices depend on the device. The full room-by-room Demo suite also checks the longer silent reading/praise timing.

## v1.23 simultaneous finger and voice

The finger points at the item as the instruction starts, with the SaNa message shown at the same time. Dragged objects still wait until the instruction and its short pause finish. The demo speech rate is 0.74, between the original 0.82 and v1.22's 0.65. The extra lead-in before speech is removed. Phrase gaps, readable text fallback, cancellation and the two-second pause after spoken praise remain.

Voice regression checks capture finger visibility and target alignment at the actual speech call, as well as its midpoint rate and uninterrupted completion.

## v1.24 fitted thumbnail rows

Every game uses a single fitted row of all available thumbnails. Column count comes from the current items, so the full alphabet (26), number set (20), shapes (20), drawings/rooms (up to 16) and every counting activity fit without horizontal scrolling. Tab widths, numbers, icons and ticks adapt to the available space. Drawing buttons remain selectable and keyboard focus is drawn inside the tab.

The existing 54px game thumbnail band and 46px counting band are preserved, so the picture area keeps its height. Active/completed styles remain, and Demo copies inherit the same fitted layout without auto-scrolling.

`node check-fitted-thumbnails.cjs` checks every age/game and full bubble set on nine phone/tablet/desktop viewports, including rotation, fullscreen, manual selection of the final drawing, Count 20 progression, and preview/restored rows. `THUMB_EVIDENCE` selects its screenshot and check output directory.

## v1.25 realistic Number Train

Age 4 now uses separate transparent AI-generated photographic-style locomotive and passenger-carriage assets. The game overlays its own readable numbers; the artwork contains no baked-in numerals. A responsive train layout uses the available play width on short phone screens, retains large tap regions and bold instructions, and redraws on resize. The 20 fitted thumbnails and existing spoken Demo remain.

The final counts now retain four unique carriage choices, including 20, rather than repeating the last value. Both image files are precached for offline play. Original count artwork and the install manifest remain unchanged. Assets and exact built-in image-generator prompts are under `docs/beta/train-art/generation.json`.

`node check-real-train.cjs` verifies the generated image references, seven viewport layouts, tap targets and numbers, all 20 stages, incorrect choices, Demo alignment/progress preservation, rotated touch, resize, decoded images and Chromium cold offline play. `TRAIN_EVIDENCE` selects its output folder.

## v1.26 colourful train and countryside

The realistic train now has a bright yellow/coral/turquoise engine and four differently coloured coaches: turquoise, yellow, coral and violet. Wheels and bogies are painted in bright colours and light silver instead of black. Edited sprites preserve the original train shapes and transparency; the original v1.25 files are kept. A new green-farmland/blue-sky photograph-style background fills only the Age 4 train play area. Light heading panels and outlined captions preserve readability over the scene.

The six new pictures are precached for offline play. Built-in image-generator edits/prompts and file names are saved in `docs/beta/train-art/generation-v126.json`. The number logic, touch targets, fitted thumbnail row and spoken Demo timing are preserved.

## v1.27 fixed train groups

Age 4 keeps each carriage and its number in place while the child completes a group. The groups are 1–4, 5–9, 10–13, 14–16 and 17–20; the next group appears only after the final correct answer in the current group. Five coaches fit together for 5–9, while the three-coach group retains the standard coach size. Number labels keep their readable size. Completed or incorrect numbers do not advance the target; Demo previews the current group without changing real progress.

`node check-real-train.cjs` now checks every group's fixed positions and tappable labels across all seven viewport sizes, group transitions through 20, keyboard/touch input, Demo in the five-coach group, restart and offline play. Screenshots wait for the artwork to decode before capture.

## v1.32 continuous balloon rows

Bubble Garden now keeps several rows travelling together instead of one balloon per horizontal lane. Body sizes fit multiple rows; row spacing includes the knot and full string. A bounded pool queues the next row below the field before the previous row exits. Popped balloons rejoin only when their lane has space. Every row uses the selected speed, so balloons cannot catch or touch the row above.

The four content choices share the speed/size settings row, releasing the old bottom toolbar's height for larger balloon targets. Short screens can scroll this settings row horizontally. The artwork, starter/full collections, saved preferences, shared selection feedback, Demo, and 1.5-second completion/replay pauses are preserved. Fullscreen and rotation reflow existing balloons without clearing collection progress. Fullscreen retains the normal view's visible balloon diameter and spacing for Small, Medium and Large; its extra area increases balloon quantity rather than doubling their size.

The current Beta is maintained directly in `docs/beta/`; the root prototype and `build-beta.mjs` still describe the older prototype and must not overwrite this published game. This release updates `docs/beta/app.js`, `play.html`, `index.html` and its worker together.

`node check-balloon-flow.cjs` checks actual rendered rows, body/string separation, bounded recycling over all three speeds, all four ages/content modes/sizes, short/rotated phone and tablet layouts, touch, fullscreen, reset and automatic replay. Use `PLAYROOM_BROWSER=webkit` for the second browser engine and `FLOW_EVIDENCE` for screenshots and results.

## v1.33 touch enlargement and counting scenery

Age 2 Apple Basket and Age 3 Feed the Hungry Rabbit now share the train's full countryside backdrop. The counting scene leaves that scenery visible through its panel. All ten collected carrots lie on the ground around the rabbit, clear of the running-count displays; Demo uses the same destination and orientation.

Shapes, apples, carrots and abacus beads enlarge while held and return to their fitted size on release or cancellation. Matched shapes stay visible in their pockets. Number Train uses smaller ordinary labels, an enlarged copy of the same selected numeral at approximately carriage size, and rails that reach both borders. These objects use enlargement without splash rays. Slide and Brush retain their existing effects and controls.

Each balloon remains visible for a short enlargement before its splash, removal and collection tick. Separate pending balloons can finish together, while repeated input on the same balloon is ignored. Again, navigation and hiding the page cancel pending effects. Completed collections retain their 1.5-second replay pause. The v1.32 continuous rows and stable fullscreen sizes are preserved.

`node check-touch-count.cjs` verifies rendered backgrounds, held-object geometry, normal-size recovery, carrot placement, train sizing/rails, the grow-then-splash sequence, concurrent input, cancellation and native animation. `TOUCH_EVIDENCE` selects the evidence folder.

## v1.34 free abacus and W balloon rows

The Age 5 rainbow/circle abacus is a counting monitor. Showing every colour, or moving all 100 beads, does not finish a game or schedule a reset. The beads and counts remain available for continued counting; Again still deliberately clears the board. Other games retain their completion and replay behaviour.

Balloon lanes use a gentle W-shaped vertical stagger. New and recycled rows retain this offset while all lanes travel at the existing speed, with the existing horizontal clearance, row spacing, sizes and fullscreen quantities. Touch enlargement, splashes, collections and Demo are unchanged.

`node check-abacus-wave.cjs` verifies long waits with one bead in every row and all 100 beads, continued forward/backward counting, manual reset, fullscreen/rotation, the W silhouette, consistent upward movement, separated bodies/strings across layouts and sizes, recycling and Demo alignment. `WAVE_EVIDENCE` selects its output folder.


## v1.35 larger balloons and clearer counting

All three balloon sizes have 20% larger rendered diameters than v1.34. Existing lane and row geometry uses the larger radius to reduce the pool where necessary. The W stagger, travelling speed, stable fullscreen sizes, grow-then-splash feedback and collection rules remain unchanged.

Apple, Rabbit and the Age 5 Abacus use the original mint-green across the complete play area in normal and fullscreen views. The Age 4 train retains its farmland. The abacus moves its rainbow/circle upward and provides a taller two-cell SUM/TOTAL table. Long sums wrap after five rows and fit within their own cell, including all 100 beads. Counting remains free with manual Again.

The normal toolbar places fullscreen before vibration. Expanded play places vibration above the fullscreen return square, and the fullscreen controls share the normal blue/green palette. Existing sound, vibration, exit, navigation, Slide and Brush behaviour is retained.

`node check-count-layout.cjs` compares rendered balloon sizes to v1.34, checks backgrounds and control order/colours, and verifies abacus text containment at 100 beads in normal/fullscreen layouts across phone, portrait and tablet viewports. `LAYOUT_EVIDENCE` chooses the evidence folder.


## v1.36 Apple and Rabbit countryside correction

Age 2 Apple and Age 3 Rabbit now share the Age 4 train's complete green countryside artwork, with the same cover positioning in normal and fullscreen play. The flat green override is restricted to the Age 5 abacus. Balloon sizing/formation, counting behaviour, SUM/TOTAL layout and controls are unchanged.


## v1.37 keep harvest counts clear of the controls

In fullscreen, vibration sits on the bottom row immediately left of the fullscreen return square. Apple and Rabbit reserve this bottom row so neither control covers the collected count. Normal toolbar order, toggle behaviour, countryside backgrounds and gameplay are unchanged.


## v1.38 one countryside theme for every playroom

Every age and activity now uses the train's full green countryside backdrop, in normal and fullscreen play: Shapes, Balloons, Slide, Brush, Paint and all counting rooms including Age 5 Abacus. Slide retains its door and revealed objects while its separate cave photograph/dark room overlay is removed so the common landscape remains visible outside the door. Unused planet/cave backdrop downloads are removed from the new offline cache.

The bottom-right fullscreen return square and vibration switch to its left remain consistent across all games. Every fullscreen room reserves a clear bottom row beneath its game field, protecting Abacus labels and game objects as well as Apple/Rabbit counts. Sizes, W rows, touch effects, game rules and timing are retained. Layout tests cover every age/game/mode in both views; room feedback, artwork loading, fullscreen size and installed/offline checks verify the shared background without changing interactions.


## v1.39 visible running version

The welcome page's version beside Update, the Update button in the Games menu/every room, and a passive fullscreen badge all identify the loaded page release. Compact headers stack the number beneath Update without widening the controls. Fullscreen shows the version at the left of the existing clear bottom row. The label follows the page metadata and stays on the running version while a newer worker downloads, changing only when that update is applied. Game logic, theme and controls are retained.


## v1.40 centred transparent text panels

Train title/target headings, carriage numerals, harvest instructions/praise/counters, Slide captions and Abacus sum/total/colour labels are centred within their areas. Noninteractive text-panel fills, progress-tab fills and status/hint backdrops are transparent; light text outlines preserve readability over the countryside. Progress borders/checkmarks, action-button colours, artwork, the painting surface and the bead board remain distinct. Text content, counting rules, feedback and replay timing are retained.

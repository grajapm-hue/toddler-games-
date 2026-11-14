# SaNa Little Hands — playable prototype

A separate landscape HTML playroom with freely selectable starting sets for ages 2–5. Parents choose any age and any activity level for shared fun; the sets are not ability grades. This prototype is ready for family feedback; it has not been added to the MathMatrix Main or Beta menus.

## Installable Beta

Beta v1.68 uses an upright responsive layout in portrait and landscape on phones, tablets and laptops. All six games appear together. Safe-area insets protect controls; the former fixed camera gutter and forced rotated frame apply only to the legacy standalone prototype. The welcome and game pages release orientation locks and the Beta manifest permits either orientation. Rotation keeps the current round.

The first page keeps the six existing games. **More games → Blocks** opens Glossy Blocks with ten categories, expanded age 2–5 collections, tap/drag/keyboard building, colours, patterns and the shared Demo, Again, settings and navigation. Equal Stores and Assemble panes sit side by side in landscape and stack in portrait. Ages 2–5 use 2×2/4 blocks, 3×3/9, 4×4/16 and 6×6/36. Landscape fits every row without scrolling. Mixed immediately follows Plain and contains solid silhouettes from Drag Shapes: 4 at age 2, 12 at age 3 and all 20 at ages 4 and 5. Stores never wrap back to identical choices: Small, Wide and Tall vector variants fill spare page slots. Original age catalogues remain available. The variants share the existing glossy finish; their picture and word content retains correct proportions. Source, drag preview and placed artwork use the same drawing scale. Free placement is the default and uses the whole Assemble window, including the space beside the age grid. Shapes can touch, overlap and interlock without collision rejection or magnetic resistance. Optional Grid fits new and moved pieces inside cells while preserving the existing arrangement when toggled. Rotate turns the selected piece 45° clockwise per tap (keyboard R); Grid mode fits rotated artwork within its cell, while Free mode keeps the original size. Rotation of the device fits the construction without changing piece coordinates or angles. Rotation releases active touch capture and keeps completed construction. Local SVG illustrations work consistently offline. The install manifest and existing saved-data keys remain unchanged.

The maintained Beta lives directly in **docs/beta/**. Edit those files for Beta changes. The legacy `build-beta.mjs` generator predates the current Beta and must not overwrite it. The original standalone game remains available for local testing.

For a local hosted trial, run `node serve.mjs 8778 docs` and open `http://127.0.0.1:8778/beta/`.

Publish GitHub Pages from **main → /docs**. The intended Beta URL is `https://grajapm-hue.github.io/toddler-games-/beta/`. See `BETA-RELEASE.md` for installation, checks and deployment status. Main release is a later step.

The Beta welcome screen includes **Share app** for parents, teachers and supervisors. Sharing stays on that opening screen. The options are WhatsApp, Copy link, and the device share menu when available. Share the link with your test group so members can try installation and each activity and reply to you with feedback.

## Welcome screen: preview 01

Start with **welcome-preview.html** for the MathMatrix-inspired responsive welcome screen. Phones use a portrait-shaped frame, rotated inside a landscape viewport when needed; the phone's status bar may remain at the side, as accepted in the supplied reference screenshots. Tap to play opens the existing landscape game file. Keep this folder together. Install app in this preview explains the Beta installation; About opens the app information.

This is the first screen for discussion. The activities remain unchanged. The new repository is [grajapm-hue/toddler-games-](https://github.com/grajapm-hue/toddler-games-). The installable Beta now builds from this preview; see `PREVIEW-NOTES.md` for the earlier design scope.

## Play

Open **SaNa-Little-Hands-Prototype.html** for the self-contained version. Its illustrations, styles and game code are embedded, so it works without an internet connection. Use a finger on a touchscreen or click and drag with a mouse/trackpad.

The editable version is **index.html**, **age-profiles.js**, **app.js** and the local icon/manifest files in this folder. Open index.html directly, or serve the folder over HTTP/HTTPS. No build or account is needed.

With Node.js available, run `node serve.mjs` in this folder and open `http://127.0.0.1:8776/`. Run `node build.mjs` after source changes to regenerate the self-contained HTML.

## Levels

Parents can choose ages **2, 3, 4 or 5** on the portrait welcome or in the landscape game-menu header. Every set contains Drag, Tap, Slide, Brush & paint, and Count, with Explore / Play / Challenge freely available. The age selector is hidden inside game rooms. Each age remembers its own level and explicit bubble settings. If no age is chosen, **Family play** retains the earlier common settings listed below. Age selection can travel through the local page URL when storage is unavailable; no age or birth date is sent to an account service.

The shared **age-profiles.js** registry defines starting object counts, pace, picture/paint targets and optional bubble collections. **Full set** above the bubble board keeps all numbers 1–20, letters A–Z and six shapes available at every age. Count retains all 100 beads and unrestricted movement; its age-slot sub-levels offer optional counting ideas. No rankings, locked levels or failure labels are added. Smaller screens below 350 logical pixels of play height use a slim guidance row and hide the redundant game header so the black board remains playable.

- **Explore:** two large shapes, four large bubbles, one reveal slider, a simple fish with four muddy patches and a large brush. Painting about half the fish earns the reward.
- **Play — guided play:** four shapes, six bubbles, two sliders, the puppy with eight muddy patches and a medium brush. Painting about two thirds earns the reward. This is the Family play default.
- **Challenge:** six shapes, nine faster rising bubbles, three sliders, a detailed butterfly with fourteen muddy patches and a small brush. Painting about four fifths earns the reward.

The level labels describe activity difficulty. A grown-up can choose whichever level feels comfortable.

The playroom fills the available screen. The home introduction is a single row at the same font size as the hint above, without the decorative picture, leaving the four game cards more space. SaNa's guidance, Show me and Again sit above the menu or game. Bubble speed/size and art tools sit above the table; the active sub-level choices sit at its top right, with a rectangular result box at the top left. Larger dark bold labels and filled green, yellow, blue and peach controls keep the choices readable. Dedicated rows keep the results, choices, animation and navigation separate so controls cannot cover gameplay.

Above the Bubble Garden table, **Speed: Slow / Medium / Fast** and **Size: Small / Medium / Large** can be changed while playing. Existing bubbles resize immediately, and changing either setting keeps the current collection. The choices apply to all four content modes and are remembered in this browser. Until a setting is chosen, the selected level supplies its default; an explicit choice also stays in effect when changing levels. Large bubbles fit the available space on short screens.

## Count — Rainbow abacus

All 100 beads are available immediately, in any row and in both directions. Slide a single bead or push neighbouring beads together, like a basic abacus. Each row counts the beads on the right from 0 to 10. Its label shows the numeral, English number word and colour: **5 Five Red**, **10 Ten Blue**, or **0 Zero White**. The small number beside the row also shows its actual count.

The seven rainbow bands retain Red, Orange, Yellow, Green, Blue, Indigo and Violet order. The circle remains pink outside, white in the middle and brown at the centre. A region fills when that row has beads on the right; returning them all left makes it black again. All ten colour labels are visible from the start at 0 Zero. Each numeral and number word updates as that row moves, and reset returns every label to zero. Numbers stay below the drawings, not inside them.

Counts and words update as a pushed group crosses the centre; release settles it at the corresponding end. A short or cancelled slide restores the prior count. All ten colours trigger SaNa’s congratulations and optional applause, while every bead remains movable. Clearing a row makes that colour available to complete again. Again clears the whole puzzle; rotation and fullscreen keep counts.

ArrowRight/End and ArrowLeft/Home move the selected bead and its neighbours to the corresponding side; Enter/Space switches sides. Games, Back and Front keep their existing navigation. This is one free-counting puzzle, so the other games’ difficulty buttons are hidden.

`node check-abacus.mjs` checks all 100 beads forwards and backwards with touch/pointer gestures, grouped and single moves, actual 0–10 numerals/words, arbitrary row order, stable bead nodes, immediate movement before release, final-position-only releases, cancellation, colours/zero, keyboard support, completion/reset and five normal/fullscreen screen sizes. `ABACUS_URL` selects a hosted play page; evidence is under ignored `artifacts/abacus/`.

## Activities

**Picture Puzzle:** choose a picture from the device or play with the AI illustration of SaNa eating a banana. Ages 2, 3, 4 and 5 use 2×2, 3×3, 4×4 and 5×5 grids. Two equal panels show every scrambled fragment on the left and a blank picture grid on the right. Touch a piece to highlight its matching pocket, then drag it onto the right grid; it gently snaps into its correct position. Releasing outside the grid returns it to the left. Tapping a piece and then the right grid, or using the keyboard, also works. Look previews the complete picture without changing progress. Numbers are optional. Again reshuffles all pieces back to the left. Fullscreen and rotation preserve placed pieces; Demo holds for one second and previews one drag on copies. The completed picture stays visible on the right. There are no timers, rankings or wrong-answer penalties. Seven equal-sized tabs keep the photo, preview, numbers, SaNa picture, Again, grid and placed count together.

Picture Puzzle's top row is a picture gallery. Add several images at once and choose any thumbnail, including SaNa. Switching pictures keeps each picture's placed pieces during play, and completed pictures receive a tick. The title and grid/placed summary sit below the SaNa tab, between the panel headings. The Picture, Look, Numbers, SaNa, Again, Grid and Placed controls retain their uniform sizes. The gallery can scroll for a larger collection, and its Remove control removes only the selected saved copy from this game.

Remove remains available whenever personal photos exist, including while SaNa is selected or a picture is still loading. With SaNa open, tap Remove, then a photo marked ×; Cancel returns to normal choices. Removing an inactive photo keeps the current puzzle and its progress. A stuck picture load can be cancelled through Remove, and an unreadable photo can be deleted without opening it. Removing the selected photo keeps the existing direct action, with SaNa as a fallback if the next photo cannot open. When only SaNa remains, a locked **Built-in** label explains why that picture stays. Removal affects only the game's saved copy, and works offline.

Selected images are resized locally and the gallery plus selected image are retained in this browser's IndexedDB for offline reopening. Existing single-photo selections migrate into the gallery. Selecting SaNa keeps the personal pictures available. No photo is sent to a server. Without optional storage, multiple-picture choice still works for the visit. Run `node check-picture-gallery.cjs` for gallery, photo storage and layout checks and `node check-picture-puzzle.cjs` for the two-panel game checks.

1. **Drag — Shape picnic:** move each shape onto its matching shadow. Tapping a shape and then its shadow also works.
2. **Tap — Bubble garden:** choose Plain, 1–20, A–Z or Shapes. Bubbles rise continuously from random positions. Tap or sweep to splash and pop them; new bubbles enter from below. The matching number, letter or shape in the top list turns the popped bubble's exact color. Missed items return until the full set is collected, then SaNa cheers and play continues. Plain keeps a pop count and recent colors. Explore has four slower, larger bubbles; Play has six; Challenge has nine faster bubbles. Again clears the current collection.
3. **Slide — Peek-a-boo friends:** move the sunny handles along their tracks to reveal the fox, owl and frog.
4. **Brush & paint — Little art studio:** Explore shows a fish, Play a puppy and Challenge a butterfly in both modes. Choose Small, Medium or Large for cleaning and painting. Finger paint stays inside the selected picture. Use Eraser to remove paint, then choose a color to paint again. SaNa congratulates you when the level's coloring goal is reached, with applause when sound is on. Again starts a fresh picture.

5. **Count — Rainbow abacus:** freely slide beads in any row to colour the rainbow and circle; each label shows the actual count as a numeral and a word.

**Back** and **Front** sit at the bottom corners of every black game field, including fullscreen. They step through the three levels and each game’s modes, then move to the previous/next game. Beyond the first or last step they return to the activity pictures. **Games** in the bottom center and **Home** return directly to those pictures. **Again** resets the current round or clears the painting. **Show me** gives a visual hand hint. The sound button toggles gentle generated tones; sound starts off. The last level and sound preference are stored only in this browser when storage is available. There are no ads, sign-ins, trackers, external fonts or external media downloads.

The opening screen’s About panel follows the Kids Puzzle Library card style: current SaNa games and levels, screen brightness/break guidance, creator and team credits, and a Feedback & Suggestion email link. The close button stays available while the content scrolls.

## Landscape and installation

The app uses a landscape play frame. In a portrait viewport the frame rotates, and pointer positions are mapped through the SVG screen transform so finger gestures continue to work. Rotating the device to landscape uses the screen normally. The fullscreen button expands the current game to the entire play frame, hiding the header, hints and the outer settings. Results and active sub-level choices remain at the top of the black game field. Back and Front occupy its bottom corners; Games, sound and Exit fullscreen sit between them, and exiting restores the same round and settings. From the menu, choose a game to start immersive play. The button uses in-page expansion without requesting native browser fullscreen or orientation lock, so it does not trigger the browser fullscreen URL notice. Escape or the Exit fullscreen button restores the normal layout. Browser and status bars may remain visible.

When the editable folder is hosted over HTTPS or localhost, its manifest requests landscape standalone display, and its service worker caches the local app for offline use after the first successful load. The worker's scope and cache names belong to this prototype folder. Installation and native orientation behavior still need checking on the family's actual iPhone/iPad and Android devices. A home-screen installation is optional for testing.

The installed prototype serves its versioned files from cache. Increment the cache version in `sw.js` when publishing a later revision.

## How to Play

The game-choice header shows one **Age 2 to 5** label and a **How to Play** dropdown beside Update. Its common notes explain choosing games, browsing the cards and shared settings. Choose a specific age after entering a game; changing age still begins that age's round.

**Back to first game** and **Go for new games** sit together below the sound controls in the menu's tips row. Back returns directly to the first card and is disabled at the beginning. Forward reveals more cards and shows **All games shown** at the end. The small arrows and swiping still work. Both labelled controls are hidden during play. On narrow menus the pair uses the tips space to preserve card sizes.

Each game opens its own parent cheat sheet, with visual copies of the actual controls and short instructions. Count follows the selected age, and the art guide follows Brush clean or Finger paint. Fullscreen has its own How to Play button in the reserved bottom control space. The guide ends any Demo, blocks background input while open, traps keyboard focus, and returns focus when closed. Existing play progress stays in place. The guide files are available offline with the rest of the game. Run `node check-parent-guide.cjs` for responsive, focus, context and progress checks.

## Developer checks

`node check-board.mjs` checks in-board placement, non-overlap and playable room across all games at five screen sizes, plus the complete 25-step Front/Back sequence and its boundaries. `BOARD_URL` selects a hosted play page. `node check-parents.mjs` checks larger welcome labels, the scrollable About cards and credits/contact link, sharing confined to the opening screen, and Back navigation in every game at five screen sizes. `PARENTS_URL` selects a hosted welcome page. `node check-immersive.mjs` verifies the compact home row, larger game cards, black game backgrounds, fullscreen geometry, floating controls, game input and preserved progress, browser exit, and the native-fullscreen fallback across five screen sizes. `IMMERSIVE_URL` selects a hosted play page. `node check-playroom.mjs` uses Playwright to exercise the actual interface. `node check-art.mjs` checks picture clipping, brush sizes, erasing and repainting using rendered pixels, completion/reset, cleaning reach and responsive controls. `node check-bubbles.mjs` checks rising motion, touch popping, splash cleanup, exact matching colors, complete number/letter/shape collections, continued play, fixed bubble counts and responsive lists. `node check-bubble-settings.mjs` checks measured travel at different speeds, immediate resizing, collection preservation, all four content modes, persistence and responsive controls. Set `MM_PLAYWRIGHT` to the installed Playwright test module when it is not available locally. `MM_CHROME` can select a Chromium executable. `PLAYROOM_BROWSER=webkit` selects Playwright WebKit. `ART_URL` and `BUBBLES_URL` select a hosted play page for their respective checks.

Screenshots and test evidence are written to `../artifacts/toddler-playroom/`. The test covers matching, popping, reveal sliders, cleaning, painting/reset, three levels, touch gestures, landscape and the rotated portrait frame. Browser emulation does not replace a child's hands-on device trial.

The installed-cache check uses network-offline emulation in Chromium. Playwright WebKit has a documented [offline-emulation limitation](https://github.com/microsoft/playwright/issues/42775), so its check stops the actual local origin server and requires the cached playroom to load and reload without that server. The self-contained HTML is checked with HTTP unavailable in both engines. These are distinct browser-test controls, not physical iOS installation certification.


The play frame reserves a fixed 64px margin before the left play border on every device, including rotated portrait and fullscreen. It also honors larger reported device safe-area insets, without trying to detect camera positions. SaNa appreciation is centered in its own top row above the results and controls. `node check-camera.mjs` verifies both layouts across five sizes and simulated cutouts.


The Beta welcome page offers **Update app** beside the version badge; the game-choice home header also has a brown **Update** button beside SaNa, matching the supplied reference. It checks online, waits until the new release is fully downloaded, then refreshes the current welcome or game-choice home page. Automatic checks remain enabled; open games keep their progress. The header Update button is hidden during games, and entering a game while an update downloads prevents any automatic reload or dialog interruption. Offline or failed checks keep the previous playable release and allow retry. `node check-updates.mjs` verifies real service-worker updates, failures, offline use, saved settings and responsive layout in Chrome/WebKit.


Expanded play stays within the page so the browser fullscreen URL notice is not triggered; browser/status bars may remain. Long-press selection, context menus and native dragging are disabled on SaNa text and dialogs from first paint, even while the main script loads, while gameplay gestures, dialog scrolling and intentional parent controls remain available. Explicit Copy link still works, including the compatibility clipboard path. `node check-quiet-play.mjs` tests the touch guards and quiet expansion; actual iPhone/Android OS menus remain device-specific.

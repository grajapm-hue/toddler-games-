# SaNa Little Hands — playable prototype

A separate landscape HTML playroom, mainly for ages 2–4, with simpler and harder activity levels. This prototype is ready for family feedback; it has not been added to the MathMatrix Main or Beta menus.

## Installable Beta

The Beta site is built into **docs/beta/**. Run `node build-beta.mjs` after editing the prototype or `beta-runtime/` sources. The original standalone game remains available for local testing.

For a local hosted trial, run `node serve.mjs 8778 docs` and open `http://127.0.0.1:8778/beta/`.

Publish GitHub Pages from **main → /docs**. The intended Beta URL is `https://grajapm-hue.github.io/toddler-games-/beta/`. See `BETA-RELEASE.md` for installation, checks and deployment status. Main release is a later step.

The Beta welcome screen includes **Share app** for parents, teachers and supervisors. Sharing stays on that opening screen. The options are WhatsApp, Copy link, and the device share menu when available. Share the link with your test group so members can try installation and each activity and reply to you with feedback.

## Welcome screen: preview 01

Start with **welcome-preview.html** for the new MathMatrix-inspired landscape welcome screen. Keep this folder together: Tap to play opens the existing self-contained game file. Install app currently explains the planned Beta installation; About opens the app information.

This is the first screen for discussion. The activities remain unchanged. The new repository is [grajapm-hue/toddler-games-](https://github.com/grajapm-hue/toddler-games-). The installable Beta now builds from this preview; see `PREVIEW-NOTES.md` for the earlier design scope.

## Play

Open **SaNa-Little-Hands-Prototype.html** for the self-contained version. Its illustrations, styles and game code are embedded, so it works without an internet connection. Use a finger on a touchscreen or click and drag with a mouse/trackpad.

The editable version is **index.html** plus **app.js** and the local icon/manifest files in this folder. Open index.html directly, or serve the folder over HTTP/HTTPS. No build or account is needed.

With Node.js available, run `node serve.mjs` in this folder and open `http://127.0.0.1:8776/`. Run `node build.mjs` after source changes to regenerate the self-contained HTML.

## Levels

- **Explore:** two large shapes, four large bubbles, one reveal slider, a simple fish with four muddy patches and a large brush. Painting about half the fish earns the reward.
- **Play — ages 2–4:** four shapes, six bubbles, two sliders, the puppy with eight muddy patches and a medium brush. Painting about two thirds earns the reward. This is the default.
- **Challenge:** six shapes, nine faster rising bubbles, three sliders, a detailed butterfly with fourteen muddy patches and a small brush. Painting about four fifths earns the reward.

The level labels describe activity difficulty. A grown-up can choose whichever level feels comfortable.

The playroom fills the available screen. The home introduction is a single row at the same font size as the hint above, without the decorative picture, leaving the four game cards more space. SaNa's guidance, Show me and Again sit above the menu or game. Bubble speed/size and art tools sit above the table; the active sub-level choices sit at its top right, with a rectangular result box at the top left. Larger dark bold labels and filled green, yellow, blue and peach controls keep the choices readable. Dedicated rows keep the results, choices, animation and navigation separate so controls cannot cover gameplay.

Above the Bubble Garden table, **Speed: Slow / Medium / Fast** and **Size: Small / Medium / Large** can be changed while playing. Existing bubbles resize immediately, and changing either setting keeps the current collection. The choices apply to all four content modes and are remembered in this browser. Until a setting is chosen, the selected level supplies its default; an explicit choice also stays in effect when changing levels. Large bubbles fit the available space on short screens.

## Activities

1. **Drag — Shape picnic:** move each shape onto its matching shadow. Tapping a shape and then its shadow also works.
2. **Tap — Bubble garden:** choose Plain, 1–20, A–Z or Shapes. Bubbles rise continuously from random positions. Tap or sweep to splash and pop them; new bubbles enter from below. The matching number, letter or shape in the top list turns the popped bubble's exact color. Missed items return until the full set is collected, then SaNa cheers and play continues. Plain keeps a pop count and recent colors. Explore has four slower, larger bubbles; Play has six; Challenge has nine faster bubbles. Again clears the current collection.
3. **Slide — Peek-a-boo friends:** move the sunny handles along their tracks to reveal the fox, owl and frog.
4. **Brush & paint — Little art studio:** Explore shows a fish, Play a puppy and Challenge a butterfly in both modes. Choose Small, Medium or Large for cleaning and painting. Finger paint stays inside the selected picture. Use Eraser to remove paint, then choose a color to paint again. SaNa congratulates you when the level's coloring goal is reached, with applause when sound is on. Again starts a fresh picture.

**Back** and **Front** sit at the bottom corners of every black game field, including fullscreen. They step through the three levels and each game’s modes, then move to the previous/next game. Beyond the first or last step they return to the activity pictures. **Games** in the bottom center and **Home** return directly to those pictures. **Again** resets the current round or clears the painting. **Show me** gives a visual hand hint. The sound button toggles gentle generated tones; sound starts off. The last level and sound preference are stored only in this browser when storage is available. There are no ads, sign-ins, trackers, external fonts or external media downloads.

The opening screen’s About panel follows the Kids Puzzle Library card style: current SaNa games and levels, screen brightness/break guidance, creator and team credits, and a Feedback & Suggestion email link. The close button stays available while the content scrolls.

## Landscape and installation

The app uses a landscape play frame. In a portrait viewport the frame rotates, and pointer positions are mapped through the SVG screen transform so finger gestures continue to work. Rotating the device to landscape uses the screen normally. The fullscreen button expands the current game to the entire play frame, hiding the header, hints and the outer settings. Results and active sub-level choices remain at the top of the black game field. Back and Front occupy its bottom corners; Games, sound and Exit fullscreen sit between them, and exiting restores the same round and settings. From the menu, choose a game to start immersive play. The button requests native browser fullscreen and landscape lock where available; an in-page mode remains usable when native fullscreen is unavailable or denied. Escape or a native browser exit restores the normal layout. Browser and operating-system support varies.

When the editable folder is hosted over HTTPS or localhost, its manifest requests landscape standalone display, and its service worker caches the local app for offline use after the first successful load. The worker's scope and cache names belong to this prototype folder. Installation and native orientation behavior still need checking on the family's actual iPhone/iPad and Android devices. A home-screen installation is optional for testing.

The installed prototype serves its versioned files from cache. Increment the cache version in `sw.js` when publishing a later revision.

## Developer checks

`node check-board.mjs` checks in-board placement, non-overlap and playable room across all games at five screen sizes, plus the complete 24-step Front/Back sequence and its boundaries. `BOARD_URL` selects a hosted play page. `node check-parents.mjs` checks larger welcome labels, the scrollable About cards and credits/contact link, sharing confined to the opening screen, and Back navigation in every game at five screen sizes. `PARENTS_URL` selects a hosted welcome page. `node check-immersive.mjs` verifies the compact home row, larger game cards, black game backgrounds, fullscreen geometry, floating controls, game input and preserved progress, browser exit, and the native-fullscreen fallback across five screen sizes. `IMMERSIVE_URL` selects a hosted play page. `node check-playroom.mjs` uses Playwright to exercise the actual interface. `node check-art.mjs` checks picture clipping, brush sizes, erasing and repainting using rendered pixels, completion/reset, cleaning reach and responsive controls. `node check-bubbles.mjs` checks rising motion, touch popping, splash cleanup, exact matching colors, complete number/letter/shape collections, continued play, fixed bubble counts and responsive lists. `node check-bubble-settings.mjs` checks measured travel at different speeds, immediate resizing, collection preservation, all four content modes, persistence and responsive controls. Set `MM_PLAYWRIGHT` to the installed Playwright test module when it is not available locally. `MM_CHROME` can select a Chromium executable. `PLAYROOM_BROWSER=webkit` selects Playwright WebKit. `ART_URL` and `BUBBLES_URL` select a hosted play page for their respective checks.

Screenshots and test evidence are written to `../artifacts/toddler-playroom/`. The test covers matching, popping, reveal sliders, cleaning, painting/reset, three levels, touch gestures, landscape and the rotated portrait frame. Browser emulation does not replace a child's hands-on device trial.

The installed-cache check uses network-offline emulation in Chromium. Playwright WebKit has a documented [offline-emulation limitation](https://github.com/microsoft/playwright/issues/42775), so its check stops the actual local origin server and requires the cached playroom to load and reload without that server. The self-contained HTML is checked with HTTP unavailable in both engines. These are distinct browser-test controls, not physical iOS installation certification.

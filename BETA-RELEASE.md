# SaNa Little Hands Beta v0.14

The Beta site is published using GitHub Pages from `main` → `/docs`. Version 0.14 removes abacus row locks, supports responsive grouped slides in both directions and displays each actual count as a numeral and English word; verify the Pages build commit and run the live checks after publishing each update.

## Free abacus counting

All ten rows and all 100 beads work in either direction, including rows already coloured. A dragged bead pushes neighbouring beads without passing them. Single beads and groups settle across the centre to the chosen end. The row counter, result box and colour label show the actual count from 0 to 10, including its word: 5 Five Red, 10 Ten Blue, 0 Zero White. Untouched labels start blank; zero remains visible after a row is used and cleared.

Rainbow order and circle regions are unchanged. A positive row count fills its region; zero returns it to black. All ten colours earn SaNa’s congratulations and optional applause, without locking any beads. Again resets the puzzle. Counts survive resize/fullscreen; the game remains the 25th navigation step.

The previous version disabled completed and future rows, rebuilt all bead nodes after a slide, and trusted the last move event rather than the release position. The repair keeps bead nodes stable, caches gesture geometry and element references, updates only the moving row and relevant labels, picks the nearest bead, and handles a final position delivered on pointerup. It does not rebuild the scene for ordinary counting. Count text stays fully visible immediately, using a small pulse instead of fading out after release.

`node check-abacus.mjs` moves every bead forward and backward in arbitrary row order, verifies 0–10 numerals/words and colour changes, groups moving before release, stable DOM nodes, final-position-only input, short/cancelled slides, keyboard, reward/reset, resize and five screen sizes in normal/fullscreen. `ABACUS_URL` selects a hosted play page. Beta cache v14 updates existing installations online.

## Welcome and About

The opening-screen family label, small SaNa/monkey, title’s SaNa label and age/offline notes use larger bold type. About uses scrollable cream cards with current activities, parent guidance, G.RajaPathamuthu / Kids Puzzle Library, JNT and AI-Assistances credits, the supplied motto, current version and the existing feedback address. It does not claim a separate Feedback tab. Its close button stays visible while the contents scroll.

`node check-parents.mjs` checks five screen sizes, About scrolling/focus/contact, welcome-only sharing and Back in all five games. `PARENTS_URL` selects a hosted welcome page.

## Board navigation and results

Every game has a rectangular result box at the top left and its active sub-level choices at the top right of the black board. Explore/Play/Challenge move into that box of choices during play and return to the header on the menu. Bubble contents and brush modes are shown only in their relevant game, including fullscreen. Bubble collections remain below the top row.

Back is at the board’s bottom left, Front at its bottom right. They visit the levels and available modes within each game, continuing to the neighboring game at the ends: three Drag steps, twelve Bubble steps, three Slide steps and six Brush/Paint steps, followed by one Count puzzle. Passing either end of the full sequence returns to the menu. Games returns there directly. Sound and fullscreen controls sit alongside Games. The toolbar, animation and navigation occupy separate rows to prevent overlap.

`node check-board.mjs` checks all five games at five sizes in normal and fullscreen modes, control bounds, non-overlap, appropriate modes, room to play, and both directions through all 25 steps. `BOARD_URL` selects a hosted play page.

## Immersive play

The home introduction uses one row at the same size as the hint above it. The decorative picture and eyebrow are removed, leaving the four game cards the remaining space. Every animated game field has a black background; painting retains its light paper.

Fullscreen hides the main header, instructions and outer speed/size or art settings. Results and active sub-level choices remain inside the top of the black board. The bottom navigation row keeps Back, Front, Games, sound and Exit fullscreen clear of gameplay. Games leaves fullscreen and returns to the activity menu; Back and Front continue through the game steps. Gameplay continues and exiting restores the same round, collected colors, painting and settings. The menu can also enter fullscreen before a game is chosen. Supported browsers use native fullscreen and attempt landscape lock; otherwise in-page immersive play remains available. The exit button, Escape and native browser exit restore the regular layout.

`node check-immersive.mjs` checks five viewport sizes in Chrome and WebKit, real native entry/exit, sound, full-field geometry, touch popping, matching, revealing, painting, preserved progress and fallback when native fullscreen is denied or unavailable. `IMMERSIVE_URL` selects a hosted play page. Beta cache v14 updates existing installations online.

## Screen layout

SaNa's hints, Show me and Again are above both the home menu and games. Bubble speed/size and art tools are above their tables, with no bottom control strip. The playroom fills the available viewport, removing the desktop size cap and outer inset. Compact headers, smaller outer padding and a combined wide-screen bubble toolbar give the table more space. Labels use larger dark bold type, and green, yellow, blue, peach and purple boxes distinguish choices while preserving collected bubble colors.

`node check-layout.mjs` verifies guidance and controls above the board, use of the bottom edge, readable type, control bounds and art tool placement at phone, small-phone, rotated, tablet and wide-screen sizes. `LAYOUT_URL` selects a hosted play page. `LAYOUT_BASELINE=1` records local before measurements for comparison; evidence is stored under ignored `artifacts/layout/`. Beta cache v9 updates existing installations online.

## Rising bubbles

Choose Plain for free popping with a counter, or collect all numbers 1–20, uppercase letters A–Z or six shapes. Bubbles rise from randomly varied positions in a fixed pool of four, six or nine according to level. Touch, mouse or keyboard pops a bubble into colored droplets, removes it, then brings a new bubble from below. The matching top-list item takes that exact bubble color; duplicates cannot complete a different item. Uncollected content is prioritized and missed content returns. Completing a set triggers SaNa's congratulations while bubbles continue rising. Again resets the current collection. Home, Back and hidden pages stop animation.

Above the play area, Speed offers Slow, Medium and Fast; Size offers Small, Medium and Large. Both apply immediately to the existing bubbles without clearing collected items or changing their colors. Explicit choices survive mode changes, Again, level changes and reload, using optional browser-local settings. Unchosen settings follow the level default. The size scales the contents and touch hit area together and fits short phone play fields. Overlapping bubbles use the actual tapped bubble for exact matching.

`node check-bubbles.mjs` exercises upward movement, actual touch pops, splash spread/cleanup, exact target colors, complete sets, continued play and bounded bubble counts, difficulty levels and responsive target lists. `node check-bubble-settings.mjs` measures motion over equal time intervals, checks resizing of the same bubble, collection preservation, mode independence, persistence and responsive controls. Set `BUBBLES_URL` to the hosted play page for live checks. Beta cache v8 updates existing installations online.

## Painting

Explore uses a simple fish, four muddy patches, a large default brush and a 50 percent painting goal. Play uses the puppy, eight patches, a medium brush and a 65 percent goal. Challenge uses a detailed butterfly, fourteen patches, a small brush and an 80 percent goal. Both cleaning and painting follow the level; the heading, home card, hints and reward name the selected picture. Changing levels starts a fresh round and sets that level's default brush.

Small, Medium and Large select the actual brush size without clearing the picture. Paint is clipped to the current picture silhouette; gestures starting on the blank paper add no paint. Eraser removes existing paint while preserving the outline, and choosing any color resumes painting over erased areas. Reaching the level's painting goal triggers a SaNa congratulations badge and stars, with generated applause when Sound is on. The reward occurs once per round, and Again clears the painting and progress. Beta cache v6 updates installed copies after they reconnect online.

`node check-art.mjs` checks actual SVG pixels for picture boundaries and erasing/repainting, selected brush size, completion/reset, cleaning reach and phone/tablet/rotated layouts. Chromium uses touch input; WebKit uses pointer input. Set `ART_URL` to the hosted play page for live checks.

## Share with a testing group

On the welcome screen choose **Share app**. Share controls are confined to that opening screen for parents, teachers and supervisors; they are absent from the activity menu and games. **WhatsApp** opens a draft invitation containing the Beta URL and a request to try installation and the activities; choose a group/contact and send it yourself. **Copy link** copies the direct Beta URL. If Async Clipboard is unavailable or denied, it tries a compatibility selection-copy operation; only success reports Link copied. If both methods fail, the link remains selected with manual-copy instructions.

**More apps** checks `canShare` where supported and is hidden when the browser reports that the payload cannot be shared. A plain URL is used when the browser cannot share the full invitation. A browser that rejects native sharing gets explicit guidance to open the link in Chrome or Safari; the app cannot override the browser/OS permission or provide native share targets that are not installed. User cancellation and missing native share targets are handled without claiming a successful send.

The app does not send invitations automatically or collect group feedback. Members can send feedback to the person who shared the link. Sharing always uses the public canonical Beta URL, including when the app was opened with a query string or from an installed shortcut.

## Publish

1. Run `node build-beta.mjs` and the local checks below.
2. Push the repository to `https://github.com/grajapm-hue/toddler-games-`.
3. In repository Settings → Pages, select **Deploy from a branch**, **main**, **/docs**, and Save. No custom GitHub Actions build/test workflow is included.
4. After Pages finishes publishing, open `https://grajapm-hue.github.io/toddler-games-/beta/` and verify the deployed version and offline launch. This URL is the intended destination; the local preparation alone does not make it live.

`docs/index.html` leads to Beta. The app manifest and service worker are scoped to `/toddler-games-/beta/`; Main remains a later release.

## Install and try

Open the Beta URL online once and wait for **Ready for offline play**.

- Android Chrome: tap **Install app**, or use the browser menu's Install app/Add to Home Screen command.
- iPhone/iPad: open in Safari, choose Share → Add to Home Screen → Add.
- Laptop Chrome/Edge: use Install app or the install icon in the address bar.

Launch **SaNa Beta** from the home screen/app list. Try Tap to play and all four activity cards. Then close it, turn off the network and reopen it to check offline play. Portrait viewports retain a rotated landscape frame. Physical-device installation and native orientation behavior still need a hands-on trial.

Clearing browser/site data can remove the offline cache. Reopen online once to prepare it again.

## Local validation

`node check-beta.mjs` uses Playwright. Set `MM_PLAYWRIGHT` to the installed Playwright test module if needed; `MM_CHROME` selects a Chrome executable. Set `PLAYROOM_BROWSER=webkit` for WebKit. `BETA_URL` can select the published URL for live verification.

- Chromium: 32 passing Beta checks, including zero manifest/installability errors in a fresh normal Chrome profile, all icons available, native-prompt event wiring, manual install guidance, welcome-to-game navigation, matching, level persistence, and all activities available offline.
- Playwright WebKit: 31 passing checks, including offline welcome/game navigation with the actual local origin server stopped.
- `node check-share-browser.mjs`: four checks using the real browser clipboard APIs in Chrome and WebKit, with normal and denied-policy documents. Chrome's denied-policy case uses the actual selection-copy fallback and confirms the public Beta link in the system clipboard. Native share choosers are not opened or messages sent by these tests.
- Sharing: WhatsApp draft URL/message, copied canonical link, native share data and cancellation, clipboard-denied manual selection, dialog keyboard focus/return, phone/tablet/rotated-portrait layouts, sharing absent from the play page, Back navigation, and availability of welcome-screen Share while the app is offline. Sending to others requires network access in the chosen sharing app.
- The native install event tests simulate the app's event contract without installing an application on the development machine.
- WebKit network-offline emulation has a documented service-worker navigation limitation; the local test uses an origin shutdown instead. Live WebKit checks omit the emulated offline portion and rely on the local outage proof.

The Beta build adds branding, a welcome link, and common PWA registration. The painting changes described above also apply to the editable source and regenerated self-contained HTML. Screenshots and test profiles remain local under ignored `artifacts/`.

## Future updates

Keep the manifest `id` and scope stable for this Beta. Increment the cache version in `beta-runtime/sw.js` whenever shipped assets change, rebuild, then publish. Version 0.4 uses `sana-little-hands-beta-v4`. Cache cleanup deletes only old `sana-little-hands-beta-*` caches. The SW precaches the welcome page, play page, game script, install and share scripts, sharing stylesheet, manifest and icons before reporting readiness. Existing installed copies may need a refresh after loading online to display an update.

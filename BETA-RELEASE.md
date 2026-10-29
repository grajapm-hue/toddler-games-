# SaNa Little Hands Beta v0.27

The Beta site is published using GitHub Pages from `main` → `/docs`. Version 0.27 sets the installed app to launch in native portrait, matching the reference app and aligning system UI with the portrait welcome; verify the Pages build commit and run the live checks after publishing each update.

## Native portrait launch and system status bar

The reference app uses manifest orientation `portrait`, while SaNa v0.26 still used `any`. Page rotation alone can leave the system status/signal bar on the physical landscape edge. The Beta now uses the same native portrait launch default as the reference. Its manifest filename, identity, scope, start URL, display mode and icons are unchanged. The welcome still requests portrait on supported installed phones and retains its visual fallback; the play page still requests landscape where supported and keeps its landscape frame. Normal browser tabs and operating systems that ignore manifest orientation retain platform control of their bars.

The Update button refreshes app files, including the cached manifest, but cannot force Chrome to apply the installed WebAPK metadata. Fully close and relaunch the installed app after updating. Chrome manages the native manifest refresh separately; older versions can defer it. See https://web.dev/articles/manifest-updates and https://developer.chrome.com/blog/improvements-to-web-app-updates. Chrome/WebKit checks validate the manifest, offline update and browser flow; physical Moto/iPhone system-bar placement cannot be verified without the device. No system bar is drawn, hidden or imitated by the app.

## Welcome reference styling

The welcome follows the supplied Kids Puzzle splash reference: pink/purple/cyan background, a centred mascot and one-line SaNa Little Hands title on phones, green supporting text, a dark three-point health card, then large yellow Play and cyan Install buttons. About this project is centred below Play/Install, with the age/offline note last. Version, Update and an accessible Share icon remain together at the top. The mascot is an inline vector based on the existing SaNa face, so its appearance does not change with the device emoji font. Wide tablet/computer layouts keep the side-by-side composition.

The exact reference was read from `grajapm-hue/web-assets-` main commit `953eadc38059adb037a9dfe7d445783fb94eae0b`, `mathmatrix/beta-app/index.html`. Its splash uses an orbiting, rolling die and a centred About button. SaNa now follows those details with inline SVG/CSS: the die cycles through one to six pips, remains inside the mascot area, and stops at a single-pip face with reduced motion. No runtime library or new asset download is needed. MathMatrix source is a read-only reference.

The health card reminds families to use low brightness/Night Mode after dark, take short breaks and play with a parent or guardian. It precedes Play/Install in both visual and document order. The portrait frame and installed-phone orientation handling from v0.24 remain intact. Short windows can scroll their welcome, and the SVG is constrained to its layout track so it cannot overlap the title. Game cards and game rooms are unchanged. About, Share, Install and Update retain their existing behavior.

## Portrait welcome and sliding game cards

The phone opening page always uses a portrait logical frame. Phone identification uses the mobile browser signal/user agent or a small physical touch screen, rather than the current viewport orientation alone. An installed phone requests native portrait orientation when supported; the phone welcome also rotates its portrait frame inside a landscape viewport if native locking is rejected, missing or stale. Reverse landscape and safe-area mapping follow the reported screen angle. Short layouts scroll vertically, and sizing uses the logical welcome dimensions. Tablets and computers retain responsive layouts. Tap to play enters the landscape frame and requests a landscape preference only on installed phones. Both native preference calls tolerate synchronous errors and rejected promises and never request browser fullscreen. Returning through SaNa restores the portrait welcome, including history restoration. The Beta manifest now defaults to native `portrait`; its identity, start URL and scope are unchanged. Browser and system bars remain controlled by the platform.

The game menu shows five cards at their previous width and height. Extra cards extend the same row instead of squeezing its columns. A clearly labelled More games / Coming soon space follows the five playable games. Swipe or drag the row in either direction, or use Previous games and Next games in the menu header. Keyboard Home, End and arrow keys also browse the focused row. Gestures follow the rotated frame on upright phones and do not accidentally open a game. The navigation hides inside game rooms. Adding future game entries automatically extends the row; the placeholder has no game action.

`node check-welcome-carousel.mjs` checks eight viewport sizes, phone portrait in both viewport orientations, welcome dialogs, entry/return to landscape play, unchanged card dimensions, actual swipes and mouse drags, arrow/keyboard navigation, eight fixture-only future cards, orientation changes retaining game progress, and manifest identity. Additional controlled native-API tests cover an installed Android display mode, accepted/rejected/throwing/missing orientation APIs, reverse landscape, browser-only phones and non-phone devices. These tests verify the layout and preference requests; they do not prove physical Moto or iPhone OS rotation. `FLOW_URL` selects a hosted Beta root. Local measurements recorded before this change also verify the existing card width and height stay within one pixel.

## Quiet expanded play and touch protection

The expand/exit control now uses in-page immersive play on all devices. It no longer requests the browser Fullscreen API, so that action does not trigger the browser-owned fullscreen notice containing the site address. Installed-phone page-entry orientation preferences operate independently of expansion. The same board still fills the available camera-safe app frame, keeps its results, choices and bottom controls, and exits with the toggle, Escape or Games. Browser/status bars may remain visible when running in a browser. The app does not add a replacement popup.

Welcome, app home, game text, labels and app dialogs disable user selection, touch callouts and native dragging. An inline head bootstrap starts the contextmenu, selectstart and dragstart guards before visible content. Idempotent script fallbacks also cover an older cached page shell loading the new game script. The guards stop accidental native actions while leaving game pointer input and dialog scrolling intact. The displayed sharing URL does not accept touch/pointer input. Explicit parent controls remain available, including Update, About, Share, and Copy link. Compatibility copying selects the readonly link only temporarily and clears selection afterward; failed copying points to the explicit WhatsApp sharing option rather than telling users to hold text.

`node check-quiet-play.mjs` verifies non-selectable text, cancelled native actions and real right-clicks, text-drag selection, all five games in normal/expanded layouts, no native fullscreen, a held-pointer abacus slide, Escape, and both prototype builds. A held network request also proves the text guards work before game initialization; game controls must be ready before subsequent navigation checks. It checks the iOS-only callout property when the test platform exposes it; desktop WebKit is not an iPhone device test. `QUIET_URL` selects a hosted Beta root. `node check-share-browser.mjs` verifies the actual clipboard and compatibility copying in both engines without navigator mocks.

## Manual and automatic app updates

The welcome page has Update app beside its version badge. The game-choice home screen also has a brown Update button beside the SaNa brand, matching the supplied header reference. Both use the same updater. The header button is hidden during games and the immersive menu. It explicitly checks the service worker online, waits for the complete app cache and activation, then reloads only the current welcome or game-choice home page when its release has changed. It reports App is up to date when already current and App updated after applying a newer release. A disabled busy button prevents duplicate clicks during checking/download. Offline or failed downloads show Update unavailable and allow retry; the previous downloaded games and saved settings remain available.

Automatic checks run on opening the app and when the device comes online. They can download and activate newer cached assets without reloading an ongoing game or another tab. A manual check can also refresh an old opening page after an automatic download has already activated. The Update control is hidden during children’s gameplay. If a child enters a game while a manual download is still pending, the download can finish, but no reload or dialog interrupts the game. Returning to Games allows the adult to apply that update. The home update dialogs fit inside the same rotated, camera-safe frame and support Escape, trapped keyboard focus, and focus return. Manifest identity, installation scope and saved settings are preserved.

`node check-updates.mjs` uses real service workers and six staged releases in Chrome and WebKit: already-current, download/busy/reload, incomplete asset failure and retry, automatic activation, manual application of an already-active newer release, origin outage/offline play, recovery, saved settings and an uninterrupted game tab. It also checks both welcome and home-header controls at five sizes, home update/reload, dialogs, and entering a game while a download is held at the network boundary. `UPDATE_URL` runs current-version and layout checks against a hosted opening page.

## Camera clearance and appreciation

The shared play frame uses all four device safe-area insets before applying its landscape rotation. Every device reserves at least 64 CSS pixels before the left play border, without camera detection or phone-model rules. For the rotated portrait frame this maps to the physical top edge. Other edges use only their reported device insets; a larger reported left inset takes precedence. The same frame fitting applies to every game, menu, normal play, normal and expanded play. Touch coordinates continue to use the rendered SVG matrix.

SaNa congratulations appear in a centered top row above the results and sub-level controls. That row is outside the animated scene and does not cover beads, pictures or controls. Every game's completion uses it; Again clears it. Small-phone letter targets use tighter gaps to retain a useful play area inside the fixed margin.

`node check-camera.mjs` checks all five games at five screen sizes, with default margins and simulated asymmetric cutouts at the CSS device-inset boundary, normal/fullscreen, abacus and matching completion, centered rewards and reset. `CAMERA_URL` selects a hosted play page. These are browser layout checks, not a physical-phone camera test.

## Free abacus counting

All ten rows and all 100 beads work in either direction, including rows already coloured. A dragged bead pushes neighbouring beads without passing them. Single beads and groups settle across the centre to the chosen end. The row counter, result box and colour label show the actual count from 0 to 10, including its word: 5 Five Red, 10 Ten Blue, 0 Zero White. All ten colour labels are visible from the start at 0 Zero. Each numeral and number word updates as that row moves, and reset returns every label to zero.

Rainbow order and circle regions are unchanged. A positive row count fills its region; zero returns it to black. All ten colours earn SaNa’s congratulations and optional applause, without locking any beads. Again resets the puzzle. Counts survive resize/fullscreen; the game remains the 25th navigation step.

Before version 0.14 the app disabled completed and future rows, rebuilt all bead nodes after a slide, and trusted the last move event rather than the release position. The repair keeps bead nodes stable, caches gesture geometry and element references, updates only the moving row and relevant labels, picks the nearest bead, and handles a final position delivered on pointerup. It does not rebuild the scene for ordinary counting. Count text stays fully visible immediately, using a small pulse instead of fading out after release.

`node check-abacus.mjs` moves every bead forward and backward in arbitrary row order, verifies 0–10 numerals/words and colour changes, groups moving before release, stable DOM nodes, final-position-only input, short/cancelled slides, keyboard, reward/reset, resize and five screen sizes in normal/fullscreen. `ABACUS_URL` selects a hosted play page. Beta cache v27 updates existing installations online.

## Welcome and About

The opening-screen family label, small SaNa/monkey, title’s SaNa label and age/offline notes use larger bold type. About uses scrollable cream cards with current activities, parent guidance, G.RajaPathamuthu / Kids Puzzle Library, JNT and AI-Assistances credits, the supplied motto, current version and the existing feedback address. It does not claim a separate Feedback tab. Its close button stays visible while the contents scroll.

`node check-parents.mjs` checks five screen sizes, About scrolling/focus/contact, welcome-only sharing and Back in all five games. `PARENTS_URL` selects a hosted welcome page.

## Board navigation and results

Every game has a rectangular result box at the top left and its active sub-level choices at the top right of the black board. Explore/Play/Challenge stay in that box of choices and are hidden with the game room on the menu. They are absent from the menu header, including before the game script loads and after returning through Games, Back or Front. Bubble contents and brush modes are shown only in their relevant game, including fullscreen. Bubble collections remain below the top row.

Back is at the board’s bottom left, Front at its bottom right. They visit the levels and available modes within each game, continuing to the neighboring game at the ends: three Drag steps, twelve Bubble steps, three Slide steps and six Brush/Paint steps, followed by one Count puzzle. Passing either end of the full sequence returns to the menu. Games returns there directly. Sound and fullscreen controls sit alongside Games. The toolbar, animation and navigation occupy separate rows to prevent overlap.

`node check-board.mjs` checks all five games at five sizes in normal and fullscreen modes, control bounds, non-overlap, appropriate modes, room to play, and both directions through all 25 steps. `BOARD_URL` selects a hosted play page.

## Immersive play

The home introduction uses one row at the same size as the hint above it. The decorative picture and eyebrow are removed, leaving the game cards the remaining space. Every animated game field has a black background; painting retains its light paper.

Fullscreen hides the main header, instructions and outer speed/size or art settings. Results and active sub-level choices remain inside the top of the black board. The bottom navigation row keeps Back, Front, Games, sound and Exit fullscreen clear of gameplay. Games leaves fullscreen and returns to the activity menu; Back and Front continue through the game steps. Gameplay continues and exiting restores the same round, collected colors, painting and settings. The menu can also enter fullscreen before a game is chosen. Expansion stays within the page on all browsers without native fullscreen requests. Installed-phone page-entry orientation preferences are separate from expansion. The exit button, Escape and Games restore the regular layout. Browser chrome is controlled by the browser and may remain visible.

`node check-immersive.mjs` checks five viewport sizes in Chrome and WebKit, in-page entry/exit, sound, full-field geometry, touch popping, matching, revealing, painting, preserved progress and operation when native fullscreen is denied or unavailable. `IMMERSIVE_URL` selects a hosted play page. Beta cache v27 updates existing installations online.

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

On the welcome screen choose **Share app**. Share controls are confined to that opening screen for parents, teachers and supervisors; they are absent from the activity menu and games. **WhatsApp** opens a draft invitation containing the Beta URL and a request to try installation and the activities; choose a group/contact and send it yourself. **Copy link** copies the direct Beta URL. If Async Clipboard is unavailable or denied, it tries a compatibility selection-copy operation; only success reports Link copied. If both methods fail, selection is cleared and the message directs the parent to the WhatsApp sharing option.

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

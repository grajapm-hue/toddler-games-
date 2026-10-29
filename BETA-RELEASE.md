# SaNa Little Hands Beta v0.9

The Beta site is published using GitHub Pages from `main` → `/docs`. Version 0.8 added independent bubble speed and size settings. Version 0.9 moves guidance and settings above the games, expands the play area and increases text weight, size and color contrast; verify the Pages build commit and run the live checks after publishing each update.

## Screen layout

SaNa's hints, Show me and Again are above both the home menu and games. Bubble speed/size and art tools are above their tables, with no bottom control strip. The playroom fills the available viewport, removing the desktop size cap and outer inset. Compact headers, smaller outer padding and a combined wide-screen bubble toolbar give the table more space. Labels use larger dark bold type, and green, yellow, blue, peach and purple boxes distinguish choices while preserving collected bubble colors.

`node check-layout.mjs` verifies guidance and controls above the board, use of the bottom edge, readable type, control bounds and art tool placement at phone, small-phone, rotated, tablet and wide-screen sizes. `LAYOUT_URL` selects a hosted play page. `LAYOUT_BASELINE=1` records local before measurements for comparison; evidence is stored under ignored `artifacts/layout/`. Beta cache v9 updates existing installations online.

## Rising bubbles

Choose Plain for free popping with a counter, or collect all numbers 1–20, uppercase letters A–Z or six shapes. Bubbles rise from randomly varied positions in a fixed pool of four, six or nine according to level. Touch, mouse or keyboard pops a bubble into colored droplets, removes it, then brings a new bubble from below. The matching top-list item takes that exact bubble color; duplicates cannot complete a different item. Uncollected content is prioritized and missed content returns. Completing a set triggers SaNa's congratulations while bubbles continue rising. Again resets the current collection. Home and hidden pages stop animation; the play-page Share dialog pauses it.

Above the play area, Speed offers Slow, Medium and Fast; Size offers Small, Medium and Large. Both apply immediately to the existing bubbles without clearing collected items or changing their colors. Explicit choices survive mode changes, Again, level changes and reload, using optional browser-local settings. Unchosen settings follow the level default. The size scales the contents and touch hit area together and fits short phone play fields. Overlapping bubbles use the actual tapped bubble for exact matching.

`node check-bubbles.mjs` exercises upward movement, actual touch pops, splash spread/cleanup, exact target colors, complete sets, continued play and bounded bubble counts, difficulty levels and responsive target lists. `node check-bubble-settings.mjs` measures motion over equal time intervals, checks resizing of the same bubble, collection preservation, mode independence, persistence and responsive controls. Set `BUBBLES_URL` to the hosted play page for live checks. Beta cache v8 updates existing installations online.

## Painting

Explore uses a simple fish, four muddy patches, a large default brush and a 50 percent painting goal. Play uses the puppy, eight patches, a medium brush and a 65 percent goal. Challenge uses a detailed butterfly, fourteen patches, a small brush and an 80 percent goal. Both cleaning and painting follow the level; the heading, home card, hints and reward name the selected picture. Changing levels starts a fresh round and sets that level's default brush.

Small, Medium and Large select the actual brush size without clearing the picture. Paint is clipped to the current picture silhouette; gestures starting on the blank paper add no paint. Eraser removes existing paint while preserving the outline, and choosing any color resumes painting over erased areas. Reaching the level's painting goal triggers a SaNa congratulations badge and stars, with generated applause when Sound is on. The reward occurs once per round, and Again clears the painting and progress. Beta cache v6 updates installed copies after they reconnect online.

`node check-art.mjs` checks actual SVG pixels for picture boundaries and erasing/repainting, selected brush size, completion/reset, cleaning reach and phone/tablet/rotated layouts. Chromium uses touch input; WebKit uses pointer input. Set `ART_URL` to the hosted play page for live checks.

## Share with a testing group

On the welcome screen choose **Share app**, or use **Share** at the top right of the activity menu or any game. Opening and closing Share keeps the current activity and round. **WhatsApp** opens a draft invitation containing the Beta URL and a request to try installation and the activities; choose a group/contact and send it yourself. **Copy link** copies the direct Beta URL. If Async Clipboard is unavailable or denied, it tries a compatibility selection-copy operation; only success reports Link copied. If both methods fail, the link remains selected with manual-copy instructions.

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

- Chromium: 31 passing Beta checks, including zero manifest/installability errors in a fresh normal Chrome profile, all icons available, native-prompt event wiring, manual install guidance, welcome-to-game navigation, matching, level persistence, and all activities available offline.
- Playwright WebKit: 30 passing checks, including offline welcome/game navigation with the actual local origin server stopped.
- `node check-share-browser.mjs`: four checks using the real browser clipboard APIs in Chrome and WebKit, with normal and denied-policy documents. Chrome's denied-policy case uses the actual selection-copy fallback and confirms the public Beta link in the system clipboard. Native share choosers are not opened or messages sent by these tests.
- Sharing: WhatsApp draft URL/message, copied canonical link, native share data and cancellation, clipboard-denied manual selection, dialog keyboard focus/return, phone/tablet/rotated-portrait layouts, activity-menu access, preservation of a partly played round, and availability of Share while the app is offline. Sending to others requires network access in the chosen sharing app.
- The native install event tests simulate the app's event contract without installing an application on the development machine.
- WebKit network-offline emulation has a documented service-worker navigation limitation; the local test uses an origin shutdown instead. Live WebKit checks omit the emulated offline portion and rely on the local outage proof.

The Beta build adds branding, a welcome link, and common PWA registration. The painting changes described above also apply to the editable source and regenerated self-contained HTML. Screenshots and test profiles remain local under ignored `artifacts/`.

## Future updates

Keep the manifest `id` and scope stable for this Beta. Increment the cache version in `beta-runtime/sw.js` whenever shipped assets change, rebuild, then publish. Version 0.4 uses `sana-little-hands-beta-v4`. Cache cleanup deletes only old `sana-little-hands-beta-*` caches. The SW precaches the welcome page, play page, game script, install and share scripts, sharing stylesheet, manifest and icons before reporting readiness. Existing installed copies may need a refresh after loading online to display an update.

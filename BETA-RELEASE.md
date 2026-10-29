# SaNa Little Hands Beta v0.4

The Beta site is published using GitHub Pages from `main` → `/docs`. Version 0.3 added Share to the activity menu and all games and was verified live in Chrome and WebKit. Version 0.4 repairs clipboard compatibility and checks actual native-share capability; verify the Pages build commit and run the live checks after publishing each update.

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

The accepted game logic is unchanged. The Beta build adds branding, a welcome link, and common PWA registration; it does not change activity rules or levels. Screenshots and test profiles remain local under ignored `artifacts/beta/`.

## Future updates

Keep the manifest `id` and scope stable for this Beta. Increment the cache version in `beta-runtime/sw.js` whenever shipped assets change, rebuild, then publish. Version 0.4 uses `sana-little-hands-beta-v4`. Cache cleanup deletes only old `sana-little-hands-beta-*` caches. The SW precaches the welcome page, play page, game script, install and share scripts, sharing stylesheet, manifest and icons before reporting readiness. Existing installed copies may need a refresh after loading online to display an update.

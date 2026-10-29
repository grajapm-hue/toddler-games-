# SaNa Little Hands Beta v0.1

Status: prepared and tested locally. Upload and GitHub Pages activation are pending repository write/admin access.

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

- Chromium: 14 passing Beta checks, including zero manifest/installability errors in a fresh normal Chrome profile, all icons available, native-prompt event wiring, manual install guidance, welcome-to-game navigation, matching, level persistence, and all activities available offline.
- Playwright WebKit: 13 passing checks, including offline welcome/game navigation with the actual local origin server stopped.
- The native install event tests simulate the app's event contract without installing an application on the development machine.
- WebKit network-offline emulation has a documented service-worker navigation limitation; the local test uses an origin shutdown instead. Live WebKit checks omit the emulated offline portion and rely on the local outage proof.

The accepted game logic is unchanged. The Beta build adds branding, a welcome link, and common PWA registration; it does not change activity rules or levels. Screenshots and test profiles remain local under ignored `artifacts/beta/`.

## Future updates

Keep the manifest `id` and scope stable for this Beta. Increment the cache version in `beta-runtime/sw.js` whenever shipped assets change, rebuild, then publish. Cache cleanup deletes only old `sana-little-hands-beta-*` caches. The SW precaches the welcome page, play page, game script, install script, manifest and icons before reporting readiness.

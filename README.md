# SaNa Little Hands — playable prototype

A separate landscape HTML playroom, mainly for ages 2–4, with simpler and harder activity levels. This prototype is ready for family feedback; it has not been added to the MathMatrix Main or Beta menus.

## Installable Beta

The Beta site is built into **docs/beta/**. Run `node build-beta.mjs` after editing the prototype or `beta-runtime/` sources. The original standalone game remains available for local testing.

For a local hosted trial, run `node serve.mjs 8778 docs` and open `http://127.0.0.1:8778/beta/`.

Publish GitHub Pages from **main → /docs**. The intended Beta URL is `https://grajapm-hue.github.io/toddler-games-/beta/`. See `BETA-RELEASE.md` for installation, checks and deployment status. Main release is a later step.

The Beta welcome screen includes **Share app**, and the activity menu and games have **Share** at the top right. The options are WhatsApp, Copy link, and the device share menu when available. Share the link with your test group so members can try installation and each activity and reply to you with feedback.

## Welcome screen: preview 01

Start with **welcome-preview.html** for the new MathMatrix-inspired landscape welcome screen. Keep this folder together: Tap to play opens the existing self-contained game file. Install app currently explains the planned Beta installation; About opens the app information.

This is the first screen for discussion. The activities remain unchanged. The new repository is [grajapm-hue/toddler-games-](https://github.com/grajapm-hue/toddler-games-). The installable Beta now builds from this preview; see `PREVIEW-NOTES.md` for the earlier design scope.

## Play

Open **SaNa-Little-Hands-Prototype.html** for the self-contained version. Its illustrations, styles and game code are embedded, so it works without an internet connection. Use a finger on a touchscreen or click and drag with a mouse/trackpad.

The editable version is **index.html** plus **app.js** and the local icon/manifest files in this folder. Open index.html directly, or serve the folder over HTTP/HTTPS. No build or account is needed.

With Node.js available, run `node serve.mjs` in this folder and open `http://127.0.0.1:8776/`. Run `node build.mjs` after source changes to regenerate the self-contained HTML.

## Levels

- **Explore:** two large shapes, four large bubbles, one reveal slider, fewer muddy patches and a wide paintbrush.
- **Play — ages 2–4:** four shapes, six bubbles, two sliders, eight muddy patches and a medium paintbrush. This is the default.
- **Challenge:** six shapes, nine bubbles grouped by color, three sliders, more muddy patches and a finer paintbrush.

The level labels describe activity difficulty. A grown-up can choose whichever level feels comfortable.

## Activities

1. **Drag — Shape picnic:** move each shape onto its matching shadow. Tapping a shape and then its shadow also works.
2. **Tap — Bubble garden:** tap or sweep across bubbles. Challenge asks for bubbles that match the color dot.
3. **Slide — Peek-a-boo friends:** move the sunny handles along their tracks to reveal the fox, owl and frog.
4. **Brush & paint — Little art studio:** rub muddy patches to clean the puppy, or select Finger paint and draw with six colors.

**Home** returns to the activity pictures. **Again** resets the current round or clears the painting. **Show me** gives a visual hand hint. The sound button toggles gentle generated tones; sound starts off. The last level and sound preference are stored only in this browser when storage is available. There are no ads, sign-ins, trackers, external fonts or external media downloads.

## Landscape and installation

The app uses a landscape play frame. In a portrait viewport the frame rotates, and pointer positions are mapped through the SVG screen transform so finger gestures continue to work. Rotating the device to landscape uses the screen normally. The fullscreen button is shown where the browser supports fullscreen; it also attempts a native landscape lock where available. Browser and operating-system support varies.

When the editable folder is hosted over HTTPS or localhost, its manifest requests landscape standalone display, and its service worker caches the local app for offline use after the first successful load. The worker's scope and cache names belong to this prototype folder. Installation and native orientation behavior still need checking on the family's actual iPhone/iPad and Android devices. A home-screen installation is optional for testing.

The installed prototype serves its versioned files from cache. Increment the cache version in `sw.js` when publishing a later revision.

## Developer checks

`node check-playroom.mjs` uses Playwright to exercise the actual interface. Set `MM_PLAYWRIGHT` to the installed Playwright test module when it is not available locally. `MM_CHROME` can select a Chromium executable. `PLAYROOM_BROWSER=webkit` selects Playwright WebKit.

Screenshots and test evidence are written to `../artifacts/toddler-playroom/`. The test covers matching, popping, reveal sliders, cleaning, painting/reset, three levels, touch gestures, landscape and the rotated portrait frame. Browser emulation does not replace a child's hands-on device trial.

The installed-cache check uses network-offline emulation in Chromium. Playwright WebKit has a documented [offline-emulation limitation](https://github.com/microsoft/playwright/issues/42775), so its check stops the actual local origin server and requires the cached playroom to load and reload without that server. The self-contained HTML is checked with HTTP unavailable in both engines. These are distinct browser-test controls, not physical iOS installation certification.

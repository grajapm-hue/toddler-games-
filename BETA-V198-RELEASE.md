# SaNa Beta V198 (v1.98)

V198 upgrades the published V197 app. V1980 / v1.980 remains the separate supplied prototype identifier; it is not the published release number.

## Changes

- Adds Kids Machines Vision beside Blocks in More games, using the supplied prototype's free-building design.
- Robot, Car, Ship, Plane and Rocket collections offer 9, 18, 27 and 36 parts for ages 2, 3, 4 and 5. The shelf uses nine parts per page. Ages 2-3 use toy artwork; ages 4-5 use mechanical artwork.
- Look shows the complete reference until Back to build. Dragging, tap placement, resizing, rotation, flipping, Demo, Done and PNG snapshots use the shared Assemble room.
- Adds machine-specific parent instructions and accessibility labels. Hides Colour in Machines because this prototype uses fixed-colour SVG artwork. Existing Blocks retains Colour.
- Uses the V198 cache and v1.98 labels on welcome, play and fullscreen surfaces. The game script URL is cache-busted to v198.
- Keeps the published Drag Shapes drop rule. The prototype's unrelated drop-detection change is excluded.
- Retains manifest identity/scope, saved puzzle photos and saved settings. Existing Picture Puzzle code is unchanged.
- The Pages workflow publishes static files only. Builds and tests run locally, following the workspace instructions and the user's Naren-PC override for this release.

## Validation on Naren-PC

- `node check-deployment.mjs`: 631 asset references and all Beta JavaScript syntax pass.
- `node check-picture-puzzle-core.cjs`: 11,882 checks pass.
- `node check-machines-v198.cjs`: 80 Chromium checks pass.
- `PLAYROOM_BROWSER=webkit node check-machines-v198.cjs`: 80 WebKit checks pass.
- `node check-machines-update-v198.cjs`: 10 actual service-worker upgrade checks pass, including V197 to V198, survival of an open game, saved settings and a saved puzzle photo, cache cleanup boundaries, offline startup and offline machine reference rendering.
- `VERSION_RED=1 node check-version-labels.cjs`: 8 existing Chromium version-label checks pass.

The machine checks cover all 20 age/family combinations and every shelf page, image decoding, help, fixed-art Colour visibility, tap placement, Demo preservation, portrait/landscape changes, PNG export, existing Blocks colour behaviour and the original six-game first page.

This remains free building. Guided assembly, correctness detection, revised source artwork and moving machine parts are later design work. Simulated browser viewports do not prove physical Moto G45 touch behaviour or installed-device operation. The phone's cross-app photo-picker thumbnail issue is independent of this release.

## Publishing and recovery

Publish the maintained `docs/` tree through GitHub Pages. Do not regenerate it from the older root or `beta-runtime/` sources.

The previous published source is commit `1f11fa1f7f3497f1c95cf31d7979339ecbd385db`. If release recovery is needed, restore the reviewed V197 application assets and publish them with a new cache identifier; preserve manifest identity and IndexedDB rather than clearing user data.

## V198 update-check repair (internal revision r2)

The public app version remains v1.98. The cache identifier changes to `sana-little-hands-beta-v198-r2-update-recovery` so the repair is installed safely.

- Bounds browser registration/update checks to 15 seconds and restores the Update button on a stalled network request. Automatic checks also leave their running state after a timeout.
- Uses Downloading while game assets install and allows up to two minutes before offering a retry; the previous downloaded release stays usable until installation finishes.
- Adds `update-v1.98.html`, a fresh entry URL with a self-contained updater. An older cache cannot substitute its cached welcome page or old pwa.js for this new entry. It redirects to the normal app only after the new cache is ready and its worker controls the page.
- Cache-busts pwa.js. Manifest identity, IndexedDB puzzle photos, settings and game rules remain unchanged.

Validation on Naren-PC: 13 stalled-network/slow-download/retry checks; 10 standard V197-to-V198 update checks; 10 fresh-entry V197-to-V198 checks, including saved photos and offline Machines; 80 Machines checks per browser; deployment asset and syntax checks. A physical Moto G45 test is still required to establish device-specific success.


## V198 first-install sequencing repair (internal revision r3)

R3 supersedes R2 while keeping the public label v1.98. The fresh entry link is `v1.98.html`; `update-v1.98.html` remains available for compatibility.

A cold live-browser check found that a second registration.update() could queue behind an initial installation. The entry now waits for an already installing/waiting worker, and regular update checks return as soon as updatefound starts the download. The normal offline preparer also avoids a redundant check during installation. Downloading therefore uses the installation timeout instead of the shorter connection-check timeout.

The 16 timeout/retry checks now include a real initial installation held at an asset download beyond the connection timeout, followed by successful completion. Standard and fresh-entry V197 upgrades preserve settings and a puzzle photo; browser game and deployment checks are retained.


## V198 resilient downloads (internal revision r4)

A cold live-browser trace captured HTTP 503 on a machine SVG during the all-at-once precache request burst; the install was discarded and remaining fetches were aborted. The asset returned 200 when requested individually.

R4 downloads four assets per batch and retries a failed batch up to three attempts with short backoff. Activation and old-cache cleanup still happen only after every batch succeeds. A permanent failure removes only the incomplete new cache; existing downloaded games and IndexedDB remain intact. The public version and fresh `v1.98.html` entry stay unchanged.

The real-browser cache download check covers a constrained host, recovery from two temporary 503 responses, and bounded failure/cleanup for persistent 503 responses. Timeout, slow first-install, V197 migration and saved-photo checks remain required before publication; cold live verification remains required after publication.


## Fire tablet update diagnosis

The Fire HD 8 (10th generation) report shows the installed V197 app stopping at the shared online/secure-context/service-worker precondition, before it attempts a release download. The screenshot alone cannot identify which of those three conditions failed.

Adds the fresh, read-only tablet-check.html entry. It displays the browser-reported connection state, secure-context and service-worker availability, the actual response from a no-store worker-script request, available release identity, existing registration state and browser identity. It does not register or update a worker, write caches or access saved game data. Network and registration checks have bounded timeouts. Existing game files, release identifiers, manifest and updater behaviour stay unchanged.

Validation on Naren-PC: 25 checks each in Chromium and WebKit cover healthy access, an offline hint despite a working request, unavailable worker support, an insecure context, an HTTP 503 and a stalled connection. Checks also confirm preserved settings, no script errors, no horizontal overflow and no worker registration. Deployment validation passes all 633 asset references and Beta JavaScript syntax. Physical Fire tablet results remain required to diagnose the installed app.


## SaNa shared-link picture preview

The WhatsApp comparison shows a picture preview for MathMatrix and a title-only SaNa preview. SaNa already shares its own correct title and canonical link, but the published welcome and play HTML lacked social-preview metadata.

Both pages now expose a SaNa title, concise description, canonical app URL and the existing 512 by 512 monkey PNG through static Open Graph and Twitter card metadata. The image is publicly available without JavaScript. This metadata-only change keeps the public v1.98 label, release cache, manifest, game rules and share message unchanged. Existing installed copies continue to share the same URL; preview crawlers read the published HTML.

Validation on Naren-PC: 14 raw-HTML preview checks, all 633 deployment asset references and Beta JavaScript syntax, plus four actual Chromium/WebKit clipboard and browser-share fallback checks. These checks verify the page data and existing sharing behaviour, not the physical WhatsApp preview or its cache. A fresh phone share is required for that observation.


## Short shared-link instructions (internal revision r5)

Replaces the feature-list preview description with the same brief monkey/open-browser/install/accept/wait/play steps used in MathMatrix Main. SaNa WhatsApp and native sharing now send only the app URL, removing the repeated title and long invitation beneath the preview. Copy link stays a bare URL.

The public app label remains v1.98. R5 updates the offline cache and recovery-entry targets so installed copies receive the new share script; manifest identity, saved data and game rules are preserved. The four-at-a-time download and retry repair remains in place.

Naren-PC validation: 14 preview checks, four browser clipboard/share checks including the WhatsApp payload, 12 normal V197 upgrade checks, 12 recovery-entry upgrade checks, 16 bounded update/download checks and six download retry checks. The upgrade checks exercise the actual cached long message before updating and the bare URL after updating, together with saved photos/settings and offline Machines. Main preview and URL-only share payloads pass for both HTML entry pages in Chromium and WebKit. Device WhatsApp rendering remains an external observation.

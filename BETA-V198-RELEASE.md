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

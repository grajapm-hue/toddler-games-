# SaNa Beta v2.00 — transparent robot assemblies

Target: `grajapm-hue/toddler-games-`, `main` / `docs`. Maintained app: `docs/beta/`.

Public app: https://grajapm-hue.github.io/toddler-games-/beta/index.html

Fresh browser updater: https://grajapm-hue.github.io/toddler-games-/update-beta-v2.00.html

## Machines

Machines now uses the supplied standing and waving robot cutouts for ages 4 and 5. Each pose has 16 transparent PNG pieces, its original complete SVG reference, source proportions, placement coordinates and drawing order. The matching `apose` and `waving` sets from the user's Drive `v198.zip` are copied without image modification; the inconsistent alternate hands-down set is not used.

Stores shows six cutouts per page, or three in short landscape windows, with labels and no picture tile backgrounds. Assemble accepts drag, tap and keyboard placement. Correct nearby parts snap into their source coordinates (112 canvas units at age 4; 72 at age 5). Misplaced parts remain movable; fitted parts are counted once. Done requires all 16 fitted parts. Look, Remove, Clear, Again, Demo and transparent PNG export are available. Demonstrations do not change the child's assembly.

The four other machine collection names remain visible but disabled while replacement art is pending. Ages 2 and 3 show an invitation to choose age 4 or 5. Old machine cartoons are no longer requested by this activity or included in the new offline cache. The old static files remain available for older app clients.

The Machines menu thumbnail uses the supplied robot. Blocks and the six original activities keep their current controllers. Puppy PWA icons, circular welcome image, manifest bytes/identity, app name, storage keys and saved photos are unchanged. Toddler Main and MathMatrix are separate repositories and are outside this release.

## Delivery

Cache: `sana-little-hands-beta-v200-robot-cutouts`. Version labels show v2.00. Existing recovery URLs target the same complete release; the fresh v2.00 browser updater remains outside the installed Beta scope. Regenerate worker integrity data after source changes with `node build-offline-integrity.mjs`.

## Naren-PC verification

- Pure fitting model: 60 assertions.
- Chromium and WebKit browser flows: both poses, missed/correct placement, completion, mouse drag, touch taps, keyboard placement, cancelled drag, Demo preservation, Look, reset, responsive layouts and PNG export.
- Actual v1.99 worker upgrade: 16 checks including a rejected incomplete download, preserved old cache, open-game retention, saved settings/photo retention, unrelated-cache preservation and offline decoding of every new part/reference.
- Fresh browser updater: 13 upgrade/offline checks.
- Exported PNGs are 848 × 1264 RGBA, with transparent corner pixels.
- Deployment integrity and JavaScript syntax checks; unchanged manifest/icon/welcome bytes; responsive release-label checks.

Automated browser checks do not establish the installed physical phone/tablet result.

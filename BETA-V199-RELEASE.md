# SaNa Toddler Beta v1.99: puppy artwork

Target: `grajapm-hue/toddler-games-`, maintained `docs/beta/`.
Public Beta: https://grajapm-hue.github.io/toddler-games-/beta/index.html .

The supplied puppy replaces the welcome monkey, including the welcome header. SaNa's name, the SeSe family portrait, dice/shapes, responsive layout and games remain intact. Install icons, favicon and shared preview show the puppy; share instructions now say Tap puppy.

Assets: `docs/beta/sana-puppy-v199-192.png` and `docs/beta/sana-puppy-v199-512.png`. Legacy `icon-192.png`, `icon-512.png` and `icon.svg` also show the puppy. The manifest selects the versioned PNGs, including a maskable 512 icon. Its ID, name, start URL and scope are preserved.

Release: v1.99, cache `sana-little-hands-beta-v199-puppy-art`, 608 offline entries. `v1.99.html` is the fresh updater. Existing v1.98 recovery URLs now prepare the latest release. Game scripts, rules, saved settings and uploaded photos are preserved. Toddler Main Live and both MathMatrix repositories are outside this release.

Validation on Naren-PC: 8 puppy branding/layout checks per Chromium and WebKit; 14 share-preview checks; 13 real V198-to-V199 upgrade checks using each of normal Update and fresh-entry recovery; 8 version-label checks per browser. Total: 72 checks, plus deployment reference/syntax validation (636 references). Browser simulations do not prove a physical phone launcher has refreshed its installed icon.

## Artwork preparation

Mode: built-in image generation, editing the user-supplied two-icon reference. The generated master is in ignored `artifacts/puppy-v199/source.png`; the final PNG assets are in `docs/beta`. Sharp prepared the required deployment sizes and embedded the same PNG in the legacy SVG wrapper.

Exact generation prompt:

> Prepare one production app icon from the attached reference image. Edit target: the RIGHT-HAND puppy icon in the supplied presentation. Preserve this puppy's recognizable face, silky white and brown fur, dark glossy eyes, floppy ears, tiny pink tongue, pink-and-blue hair bow, and the warm cream/gold rounded square frame. Extract/reconstruct that same artwork as a single square 1024 x 1024 image, tightly filling the canvas with the cream/gold app tile. Remove the surrounding black presentation backdrop, the duplicate left icon, every size label, all DOWNLOAD buttons, and the star decoration. No text, letters, watermark, numbers or UI controls anywhere. No monkey. Do not redesign the puppy. Keep its full head and bow visible, centred inside the tile; make the puppy's important face features fit comfortably within the central 75 percent so the icon also works under rounded and circular phone launcher masks. Fill the entire square canvas with opaque warm cream colour behind the rounded gold frame; no black corners. This single clean tile will be reused as the SaNa toddler app PWA icon and welcome-page illustration. SaNa remains text in the app, not lettering inside this artwork.

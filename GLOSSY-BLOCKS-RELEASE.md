# SaNa Beta v1.63: Glossy Blocks

The first chooser page retains the six existing games. **More games → Blocks** opens Glossy Blocks. It uses the current SaNa theme, age controls, settings, Demo, Again, navigation and 1,500 ms completion/replay timing.

The new room includes drag-and-snap placement, tap placement, keyboard building, selection and recolouring, removal, Clear, Finished and optional pattern guides. Category changes, settings and rotation keep the construction. Escape, lost/interrupted pointers, window blur and leaving the page cancel pending gestures. Demo builds on a temporary copy.

## Expanded collections

| Category | Age 2 | Age 3 | Age 4 | Age 5 |
| --- | ---: | ---: | ---: | ---: |
| Plain blocks / Colours | 6 | 8 | 10 | 12 |
| Numbers | 1–5 | 1–10 | 1–15 | 1–20 |
| Letters | A–F | A–L | A–T | A–Z |
| Shapes / Animals / Fruits / Vegetables / Utensils | 4 | 6 | 8 | 10 |
| Pattern examples | 4 | 5 | 7 | 8 |

Objects use local SVG illustrations. A named twelve-colour palette works without a native colour-picker dialog. Custom values are validated before mutation/rendering. Recolouring a colour-word block updates its name; it does not silently change later shelf blocks.

## Local release validation

- `node check-glossy-core.cjs`: 143 assertions, including bounds, overlap, invalid colour rejection and foreground contrast.
- `node check-glossy-beta.cjs`: Chromium 100 checks, WebKit 99; includes real pointer/touch input, all age/category inventories, small phone touch areas, rotation, settings, Demo and replay cancellation.
- `node check-glossy-review.cjs`: four regression groups per engine for the independent review findings (palette/validation, colour semantics, Escape/blur, accurate guides).
- Existing responsive suite: 138 layout checks and 23 interaction checks per engine; Picture Puzzle core: 11,882 assertions.
- Worker upgrade from v1.62 tested in both engines: preferences and saved photos retained, unrelated cache retained, old SaNa cache retired, all games including Glossy Blocks usable offline.
- The manifest and install identity are unchanged; two new assets are precached with the v1.63 script.

These are local browser checks. Group verification on installed Android/iPhone apps remains the next Beta feedback step; this is not a general-public release.

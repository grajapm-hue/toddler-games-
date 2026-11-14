# SaNa Beta v1.64

Rotation now releases a held Glossy Blocks pointer before reflow. Frame fitting checks again after viewport dimensions settle, and an unchanged delayed check leaves a newly started drag alone. Idle resize checks keep board nodes intact; shelf selection retains the native touch target. The exact installed-iPhone symptom still needs group device confirmation: browser tests establish the corrected capture and viewport paths, not the hardware result.

The chooser return button fits its full label rather than inheriting the older fixed width. Glossy Blocks has equal Stores and Assemble panes: columns in landscape and rows in portrait. Grid defaults on, with exact 180-unit cells and one placement origin on a 900×540 board. Turning it off retains construction and enables stronger, screen-scaled edge attraction. Drawn block edges meet without the former inset seam.

Very short portrait screens keep blocks at least 44 px and allow scrolling inside Assemble; a visible Swipe cue explains this. Touch scrolling cancels placement safely, lower rows remain usable, and Again returns to the top. Toolbar labels, dropdown text and multiline feedback stay readable. The current install manifest and saved-data keys are unchanged.

## Validation

- 143 existing Glossy model checks and 15 new grid/alignment checks; 11,882 Picture Puzzle core assertions.
- Seven new browser regression scenarios in each engine: capture release, delayed viewport dimensions, a fresh drag after rotation, chooser text bounds, equal panes/grid, repeated mobile rotation in all seven games, and short-screen scrolling/label fit/reset. iPhone 13 and Pixel 5 profiles were used.
- New-game integration checks: Chromium 100 / WebKit 99. Existing colour/help checks: four groups per engine. Existing responsive checks: 138 layouts and 23 interactions per engine.
- Both engines passed v1.63→v1.64 worker upgrade and offline play, retaining preferences, saved photos and unrelated caches.
- Independent code review approved Beta deployment; touch probes verified scroll cancellation and lower-row placement. Visual review checked the rendered phone/tablet/laptop layouts; reported typography, hint and narrow-toolbar defects were corrected and retested.

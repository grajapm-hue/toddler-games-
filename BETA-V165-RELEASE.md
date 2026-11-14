# SaNa Beta v1.65

Glossy Blocks now follows Picture Puzzle's age sizing in both Stores and Assemble:

| Age | Grid | Stores slots |
| --- | --- | ---: |
| 2 | 2×2 | 4 |
| 3 | 3×3 | 9 |
| 4 | 4×4 | 16 |
| 5 | 5×5 | 25 |

Both panes use the same square SVG viewBox, tile artwork and canvas sizing. Stock blocks, drag previews, placed blocks and grid cells therefore have the same visible size. Matching inset focus outlines keep selection from inflating a block. The instruction area has a stable height, so selecting a block does not resize the trays or clip the first source row.

Existing categories remain available through choice pages. Colours and objects repeat to fill the age's fixed number of building-block slots. Small screens keep usable block sizes and expose all rows through scrolling; Stores has a ↕ row control that also permits reliable touch dragging in portrait. Age-2 pattern examples fit the 2×2 board. Age changes begin the corresponding new square board, while rotation preserves a construction.

Validation: exact age/capacity and initial-fit checks; source/preview/placed size comparisons over seven phone/tablet/laptop viewports; 143 catalogue/model checks and 15 alignment checks; 11,882 Picture Puzzle core assertions. Chromium and WebKit passed the new age/scale tests, existing rotation/grid tests, new-game integration, colour/help, responsive/interaction checks, and v1.64→v1.65 worker upgrade/offline tests retaining settings and saved photos. Independent code and screenshot reviews found no remaining important issue. Physical installed-device feedback remains the Beta group's next check.

The install manifest and saved-data keys are unchanged.

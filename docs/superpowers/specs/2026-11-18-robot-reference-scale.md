# Robot reference scale and assembly tools

User request: use the supplied Look screenshot as the default part-size reference, call this 100%, allow plus/minus for the entire assembly and the selected part, and reuse the existing Blocks assembly controls in toddler Beta.

100% is the fit scale of the original 848 by 1264 reference in the current canvas. It must remain meaningful across rotation, resizing, selected parts and Look. Camera Fit may show a different percentage when loose pieces extend beyond the reference. The percentage button restores the reference's centered 100% view. Look and assembly share one camera.

A compact Tools panel contains selected-part Size (Both/Width/Height), counterclockwise/clockwise rotation, Flip, Original and a view-only Grid. Original part dimensions are 100%, with the Blocks size range of 50%-150%. Camera zoom does not resize the model. Part changes unset a magnetic fit; fitting a part at its correct joint restores the supplied original dimensions/orientation. Raw image assets are preserved.

Scope: only grajapm-hue/toddler-games-, maintained docs/beta and its recovery pages. Release as v2.04. Preserve PWA identity/icons, welcome, saved data, Blocks behavior, toddler Main and MathMatrix.

Evidence: v2.03's 100% camera scale measured only 0.6848 of the Look reference after resizing a phone viewport to tablet. The camera retained the phone-shaped initial basis. Fit also redefined the basis while continuing to call it 100%.

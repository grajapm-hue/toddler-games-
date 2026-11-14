# Upgrade and deployment review

Reviewed source: efb77b3 (Beta v1.69).

## Implemented

- Added GitHub Actions validation on pull requests and main pushes. Only main can deploy.
- Deploy the maintained docs directory without running the obsolete Beta generator.
- Check offline-cache file availability, project-relative HTML assets, manifest icons/start URL, and published JavaScript syntax before deployment.
- Run the existing 11,882-assertion Picture Puzzle core suite in CI.

Local validation passed: 225 asset references, published JavaScript syntax, and all 11,882 puzzle assertions. Browser/device behavior and the live deployment have not been revalidated in this review.

## Enable deployment

In repository Settings → Pages → Build and deployment, select **GitHub Actions** as Source. Merge the workflow into main, then inspect the Validate and deploy Pages run. The site root redirects to Beta; the expected address is https://grajapm-hue.github.io/toddler-games-/beta/.

The existing main /docs branch publishing option remains usable until switching Source. Do not run build-beta.mjs: docs/beta is maintained directly. A failed validation prevents this workflow from deploying a new artifact.

## Recommended next upgrades

1. Make browser tests portable. Existing scripts assume local Chrome paths and externally installed Playwright. Add a package manifest, lockfile and shared browser/server fixtures, then run touch, rotation, keyboard and offline-upgrade smoke tests in CI.
2. Consolidate release metadata. The maintained Beta is v1.69 while beta-runtime and standalone sources describe earlier releases. Keep a single release manifest and verify cache identifiers and page release labels together. Preserve the separate legacy prototype.
3. Measure first-install download cost. The service worker precaches the expanded image catalogue. Record total bytes and install duration on a slow connection before deciding whether to split optional collections into downloadable offline packs.
4. Verify accessibility with actual browser evidence: visible keyboard focus, tap alternatives to dragging, reduced motion, sound controls and parent-dialog focus restoration.
5. Clarify intended ages. Repository description says 1–3, while current Beta starting sets and manifest describe 2–5. Align public wording with the intended audience.

These are follow-up recommendations, not verified defects. Existing release-note claims have not been independently reproduced beyond the checks listed above.

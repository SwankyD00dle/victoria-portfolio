# First-pass verification

Verified locally September 12, 2026. No production deployment, live CMS project, real email submission, or DNS changes were made.

| Check | Result |
| --- | --- |
| `npm run check` | Pass: Biome + Astro/CSS formatting |
| `npm run typecheck` | Pass: shared schemas, tooling/tests, Astro/React, Studio |
| `npm test` | 64 tests pass |
| `npm run build` | Pass: 11 static HTML pages plus robots/sitemaps |
| Default production Playwright run | 26 pass, 6 configured-form tests intentionally skipped |
| Isolated Formspree test build | 30 pass, 2 fallback-only tests intentionally skipped; all delivery intercepted |
| `content:import --dry-run` | Pass: 6 project records, 2 singletons, 65 unique images, 1 résumé; no network writes |
| Studio production compilation | Pass with a compile-only project identifier; actual Google login/membership remains to be tested after account setup |
| Dependency audit | 0 known advisories after targeted transitive overrides |
| First-run font download | Pass using Fontshare's official endpoint |

The browser suite covers both desktop and mobile: original routes, image loading, absence of horizontal overflow, homepage navigation, résumé link, no public editor navigation, unconfigured editor messaging, lightbox opening/Escape/focus restoration, real 404 responses, and contact success/failure/network errors through interception.

Additional image tests cover Sanity crop rectangles, intrinsic dimensions, focal point positioning, and responsive variants. Content tests cover invalid/missing live content, deletion without seed fallback, published-only requests, protected teaser projection, path traversal rejection, import schema conversion, and non-destructive mutation construction.

## Visual review

Compared rendered desktop (1440px) and mobile (390px) pages against the live site. Matched portraits, hero proportions, typography, source-specific Satoshi Black headings, whitespace, project order, mobile navigation wrapping, page headings, and case-study colors/layouts. No horizontal overflow or browser runtime errors were found on the checked public routes. This is a close first pass, not a claim of pixel-identical parity across every viewport.

Reference output from the new implementation:

- [Homepage desktop](screenshots/home-desktop.png)
- [Homepage mobile](screenshots/home-mobile.png)
- [About desktop](screenshots/about-desktop.png)
- [AWS case study desktop](screenshots/aws-desktop.png)

## Intentional differences and outstanding checks

- Integro is a public request-access teaser. No password gate or confidential body is shipped.
- Contact falls back to an explicitly labeled email draft until Formspree is connected.
- Device/browser frames and gallery controls are accessible CSS/Base UI reconstructions rather than copies of the vendor runtime.
- Draft preview and deployment progress inside Studio are not implemented. Publication is visible after a successful rebuild.
- Verify the actual owner's Google identity, dataset permissions, webhook lifecycle, real inbox receipt, external research report access, and the embedded Figma prototype after configuring services.
- Existing source colors were retained for fidelity; a separate color-contrast/accessibility polish pass is advisable.

Targeted dependency overrides patch Sanity CLI transitive dependencies (`js-yaml`, `smol-toml`, `adm-zip`, `uuid`). Revisit them as upstream releases catch up rather than using `npm audit fix --force` to downgrade the CMS.

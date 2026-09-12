# Asset provenance

Captured from the owner's public portfolio on September 12, 2026:

- `https://www.victoriatu.info/`
- `/p/about`, `/p/contact`
- `/p/awsinternship`, `/p/docbot`, `/p/costco-redesign`, `/p/diem-app`, `/p/uxresearch`
- Integro's already-public homepage thumbnail/title only; its protected body was not accessed or migrated.

65 unique public images were downloaded from the site's image URLs, keeping the currently selected crops. They were converted to WebP at up to 2400px wide, with 640/1200/1920px variants where the original resolution permits. Hashed filenames identify source URLs. Some distinct URLs contain the same photograph. No runtime references to UXfolio's images, JavaScript, CSS, trackers, or account endpoints are needed.

The owner-facing text, portraits, project screenshots, and résumé remain the property of their respective rights holders. This repository does not grant a stock-image or portfolio-template redistribution license to other people. It does not include the page-builder's source/runtime. Browser and device chrome were reconstructed with CSS and may differ slightly from the original.

- **Satoshi:** Indian Type Foundry / Fontshare. Official unmodified webfonts are obtained directly at development/build time by `scripts/prepare-fonts.mjs`. They are not committed because the FFL permits self-hosting but restricts redistribution. See `packages/frontend/public/fonts/Satoshi-FFL.txt`. The source's "Bold" file actually identifies itself as Satoshi Black; the build fetches weight 900 and maps it to the same rendered heading weight.
- **Public Sans:** bundled locally under the included SIL Open Font License in `packages/frontend/public/fonts/PublicSans-OFL.txt`.
- **Résumé:** the PDF linked from the current public site, copied to `/media/victoria-tu-resume.pdf`.
- **External content:** LinkedIn, three Google Drive research reports, and the Figma prototype retain their external destinations. The study-to-study Costco link now points at the local route.

Review permissions and current résumé details with the owner before production. Source screenshots and raw CMS responses are not committed. No passwords, tokens, private case-study content, or customer/company data are included.

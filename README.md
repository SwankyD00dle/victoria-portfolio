# victoria-portfolio

Victoria Tu's portfolio, rebuilt as a static Astro site with React, Base UI, Tailwind CSS, and an optional Sanity editor. Runs locally without service credentials.

## Packages

- `packages/frontend` — Astro pages, React interactive components, styles, and the migrated public portfolio. Deploys to Cloudflare Pages.
- `packages/content-schema` — shared Zod content validation and inferred types.
- `packages/studio` — standalone Sanity editing portal with Google login. Deploy separately; there is no editor link in the public navigation.

Uses the npm workspace structure, shared strict TypeScript config, kebab-case modules, and Biome conventions from `tier-list-league`. There is no separate application server or database to operate.

## Local development

```bash
nvm use
npm ci
npm run dev
```

Open http://localhost:4321. The default `CONTENT_SOURCE=local` loads the included, validated public content. Local images and the résumé work without UXfolio.

The first `dev` or `build` downloads Satoshi directly from Fontshare for self-hosted use. Its license permits site hosting but not redistribution in a public repository, so those binaries are gitignored. Public Sans is included under its OFL. See [asset notes](docs/assets.md).

## Commands

```bash
npm run dev
npm run build
npm run preview
npm run check
npm run format
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e             # run npm run build first
npm run content:import -- --dry-run
npm run studio              # requires your Sanity project configuration
npm run studio:build
```

Biome formats/lints TypeScript, JavaScript, and JSON. Prettier handles Astro templates and CSS. The frontend uses TypeScript 5.9 for Astro's checker compatibility; shared schemas, scripts, tests, and Studio use TypeScript 7 via the reference repo's `tsc-native` alias.

## Included

- Homepage with six projects, original portraits, hover treatments, and mobile project descriptions.
- About, Contact, and five public case studies at the existing `/p/...` routes.
- Local responsive WebP images, galleries, accessible Base UI image dialogs, and the original Figma embed.
- Original résumé and LinkedIn links, descriptive metadata, canonical URLs, sitemap, real 404, and reduced-motion support.
- Sanity schemas for site settings, About, projects, modular sections, galleries, image uploads/crops, drafts, and publishing.
- Explicit, non-destructive asset/content importer and a build-time published-content adapter.
- Unit tests and desktop/mobile Playwright tests, including separately mocked form delivery.

## Before going live

1. Follow [deployment and CMS setup](docs/deployment.md).
2. Connect a Sanity project owned by Victoria, invite her Google-backed identity, and import the seed. No live CMS has been provisioned by this code.
3. Configure Formspree if keeping direct form delivery. Without it, the form honestly opens an email draft; it does not claim to send mail.
4. Decide how to host the confidential Integro study. This version is a **public teaser and request-access link**, not a password implementation. No protected body, password, or private assets were migrated.
5. Verify layout, galleries, external reports, and actual email receipt with the owner before switching hosting. Some device chrome is a CSS reconstruction, not the original provider's renderer.

Do not commit `.env` files, Sanity tokens, Cloudflare deploy-hook URLs, or confidential portfolio content. Never upload confidential assets to an ordinary Sanity dataset: even private dataset asset URLs are normally publicly accessible.

## Testing the configured contact form

The normal build tests the email-app fallback. This separate test build intercepts all delivery requests and sends no email:

```bash
PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/testform npm run build
TEST_CONTACT_FORM=1 npm run test:e2e
npm run build  # restore the normal build
```

No auto-deploy, CMS write, DNS update, or real email submission happens during setup or tests. No analytics script is installed on the public site. `content:import --apply` is the explicit exception and only writes to the project identified by your local credentials.

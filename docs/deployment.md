# Deployment and owner handoff

## 1. Public portfolio on Cloudflare Pages

Connect the GitHub repo in Cloudflare Pages. Use the repository root as the build root so npm workspaces resolve correctly.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `packages/frontend/dist` |
| Node version | `24.20.0` |
| `SITE_URL` | Actual canonical production origin |
| `CONTENT_SOURCE` | `local` initially; `sanity` after import |

Cloudflare's generated `pages.dev` address is sufficient for review. This does not change any existing DNS. The frontend's `_headers` and `_redirects` are copied to the output. There is deliberately a `404.html`, so unknown public routes do not receive the homepage.

The site is static. Public page requests do not call Sanity; only builds do. The last successful static deployment stays available if a later build fails. Image requests after switching to Sanity use Sanity's CDN.

## 2. Sanity project and Google identity

Create a Free Sanity project in Victoria's own account and a **public** dataset called `production`. Both public documents and ordinary uploaded assets are public. The project must never contain confidential work or contact submissions.

Invite the exact Google-backed Sanity account Victoria will use. Google, GitHub, and email/password can correspond to different Sanity identities. Free currently has Administrator and Viewer roles; editing requires Administrator. Remove any temporary developer access when no longer needed.

The Studio filters its built-in authentication providers to Google. No custom Google Cloud OAuth application is required. This login selection is not a substitute for membership: Sanity's API authorization enforces which invited accounts can write. Discovering the Studio URL grants no editing rights. Do not enable anonymous writes or put an API write token into Studio configuration.

For local editing:

```bash
cp packages/studio/.env.example packages/studio/.env.local
# Fill SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET.
npm run studio
```

Add exact Studio origins to Sanity's API CORS settings with credentials allowed: `http://localhost:3333` and the deployed editor origin. Do not use a wildcard credentialed origin.

The Studio contains three navigation entries: Site settings, About page, and Projects. Fields are normal form/rich-text/image controls, not source code. Image crop/focal-point edits are respected by the frontend. Project section order is editable. Keep existing slugs stable to preserve links.

## 3. Import the public portfolio once

```bash
cp .env.example .env.local
# Fill SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_WRITE_TOKEN.
npm run content:import -- --dry-run
npm run content:import -- --apply
```

Create the temporary write token in your own Sanity project. The importer validates content and local files first, uploads the 65 unique public images and résumé, and creates eight published documents: six project records plus Site settings and About. Integro is metadata only. Existing document IDs are never overwritten or deleted. Revoke the temporary token afterward.

This is a one-time initial publication, not an ongoing sync from local JSON. If an import fails partway through asset uploads, retrying is safe, though unused uploaded assets may remain. Do not run the importer against an unrelated project.

Stable singleton IDs are `site-settings` and `about`. Public project IDs are `project-<slug>`.

## 4. Deploy the Studio separately

Use a second Cloudflare Pages project connected to this repository:

| Setting | Value |
| --- | --- |
| Build command | `npm run studio:build` |
| Output directory | `packages/studio/dist` |
| `SANITY_STUDIO_PROJECT_ID` | Your real Sanity project ID |
| `SANITY_STUDIO_DATASET` | `production` |

The standalone Studio is a static SPA. Cloudflare's default SPA fallback handles Studio deep links when no `404.html` is present in this output. Do not copy the public portfolio's `404.html` into it. Alternatively use Sanity's hosted Studio.

The project ID and dataset are public identifiers. **Never put tokens or other secrets in a `SANITY_STUDIO_*` variable:** these values can be bundled into browser JavaScript.

Set `SANITY_STUDIO_URL` on the public frontend to the Studio's HTTPS URL. `/admin` is an unlinked, noindex entry page with an "Open editor" link, not a custom auth implementation. The actual editor is protected by Sanity login and membership. Before setup, `/admin` explicitly says it is not connected.

## 5. Switch builds to Sanity

Configure these on the public Pages project:

```text
CONTENT_SOURCE=sanity
SANITY_PROJECT_ID=<your-project-id>
SANITY_DATASET=production
SANITY_STUDIO_URL=<your-https-studio-origin>
```

`SANITY_API_READ_TOKEN` is optional for a public dataset. If supplied, keep it a build-only secret, never prefixed with `PUBLIC_`. Production always requests the `published` perspective with CDN caching disabled so a rebuild sees fresh content.

When Sanity mode is enabled, a missing singleton, invalid document, or fetch failure fails the build. It never silently republishes the local seed. Deleted/unpublished projects disappear on the next successful build, including when the project list becomes empty.

## 6. Rebuild on publication

1. In the public Cloudflare Pages project, create a deploy hook for the production branch.
2. In Sanity project API settings, create a webhook for the production dataset and paste that deploy-hook URL.
3. Enable create, update, and delete events, excluding drafts and versions. Filter to the content types used by this site:

```groq
_type in ["siteSettings", "aboutPage", "project"] &&
!(_id in path("drafts.**")) && !(_id in path("versions.**"))
```

4. Publish a harmless change, wait for the successful deployment, and verify the live page. Also test unpublishing a test project.

The hook URL is a credential: keep it in the provider dashboards, not the browser bundle or repository. Draft autosaves must not trigger production builds. Publishing is not instant and live draft preview is not wired in this first pass; the public site updates after the build completes.

## 7. Contact form

Create a Formspree form under Victoria's account, verify its destination email, and configure:

```text
PUBLIC_FORMSPREE_ENDPOINT=https://formspree.io/f/<form-id>
```

A form endpoint is public, not a secret. The UI reports actual success/failure, blocks repeated clicks while sending, and includes a honeypot. Enable Formspree's server-side spam protection and allowed origins; browser validation alone is not abuse protection. Test one real delivery with the owner's approval after setup.

Without an endpoint, the button says "Open email draft" and uses the visitor's email app. It never reports delivery. A direct email link is also present.

## 8. Confidential work is separate

The Integro route intentionally contains only the already-public title/thumbnail and a request-access link. There is no password input, bundled password, hidden private JSON, or fake password protection.

A future password implementation must enforce sessions on the server and protect both documents and assets at every origin, including `pages.dev`, preview URLs, direct object URLs, and image caches. Keep confidential bodies and files in private storage outside the public build and ordinary Sanity assets. A private Sanity dataset by itself does not protect published static output or its asset CDN URLs.

## 9. Backups and exit path

Keep the repo, source assets, and a periodic Sanity dataset export under the owner's control. CMS content changes do not create Git commits. Export public content/assets after significant edits rather than relying only on deployment rollback. The local seed remains an initial snapshot, not a backup of future edits.

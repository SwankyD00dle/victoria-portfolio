# Portfolio editing Studio

From the repository root, run `npm run studio` to edit or `npm run studio:build` to build the Studio. Dependencies are managed by the root workspace.

## Connect an existing Sanity project

1. Copy `.env.example` in this directory to `.env.local`.
2. Set `SANITY_STUDIO_PROJECT_ID` to your real Sanity project ID. The Studio and CLI deliberately fail with an explanatory error when it is absent; there is no fallback project.
3. Set `SANITY_STUDIO_DATASET` if you are not using `production`.
4. Invite the editor's Google account to that project with the appropriate editor permissions. The Studio filters Sanity's built-in authentication providers to Google only; it does not implement its own Google OAuth flow. Project membership and dataset permissions must still be configured in Sanity.
5. Configure the allowed Studio origins in Sanity for the actual deployment. This package does not create projects, datasets, OAuth clients, or hosted services.

## Editing

- **Site settings** edits the single `siteSettings` document with ID `site-settings`, including homepage text, portrait, avatar, public contact details, and a public résumé PDF.
- **About page** edits the single `aboutPage` document with ID `about`.
- **Projects** uses `project` documents sorted by `order`; lower numbers come first. Generate a unique slug from the project name. The expected initial content is five public projects and a protected Integro teaser. Document counts and specific project names are seed-content concerns, not hard-coded publishing limits.
- Build pages with text, split text/image, large image, gallery, columns, and approved embed sections. Advanced layout controls use a 12-column grid (start 1, end 13 means full width); spacing is 0–200 pixels.
- Each uploaded image requires an asset and an accessibility description. Captions are optional. A frame can be none, browser, laptop, or phone.

## Public dataset safety

**Protected projects are public teasers, not privately stored case studies.** Their title, subtitle, slug, order, thumbnail, and visibility are public. Never store confidential material in this dataset or upload confidential assets. All public projects require a hero, accent color, and sections list.

Validation rejects hero, sections (even an empty list), accent, and other non-teaser fields on protected documents. To convert an existing public case study, remove its introduction, sections field, and accent while those controls are still visible, then change visibility to protected. Prefer creating a clean teaser when old content might be sensitive. Removing fields or unpublishing does not guarantee removal from document history, asset storage, caches, or previously fetched copies.

Studio field hiding, validation, singleton menus, and the Google-only login selector are editor safeguards, not a security boundary. API writes can bypass Studio validation. Validate imported data and restrict write access. Confidential case studies require a separate authenticated server-side content system and must never be returned by public queries or embedded in frontend bundles.

## Stored content and frontend normalization

The fields match `packages/content-schema/src/schema/portfolio-schema.ts`, with Sanity-native storage where asset resolution is needed:

- `slug` is a Sanity slug object; normalize `slug.current` to a string.
- Every `portfolioImage` object contains a nested `image` field with its Sanity image asset reference, plus sibling `alt`, `caption`, and `frame`. Resolve `image.asset->url` and `image.asset->metadata.dimensions` into `src`, `width`, and `height`. Preserve crop/hotspot information when building image URLs if desired.
- `siteSettings.resume` is a Sanity file object; normalize `resume.asset->url` to the public URL.
- `body` and `contactBody` contain Portable Text block arrays, not HTML. Link annotations permit HTTPS, mailto, and local paths.
- Sections retain `_key`, `_type`, `paddingTop`, and `paddingBottom`. Grid placement is a nested `{start, end}` object. Optional empty strings should be normalized to `""`; optional image captions and frames default to `""` and `"none"`.
- The editor reserves the singleton IDs above; both the document creation menu and initial-value templates exclude duplicate singleton creation. Singleton actions do not offer duplicate, delete, or unpublish.

No credentials or project identifiers are committed in this package.

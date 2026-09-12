import { isAbsolute, relative, resolve, sep } from "node:path";
import { portfolioSchema, projectSchema } from "@victoria-portfolio/content-schema";
import type {
  Portfolio,
  PortfolioImage,
  Project,
  Section,
} from "@victoria-portfolio/content-schema/types";
import { z } from "zod";

export class ImportValidationError extends Error {}

export interface LocalAsset {
  src: string;
  kind: "image" | "file";
}

interface SanityDocument {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

export function parseImportArguments(args: readonly string[]): "dry-run" | "apply" {
  if (args.length === 1 && args[0] === "--dry-run") return "dry-run";
  if (args.length === 1 && args[0] === "--apply") return "apply";
  throw new ImportValidationError("Use npm run content:import -- --dry-run or --apply.");
}

export function validateImportPortfolio(value: unknown): Portfolio {
  const candidate = z.object({ projects: z.array(z.unknown()) }).safeParse(value);
  if (candidate.success) {
    for (const project of candidate.data.projects) {
      const protectedRecord = z.object({ visibility: z.literal("protected") }).safeParse(project);
      if (
        protectedRecord.success &&
        !projectSchema.options[1].strict().safeParse(project).success
      ) {
        throw new ImportValidationError(
          "Protected projects must contain only valid public teaser fields. Remove all private or extra content before importing.",
        );
      }
    }
  }

  const result = portfolioSchema.safeParse(value);
  if (!result.success) {
    throw new ImportValidationError("The seed portfolio does not match the content schema.");
  }

  const ids = new Set(["site-settings", "about"]);
  for (const project of result.data.projects) {
    if (
      !/^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$/.test(project._id) ||
      project._id.startsWith("drafts.") ||
      project._id.startsWith("versions.") ||
      ids.has(project._id)
    ) {
      throw new ImportValidationError(
        "Project document IDs must be unique, valid, and non-reserved.",
      );
    }
    ids.add(project._id);
  }
  return result.data;
}

export function isInsideDirectory(directory: string, file: string): boolean {
  const path = relative(resolve(directory), resolve(file));
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

export function resolveLocalAsset(publicDirectory: string, src: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(src);
  } catch {
    throw new ImportValidationError("Asset paths must be valid local public paths.");
  }
  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    /[\\?#%]/.test(decoded) ||
    /%(2f|5c)/i.test(src) ||
    [...decoded].some((character) => character.charCodeAt(0) < 32) ||
    decoded
      .slice(1)
      .split("/")
      .some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new ImportValidationError("Import assets must be local files inside frontend/public.");
  }
  const file = resolve(publicDirectory, `.${decoded}`);
  if (!isInsideDirectory(publicDirectory, file)) {
    throw new ImportValidationError("Asset paths must stay inside frontend/public.");
  }
  return file;
}

export function collectLocalAssets(portfolio: Portfolio): LocalAsset[] {
  const validated = validateImportPortfolio(portfolio);
  const assets = new Map<string, LocalAsset>();
  function add(src: string, kind: LocalAsset["kind"]) {
    const previous = assets.get(src);
    if (previous && previous.kind !== kind) {
      throw new ImportValidationError("An asset cannot be both an image and a résumé file.");
    }
    assets.set(src, { src, kind });
  }
  function addImage(image: PortfolioImage) {
    add(image.src, "image");
  }
  function addSection(section: Section) {
    switch (section._type) {
      case "splitSection":
      case "mediaSection":
        addImage(section.image);
        break;
      case "gallerySection":
        section.images.forEach(addImage);
        break;
      case "columnsSection":
        section.columns.forEach((column) => {
          if (column.image) addImage(column.image);
        });
        break;
      case "textSection":
      case "embedSection":
        break;
    }
  }

  addImage(validated.settings.portrait);
  addImage(validated.settings.avatar);
  add(validated.settings.resume, "file");
  validated.about.sections.forEach(addSection);
  for (const project of validated.projects) {
    addImage(project.thumbnail);
    if (project.visibility === "public") {
      if (project.hero.image) addImage(project.hero.image);
      project.sections.forEach(addSection);
    }
  }
  return [...assets.values()];
}

export function createSanityDocuments(
  portfolio: Portfolio,
  assetIds: ReadonlyMap<string, string>,
): SanityDocument[] {
  const validated = validateImportPortfolio(portfolio);
  function reference(src: string, kind: LocalAsset["kind"]) {
    const id = assetIds.get(src);
    if (!id?.startsWith(`${kind}-`)) {
      throw new ImportValidationError("Every local asset needs a matching uploaded Sanity asset.");
    }
    return { _type: "reference", _ref: id };
  }
  function imageObject(image: PortfolioImage) {
    return {
      _type: "portfolioImage",
      image: { _type: "image", asset: reference(image.src, "image") },
      alt: image.alt,
      caption: image.caption,
      frame: image.frame,
    };
  }
  function gridObject(grid: { start: number; end: number }) {
    return { _type: "grid", start: grid.start, end: grid.end };
  }
  function sectionObject(section: Section) {
    const base = {
      _type: section._type,
      _key: section._key,
      paddingTop: section.paddingTop,
      paddingBottom: section.paddingBottom,
    };
    switch (section._type) {
      case "textSection":
        return { ...base, body: section.body, textGrid: gridObject(section.textGrid) };
      case "splitSection":
        return {
          ...base,
          body: section.body,
          image: imageObject(section.image),
          textGrid: gridObject(section.textGrid),
          mediaGrid: gridObject(section.mediaGrid),
        };
      case "mediaSection":
        return {
          ...base,
          image: imageObject(section.image),
          mediaGrid: gridObject(section.mediaGrid),
        };
      case "gallerySection":
        return {
          ...base,
          images: section.images.map((image, index) => ({
            ...imageObject(image),
            _key: `image-${index + 1}`,
          })),
          columns: section.columns,
          layout: section.layout,
        };
      case "columnsSection":
        return {
          ...base,
          columns: section.columns.map((column, index) => ({
            _type: "contentColumn",
            _key: column._key || `column-${index + 1}`,
            body: column.body,
            ...(column.image ? { image: imageObject(column.image) } : {}),
          })),
        };
      case "embedSection":
        return { ...base, title: section.title, url: section.url };
    }
  }
  function projectDocument(project: Project): SanityDocument {
    const teaser = {
      _id: project._id,
      _type: "project",
      title: project.title,
      subtitle: project.subtitle,
      slug: { _type: "slug", current: project.slug },
      order: project.order,
      thumbnail: imageObject(project.thumbnail),
      visibility: project.visibility,
    };
    if (project.visibility === "protected") return teaser;
    const { image, textGrid, mediaGrid, ...hero } = project.hero;
    return {
      ...teaser,
      accent: project.accent,
      hero: {
        _type: "projectHero",
        ...hero,
        textGrid: gridObject(textGrid),
        mediaGrid: gridObject(mediaGrid),
        ...(image ? { image: imageObject(image) } : {}),
      },
      sections: project.sections.map(sectionObject),
    };
  }

  const { portrait, avatar, resume, ...settings } = validated.settings;
  return [
    {
      _id: "site-settings",
      _type: "siteSettings",
      ...settings,
      portrait: imageObject(portrait),
      avatar: imageObject(avatar),
      resume: { _type: "file", asset: reference(resume, "file") },
    },
    { _id: "about", _type: "aboutPage", sections: validated.about.sections.map(sectionObject) },
    ...validated.projects.map(projectDocument),
  ];
}

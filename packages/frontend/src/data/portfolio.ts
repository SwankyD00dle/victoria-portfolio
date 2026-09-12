import { createClient } from "@sanity/client";
import { portfolioSchema } from "@victoria-portfolio/content-schema";
import type { Portfolio } from "@victoria-portfolio/content-schema/types";
import { z } from "zod";

const imageProjection = `{
  "src": image.asset->url,
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  alt,
  defined(image.crop) => { "crop": image.crop { top, bottom, left, right } },
  defined(image.hotspot) => { "hotspot": image.hotspot { x, y } },
  "caption": coalesce(caption, ""),
  "frame": coalesce(frame, "none")
}`;

const sectionProjection = `{
  _key, _type,
  "paddingTop": coalesce(paddingTop, 60),
  "paddingBottom": coalesce(paddingBottom, 60),
  _type == "textSection" => { body, textGrid { start, end } },
  _type == "splitSection" => {
    body, image ${imageProjection}, textGrid { start, end }, mediaGrid { start, end }
  },
  _type == "mediaSection" => { image ${imageProjection}, mediaGrid { start, end } },
  _type == "gallerySection" => { images[] ${imageProjection}, columns, layout },
  _type == "columnsSection" => {
    columns[] { _key, body, defined(image) => { image ${imageProjection} } }
  },
  _type == "embedSection" => { title, url }
}`;

const portfolioQuery = `{
  "settings": *[_type == "siteSettings" && _id == "site-settings"][0] {
    _id, name, role, heading, introduction, currentRole,
    portrait ${imageProjection}, avatar ${imageProjection},
    email, linkedin, "resume": resume.asset->url, contactBody
  },
  "about": *[_type == "aboutPage" && _id == "about"][0] {
    _id, sections[] ${sectionProjection}
  },
  "projects": *[_type == "project" && !(_id in path("drafts.**"))]
    | order(order asc, slug.current asc) {
      _id, title, "subtitle": coalesce(subtitle, ""), "slug": slug.current,
      order, thumbnail ${imageProjection}, visibility,
      visibility == "public" => {
        hero {
          title, "subtitle": coalesce(subtitle, ""), background, textColor,
          textGrid { start, end }, mediaGrid { start, end },
          defined(image) => { image ${imageProjection} }
        },
        accent, sections[] ${sectionProjection}
      }
    }
}`;

const livePortfolioSchema = portfolioSchema.extend({
  settings: portfolioSchema.shape.settings.extend({ _id: z.literal("site-settings") }),
  about: portfolioSchema.shape.about.extend({ _id: z.literal("about") }),
});

function parsePortfolio(value: unknown): Portfolio {
  const portfolio = portfolioSchema.parse(value);
  portfolio.projects.sort(
    (left, right) => left.order - right.order || left.slug.localeCompare(right.slug),
  );
  return portfolio;
}

// Import only from Astro build-time frontmatter, never from browser components.
export async function getPortfolio(): Promise<Portfolio> {
  const source = import.meta.env.CONTENT_SOURCE ?? "local";
  if (source === "local") {
    const seed = await import("./portfolio.json");
    return parsePortfolio(seed.default);
  }
  if (source !== "sanity") {
    throw new Error("CONTENT_SOURCE must be local or sanity.");
  }

  const projectId = import.meta.env.SANITY_PROJECT_ID;
  const dataset = import.meta.env.SANITY_DATASET;
  if (!projectId || !dataset) {
    throw new Error("Sanity builds require SANITY_PROJECT_ID and SANITY_DATASET.");
  }

  const client = createClient({
    projectId,
    dataset,
    token: import.meta.env.SANITY_API_READ_TOKEN || import.meta.env.SANITY_READ_TOKEN || undefined,
    apiVersion: "2025-02-19",
    useCdn: false,
    perspective: "published",
  });
  const live: unknown = await client.fetch(portfolioQuery);
  return parsePortfolio(livePortfolioSchema.parse(live));
}

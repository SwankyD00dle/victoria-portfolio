import { z } from "zod";

export const linkSchema = z.string().refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return ["https:", "mailto:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}, "Use an HTTPS URL, email link, or local path.");

export const richTextSchema = z.array(
  z.object({
    _type: z.literal("block"),
    _key: z.string(),
    style: z.enum(["normal", "h2", "h3", "h4", "blockquote"]).default("normal"),
    listItem: z.enum(["bullet", "number"]).optional(),
    level: z.number().int().min(1).optional(),
    children: z.array(
      z.object({
        _type: z.literal("span"),
        _key: z.string(),
        text: z.string(),
        marks: z.array(z.string()).default([]),
      }),
    ),
    markDefs: z
      .array(
        z.object({
          _key: z.string(),
          _type: z.literal("link"),
          href: linkSchema,
        }),
      )
      .default([]),
  }),
);

export const imageSchema = z.object({
  src: linkSchema,
  crop: z
    .object({
      top: z.number().min(0).max(1),
      bottom: z.number().min(0).max(1),
      left: z.number().min(0).max(1),
      right: z.number().min(0).max(1),
    })
    .refine(
      (crop) => crop.top + crop.bottom < 1 && crop.left + crop.right < 1,
      "Crop must retain some image area.",
    )
    .optional(),
  hotspot: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  alt: z.string().min(1),
  caption: z.string().default(""),
  frame: z.enum(["none", "browser", "laptop", "phone"]).default("none"),
});

export const gridSchema = z
  .object({
    start: z.number().int().min(1).max(12),
    end: z.number().int().min(2).max(13),
  })
  .refine((grid) => grid.end > grid.start, "Columns must have a positive width.");

const sectionFields = {
  _key: z.string(),
  paddingTop: z.number().min(0).max(200).default(60),
  paddingBottom: z.number().min(0).max(200).default(60),
};

export const sectionSchema = z.discriminatedUnion("_type", [
  z.object({
    ...sectionFields,
    _type: z.literal("textSection"),
    body: richTextSchema,
    textGrid: gridSchema,
  }),
  z.object({
    ...sectionFields,
    _type: z.literal("splitSection"),
    body: richTextSchema,
    image: imageSchema,
    textGrid: gridSchema,
    mediaGrid: gridSchema,
  }),
  z.object({
    ...sectionFields,
    _type: z.literal("mediaSection"),
    image: imageSchema,
    mediaGrid: gridSchema,
  }),
  z.object({
    ...sectionFields,
    _type: z.literal("gallerySection"),
    images: z.array(imageSchema).min(1),
    columns: z.number().int().min(1).max(4),
    layout: z.enum(["grid", "slider", "carousel"]),
  }),
  z.object({
    ...sectionFields,
    _type: z.literal("columnsSection"),
    columns: z
      .array(z.object({ _key: z.string(), body: richTextSchema, image: imageSchema.optional() }))
      .min(1)
      .max(4),
  }),
  z.object({
    ...sectionFields,
    _type: z.literal("embedSection"),
    title: z.string(),
    url: z
      .url()
      .refine((url) =>
        ["www.figma.com", "www.youtube-nocookie.com", "player.vimeo.com"].includes(
          new URL(url).hostname,
        ),
      ),
  }),
]);

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
const projectFields = {
  _id: z.string(),
  title: z.string().min(1),
  subtitle: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .refine(
      (slug) => !["about", "contact", "file", "link", "home"].includes(slug),
      "This URL is reserved.",
    ),
  order: z.number(),
  thumbnail: imageSchema,
};

export const projectSchema = z.discriminatedUnion("visibility", [
  z.object({
    ...projectFields,
    visibility: z.literal("public"),
    hero: z.object({
      title: z.string(),
      subtitle: z.string(),
      background: hexColorSchema,
      textColor: hexColorSchema,
      image: imageSchema.optional(),
      textGrid: gridSchema,
      mediaGrid: gridSchema,
    }),
    accent: hexColorSchema,
    sections: z.array(sectionSchema),
  }),
  z.object({ ...projectFields, visibility: z.literal("protected") }),
]);

export const settingsSchema = z.object({
  name: z.string(),
  role: z.string(),
  heading: z.string(),
  introduction: z.string(),
  currentRole: z.string(),
  portrait: imageSchema,
  avatar: imageSchema,
  email: z.email(),
  linkedin: z.url(),
  resume: linkSchema,
  contactBody: richTextSchema,
});

export const portfolioSchema = z.object({
  settings: settingsSchema,
  about: z.object({ sections: z.array(sectionSchema) }),
  projects: z
    .array(projectSchema)
    .refine(
      (projects) => new Set(projects.map((project) => project.slug)).size === projects.length,
      "Project URLs must be unique.",
    ),
});

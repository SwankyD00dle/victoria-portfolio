import { defineArrayMember, defineField, defineType } from "sanity";

export function validateLink(value: string | undefined) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    if (["https:", "mailto:"].includes(new URL(value).protocol)) return true;
  } catch {
    return "Use a full HTTPS address, a mailto: email link, or a local path beginning with /.";
  }

  return "Use an HTTPS address, a mailto: email link, or a local path beginning with /.";
}

export const body = defineType({
  name: "body",
  title: "Formatted text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Heading", value: "h2" },
        { title: "Subheading", value: "h3" },
        { title: "Small heading", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet list", value: "bullet" },
        { title: "Numbered list", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Underline", value: "underline" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              defineField({
                name: "href",
                title: "Link address",
                type: "string",
                description: "Use https://, mailto:, or a page path such as /about.",
                validation: (rule) => rule.required().custom(validateLink),
              }),
            ],
          },
        ],
      },
    }),
  ],
});

export const portfolioImage = defineType({
  name: "portfolioImage",
  title: "Image",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Upload image",
      type: "image",
      options: { hotspot: true },
      description: "Choose or upload the actual image. An empty image slot cannot be published.",
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "alt",
      title: "Image description (accessibility)",
      type: "string",
      description: "Briefly describe what the image shows for someone who cannot see it.",
      validation: (rule) =>
        rule
          .required()
          .custom((value) =>
            value?.trim() ? true : "Describe the image; blank descriptions are not accessible.",
          ),
    }),
    defineField({
      name: "caption",
      title: "Caption below image",
      type: "string",
      initialValue: "",
    }),
    defineField({
      name: "frame",
      title: "Image frame",
      type: "string",
      initialValue: "none",
      options: {
        list: [
          { title: "No frame", value: "none" },
          { title: "Browser window", value: "browser" },
          { title: "Laptop", value: "laptop" },
          { title: "Phone", value: "phone" },
        ],
      },
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value ||
              ["none", "browser", "laptop", "phone"].includes(value) ||
              "Choose a listed image frame.",
          ),
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "caption", media: "image" },
  },
});

export const grid = defineType({
  name: "grid",
  title: "Column placement",
  type: "object",
  description: "Advanced: a 12-column desktop grid. Start 1 and end 13 fills the width.",
  options: { columns: 2 },
  initialValue: { start: 1, end: 13 },
  fields: [
    defineField({
      name: "start",
      title: "Start at grid line",
      type: "number",
      validation: (rule) => rule.required().integer().min(1).max(12),
    }),
    defineField({
      name: "end",
      title: "End at grid line",
      type: "number",
      validation: (rule) => rule.required().integer().min(2).max(13),
    }),
  ],
  validation: (rule) =>
    rule.custom<{ start?: number; end?: number }>((value) => {
      if (typeof value?.start !== "number" || typeof value.end !== "number") return true;
      return value.end > value.start || "The end line must come after the start line.";
    }),
});

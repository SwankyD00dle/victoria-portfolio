import { defineArrayMember, defineField, defineType } from "sanity";

const layoutFieldset = {
  name: "layout",
  title: "Advanced layout & spacing",
  options: { collapsible: true, collapsed: true },
};

const spacingFields = [
  defineField({
    name: "paddingTop",
    title: "Space above (pixels)",
    type: "number",
    fieldset: "layout",
    initialValue: 60,
    validation: (rule) => rule.required().min(0).max(200),
  }),
  defineField({
    name: "paddingBottom",
    title: "Space below (pixels)",
    type: "number",
    fieldset: "layout",
    initialValue: 60,
    validation: (rule) => rule.required().min(0).max(200),
  }),
];

const bodyField = defineField({
  name: "body",
  title: "Text",
  type: "body",
  validation: (rule) => rule.required(),
});

const imageField = defineField({
  name: "image",
  title: "Image",
  type: "portfolioImage",
  validation: (rule) => rule.required(),
});

const textGridField = defineField({
  name: "textGrid",
  title: "Text column placement",
  type: "grid",
  fieldset: "layout",
  initialValue: { start: 3, end: 11 },
  validation: (rule) => rule.required(),
});

const mediaGridField = defineField({
  name: "mediaGrid",
  title: "Image column placement",
  type: "grid",
  fieldset: "layout",
  initialValue: { start: 1, end: 13 },
  validation: (rule) => rule.required(),
});

export const textSection = defineType({
  name: "textSection",
  title: "Text",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [bodyField, textGridField, ...spacingFields],
  preview: {
    select: { excerpt: "body.0.children.0.text" },
    prepare({ excerpt }) {
      return { title: "Text", subtitle: excerpt || "Add paragraphs, headings, or lists" };
    },
  },
});

export const splitSection = defineType({
  name: "splitSection",
  title: "Text beside an image",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [
    bodyField,
    imageField,
    defineField({ ...textGridField, initialValue: { start: 1, end: 6 } }),
    defineField({ ...mediaGridField, initialValue: { start: 7, end: 13 } }),
    ...spacingFields,
  ],
  preview: {
    select: { excerpt: "body.0.children.0.text", media: "image.image" },
    prepare({ excerpt, media }) {
      return { title: "Text beside an image", subtitle: excerpt, media };
    },
  },
});

export const mediaSection = defineType({
  name: "mediaSection",
  title: "Large image",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [imageField, mediaGridField, ...spacingFields],
  preview: {
    select: { subtitle: "image.alt", media: "image.image" },
    prepare({ subtitle, media }) {
      return { title: "Large image", subtitle, media };
    },
  },
});

export const gallerySection = defineType({
  name: "gallerySection",
  title: "Image gallery",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [
    defineField({
      name: "images",
      title: "Gallery images",
      type: "array",
      description: "Drag images to reorder them.",
      of: [defineArrayMember({ type: "portfolioImage" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "layout",
      title: "Display style",
      type: "string",
      initialValue: "grid",
      options: {
        list: [
          { title: "Grid", value: "grid" },
          { title: "Slider", value: "slider" },
          { title: "Carousel", value: "carousel" },
        ],
        layout: "radio",
      },
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value ||
              ["grid", "slider", "carousel"].includes(value) ||
              "Choose a listed display style.",
          ),
    }),
    defineField({
      name: "columns",
      title: "Images per row",
      type: "number",
      initialValue: 2,
      description: "Choose 1 to 4. Small screens automatically use fewer columns.",
      validation: (rule) => rule.required().integer().min(1).max(4),
    }),
    ...spacingFields,
  ],
  preview: {
    select: { layout: "layout", media: "images.0.image" },
    prepare({ layout, media }) {
      return { title: "Image gallery", subtitle: layout, media };
    },
  },
});

export const columnsSection = defineType({
  name: "columnsSection",
  title: "Text & image columns",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [
    defineField({
      name: "columns",
      title: "Columns",
      type: "array",
      description: "Add up to four columns. Each has text and an optional image.",
      of: [
        defineArrayMember({
          name: "contentColumn",
          title: "Column",
          type: "object",
          fields: [
            bodyField,
            defineField({ name: "image", title: "Optional image", type: "portfolioImage" }),
          ],
          preview: {
            select: { title: "body.0.children.0.text", media: "image.image" },
            prepare({ title, media }) {
              return { title: title || "Column", media };
            },
          },
        }),
      ],
      validation: (rule) => rule.required().min(1).max(4),
    }),
    ...spacingFields,
  ],
  preview: { prepare: () => ({ title: "Text & image columns" }) },
});

export const embedSection = defineType({
  name: "embedSection",
  title: "Video or Figma embed",
  type: "object",
  fieldsets: [layoutFieldset],
  fields: [
    defineField({
      name: "title",
      title: "Accessible embed title",
      type: "string",
      description: "Describe the video or prototype for screen readers.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      title: "Secure embed URL",
      type: "url",
      description:
        "Paste the embed URL from www.figma.com, www.youtube-nocookie.com, or player.vimeo.com. Regular video watch links are not embed links.",
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value) return true;
          try {
            const url = new URL(value);
            const approvedHosts = ["www.figma.com", "www.youtube-nocookie.com", "player.vimeo.com"];
            return (
              (url.protocol === "https:" &&
                !url.username &&
                !url.password &&
                approvedHosts.includes(url.hostname)) ||
              "Use an HTTPS embed URL from Figma, YouTube's privacy-enhanced player, or Vimeo's player."
            );
          } catch {
            return "Paste a complete, valid embed URL.";
          }
        }),
    }),
    ...spacingFields,
  ],
  preview: {
    select: { title: "title", subtitle: "url" },
  },
});

export const sectionMembers = [
  defineArrayMember({ type: "textSection" }),
  defineArrayMember({ type: "splitSection" }),
  defineArrayMember({ type: "mediaSection" }),
  defineArrayMember({ type: "gallerySection" }),
  defineArrayMember({ type: "columnsSection" }),
  defineArrayMember({ type: "embedSection" }),
];

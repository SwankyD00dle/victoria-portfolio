import { defineField, defineType } from "sanity";
import { sectionMembers } from "./sections";

const protectedWarning =
  "Protected means public teaser only, not private storage. This dataset is publicly readable. Never upload confidential text, images, or files here. Hiding a Studio field is not security. Remove the hero, sections, and accent before publishing a protected teaser. Private case studies need a separate, authenticated content system.";

const protectedFields = new Set([
  "_id",
  "_type",
  "_rev",
  "_createdAt",
  "_updatedAt",
  "_system",
  "title",
  "subtitle",
  "slug",
  "order",
  "thumbnail",
  "visibility",
]);

export const projectHero = defineType({
  name: "projectHero",
  title: "Project introduction",
  type: "object",
  fieldsets: [
    {
      name: "layout",
      title: "Advanced column placement",
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Headline",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Supporting line",
      type: "text",
      rows: 3,
      initialValue: "",
    }),
    defineField({
      name: "background",
      title: "Background color",
      type: "string",
      description: "Use a six-digit hex color, such as #F5F1E8.",
      initialValue: "#F5F1E8",
      validation: (rule) => rule.required().regex(/^#[0-9a-f]{6}$/i, "six-digit hex color"),
    }),
    defineField({
      name: "textColor",
      title: "Text color",
      type: "string",
      description: "Choose a readable color with strong contrast against the background.",
      initialValue: "#252525",
      validation: (rule) => rule.required().regex(/^#[0-9a-f]{6}$/i, "six-digit hex color"),
    }),
    defineField({ name: "image", title: "Optional introduction image", type: "portfolioImage" }),
    defineField({
      name: "textGrid",
      title: "Headline column placement",
      type: "grid",
      fieldset: "layout",
      initialValue: { start: 1, end: 7 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mediaGrid",
      title: "Image column placement",
      type: "grid",
      fieldset: "layout",
      initialValue: { start: 7, end: 13 },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "title", media: "image.image" } },
});

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  description:
    "The homepage shows projects in display order. Protected projects are public teasers only.",
  initialValue: { visibility: "public", order: 0, subtitle: "" },
  groups: [
    { name: "teaser", title: "Homepage card", default: true },
    { name: "caseStudy", title: "Public case study" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Project name",
      type: "string",
      group: "teaser",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Short description",
      type: "text",
      rows: 3,
      group: "teaser",
      description: "Public text shown on the homepage, including for protected projects.",
      initialValue: "",
    }),
    defineField({
      name: "slug",
      title: "Page address",
      type: "slug",
      group: "teaser",
      description:
        "Click Generate to make a web address from the project name. Keep published addresses stable.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) =>
        rule.required().custom((value) => {
          if (!value?.current) return true;
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.current)) {
            return "Use lowercase letters, numbers, and single hyphens only.";
          }
          return (
            !["about", "contact", "file", "link", "home"].includes(value.current) ||
            "This address is reserved. Choose a different project address."
          );
        }),
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      group: "teaser",
      description: "Smaller numbers appear first on the homepage.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "thumbnail",
      title: "Homepage card image",
      type: "portfolioImage",
      group: "teaser",
      description:
        "Always public. For protected work, use only an approved, non-confidential teaser image.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "visibility",
      title: "Project visibility",
      type: "string",
      group: "teaser",
      description: protectedWarning,
      options: {
        list: [
          { title: "Public — full case study", value: "public" },
          { title: "Protected — public teaser only", value: "protected" },
        ],
        layout: "radio",
      },
      validation: (rule) =>
        rule
          .required()
          .custom(
            (value) =>
              !value || ["public", "protected"].includes(value) || "Choose Public or Protected.",
          ),
    }),
    defineField({
      name: "hero",
      title: "Project introduction",
      type: "projectHero",
      group: "caseStudy",
      hidden: ({ document }) => document?.visibility === "protected",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.visibility === "protected") {
            return (
              value === undefined ||
              "Remove this introduction before publishing a protected teaser."
            );
          }
          return (
            context.document?.visibility !== "public" ||
            Boolean(value) ||
            "Public projects need an introduction."
          );
        }),
    }),
    defineField({
      name: "accent",
      title: "Project accent color",
      type: "string",
      group: "caseStudy",
      description: "Use a six-digit hex color, such as #8B453C.",
      hidden: ({ document }) => document?.visibility === "protected",
      validation: (rule) =>
        rule.regex(/^#[0-9a-f]{6}$/i, "six-digit hex color").custom((value, context) => {
          if (context.document?.visibility === "protected") {
            return (
              value === undefined || "Remove this accent before publishing a protected teaser."
            );
          }
          return (
            context.document?.visibility !== "public" ||
            Boolean(value) ||
            "Public projects need an accent color."
          );
        }),
    }),
    defineField({
      name: "sections",
      title: "Case study sections",
      type: "array",
      group: "caseStudy",
      description:
        "Add sections in reading order. Drag a section to move it; open it to edit its content.",
      of: sectionMembers,
      hidden: ({ document }) => document?.visibility === "protected",
      validation: (rule) =>
        rule.custom((value, context) => {
          if (context.document?.visibility === "protected") {
            return (
              value === undefined ||
              "Remove all sections, including the empty list, before publishing a protected teaser."
            );
          }
          return (
            context.document?.visibility !== "public" ||
            Array.isArray(value) ||
            "Public projects need a sections list."
          );
        }),
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      if (value?.visibility !== "protected") return true;
      const extraFields = Object.keys(value).filter((key) => !protectedFields.has(key));
      return (
        extraFields.length === 0 ||
        `Protected projects can contain only public teaser metadata. Remove: ${extraFields.join(", ")}. Hiding fields is not security; never store confidential content in this dataset.`
      );
    }),
  orderings: [
    { title: "Homepage order", name: "homepageOrder", by: [{ field: "order", direction: "asc" }] },
    { title: "Project name", name: "projectName", by: [{ field: "title", direction: "asc" }] },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "subtitle",
      visibility: "visibility",
      media: "thumbnail.image",
    },
    prepare({ title, subtitle, visibility, media }) {
      return {
        title,
        subtitle: visibility === "protected" ? "Protected · public teaser only" : subtitle,
        media,
      };
    },
  },
});

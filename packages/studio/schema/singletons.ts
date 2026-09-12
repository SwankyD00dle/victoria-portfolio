import { defineField, defineType } from "sanity";
import { sectionMembers } from "./sections";

function singletonId(id: string) {
  return (value: { _id?: string } | undefined) =>
    !value?._id ||
    [id, `drafts.${id}`].includes(value._id) ||
    `Edit the existing ${id} document from the Studio menu instead of creating another copy.`;
}

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  groups: [
    { name: "intro", title: "Homepage introduction", default: true },
    { name: "identity", title: "Name & images" },
    { name: "contact", title: "Contact & résumé" },
  ],
  fields: [
    defineField({
      name: "heading",
      title: "Main homepage heading",
      type: "string",
      group: "intro",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "introduction",
      title: "Short introduction",
      type: "text",
      rows: 4,
      group: "intro",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "currentRole",
      title: "What you do now",
      type: "string",
      group: "intro",
      description: "Your current role or availability, shown below the introduction.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "portrait",
      title: "Large portrait",
      type: "portfolioImage",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "avatar",
      title: "Small profile image",
      type: "portfolioImage",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "name",
      title: "Your name",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "role",
      title: "Professional title",
      type: "string",
      group: "identity",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "email",
      title: "Public contact email",
      type: "string",
      group: "contact",
      description: "This address will be visible to everyone visiting your portfolio.",
      validation: (rule) => rule.required().email(),
    }),
    defineField({
      name: "linkedin",
      title: "LinkedIn profile address",
      type: "url",
      group: "contact",
      validation: (rule) => rule.required().uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "resume",
      title: "Public résumé PDF",
      type: "file",
      group: "contact",
      options: { accept: "application/pdf" },
      description:
        "Upload a PDF approved for public download. Do not include private contact details.",
      validation: (rule) => rule.required().assetRequired(),
    }),
    defineField({
      name: "contactBody",
      title: "Contact invitation",
      type: "body",
      group: "contact",
      description:
        "A short, friendly invitation to get in touch. Supports formatted text and links.",
      validation: (rule) => rule.required(),
    }),
  ],
  validation: (rule) => rule.custom(singletonId("site-settings")),
  preview: {
    prepare: () => ({ title: "Site settings", subtitle: "Homepage, identity, and contact" }),
  },
});

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About page",
  type: "document",
  fields: [
    defineField({
      name: "sections",
      title: "About page sections",
      type: "array",
      description:
        "Tell your story with text, images, galleries, and embeds. Drag sections to reorder them.",
      of: sectionMembers,
      validation: (rule) => rule.required(),
    }),
  ],
  validation: (rule) => rule.custom(singletonId("about")),
  preview: { prepare: () => ({ title: "About page", subtitle: "Your story and experience" }) },
});

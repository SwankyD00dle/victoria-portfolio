import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./environment";
import { schemaTypes } from "./schema";
import { singletonTypes, structure } from "./structure";

export default defineConfig({
  name: "victoria-portfolio",
  title: "Victoria's portfolio",
  projectId,
  dataset,
  auth: {
    providers: (providers) => providers.filter((provider) => provider.name === "google"),
    redirectOnSingle: true,
  },
  plugins: [structureTool({ structure })],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter((template) => !singletonTypes.has(template.schemaType)),
  },
  document: {
    newDocumentOptions: (options) =>
      options.filter((option) => !singletonTypes.has(option.templateId)),
    actions: (actions, context) =>
      singletonTypes.has(context.schemaType)
        ? actions.filter(
            (action) =>
              action.action && ["publish", "discardChanges", "restore"].includes(action.action),
          )
        : actions,
  },
});

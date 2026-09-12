import type { StructureResolver } from "sanity/structure";

export const singletonTypes = new Set(["siteSettings", "aboutPage"]);

export const structure: StructureResolver = (builder) =>
  builder
    .list()
    .title("Your portfolio")
    .items([
      builder
        .listItem()
        .id("site-settings")
        .title("Site settings")
        .child(builder.document().schemaType("siteSettings").documentId("site-settings")),
      builder
        .listItem()
        .id("about")
        .title("About page")
        .child(builder.document().schemaType("aboutPage").documentId("about")),
      builder.divider(),
      builder
        .listItem()
        .id("projects")
        .title("Projects")
        .child(
          builder
            .documentTypeList("project")
            .title("Projects")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
    ]);

import { portfolioSchema } from "@victoria-portfolio/content-schema";
import type { Portfolio } from "@victoria-portfolio/content-schema/types";
import { describe, expect, it } from "vitest";
import {
  collectLocalAssets,
  createSanityDocuments,
  isInsideDirectory,
  parseImportArguments,
  resolveLocalAsset,
  validateImportPortfolio,
} from "../import-utils";

function image(name: string) {
  return { src: `/media/${name}.png`, width: 800, height: 600, alt: name };
}

function fixture(): Portfolio {
  const body = [
    {
      _type: "block",
      _key: "paragraph",
      style: "normal",
      children: [{ _type: "span", _key: "span", text: "Hello", marks: ["strong", "link"] }],
      markDefs: [{ _type: "link", _key: "link", href: "https://example.com" }],
    },
  ];
  const grid = { start: 1, end: 13 };
  return portfolioSchema.parse({
    settings: {
      name: "Designer",
      role: "Product designer",
      heading: "Hello",
      introduction: "I design useful things.",
      currentRole: "Independent",
      portrait: image("portrait"),
      avatar: image("avatar"),
      email: "hello@example.com",
      linkedin: "https://www.linkedin.com/in/example",
      resume: "/media/resume.pdf",
      contactBody: body,
    },
    about: {
      sections: [
        { _key: "text", _type: "textSection", body, textGrid: grid },
        {
          _key: "split",
          _type: "splitSection",
          body,
          image: image("split"),
          textGrid: grid,
          mediaGrid: grid,
        },
        { _key: "media", _type: "mediaSection", image: image("large"), mediaGrid: grid },
        {
          _key: "gallery",
          _type: "gallerySection",
          images: [image("gallery"), image("gallery")],
          columns: 2,
          layout: "slider",
        },
        {
          _key: "columns",
          _type: "columnsSection",
          columns: [
            { _key: "with-image", body, image: image("column") },
            { _key: "without-image", body },
          ],
        },
        {
          _key: "embed",
          _type: "embedSection",
          title: "Prototype",
          url: "https://www.figma.com/embed?url=example",
        },
      ],
    },
    projects: [
      {
        _id: "project-public",
        title: "Public project",
        subtitle: "",
        slug: "public-project",
        order: 1,
        thumbnail: image("thumbnail"),
        visibility: "public",
        accent: "#112233",
        hero: {
          title: "A public story",
          subtitle: "",
          background: "#ffffff",
          textColor: "#111111",
          image: image("hero"),
          textGrid: grid,
          mediaGrid: grid,
        },
        sections: [
          {
            _key: "project-image",
            _type: "mediaSection",
            image: image("project-section"),
            mediaGrid: grid,
          },
        ],
      },
      {
        _id: "project-protected",
        title: "Approved teaser",
        subtitle: "Only public information",
        slug: "protected-project",
        order: 2,
        thumbnail: image("thumbnail"),
        visibility: "protected",
      },
    ],
  });
}

function assetIds(portfolio: Portfolio) {
  return new Map(
    collectLocalAssets(portfolio).map((asset, index) => [
      asset.src,
      `${asset.kind}-asset-${index}`,
    ]),
  );
}

describe("explicit importer arguments", () => {
  it("requires one unambiguous dry-run or apply flag", () => {
    expect(parseImportArguments(["--dry-run"])).toBe("dry-run");
    expect(parseImportArguments(["--apply"])).toBe("apply");
    for (const flags of [[], ["--force"], ["--apply", "--dry-run"], ["--apply", "--apply"]]) {
      expect(() => parseImportArguments(flags)).toThrow("--dry-run or --apply");
    }
  });
});

describe("import validation", () => {
  it("accepts the normalized portfolio model", () => {
    expect(validateImportPortfolio(fixture())).toEqual(fixture());
  });

  it.each([
    { hero: { title: "private" } },
    { sections: [] },
    { sections: undefined },
    { confidentialBody: "Never upload this" },
  ])("rejects extra protected content before schema parsing can strip it (%j)", (extra) => {
    const portfolio = fixture();
    const projects = portfolio.projects.map((project) =>
      project.visibility === "protected" ? { ...project, ...extra } : project,
    );
    expect(() => validateImportPortfolio({ ...portfolio, projects })).toThrow("public teaser");
  });

  it("also rejects protected extra fields when called directly to transform or collect assets", () => {
    const portfolio = fixture();
    const unsafe = {
      ...portfolio,
      projects: portfolio.projects.map((project) => ({ ...project, confidentialBody: "private" })),
    };
    expect(() => collectLocalAssets(unsafe)).toThrow("public teaser");
    expect(() => createSanityDocuments(unsafe, new Map())).toThrow("public teaser");
  });

  it.each([
    "drafts.project-one",
    "versions.release.project-one",
    "site-settings",
    "about",
    "bad id",
    "-bad-id",
  ])("rejects reserved or invalid document ID %s", (_id) => {
    const portfolio = fixture();
    const projects = portfolio.projects.map((project) => ({ ...project, _id }));
    expect(() => validateImportPortfolio({ ...portfolio, projects })).toThrow("document IDs");
  });

  it("rejects duplicate document IDs even when project slugs differ", () => {
    const portfolio = fixture();
    const projects = portfolio.projects.map((project) => ({ ...project, _id: "same-id" }));
    expect(() => validateImportPortfolio({ ...portfolio, projects })).toThrow("document IDs");
  });

  it("rejects a malformed seed", () => {
    expect(() => validateImportPortfolio({ projects: [] })).toThrow("content schema");
  });
});

describe("pure normalized-to-Studio transform", () => {
  it("creates fixed singletons, preserves project IDs, and creates nested asset references", () => {
    const portfolio = fixture();
    const references = assetIds(portfolio);
    const documents = createSanityDocuments(portfolio, references);
    expect(documents.map((document) => [document._id, document._type])).toEqual([
      ["site-settings", "siteSettings"],
      ["about", "aboutPage"],
      ["project-public", "project"],
      ["project-protected", "project"],
    ]);
    expect(documents[0]).toMatchObject({
      portrait: {
        _type: "portfolioImage",
        image: {
          _type: "image",
          asset: { _type: "reference", _ref: references.get("/media/portrait.png") },
        },
        alt: "portrait",
        caption: "",
        frame: "none",
      },
      resume: {
        _type: "file",
        asset: { _type: "reference", _ref: references.get("/media/resume.pdf") },
      },
      contactBody: portfolio.settings.contactBody,
    });
    expect(documents[0]?.portrait).not.toHaveProperty("src");
    expect(documents[0]?.portrait).not.toHaveProperty("width");
    expect(documents[2]).toMatchObject({
      slug: { _type: "slug", current: "public-project" },
      hero: {
        _type: "projectHero",
        image: { _type: "portfolioImage", image: { _type: "image" } },
        textGrid: { _type: "grid", start: 1, end: 13 },
        mediaGrid: { _type: "grid", start: 1, end: 13 },
      },
      sections: [
        { _type: "mediaSection", image: { _type: "portfolioImage", image: { _type: "image" } } },
      ],
    });
  });

  it("transforms every section type, supplies array keys, and preserves rich text", () => {
    const portfolio = fixture();
    const documents = createSanityDocuments(portfolio, assetIds(portfolio));
    expect(documents[1]?.sections).toMatchObject([
      {
        _key: "text",
        _type: "textSection",
        body: portfolio.settings.contactBody,
        textGrid: { _type: "grid" },
      },
      {
        _key: "split",
        _type: "splitSection",
        image: { image: { _type: "image" } },
        textGrid: { _type: "grid" },
        mediaGrid: { _type: "grid" },
      },
      {
        _key: "media",
        _type: "mediaSection",
        image: { image: { _type: "image" } },
        mediaGrid: { _type: "grid" },
      },
      {
        _key: "gallery",
        _type: "gallerySection",
        columns: 2,
        layout: "slider",
        images: [
          { _key: "image-1", _type: "portfolioImage", image: { _type: "image" } },
          { _key: "image-2", _type: "portfolioImage", image: { _type: "image" } },
        ],
      },
      {
        _key: "columns",
        _type: "columnsSection",
        columns: [
          {
            _key: "with-image",
            _type: "contentColumn",
            body: portfolio.settings.contactBody,
            image: { image: { _type: "image" } },
          },
          { _key: "without-image", _type: "contentColumn", body: portfolio.settings.contactBody },
        ],
      },
      {
        _key: "embed",
        _type: "embedSection",
        title: "Prototype",
        url: "https://www.figma.com/embed?url=example",
      },
    ]);
    expect(createSanityDocuments(portfolio, assetIds(portfolio))).toEqual(documents);
  });

  it("omits absent optional images instead of emitting null or undefined fields", () => {
    const portfolio = fixture();
    for (const project of portfolio.projects) {
      if (project.visibility === "public") project.hero.image = undefined;
    }
    for (const section of portfolio.about.sections) {
      if (section._type === "columnsSection") {
        for (const column of section.columns) column.image = undefined;
      }
    }
    const documents = createSanityDocuments(portfolio, assetIds(portfolio));
    expect(documents[2]?.hero).not.toHaveProperty("image");
    expect(documents).toStrictEqual(JSON.parse(JSON.stringify(documents)));
  });

  it("emits protected documents with only approved public teaser fields", () => {
    const portfolio = fixture();
    const documents = createSanityDocuments(portfolio, assetIds(portfolio));
    expect(Object.keys(documents[3] ?? {}).sort()).toEqual([
      "_id",
      "_type",
      "order",
      "slug",
      "subtitle",
      "thumbnail",
      "title",
      "visibility",
    ]);
  });

  it("requires references to already uploaded assets of the correct kind", () => {
    const portfolio = fixture();
    expect(() => createSanityDocuments(portfolio, new Map())).toThrow("uploaded Sanity asset");
    const references = assetIds(portfolio);
    references.set(portfolio.settings.resume, "image-not-a-file");
    expect(() => createSanityDocuments(portfolio, references)).toThrow("uploaded Sanity asset");
  });

  it("collects all image locations and the résumé once per src", () => {
    const assets = collectLocalAssets(fixture());
    expect(assets.filter((asset) => asset.kind === "file")).toEqual([
      { src: "/media/resume.pdf", kind: "file" },
    ]);
    expect(
      assets
        .filter((asset) => asset.kind === "image")
        .map((asset) => asset.src)
        .sort(),
    ).toEqual(
      [
        "avatar",
        "column",
        "gallery",
        "hero",
        "large",
        "portrait",
        "project-section",
        "split",
        "thumbnail",
      ].map((name) => `/media/${name}.png`),
    );
  });
});

describe("local asset path safety", () => {
  it("resolves only files beneath frontend/public, allowing URL-encoded spaces", () => {
    expect(resolveLocalAsset("/repo/frontend/public", "/media/example.png")).toBe(
      "/repo/frontend/public/media/example.png",
    );
    expect(resolveLocalAsset("/repo/frontend/public", "/media/a%20photo.png")).toBe(
      "/repo/frontend/public/media/a photo.png",
    );
  });

  it.each([
    "https://example.com/private.png",
    "//example.com/image.png",
    "mailto:a@example.com",
    "data:image/png;base64,a",
    "../secret.png",
    "/../secret.png",
    "/media/../../secret.png",
    "/media/./image.png",
    "/media//image.png",
    "/media/%2e%2e/secret.png",
    "/media/%252e%252e/secret.png",
    "/media%2f..%2fsecret.png",
    "/media\\secret.png",
    "/media/%5csecret.png",
    "/media/image.png?download=1",
    "/media/image.png#part",
    "/media/image%00.png",
    "/media/%invalid",
    "/",
  ])("rejects remote, malformed, or escaping path %s", (src) => {
    expect(() => resolveLocalAsset("/repo/frontend/public", src)).toThrow();
  });

  it("rejects resolved symlink targets outside public, including sibling-prefix paths", () => {
    expect(isInsideDirectory("/repo/public", "/repo/public/media/image.png")).toBe(true);
    expect(isInsideDirectory("/repo/public", "/repo/public-other/image.png")).toBe(false);
    expect(isInsideDirectory("/repo/public", "/repo/secret.png")).toBe(false);
    expect(isInsideDirectory("/repo/public", "/repo/public")).toBe(false);
  });
});

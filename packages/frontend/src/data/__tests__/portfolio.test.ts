import { portfolioSchema } from "@victoria-portfolio/content-schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPortfolio } from "../portfolio";

const sanity = vi.hoisted(() => ({ fetch: vi.fn(), createClient: vi.fn() }));
vi.mock("@sanity/client", () => ({ createClient: sanity.createClient }));

function liveFixture() {
  const image = {
    src: "https://cdn.sanity.io/images/example/production/image.png",
    width: 800,
    height: 600,
    alt: "An example",
  };
  return {
    settings: {
      _id: "site-settings",
      name: "Designer",
      role: "Product designer",
      heading: "Hello",
      introduction: "I design useful things.",
      currentRole: "Independent",
      portrait: image,
      avatar: image,
      email: "hello@example.com",
      linkedin: "https://www.linkedin.com/in/example",
      resume: "https://cdn.sanity.io/files/example/production/resume.pdf",
      contactBody: [],
    },
    about: { _id: "about", sections: [] },
    projects: [
      {
        _id: "second",
        title: "Second project",
        subtitle: "",
        slug: "second",
        order: 20,
        thumbnail: image,
        visibility: "protected",
      },
      {
        _id: "first",
        title: "First project",
        subtitle: "",
        slug: "first",
        order: 10,
        thumbnail: image,
        visibility: "protected",
      },
    ],
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CONTENT_SOURCE", "sanity");
  vi.stubEnv("SANITY_PROJECT_ID", "example");
  vi.stubEnv("SANITY_DATASET", "production");
  vi.stubEnv("SANITY_API_READ_TOKEN", undefined);
  vi.stubEnv("SANITY_READ_TOKEN", undefined);
  sanity.createClient.mockReturnValue({ fetch: sanity.fetch });
});
afterEach(() => vi.unstubAllEnvs());

describe("build-time portfolio adapter", () => {
  it("uses the validated, sorted local JSON seed by default without contacting Sanity", async () => {
    vi.stubEnv("CONTENT_SOURCE", undefined);
    const portfolio = await getPortfolio();
    expect(portfolioSchema.safeParse(portfolio).success).toBe(true);
    expect(portfolio.projects.map((project) => project.order)).toEqual(
      portfolio.projects.map((project) => project.order).sort((left, right) => left - right),
    );
    expect(sanity.createClient).not.toHaveBeenCalled();
  });

  it("rejects unknown sources rather than silently selecting local content", async () => {
    vi.stubEnv("CONTENT_SOURCE", "santiy");
    await expect(getPortfolio()).rejects.toThrow("CONTENT_SOURCE");
    expect(sanity.createClient).not.toHaveBeenCalled();
  });

  it.each(["SANITY_PROJECT_ID", "SANITY_DATASET"])("requires %s for live builds", async (key) => {
    vi.stubEnv(key, undefined);
    await expect(getPortfolio()).rejects.toThrow("Sanity builds require");
    expect(sanity.createClient).not.toHaveBeenCalled();
  });

  it("uses a private build token, published perspective, fixed API version, and no CDN", async () => {
    vi.stubEnv("SANITY_API_READ_TOKEN", "build-only-test-token");
    sanity.fetch.mockResolvedValue(liveFixture());
    const portfolio = await getPortfolio();
    expect(sanity.createClient).toHaveBeenCalledWith({
      projectId: "example",
      dataset: "production",
      token: "build-only-test-token",
      perspective: "published",
      useCdn: false,
      apiVersion: "2025-02-19",
    });
    expect(portfolio.projects.map((project) => project._id)).toEqual(["first", "second"]);
    expect(portfolio.settings).not.toHaveProperty("_id");
    expect(portfolio.about).not.toHaveProperty("_id");
  });

  it("does not use a PUBLIC token", async () => {
    vi.stubEnv("PUBLIC_SANITY_API_READ_TOKEN", "not-a-server-token");
    sanity.fetch.mockResolvedValue(liveFixture());
    await getPortfolio();
    expect(sanity.createClient).toHaveBeenCalledWith(expect.objectContaining({ token: undefined }));
  });

  it("projects asset metadata and gates all case-study fields on public visibility", async () => {
    sanity.fetch.mockResolvedValue(liveFixture());
    await getPortfolio();
    const query = sanity.fetch.mock.calls[0]?.[0];
    expect(query).toContain('_id == "site-settings"');
    expect(query).toContain('_id == "about"');
    expect(query).toContain('"slug": slug.current');
    expect(query).toContain('"src": image.asset->url');
    expect(query).toContain("image.asset->metadata.dimensions.width");
    expect(query).toContain('"resume": resume.asset->url');
    expect(query).toContain('"subtitle": coalesce(subtitle, "")');
    expect(query).toContain("defined(image) =>");
    expect(query).toContain('visibility == "public" =>');
    expect(query).toContain('!(_id in path("drafts.**"))');
    expect(query).not.toContain("...");
  });

  it.each([{ value: null }, { value: undefined }, { value: {} }, { value: [] }])(
    "fails empty or missing live data ($value), without seed fallback",
    async ({ value }) => {
      sanity.fetch.mockResolvedValue(value);
      await expect(getPortfolio()).rejects.toThrow();
    },
  );

  it.each(["settings", "about"])("requires the published %s singleton", async (field) => {
    sanity.fetch.mockResolvedValue({ ...liveFixture(), [field]: null });
    await expect(getPortfolio()).rejects.toThrow();
  });

  it("rejects a singleton with an unexpected ID", async () => {
    const live = liveFixture();
    live.settings._id = "a-different-settings-document";
    sanity.fetch.mockResolvedValue(live);
    await expect(getPortfolio()).rejects.toThrow();
  });

  it("rejects broken live asset metadata instead of displaying seed images", async () => {
    const live = liveFixture();
    live.settings.portrait.width = 0;
    sanity.fetch.mockResolvedValue(live);
    await expect(getPortfolio()).rejects.toThrow();
  });

  it("rejects malformed projects instead of filtering them out", async () => {
    const live = liveFixture();
    sanity.fetch.mockResolvedValue({
      ...live,
      projects: [...live.projects, { _id: "broken", visibility: "unknown" }],
    });
    await expect(getPortfolio()).rejects.toThrow();
  });

  it("does not restore deleted or unpublished projects, even when the remaining list is empty", async () => {
    const live = liveFixture();
    sanity.fetch.mockResolvedValueOnce(live).mockResolvedValueOnce({ ...live, projects: [] });
    expect((await getPortfolio()).projects).toHaveLength(2);
    expect((await getPortfolio()).projects).toEqual([]);
  });

  it("fails the build when fetching live content fails", async () => {
    sanity.fetch.mockRejectedValue(new Error("Live content unavailable"));
    await expect(getPortfolio()).rejects.toThrow("Live content unavailable");
  });
});

import { imageSchema } from "@victoria-portfolio/content-schema";
import { describe, expect, it } from "vitest";
import { imageAttributes } from "../images";

const image = imageSchema.parse({
  src: "https://cdn.sanity.io/images/project/production/image-1000x800.png",
  width: 1000,
  height: 800,
  alt: "Project image",
});

describe("responsive images", () => {
  it("preserves CMS crop bounds and updates intrinsic dimensions", () => {
    const result = imageAttributes({
      ...image,
      crop: { left: 0.1, right: 0.2, top: 0.1, bottom: 0.1 },
    });
    expect(new URL(result.src).searchParams.get("rect")).toBe("100,80,700,640");
    expect(result.width).toBe(700);
    expect(result.height).toBe(640);
    expect(result.srcSet).toContain("w=640");
    expect(result.srcSet).toContain("w=700");
    expect(result.srcSet).not.toContain("1200w");
  });

  it("repositions the focal point inside the cropped image", () => {
    const result = imageAttributes({
      ...image,
      crop: { left: 0.25, right: 0.25, top: 0, bottom: 0 },
      hotspot: { x: 0.5, y: 0.75 },
    });
    expect(result.style?.objectPosition).toBe("50% 75%");
  });

  it("serves local variants without inventing oversized files", () => {
    expect(imageAttributes({ ...image, src: "/media/example.webp" }).srcSet).toBe(
      "/media/example-640.webp 640w, /media/example.webp 1000w",
    );
  });

  it("rejects a crop that removes the entire image", () => {
    expect(
      imageSchema.safeParse({ ...image, crop: { left: 0.5, right: 0.5, top: 0, bottom: 0 } })
        .success,
    ).toBe(false);
  });
});

import type { PortfolioImage } from "@victoria-portfolio/content-schema/types";

export function imageAttributes(image: PortfolioImage) {
  let src = image.src;
  let width = image.width;
  let height = image.height;
  let srcSet: string | undefined;
  const { crop, hotspot } = image;
  if (src.startsWith("https://cdn.sanity.io/images/")) {
    const url = new URL(src);
    if (crop) {
      const left = Math.min(width - 1, Math.round(crop.left * width));
      const top = Math.min(height - 1, Math.round(crop.top * height));
      width = Math.max(1, image.width - left - Math.round(crop.right * image.width));
      height = Math.max(1, image.height - top - Math.round(crop.bottom * image.height));
      url.searchParams.set("rect", `${left},${top},${width},${height}`);
    }
    url.searchParams.set("auto", "format");
    src = url.href;
    srcSet = [...[640, 1200, 1920].filter((size) => size < width), width]
      .map((size) => {
        const variant = new URL(src);
        variant.searchParams.set("fit", "max");
        variant.searchParams.set("w", String(size));
        return `${variant.href} ${size}w`;
      })
      .join(", ");
  } else if (src.startsWith("/media/") && src.endsWith(".webp")) {
    srcSet = [
      ...[640, 1200, 1920]
        .filter((size) => size < width)
        .map((size) => `${src.replace(/\.webp$/, `-${size}.webp`)} ${size}w`),
      `${src} ${width}w`,
    ].join(", ");
  }
  return {
    src,
    srcSet,
    width,
    height,
    style: hotspot
      ? {
          objectPosition: `${Math.max(0, Math.min(100, ((hotspot.x - (crop?.left || 0)) / (1 - (crop?.left || 0) - (crop?.right || 0))) * 100))}% ${Math.max(0, Math.min(100, ((hotspot.y - (crop?.top || 0)) / (1 - (crop?.top || 0) - (crop?.bottom || 0))) * 100))}%`,
        }
      : undefined,
  };
}

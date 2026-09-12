import type { PortfolioImage as ImageValue } from "@victoria-portfolio/content-schema/types";
import { imageAttributes } from "@/lib/images";

export function PortfolioImage({
  image,
  eager = false,
  className = "",
  sizes = "(max-width: 767px) calc(100vw - 48px), 50vw",
}: {
  image: ImageValue;
  eager?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <img
      {...imageAttributes(image)}
      sizes={sizes}
      alt={image.alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}

export function FramedImage({ image, eager = false }: { image: ImageValue; eager?: boolean }) {
  return (
    <div className={`device-frame device-${image.frame}`}>
      {image.frame === "browser" && (
        <div className="browser-toolbar" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      )}
      <div className="device-screen">
        <PortfolioImage image={image} eager={eager} className="block h-auto w-full" />
      </div>
      {image.frame === "laptop" && <div className="laptop-base" aria-hidden="true" />}
    </div>
  );
}

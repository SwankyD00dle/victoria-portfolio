import { Button } from "@base-ui/react/button";
import { Dialog } from "@base-ui/react/dialog";
import type { PortfolioImage as ImageValue } from "@victoria-portfolio/content-schema/types";
import { useEffect, useRef, useState } from "react";
import { FramedImage, PortfolioImage } from "@/components/portfolio-image";

export function ImageGallery({
  images,
  layout = "grid",
  columns = 1,
}: {
  images: ImageValue[];
  layout?: "grid" | "slider" | "carousel";
  columns?: number;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const image = images[active];

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        setActive(
          (index) =>
            (index + (event.key === "ArrowRight" ? 1 : -1) + images.length) % images.length,
        );
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, images.length]);

  function scroll(direction: number) {
    if (!scroller.current) return;
    scroller.current.scrollBy({
      left: direction * scroller.current.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className={`image-gallery gallery-${layout} gallery-columns-${columns}`}>
        <div className="gallery-track" ref={scroller}>
          {images.map((item, index) => (
            <figure className="gallery-item" key={item.src}>
              <Dialog.Trigger
                className="image-trigger"
                onClick={() => setActive(index)}
                aria-label={`Enlarge ${item.alt}`}
              >
                <FramedImage image={item} />
              </Dialog.Trigger>
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </div>
        {layout !== "grid" && images.length > 1 && (
          <div className="gallery-controls">
            <Button onClick={() => scroll(-1)} aria-label="Previous gallery images">
              ←
            </Button>
            <span>Scroll to explore</span>
            <Button onClick={() => scroll(1)} aria-label="Next gallery images">
              →
            </Button>
          </div>
        )}
      </div>
      <Dialog.Portal>
        <Dialog.Backdrop className="lightbox-backdrop" />
        <Dialog.Popup className="lightbox-popup">
          <Dialog.Title className="sr-only">{image?.alt || "Project image"}</Dialog.Title>
          <Dialog.Description className="sr-only">
            Enlarged image. Use the arrow keys to browse, or Escape to close.
          </Dialog.Description>
          <Dialog.Close className="lightbox-close" aria-label="Close enlarged image">
            ✕
          </Dialog.Close>
          {image && <PortfolioImage image={image} eager sizes="90vw" className="lightbox-image" />}
          <div className="lightbox-footer">
            {images.length > 1 && (
              <Button
                onClick={() => setActive((active - 1 + images.length) % images.length)}
                aria-label="Previous image"
              >
                ←
              </Button>
            )}
            <p>{image?.caption || `${active + 1} / ${images.length}`}</p>
            {images.length > 1 && (
              <Button
                onClick={() => setActive((active + 1) % images.length)}
                aria-label="Next image"
              >
                →
              </Button>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

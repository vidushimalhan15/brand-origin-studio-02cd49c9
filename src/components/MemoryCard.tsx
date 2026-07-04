import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { MemoryPin } from "../types";

function Photo({ file, place }: { file: string; place: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="fallback">
        Drop <code>{file}</code> into
        <br />
        <code>/public/photos/</code>
      </div>
    );
  }
  return (
    <img
      src={`/photos/${file}`}
      alt={place}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export default function MemoryCard({ pin, onClose }: { pin: MemoryPin; onClose: () => void }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selected, setSelected] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Close on Escape.
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const multiple = pin.photos.length > 1;

  return (
    <div className="card-scrim" onClick={onClose}>
      <div className="memory-card" onClick={(e) => e.stopPropagation()}>
        <span className="place">{pin.place}</span>
        <button className="close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="carousel">
          <div className="carousel__viewport" ref={emblaRef}>
            <div className="carousel__container">
              {pin.photos.map((file, i) => (
                <div className="carousel__slide" key={i}>
                  <Photo file={file} place={pin.place} />
                </div>
              ))}
            </div>
          </div>

          {multiple && (
            <>
              <button
                className="carousel__btn prev"
                onClick={() => emblaApi?.scrollPrev()}
                disabled={!canPrev}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                className="carousel__btn next"
                onClick={() => emblaApi?.scrollNext()}
                disabled={!canNext}
                aria-label="Next photo"
              >
                ›
              </button>
              <div className="carousel__dots">
                {pin.photos.map((_, i) => (
                  <button
                    key={i}
                    className={i === selected ? "on" : ""}
                    onClick={() => emblaApi?.scrollTo(i)}
                    aria-label={`Photo ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="message">{pin.message}</div>
      </div>
    </div>
  );
}

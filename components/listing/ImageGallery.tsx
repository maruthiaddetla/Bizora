"use client";

import { ChevronLeft, ChevronRight, Grid2x2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";

type ImageGalleryProps = {
  images: string[];
  title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex((index + images.length) % images.length);
    },
    [images.length],
  );

  if (images.length === 0) return null;

  const main = images[activeIndex];
  const secondary = images.slice(1, 5);

  return (
    <div className="relative">
      {/* Desktop: Airbnb-style mosaic */}
      <div className="hidden overflow-hidden rounded-2xl sm:grid sm:grid-cols-4 sm:grid-rows-2 sm:gap-2 sm:h-[420px] lg:h-[480px]">
        <button
          type="button"
          className="relative col-span-2 row-span-2 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => {
            setActiveIndex(0);
            setShowAll(true);
          }}
          aria-label={`View photo 1 of ${images.length} for ${title}`}
        >
          <Image
            src={images[0]}
            alt={`${title} — photo 1`}
            fill
            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
            sizes="50vw"
            priority
          />
        </button>
        {secondary.map((src, i) => (
          <button
            key={src}
            type="button"
            className="relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => {
              setActiveIndex(i + 1);
              setShowAll(true);
            }}
            aria-label={`View photo ${i + 2} of ${images.length} for ${title}`}
          >
            <Image
              src={src}
              alt={`${title} — photo ${i + 2}`}
              fill
              className="object-cover transition-transform duration-300 hover:scale-[1.02]"
              sizes="25vw"
            />
          </button>
        ))}
      </div>

      {/* Mobile: carousel */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:hidden">
        <Image
          src={main}
          alt={`${title} — photo ${activeIndex + 1}`}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4 pt-12">
          <p className="text-sm font-medium text-white">
            {activeIndex + 1} / {images.length}
          </p>
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAll(true)}
        className="absolute bottom-4 right-4 hidden items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground shadow-md transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:inline-flex"
        aria-label="Show all photos"
      >
        <Grid2x2 className="h-4 w-4" aria-hidden />
        Show all photos
      </button>

      {/* Lightbox */}
      {showAll && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo gallery for ${title}`}
        >
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <p className="text-sm font-medium text-white">
              {activeIndex + 1} / {images.length}
            </p>
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Close
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
            <div className="relative h-full w-full max-w-5xl">
              <Image
                src={images[activeIndex]}
                alt={`${title} — photo ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex - 1)}
                  className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(activeIndex + 1)}
                  className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  i === activeIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Go to photo ${i + 1}`}
                aria-current={i === activeIndex ? "true" : undefined}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithLoader } from "@/features/store/components/ui/ImageWithLoader";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  /** Aspect ratio class, e.g. "aspect-square" or "aspect-video". Defaults to "aspect-square" */
  aspectRatio?: string;
  className?: string;
  /** Fallback icon or node shown when no images */
  fallback?: React.ReactNode;
  /** Extra overlay shown on top of the image (e.g. "Agotado" badge) */
  overlay?: React.ReactNode;
}

const DURATION = 280; // ms

export function ImageGallery({
  images,
  alt,
  aspectRatio = "aspect-square",
  className,
  fallback,
  overlay,
}: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  // direction: 1 = next (‹ slides left), -1 = prev (› slides right)
  const [direction, setDirection] = useState<1 | -1>(1);
  const [animating, setAnimating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback(
    (dir: 1 | -1, targetIndex?: number) => {
      if (animating) return;
      setDirection(dir);
      setAnimating(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCurrent(
          targetIndex !== undefined
            ? targetIndex
            : (c) => (c + dir + images.length) % images.length
        );
        setAnimating(false);
      }, DURATION);
    },
    [animating, images.length]
  );

  const prev = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); navigate(-1); },
    [navigate]
  );

  const next = useCallback(
    (e: React.MouseEvent) => { e.stopPropagation(); navigate(1); },
    [navigate]
  );

  const goTo = useCallback(
    (i: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (i === current || animating) return;
      navigate(i > current ? 1 : -1, i);
    },
    [current, animating, navigate]
  );

  const hasMultiple = images.length > 1;

  React.useEffect(() => { setCurrent(0); }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center", aspectRatio, className)}>
        {fallback ?? <ImageIcon className="w-10 h-10 text-gray-300" />}
      </div>
    );
  }

  const enterIndex = (current + direction + images.length) % images.length;

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl select-none", aspectRatio, className)}>

      {/* Static (idle) image */}
      {!animating && (
        <div className="absolute inset-0">
          <ImageWithLoader
            key={`idle-${images[current]}`}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Exit image */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{ animation: `ig-out-${direction === 1 ? "l" : "r"} ${DURATION}ms ease-in-out forwards` }}
        >
          <ImageWithLoader
            key={`exit-${images[current]}`}
            src={images[current]}
            alt={`${alt} ${current + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Enter image */}
      {animating && (
        <div
          className="absolute inset-0"
          style={{ animation: `ig-in-${direction === 1 ? "l" : "r"} ${DURATION}ms ease-in-out forwards` }}
        >
          <ImageWithLoader
            key={`enter-${images[enterIndex]}`}
            src={images[enterIndex]}
            alt={`${alt} ${enterIndex + 1}`}
            fill
            className="object-cover"
            containerClassName="w-full h-full"
            loaderSize="md"
            useSkeletonBg
          />
        </div>
      )}

      {/* Keyframe definitions */}
      <style>{`
        @keyframes ig-out-l {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-28%); opacity: 0; }
        }
        @keyframes ig-in-l {
          from { transform: translateX(28%);  opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes ig-out-r {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(28%);  opacity: 0; }
        }
        @keyframes ig-in-r {
          from { transform: translateX(-28%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      {overlay && (
        <div className="absolute inset-0 z-20 pointer-events-none">{overlay}</div>
      )}

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-all duration-200 backdrop-blur-sm"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-all duration-200 backdrop-blur-sm"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {hasMultiple && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => goTo(i, e)}
              className={cn(
                "rounded-full transition-all duration-200",
                i === current
                  ? "w-4 h-1.5 bg-white shadow"
                  : "w-1.5 h-1.5 bg-white/60 hover:bg-white/90"
              )}
              aria-label={`Ir a imagen ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-2 right-2 z-30 bg-black/40 text-white text-xs font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
          {current + 1}/{images.length}
        </div>
      )}
    </div>
  );
}

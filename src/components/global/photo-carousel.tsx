/* eslint-disable @next/next/no-img-element -- bike photos are remote user content (CSV URLs, Frappe); plain img avoids remote-pattern churn and optimizer cost. */
import { ImageOff } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// SOT:photo-carousel
// WHAT: Lead photo area — carousel for many, plain image for one, placeholder for none.
// WHY:  Every card shows bike photos identically; plain <img> avoids remote-image config.
// HOW:  Server-safe wrapper around the client shadcn Carousel. When onPhotoClick
//       is given, images become buttons that open the full photo viewer.
// WHERE: LeadDrawer photo section.

export function PhotoCarousel({
  photos,
  alt,
  onPhotoClick,
}: {
  photos: string[];
  alt: string;
  onPhotoClick?: (index: number) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted text-base text-muted-foreground">
        <ImageOff className="size-6" aria-hidden />
        No photos
      </div>
    );
  }

  function image(index: number, src: string) {
    const img = (
      <img
        src={src}
        alt={index === 0 ? alt : `${alt} (${index + 1})`}
        loading="lazy"
        draggable={false}
        className="aspect-[4/3] w-full object-cover"
      />
    );
    if (!onPhotoClick) return img;
    const open = onPhotoClick;
    return (
      <button
        type="button"
        onClick={() => open(index)}
        aria-label={`Open photo ${index + 1} of ${photos.length} in viewer`}
        className="block w-full cursor-zoom-in"
      >
        {img}
      </button>
    );
  }

  if (photos.length === 1) {
    const [only] = photos;
    return only ? image(0, only) : null;
  }
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {photos.map((src, index) => (
          <CarouselItem key={`${src}-${index}`}>{image(index, src)}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}

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
// HOW:  Server-safe wrapper around the client shadcn Carousel.
// WHERE: Top of LeadCard.

export function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-muted text-sm text-muted-foreground">
        <ImageOff className="size-6" aria-hidden />
        No photos
      </div>
    );
  }
  if (photos.length === 1) {
    return (
      <img
        src={photos[0]}
        alt={alt}
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
    );
  }
  return (
    <Carousel className="w-full">
      <CarouselContent>
        {photos.map((src, index) => (
          <CarouselItem key={`${src}-${index}`}>
            <img
              src={src}
              alt={index === 0 ? alt : `${alt} (${index + 1})`}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}

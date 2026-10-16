import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import ProviderCard from "./ProviderCard";
import type { Provider } from "@/data/mockData";

export default function RecommendedArtisanCarousel({ artisans }: { artisans: Provider[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => {
      setSnapCount(api.scrollSnapList().length);
      setSelected(api.selectedScrollSnap());
    };
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  const progress =
    snapCount > 1 ? ((selected + 1) / snapCount) * 100 : 100;

  return (
    <div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", slidesToScroll: "auto", loop: false }}
        className="w-full scrollbar-hide"
        aria-label="Recommended artisans"
      >
        <CarouselContent className="-ml-4 py-2">
          {artisans.map((artisan) => (
            <CarouselItem
              key={artisan.id}
              className="pl-4 basis-[296px] md:basis-[336px] h-auto"
            >
              <div className="h-full min-h-[420px] [&>*]:h-full">
                <ProviderCard provider={artisan} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-2 z-30 h-10 w-10" />
        <CarouselNext className="hidden md:flex right-2 z-30 h-10 w-10" />
      </Carousel>

      {snapCount > 1 && (
        <div className="mt-4 flex items-center gap-3 px-1">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={snapCount}
            aria-valuenow={selected + 1}
            aria-label={`Carousel position ${selected + 1} of ${snapCount}`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {selected + 1}/{snapCount}
          </span>
        </div>
      )}
    </div>
  );
}

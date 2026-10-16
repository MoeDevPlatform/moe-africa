import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import ProviderCard from "./ProviderCard";
import type { Provider } from "@/data/mockData";

export default function RecommendedArtisanCarousel({ artisans }: { artisans: Provider[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  useEffect(() => {
    if (!api) return;
    const update = () => { setSnaps(api.scrollSnapList()); setSelected(api.selectedScrollSnap()); };
    update(); api.on("select", update); api.on("reInit", update);
    return () => { api.off("select", update); api.off("reInit", update); };
  }, [api]);
  return <div><Carousel setApi={setApi} opts={{ align: "start", slidesToScroll: "auto", loop: false }} className="w-full" aria-label="Recommended artisans"><CarouselContent className="-ml-4 py-2">{artisans.map((artisan) => <CarouselItem key={artisan.id} className="pl-4 basis-[296px] md:basis-[336px]"><ProviderCard provider={artisan} /></CarouselItem>)}</CarouselContent><CarouselPrevious className="hidden md:flex -left-3 h-10 w-10 bg-card shadow-md" /><CarouselNext className="hidden md:flex -right-3 h-10 w-10 bg-card shadow-md" /></Carousel><div className="flex justify-center gap-1 mt-3" aria-label="Carousel positions">{snaps.map((_, index) => <Button key={index} size="icon" variant="ghost" className="h-7 w-7 rounded-full" aria-label={`Go to artisan group ${index + 1}`} aria-current={index === selected ? "true" : undefined} onClick={() => api?.scrollTo(index)}><span className={`h-2 w-2 rounded-full border ${index === selected ? "bg-primary border-primary" : "border-muted-foreground bg-transparent"}`} /></Button>)}</div></div>;
}
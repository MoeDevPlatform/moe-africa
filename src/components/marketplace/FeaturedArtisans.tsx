import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, Award } from "lucide-react";
import Skeleton from "@/components/common/Skeleton";
import EmptySection from "@/components/marketplace/EmptySection";
import { sectionsService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";
import ArtisanProductPreviews from "./ArtisanProductPreviews";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { SectionViewAll } from "@/components/marketplace/SectionViewAll";
import { useFullyVisibleSlides } from "@/hooks/usePreviewCapacity";

interface FeaturedArtisansProps {
  /** Legacy prop — ignored when section API succeeds; kept for call-site compatibility. */
  providers?: Provider[];
  title?: string;
}

type SectionArtisan = {
  id: number;
  brandName: string;
  about: string;
  city: string;
  state: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  styleTags: string[];
  category: string;
  productPreviews?: unknown;
  products?: unknown;
  isCustomOrderEligible: boolean;
};

const FeaturedArtisans = ({ title = "Featured Artisans" }: FeaturedArtisansProps) => {
  const navigate = useNavigate();
  const [items, setItems] = useState<SectionArtisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  const preview = useFullyVisibleSlides(api);

  useEffect(() => {
    let cancelled = false;
    sectionsService
      .get("featured_artisans")
      .then((res) => {
        if (cancelled) return;
        const mapped = (res.items ?? []).map((raw: Record<string, unknown>) => {
          const images = Array.isArray(raw.images) ? (raw.images as string[]) : [];
          return {
            id: Number(raw.id),
            brandName: String(raw.brandName || raw.name || "Artisan"),
            about: String(raw.about || raw.description || ""),
            city: String(raw.city || ""),
            state: String(raw.state || ""),
            heroImage: String(raw.heroImage || images[0] || FALLBACK_IMAGE),
            rating: Number(raw.rating) || 0,
            reviewCount: Number(raw.reviewCount) || 0,
            verified: Boolean(raw.verified),
            styleTags: Array.isArray(raw.styleTags) ? (raw.styleTags as string[]) : [],
            category: String(raw.category || ""),
            productPreviews: raw.productPreviews,
            products: raw.products,
            isCustomOrderEligible: raw.isCustomOrderEligible === true,
          };
        }).filter((a) => Number.isFinite(a.id) && a.id > 0);
        setItems(mapped);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="mb-12 md:mb-16">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mb-12 md:mb-16">
        <EmptySection
          title="No featured artisans yet"
          description="Featured artisans will appear here as they are added to the platform."
        />
      </section>
    );
  }

  return (
    <section
      className="mb-12 md:mb-16"
      data-testid="featured-artisans-section"
      data-preview-ready={preview.ready ? "true" : "false"}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <Award className="h-5 w-5 md:h-6 md:w-6 text-accent" />
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        {preview.ready && items.length > preview.visible && (
          <SectionViewAll
            to="/marketplace/artisans?collection=featured_artisans"
            testId="featured-artisans-view-all"
            label={`View all ${title}`}
          />
        )}
      </div>

      <Carousel
        setApi={setApi}
        opts={{ align: "center", loop: items.length > 2 }}
        className="w-full"
        aria-label="Featured artisans"
      >
        <CarouselContent className="-ml-4 py-6">
        {items.map((provider, index) => {
          const active = index === selected;
          return (
          <CarouselItem key={provider.id} className="pl-4 basis-[85%] sm:basis-[60%] md:basis-[45%] lg:basis-[36%]">
          <Card
            aria-current={active ? "true" : undefined}
            className={`artisan-card h-full overflow-hidden border-2 cursor-pointer transition-all duration-500 ease-out motion-reduce:transition-none ${
              active
                ? "scale-100 opacity-100 border-accent shadow-xl bg-gradient-to-br from-accent/10 to-transparent"
                : "scale-[0.88] opacity-60 border-accent/20"
            }`}
            onClick={() => {
              if (!active) { api?.scrollTo(index); return; }
              navigate(`/marketplace/provider/${provider.id}`);
            }}
          >
            <div className="relative">
              <div className="absolute top-4 -left-8 z-10 bg-accent text-accent-foreground px-10 py-1 text-xs font-semibold transform -rotate-45 shadow-md">
                Featured
              </div>
              <div className="h-40 md:h-48 overflow-hidden">
                <img
                  src={provider.heroImage}
                  alt={provider.brandName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
            </div>

            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg md:text-xl">{provider.brandName}</h3>
                    {provider.verified && (
                      <CheckCircle className="h-5 w-5 text-primary fill-primary/20" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[provider.city, provider.state].filter(Boolean).join(", ")}
                  </p>
                  <ArtisanProductPreviews artisan={provider} />
                </div>
                {provider.reviewCount > 0 ? (
                  <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-sm">{Number(provider.rating).toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="bg-muted px-2 py-1 rounded-full">
                    <span className="font-medium text-xs text-muted-foreground italic">No Reviews Yet</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{provider.about}</p>

              {provider.styleTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {provider.styleTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/marketplace/provider/${provider.id}`);
                }}
              >
                View Store
              </Button>
              {provider.isCustomOrderEligible && (
                <Button variant="outline" size="sm" className="mt-2 w-full rounded-full border-primary text-primary hover:bg-primary/10" onClick={(e) => { e.stopPropagation(); navigate(`/marketplace/artisan/${provider.id}#custom-order`); }} aria-label={`Request a custom order from ${provider.brandName}`}>
                  Request Custom Order
                </Button>
              )}
            </CardContent>
          </Card>
          </CarouselItem>
          );
        })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex left-2 z-30 h-10 w-10" aria-label="Previous artisan" />
        <CarouselNext className="hidden md:flex right-2 z-30 h-10 w-10" aria-label="Next artisan" />
      </Carousel>
      {items.length > 1 && (
        <div className="mt-2 flex justify-center gap-2">
          {items.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => api?.scrollTo(i)}
              aria-label={`Show ${p.brandName}`}
              className={`h-2 rounded-full transition-all ${i === selected ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedArtisans;

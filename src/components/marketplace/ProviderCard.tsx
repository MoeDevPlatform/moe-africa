import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Package } from "lucide-react";
import { Provider, getProductsByProviderId } from "@/data/mockData";
import { artisanReviewsService } from "@/lib/apiServices";
import { toCategoryLabel } from "@/lib/categories";
import ArtisanProductPreviews from "./ArtisanProductPreviews";
// Provider may carry a backend-supplied productCount (added by normalizeProvider). Fall
// back to the mock dataset count only when the field is missing — this prevents a freshly
// created artisan from showing "0 products" after they actually added one.
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProviderCardProps {
  provider: Provider;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const navigate = useNavigate();
  const liveCount = (provider as Provider & { productCount?: number }).productCount;
  // Prefer server-supplied productCount / previews — avoid N+1 catalogue fetches per card.
  const previewCount = Array.isArray(
    (provider as Provider & { productPreviews?: unknown[] }).productPreviews,
  )
    ? (provider as Provider & { productPreviews: unknown[] }).productPreviews.length
    : 0;
  const productCount =
    typeof liveCount === "number"
      ? liveCount
      : previewCount > 0
        ? previewCount
        : getProductsByProviderId(provider.id).length;

  // Issue: backend `/service-providers/public-info` does not always include
  // aggregate rating/reviewCount. If we have none, hydrate from the
  // per-artisan reviews endpoint so the card shows real star ratings.
  const [liveRating, setLiveRating] = useState<{ avg: number; count: number } | null>(null);

  useEffect(() => {
    if ((provider.reviewCount ?? 0) > 0) return;
    if (!provider.id) return;
    let cancelled = false;
    artisanReviewsService
      .list(provider.id)
      .then((res) => {
        if (cancelled) return;
        const rows = Array.isArray(res) ? res : res?.data ?? [];
        if (!rows.length) return;
        const avg = rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length;
        setLiveRating({ avg, count: rows.length });
      })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [provider.id, provider.reviewCount]);

  const displayRating = liveRating?.avg ?? Number(provider.rating ?? 0);
  const displayReviewCount = liveRating?.count ?? (provider.reviewCount ?? 0);

  const handleCardClick = () => {
    if (!provider.id) {
      if (import.meta.env.DEV) console.warn("[ProviderCard] Missing provider.id, skipping navigation", provider);
      return;
    }
    navigate(`/marketplace/provider/${provider.id}`);
  };
  
  return (
    <Card 
      className={`artisan-card overflow-hidden border-border cursor-pointer ${provider.featured ? 'border-accent' : ''}`}
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] bg-muted">
        <img 
          src={provider.heroImage} 
          alt={provider.brandName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = FALLBACK_IMAGE;
          }}
        />
        {provider.featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
            Featured
          </Badge>
        )}
        {provider.verified && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1 whitespace-nowrap shrink-0">
            <CheckCircle className="h-3 w-3 shrink-0" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="min-w-0 text-lg font-semibold hover:text-primary transition-colors" data-testid="artisan-name">
            {(provider as Provider & { businessName?: string }).businessName || provider.brandName}
          </h3>
          {provider.verified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Verified artisan — verified by MOE</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {provider.category && (
          <p className="text-sm text-muted-foreground capitalize">
            {toCategoryLabel(provider.category)}
          </p>
        )}
        <ArtisanProductPreviews artisan={provider} />
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 mb-3 text-sm text-muted-foreground">
          {displayReviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{displayRating.toFixed(1)}</span>
              <span>({displayReviewCount})</span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">No Reviews Yet</span>
          )}
          {provider.estimatedDeliveryDays ? (
            <span data-testid="artisan-delivery">
              Avg. delivery {provider.estimatedDeliveryDays} days
            </span>
          ) : null}
          <div className="flex w-full min-w-0 items-start gap-1" data-testid="artisan-location">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {[provider.city, provider.state, (provider as Provider & { country?: string }).country]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {provider.about}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.styleTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-sm border-0 bg-muted/40 text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{productCount} products</span>
          </div>
          <div className="flex flex-col gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (!provider.id) {
                if (import.meta.env.DEV) console.warn("[ProviderCard] Missing provider.id, skipping navigation", provider);
                return;
              }
              navigate(`/marketplace/provider/${provider.id}`);
            }}
          >
            View Profile
          </Button>
          {provider.isCustomOrderEligible === true && (
            <Button
              variant="outline"
              size="sm"
              data-testid="request-custom-order-card-btn"
              className="h-auto min-h-9 whitespace-normal border-border px-3 text-xs text-primary hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/marketplace/artisan/${provider.id}#custom-order`);
              }}
              aria-label={`Request a custom order from ${provider.brandName}`}
            >
              Request Custom Order
            </Button>
          )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;

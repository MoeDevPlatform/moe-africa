import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Package } from "lucide-react";
import { Provider, getProductsByProviderId } from "@/data/mockData";
import { artisanReviewsService } from "@/lib/apiServices";
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
  const productCount =
    typeof liveCount === "number" ? liveCount : getProductsByProviderId(provider.id).length;

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
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-border cursor-pointer ${provider.featured ? 'ring-2 ring-accent/50' : ''}`}
      onClick={handleCardClick}
    >
      <div className="relative h-48 bg-gradient-hero">
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
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-display font-bold hover:text-primary transition-colors">
            {(provider as Provider & { businessName?: string }).businessName || provider.brandName}
          </h3>
          {provider.verified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Verified artisan — quality checked by MOE</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {provider.category && (
          <p className="text-sm text-muted-foreground mb-2 capitalize">
            {(provider.category || "").replace(/_/g, " ")}
          </p>
        )}
        
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          {displayReviewCount > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{displayRating.toFixed(1)}</span>
              <span>({displayReviewCount})</span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">No Reviews Yet</span>
          )}
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{provider.city}, {provider.state}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {provider.about}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {provider.styleTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{productCount} products</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderCard;

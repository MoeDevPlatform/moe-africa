import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Package } from "lucide-react";
import { Provider, getProductsByProviderId } from "@/data/mockData";
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
            {provider.brandName}
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
        
        <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">{provider.rating}</span>
            <span>({provider.reviewCount})</span>
          </div>
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

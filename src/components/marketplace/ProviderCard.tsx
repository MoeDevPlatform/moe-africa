import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle, Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Unified provider type: works with both old mock data and new DB data
interface AnyProvider {
  id: string | number;
  // DB fields
  name?: string;
  hero_image_url?: string | null;
  logo_url?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  featured?: boolean;
  verified?: boolean;
  style_tags?: string[];
  // Legacy mock fields
  brandName?: string;
  heroImage?: string;
  about?: string;
  reviewCount?: number;
  styleTags?: string[];
}

interface ProviderCardProps {
  provider: AnyProvider;
}

const ProviderCard = ({ provider }: ProviderCardProps) => {
  const navigate = useNavigate();

  const brandName = provider.brandName || provider.name || "Artisan";
  const heroImage = provider.heroImage || provider.hero_image_url || "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=800";
  const about = provider.about || provider.bio || "";
  const city = provider.city || "";
  const state = provider.state || "";
  const rating = provider.rating ?? 0;
  const reviewCount = (provider as any).reviewCount || null;
  const featured = provider.featured ?? false;
  const verified = provider.verified ?? false;
  const tags = provider.styleTags || provider.style_tags || [];

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-border cursor-pointer ${featured ? "ring-2 ring-accent/50" : ""}`}
      onClick={() => navigate(`/marketplace/provider/${provider.id}`)}
    >
      <div className="relative h-48 bg-gradient-hero">
        <img src={heroImage} alt={brandName} className="w-full h-full object-cover" />
        {featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">Featured</Badge>
        )}
        {verified && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-display font-bold hover:text-primary transition-colors">{brandName}</h3>
          {verified && (
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
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-medium text-foreground">{rating}</span>
              {reviewCount && <span>({reviewCount})</span>}
            </div>
          )}
          {(city || state) && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{[city, state].filter(Boolean).join(", ")}</span>
            </div>
          )}
        </div>

        {about && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{about}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
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

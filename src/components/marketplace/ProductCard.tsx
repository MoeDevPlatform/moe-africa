import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CheckCircle } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Works with both old mock Product shape and new DBProduct shape
interface AnyProduct {
  id: string | number;
  name: string;
  description?: string | null;
  // DB fields
  price_min?: number | null;
  price_max?: number | null;
  currency?: string;
  media_urls?: string[];
  tags?: string[];
  service_providers?: any;
  // Legacy mock fields
  priceRange?: { min: number; max: number };
  images?: string[];
  providerId?: number;
  category?: string;
}

interface ProductCardProps {
  product: AnyProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id as number);

  // Normalize fields across both shapes
  const priceMin = product.price_min ?? product.priceRange?.min ?? 0;
  const currency = product.currency ?? "NGN";
  const imageUrl = product.media_urls?.[0] ?? product.images?.[0] ?? "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800";
  const providerName = product.service_providers?.name ?? (product as any).brandName ?? "";
  const providerId = product.service_providers?.id ?? product.providerId;
  const isVerified = product.service_providers?.verified ?? false;
  const tags = product.tags ?? [];

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeItem(product.id as number);
      toast({ title: "Removed from wishlist", description: `${product.name} has been removed.` });
    } else {
      addItem({
        productId: product.id as number,
        productName: product.name,
        providerId: providerId ?? 0,
        providerName,
        priceRange: { min: priceMin, max: product.price_max ?? product.priceRange?.max ?? priceMin },
        currency,
        category: product.category ?? (product.service_providers as any)?.service_categories?.name ?? "",
        imageUrl,
        styleTags: tags,
        addedAt: new Date(),
      });
      toast({ title: "Added to wishlist", description: `${product.name} has been added.` });
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/marketplace/product/${product.id}`)}
    >
      <div className="relative h-64 bg-muted">
        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
        <Button
          variant="ghost"
          size="icon"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleWishlistToggle}
        >
          <Heart className={`h-5 w-5 transition-colors ${inWishlist ? "fill-primary text-primary" : "text-foreground"}`} />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="font-display font-semibold text-lg line-clamp-1">{product.name}</h3>
          {isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <CheckCircle className="h-4 w-4 text-primary fill-primary/20 flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">From a verified artisan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {providerName && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (providerId) navigate(`/marketplace/provider/${providerId}`);
            }}
            className="text-xs text-muted-foreground hover:text-primary transition-colors mb-2 text-left"
          >
            by {providerName}
          </button>
        )}

        {product.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-xl font-bold text-primary">
              {currency === "NGN" ? "₦" : "$"}{priceMin.toLocaleString()}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/marketplace/product/${product.id}`);
            }}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

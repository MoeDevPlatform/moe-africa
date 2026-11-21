import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, CheckCircle } from "lucide-react";
import { Product, getProviderById } from "@/data/mockData";
// Note: ProductCard receives a Product prop – provider is resolved locally for display.
// When the API returns products with embedded provider info, getProviderById won't be needed.
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductCardProps {
  product: Product;
  providerId?: number;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id);
  const provider = getProviderById(product.providerId);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inWishlist) {
      removeItem(product.id);
      toast({
        title: "Removed from wishlist",
        description: `${product.name} has been removed from your wishlist.`,
      });
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        providerId: product.providerId,
        providerName: provider?.brandName || "",
        price: product.priceRange?.min ?? null,
        currency: product.currency,
        category: product.category,
        imageUrl: product.images[0],
        styleTags: product.tags,
        addedAt: new Date(),
      });
      toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
      });
    }
  };

  const handleProviderClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/marketplace/provider/${product.providerId}`);
  };

  const handleCardClick = () => {
    if (!product.id) {
      if (import.meta.env.DEV) console.warn("[ProductCard] Missing product.id, skipping navigation", product);
      return;
    }
    navigate(`/marketplace/product/${product.id}`);
  };

  return (
    <Card 
      className="product-card cursor-pointer"
      data-product-id={product.id}
      onClick={handleCardClick}
    >
      <div className="product-card__image relative aspect-square">
        <img 
          src={product.images?.[0] || FALLBACK_IMAGE} 
          alt={product.name}
          className="w-full h-full object-contain"
          loading="lazy"
          onError={(e) => {
            const target = e.currentTarget;
            target.onerror = null;
            target.src = FALLBACK_IMAGE;
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 rounded-full border border-border bg-card hover:bg-card"
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          onClick={handleWishlistToggle}
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${
              inWishlist ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </Button>
      </div>
      
      <CardContent className="px-0 py-3">
        <div className="flex items-center gap-1.5 mb-1">
          <h3 className="min-h-[2.8rem] font-medium line-clamp-2" data-testid="product-name"><Link to={`/marketplace/product/${product.id}`} className="hover:underline focus-visible:outline-ring">{product.name}</Link></h3>
          {provider?.verified && (
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
        
        {(product.artisanName || provider) && (
          <Button variant="link"
            onClick={handleProviderClick}
            className="h-auto justify-start p-0 text-xs text-muted-foreground hover:text-primary mb-2 text-left whitespace-normal"
          >
            by {product.artisanName || provider?.brandName}
          </Button>
        )}
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">{product.description}</p>
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            {product.priceRange?.min != null ? (
              <>
                <p className="text-xs text-muted-foreground">Starting from</p>
                <p className="text-lg font-semibold text-foreground">
                  {product.currency === "NGN" ? "₦" : "$"}{product.priceRange.min.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Price on request</p>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 border-border px-2 text-xs text-primary"
            onClick={(e) => {
              e.stopPropagation();
              if (!product.id) {
                if (import.meta.env.DEV) console.warn("[ProductCard] Missing product.id, skipping navigation", product);
                return;
              }
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

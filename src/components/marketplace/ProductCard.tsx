import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Product, getProviderById } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  providerId?: number;
}

const ProductCard = ({ product }: ProductCardProps) => {
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
        priceRange: product.priceRange,
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

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative h-64 bg-muted">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handleWishlistToggle}
        >
          <Heart 
            className={`h-5 w-5 transition-colors ${
              inWishlist ? "fill-primary text-primary" : "text-foreground"
            }`}
          />
        </Button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="text-xl font-bold text-primary">
              {product.currency === "NGN" ? "₦" : "$"}{product.priceRange.min.toLocaleString()}
            </p>
          </div>
          
          <Link to={`/marketplace/product/${product.id}`}>
            <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

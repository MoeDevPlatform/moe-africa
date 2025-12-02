import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import CompleteYourLook from "@/components/marketplace/CompleteYourLook";
import ProductImageGallery from "@/components/marketplace/ProductImageGallery";
import DeliveryEstimate from "@/components/marketplace/DeliveryEstimate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Clock, Heart, CheckCircle } from "lucide-react";
import { getProductById, getProviderById } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [rushOrderCost, setRushOrderCost] = useState(0);
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const product = getProductById(Number(id));
  const provider = product ? getProviderById(product.providerId) : null;

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleWishlistToggle = () => {
    if (!product || !provider) return;

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
        providerName: provider.brandName,
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

  const handleRushOrderChange = (enabled: boolean, additionalCost: number) => {
    setRushOrderCost(additionalCost);
  };

  if (!product || !provider) {
    return <Navigate to="/marketplace" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery 
              images={product.images} 
              productName={product.name} 
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">{product.name}</h1>
              <Link 
                to={`/marketplace/provider/${provider.id}`}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                by {provider.brandName}
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
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-semibold">{provider.rating}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{provider.city}, {provider.state}</span>
            </div>

            <div className="border-y py-6">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                <p className="text-3xl font-bold text-primary">
                  ₦{product.priceRange.min.toLocaleString()} - ₦{product.priceRange.max.toLocaleString()}
                </p>
                {rushOrderCost > 0 && (
                  <p className="text-sm text-accent mt-1">
                    +₦{rushOrderCost.toLocaleString()} rush order fee
                  </p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Final price depends on customization options</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Materials</h3>
              <p className="text-muted-foreground">{product.materials}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Style Tags</h3>
              <div className="flex gap-2 flex-wrap">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Delivery Estimate Module */}
            <DeliveryEstimate 
              estimatedDeliveryDays={product.estimatedDeliveryDays}
              onRushOrderChange={handleRushOrderChange}
            />

            <div className="grid grid-cols-2 gap-4 py-6 border-y">
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Made to Order</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                size="lg" 
                className="flex-1 bg-primary hover:bg-primary-dark"
                onClick={() => setShowCustomizationForm(true)}
              >
                Customize This Product
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="aspect-square p-0"
                onClick={handleWishlistToggle}
              >
                <Heart 
                  className={`h-6 w-6 transition-colors ${
                    inWishlist ? "fill-primary text-primary" : ""
                  }`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* Complete Your Look Section */}
        <CompleteYourLook currentProduct={product} />
      </main>

      <MarketplaceFooter />
      
      <CustomizationFormModal
        open={showCustomizationForm}
        onOpenChange={setShowCustomizationForm}
        providerId={provider.id}
        productId={product.id}
        productName={product.name}
        providerName={provider.brandName}
        basePrice={product.priceRange.min + rushOrderCost}
        estimatedDeliveryDays={product.estimatedDeliveryDays}
        category={product.category}
      />
    </div>
  );
};

export default ProductDetail;

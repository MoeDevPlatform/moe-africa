import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import CanvasCustomizationModal from "@/components/marketplace/CanvasCustomizationModal";
import CompleteYourLook from "@/components/marketplace/CompleteYourLook";
import ProductImageGallery from "@/components/marketplace/ProductImageGallery";
import DeliveryEstimate from "@/components/marketplace/DeliveryEstimate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Clock, Heart, CheckCircle, ArrowLeft, ShoppingCart, Sliders } from "lucide-react";
import { getProductById, getProviderById } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [rushOrderCost, setRushOrderCost] = useState(0);
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

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

      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <ProductImageGallery images={product.images} productName={product.name} />
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
              <span className="text-sm text-muted-foreground">
                {provider.city}, {provider.state}
              </span>
            </div>

            <div className="border-y py-6">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                <p className="text-3xl font-bold text-primary">
                  ₦{product.priceRange.min.toLocaleString()} - ₦{product.priceRange.max.toLocaleString()}
                </p>
                {rushOrderCost > 0 && (
                  <p className="text-sm text-accent mt-1">+₦{rushOrderCost.toLocaleString()} rush order fee</p>
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
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Delivery Estimate Module */}
            <DeliveryEstimate
              estimatedDeliveryDays={product.estimatedDeliveryDays}
              onRushOrderChange={handleRushOrderChange}
            />

            <div className="grid grid-cols-2 gap-4 py-6 border-t">
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" aria-hidden="true" />
                <p className="text-xs text-muted-foreground">Made to Order</p>
              </div>
            </div>

            {/* Action Buttons — generous spacing from trust badges */}
            <div className="pt-6 mt-4 mb-4 border-t flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      className="flex-1 bg-primary hover:bg-primary-dark"
                      onClick={() => setShowCustomizationForm(true)}
                    >
                      <Sliders className="h-4 w-4 mr-2" />
                      Customize This Product
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Customize size, color & more</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      className="aspect-square p-0"
                      onClick={handleWishlistToggle}
                      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart className={`h-6 w-6 transition-colors ${inWishlist ? "fill-primary text-primary" : ""}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{inWishlist ? "Remove from wishlist" : "Save to wishlist"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Complete Your Look Section */}
        <CompleteYourLook currentProduct={product} />
      </main>

      <MarketplaceFooter />

      {product.category === "canvas" ? (
        <CanvasCustomizationModal
          open={showCustomizationForm}
          onOpenChange={setShowCustomizationForm}
          providerId={provider.id}
          productId={product.id}
          productName={product.name}
          providerName={provider.brandName}
          basePrice={product.priceRange.min + rushOrderCost}
          estimatedDeliveryDays={product.estimatedDeliveryDays}
        />
      ) : (
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
      )}
    </div>
  );
};

export default ProductDetail;

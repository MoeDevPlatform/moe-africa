import { useState } from "react";
import { useParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Truck, Shield, Clock } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);

  // Mock data - GET /products/{id}
  const product = {
    id: 101,
    name: "Custom Ankara Jacket",
    description: "This handmade fitted jacket is crafted from premium Ankara fabric sourced directly from local markets. Each piece is unique and made to order based on your exact specifications. Perfect for both casual and formal occasions, combining traditional African patterns with modern tailoring techniques.",
    priceRange: { min: 25000, max: 35000 },
    currency: "NGN",
    estimatedDeliveryDays: 7,
    materials: "100% Cotton Ankara Fabric",
    tags: ["Afrocentric", "Modern", "Custom Fit"],
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=800",
      "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=800",
    ],
    provider: {
      id: 1,
      brandName: "Ade Tailors",
      city: "Lagos",
      rating: 4.8,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                      <img 
                        src={image} 
                        alt={`${product.name} - View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-display font-bold mb-3">{product.name}</h1>
              <p className="text-muted-foreground">by {product.provider.brandName}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-accent text-accent" />
                <span className="font-semibold">{product.provider.rating}</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{product.provider.city}</span>
            </div>

            <div className="border-y py-6">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                <p className="text-3xl font-bold text-primary">
                  ₦{product.priceRange.min.toLocaleString()} - ₦{product.priceRange.max.toLocaleString()}
                </p>
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

            <div className="grid grid-cols-3 gap-4 py-6 border-y">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">~{product.estimatedDeliveryDays} days</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Made to Order</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full bg-primary hover:bg-primary-dark"
              onClick={() => setShowCustomizationForm(true)}
            >
              Customize This Product
            </Button>
          </div>
        </div>
      </main>

      <MarketplaceFooter />
      
      <CustomizationFormModal
        open={showCustomizationForm}
        onOpenChange={setShowCustomizationForm}
        providerId={product.provider.id}
        productId={product.id}
        productName={product.name}
        providerName={product.provider.brandName}
        basePrice={product.priceRange.min}
        estimatedDeliveryDays={product.estimatedDeliveryDays}
        category="tailoring"
      />
    </div>
  );
};

export default ProductDetail;

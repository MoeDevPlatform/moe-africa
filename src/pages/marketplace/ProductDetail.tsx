import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Truck, Shield, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ProductDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);

  // Fetch product - GET /products/{id}
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          service_provider:service_providers(id, brand_name, address_city, rating)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      
      const images = data.media_urls && data.media_urls.length > 0 
        ? data.media_urls 
        : [data.preview_image_url || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800"];

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        priceRange: { 
          min: data.price_min || data.price, 
          max: data.price_max || data.price 
        },
        currency: data.currency,
        estimatedDeliveryDays: data.estimated_delivery_days || 7,
        materials: "Premium Materials",
        tags: ["Custom Made", "High Quality"],
        images,
        provider: {
          id: data.service_provider.id,
          brandName: data.service_provider.brand_name,
          city: data.service_provider.address_city,
          rating: data.service_provider.rating || 0,
        },
      };
    },
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading...</p>
          </div>
        ) : !product ? (
          <div className="text-center py-12">
            <p>Product not found</p>
          </div>
        ) : (
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
        )}
      </main>

      <MarketplaceFooter />
      
      {product && (
        <CustomizationFormModal
        open={showCustomizationForm}
        onOpenChange={setShowCustomizationForm}
        providerId={Number(id) || 0}
        productId={Number(id) || 0}
        productName={product?.name || ''}
        providerName={product?.provider.brandName || ''}
        basePrice={product?.priceRange.min || 0}
        estimatedDeliveryDays={product?.estimatedDeliveryDays || 7}
        category="tailoring"
        />
      )}
    </div>
  );
};

export default ProductDetail;

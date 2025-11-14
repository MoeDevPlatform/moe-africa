import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Truck, Shield, Clock } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch product details
      const { data: productData } = await supabase
        .from("products")
        .select("*, service_providers(*)")
        .eq("id", id)
        .single();

      if (productData) {
        setProduct(productData);
        setProvider(productData.service_providers);
      }

      // Track recent view
      const { data: { user } } = await supabase.auth.getUser();
      if (user && id) {
        await supabase.from("recent_views").insert({
          customer_id: user.id,
          product_id: id,
        });
      }

      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <MarketplaceNavbar />
        <main className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <MarketplaceNavbar />
        <main className="container mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Product not found</p>
        </main>
        <MarketplaceFooter />
      </div>
    );
  }

  const images = product.media_urls || ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800"];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((image: string, index: number) => (
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
              <CarouselPrevious className="left-2 md:left-4" />
              <CarouselNext className="right-2 md:right-4" />
            </Carousel>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl md:text-4xl font-display font-bold mb-3">{product.name}</h1>
              <p className="text-muted-foreground">by {provider?.brand_name}</p>
            </div>

            {provider && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-accent text-accent" />
                  <span className="font-semibold">{provider.rating || 0}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{provider.address_city}</span>
              </div>
            )}

            <div className="border-y py-6">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">
                  {product.price_min && product.price_max ? "Price Range" : "Starting Price"}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {product.price_min && product.price_max
                    ? `₦${product.price_min.toLocaleString()} - ₦${product.price_max.toLocaleString()}`
                    : `₦${product.price.toLocaleString()}`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">Final price depends on customization options</p>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Description</h3>
              <p className="text-muted-foreground leading-relaxed">{product.description || "No description available."}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y">
              <div className="text-center">
                <Truck className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">
                  ~{product.estimated_delivery_days || 7} days
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <Clock className="h-5 w-5 md:h-6 md:w-6 mx-auto mb-2 text-primary" />
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
        providerId={Number(provider?.id)}
        productId={Number(product.id)}
        productName={product.name}
        providerName={provider?.brand_name || ""}
        basePrice={product.price_min || product.price}
        estimatedDeliveryDays={product.estimated_delivery_days || 7}
        category="tailoring"
      />
    </div>
  );
};

export default ProductDetail;

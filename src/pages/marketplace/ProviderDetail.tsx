import { useState } from "react";
import { useParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle2, Phone, Mail, Share2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const ProviderDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);

  // Fetch provider - GET /service-providers/{id}
  const { data: provider, isLoading: loadingProvider } = useQuery({
    queryKey: ['service-provider', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return {
        id: data.id,
        brandName: data.brand_name,
        firstName: data.first_name,
        lastName: data.last_name,
        about: data.bio,
        city: data.address_city,
        state: data.address_state,
        phone: data.phone,
        email: data.email,
        rating: data.rating || 0,
        reviewCount: data.review_count || 0,
        verified: data.verified || false,
        estimatedDeliveryDays: 7,
        heroImage: data.logo_url || "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=1200",
      };
    },
    enabled: !!id,
  });

  // Fetch products - GET /products?serviceProviderId={id}
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['provider-products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('service_provider_id', id)
        .eq('status', 'active');
      if (error) throw error;
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        previewImageUrl: p.preview_image_url || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
      }));
    },
    enabled: !!id,
  });

  // Mock reviews
  const reviews = [
    {
      id: 1,
      author: "Ngozi A.",
      rating: 5,
      date: "2 weeks ago",
      comment: "Absolutely amazing work! The attention to detail is incredible. My Ankara suit fits perfectly and I received so many compliments.",
    },
    {
      id: 2,
      author: "Emeka O.",
      rating: 5,
      date: "1 month ago",
      comment: "Professional service from start to finish. Ade really knows his craft. Highly recommended!",
    },
    {
      id: 3,
      author: "Aisha M.",
      rating: 4,
      date: "2 months ago",
      comment: "Beautiful dress, excellent quality fabric. Delivery took slightly longer than expected but worth the wait.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      {loadingProvider || !provider ? (
        <div className="text-center py-12">
          <p>{loadingProvider ? 'Loading...' : 'Provider not found'}</p>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <section className="relative h-80 bg-gradient-hero">
          <img 
            src={provider.heroImage} 
            alt={provider.brandName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-display font-bold text-primary-foreground">{provider.brandName}</h1>
                  {provider.verified && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-6 text-primary-foreground/90">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-accent text-accent" />
                    <span className="font-semibold">{provider.rating}</span>
                    <span className="text-sm">({provider.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    <span>{provider.city}, {provider.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5" />
                    <span>~{provider.estimatedDeliveryDays} days delivery</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button size="lg" onClick={() => setShowCustomizationForm(true)} className="bg-secondary hover:bg-secondary-dark">
                  Request Custom Order
                </Button>
                <Button size="lg" variant="outline" className="bg-background/50 backdrop-blur">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="about" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="about">About</TabsTrigger>
                  <TabsTrigger value="products">Products</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="mt-6">
                  <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-2xl font-display font-bold mb-4">About {provider.brandName}</h2>
                    <p className="text-muted-foreground leading-relaxed">{provider.about}</p>
                  </div>
                </TabsContent>

                <TabsContent value="products" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} providerId={provider.id} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-6 space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="bg-card rounded-xl border p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{review.author}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-xl border p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>{provider.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-5 w-5 text-primary" />
                    <span>{provider.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{provider.city}, {provider.state}</span>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => setShowCustomizationForm(true)}>
                  Start Custom Order
                </Button>
              </div>
            </div>
          </div>
        </section>
        </>
      )}
      </main>

      <MarketplaceFooter />

      {provider && (
        <CustomizationFormModal
          open={showCustomizationForm}
          onOpenChange={setShowCustomizationForm}
          providerId={Number(provider.id) || 0}
          productId={0}
          productName="Custom Order"
          providerName={provider.brandName}
          basePrice={25000}
          estimatedDeliveryDays={provider.estimatedDeliveryDays}
          category="tailoring"
        />
      )}
    </div>
  );
};

export default ProviderDetail;

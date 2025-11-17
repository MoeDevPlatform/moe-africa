import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import CustomOrderModal from "@/components/marketplace/CustomOrderModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle2, Phone, Mail, Share2, Clock } from "lucide-react";

const ProviderDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);

  // Mock data - GET /service-providers/{id}
  const provider = {
    id: 1,
    brandName: "Ade Tailors",
    firstName: "Ade",
    lastName: "Olu",
    about: "With over 15 years of experience in traditional and modern African tailoring, Ade Tailors specializes in creating custom-made Ankara suits, dresses, and traditional attire. We use only premium fabrics sourced locally and internationally, ensuring each piece is unique and of the highest quality.",
    city: "Ikeja",
    state: "Lagos",
    phone: "+2348000000000",
    email: "ade@tailors.ng",
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    estimatedDeliveryDays: 7,
    heroImage: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=1200",
    customOrdersEnabled: true, // Admin-controlled toggle
  };

  useEffect(() => {
    // Track viewed provider
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    if (!viewed.includes(provider.id)) {
      viewed.unshift(provider.id);
      localStorage.setItem("recentlyViewed", JSON.stringify(viewed.slice(0, 10)));
    }
  }, [provider.id]);

  // Mock data - GET /products?serviceProviderId={id}
  const products = [
    {
      id: 101,
      name: "Custom Ankara Jacket",
      description: "Handmade fitted jacket from premium Ankara fabric",
      price: 25000,
      currency: "NGN",
      previewImageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
    },
    {
      id: 102,
      name: "Traditional Agbada",
      description: "Full traditional three-piece set with embroidery",
      price: 45000,
      currency: "NGN",
      previewImageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=400",
    },
    {
      id: 103,
      name: "Women's Ankara Dress",
      description: "Elegant floor-length dress with custom fitting",
      price: 30000,
      currency: "NGN",
      previewImageUrl: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=400",
    },
  ];

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

      <main>
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
                {provider.customOrdersEnabled && (
                  <Button 
                    className="w-full mt-6 bg-secondary hover:bg-secondary-dark" 
                    onClick={() => setShowCustomOrderModal(true)}
                  >
                    Start Custom Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketplaceFooter />
      
      <CustomOrderModal
        open={showCustomOrderModal}
        onOpenChange={setShowCustomOrderModal}
        providerId={provider.id}
        providerName={provider.brandName}
      />

      <CustomizationFormModal
        open={showCustomizationForm}
        onOpenChange={setShowCustomizationForm}
        providerId={provider.id}
        productId={0}
        productName="Custom Order"
        providerName={provider.brandName}
        basePrice={25000}
        estimatedDeliveryDays={provider.estimatedDeliveryDays}
        category="tailoring"
      />
    </div>
  );
};

export default ProviderDetail;

import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import CustomOrderModal from "@/components/marketplace/CustomOrderModal";
import MessagingModal from "@/components/marketplace/MessagingModal";
import CustomerReviews, { Review } from "@/components/marketplace/CustomerReviews";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle2, Phone, Mail, Share2, Clock, MessageCircle } from "lucide-react";
import { getProviderById, getProductsByProviderId } from "@/data/mockData";

// Mock reviews with images
const mockReviews: Review[] = [
  {
    id: "1",
    authorName: "Ngozi A.",
    rating: 5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    comment: "Absolutely amazing work! The attention to detail is incredible. My Ankara suit fits perfectly and I received so many compliments.",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"],
    verifiedPurchase: true,
    helpful: 12,
  },
  {
    id: "2",
    authorName: "Emeka O.",
    rating: 5,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    comment: "Professional service from start to finish. The custom measurements ensured a perfect fit.",
    verifiedPurchase: true,
    helpful: 8,
  },
  {
    id: "3",
    authorName: "Amaka C.",
    rating: 4,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
    comment: "Great quality and fast delivery. Would definitely recommend!",
    images: ["https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=400", "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=400"],
    verifiedPurchase: true,
    helpful: 5,
  },
];

const ProviderDetail = () => {
  const { id } = useParams();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  const provider = getProviderById(Number(id));
  const products = provider ? getProductsByProviderId(provider.id) : [];

  if (!provider) {
    return <Navigate to="/marketplace" replace />;
  }

  useEffect(() => {
    // Track viewed provider
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    if (!viewed.includes(provider.id)) {
      viewed.unshift(provider.id);
      localStorage.setItem("recentlyViewed", JSON.stringify(viewed.slice(0, 10)));
    }
  }, [provider.id]);

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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg">{provider.brandName}</h1>
                  {provider.verified && (
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-6 text-white/90 drop-shadow-md">
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
                <Button size="lg" onClick={() => setShowMessaging(true)} variant="outline" className="bg-background/50 backdrop-blur">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
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

                <TabsContent value="reviews" className="mt-6">
                  <CustomerReviews 
                    reviews={mockReviews} 
                    averageRating={provider.rating} 
                    totalReviews={provider.reviewCount} 
                  />
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
        category={provider.category as "tailoring" | "shoemaking"}
      />

      <MessagingModal
        open={showMessaging}
        onOpenChange={setShowMessaging}
        providerId={provider.id}
        providerName={provider.brandName}
      />
    </div>
  );
};

export default ProviderDetail;

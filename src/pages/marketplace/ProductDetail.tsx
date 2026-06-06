import { useState, useEffect, useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";
import CanvasCustomizationModal from "@/components/marketplace/CanvasCustomizationModal";
import DynamicCustomizationModal from "@/components/marketplace/DynamicCustomizationModal";
import CompleteYourLook from "@/components/marketplace/CompleteYourLook";
import ProductImageGallery from "@/components/marketplace/ProductImageGallery";
import DeliveryEstimate from "@/components/marketplace/DeliveryEstimate";
import ProductReviews from "@/components/marketplace/ProductReviews";
import MessagingModal from "@/components/marketplace/MessagingModal";
import ProviderCard from "@/components/marketplace/ProviderCard";
import ProductCard from "@/components/marketplace/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Clock,
  Heart,
  CheckCircle,
  ArrowLeft,
  Sliders,
  MessageCircle,
  MapPin,
} from "lucide-react";
import {
  getProductById as mockGetProductById,
  getProviderById as mockGetProviderById,
} from "@/data/mockData";
import { productsService, providersService, productReviewsService } from "@/lib/apiServices";
import type { Product, Provider } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCustomizationForm, setShowCustomizationForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);
  const [rushOrderCost, setRushOrderCost] = useState(0);
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { user } = useAuth();

  // Scroll to top when product changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [provider, setProvider] = useState<Provider | undefined>(
    product ? mockGetProviderById(product.providerId) : undefined,
  );
  // Lightweight product-level rating summary used in the right column.
  // The full reviews list/form lives inside the Reviews tab component.
  const [ratingSummary, setRatingSummary] = useState<{ avg: number; count: number }>({
    avg: 0,
    count: 0,
  });
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const productId = Number(id);
      const p = await productsService.getById(productId);
      if (p) {
        setProduct(p);
        const prov = await providersService.getById(p.providerId);
        if (prov) {
          setProvider(prov);
        } else {
          setProvider({
            id: p.providerId,
            brandName: "Artisan",
            about: "",
            heroImage: "",
            city: "",
            state: "",
            category: p.category,
            styleTags: [],
            rating: 0,
            reviewCount: 0,
            verified: false,
            featured: false,
          } as Provider);
        }
        // Rating summary + sibling products (best-effort, fail soft).
        productReviewsService.list(productId, 1, 1).then((res) =>
          setRatingSummary({ avg: res.averageRating, count: res.totalReviews }),
        );
        productsService.getByProvider(p.providerId).then((list) =>
          setOtherProducts((list ?? []).filter((x) => x.id !== p.id).slice(0, 6)),
        );
      }
      setIsLoading(false);
    };
    loadData();
  }, [id]);

  const inWishlist = product ? isInWishlist(product.id) : false;

  const isOwnProduct = useMemo(() => {
    return (
      user?.role === "artisan" &&
      !!provider &&
      user?.artisanProfile?.id === provider.id
    );
  }, [user, provider]);

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

  const handleRushOrderChange = (enabled: boolean, additionalCost: number) => {
    setRushOrderCost(additionalCost);
  };

  if (isLoading) return null; // or a spinner if one exists in the project
  if (!product) {
    return <Navigate to="/marketplace" replace />;
  }
  if (!provider) {
    // Brief loading state while provider hydrates; product is already loaded.
    return null;
  }

  // Free-text delivery preferred; legacy numeric fallback. Never invent a default.
  const deliveryDisplay =
    product.estimatedDelivery && product.estimatedDelivery.trim()
      ? product.estimatedDelivery.trim()
      : product.estimatedDeliveryDays
        ? `${product.estimatedDeliveryDays} days`
        : null;

  const priceMin = product.priceRange?.min ?? 0;
  const priceMax = product.priceRange?.max ?? priceMin;
  const priceLabel =
    priceMin === priceMax
      ? `₦${priceMin.toLocaleString()}`
      : `₦${priceMin.toLocaleString()} – ₦${priceMax.toLocaleString()}`;

  const categoryLabel = product.category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const ActionButtons = (
    <>
      <Button
        size="lg"
        className="w-full bg-primary hover:bg-primary-dark"
        onClick={() => setShowCustomizationForm(true)}
      >
        <Sliders className="h-4 w-4 mr-2" />
        Customise &amp; Order
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full"
        onClick={handleWishlistToggle}
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`h-4 w-4 mr-2 ${inWishlist ? "fill-primary text-primary" : ""}`}
        />
        {inWishlist ? "In Wishlist" : "Add to Wishlist"}
      </Button>
      {!isOwnProduct && (
        <Button
          size="lg"
          variant="ghost"
          className="w-full"
          onClick={() => setShowMessaging(true)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Message Artisan
        </Button>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8 md:py-12 pb-32 lg:pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left — Image Gallery (60%) */}
          <div className="lg:col-span-3">
            <ProductImageGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          {/* Right — Product Info (40%) */}
          <div className="lg:col-span-2 p-0 lg:p-6 flex flex-col gap-6">
            {/* 1. Category badge */}
            <div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none">
                {categoryLabel}
              </Badge>
            </div>

            {/* 2. Product name */}
            <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

            {/* 3. Artisan name with avatar */}
            <Link
              to={`/marketplace/provider/${provider.id}`}
              className="inline-flex items-center gap-3 group"
              aria-label={`View ${provider.brandName}'s storefront`}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={provider.heroImage} alt={provider.brandName} />
                <AvatarFallback>
                  {provider.brandName?.slice(0, 2).toUpperCase() ?? "AR"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1.5">
                by <span className="font-medium text-foreground">{provider.brandName}</span>
                {provider.verified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CheckCircle className="h-4 w-4 text-primary fill-primary/20" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Verified artisan — quality checked by MOE</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </span>
            </Link>

            {/* 4. Star rating + review count */}
            <div className="flex items-center gap-2 text-sm">
              {ratingSummary.count > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold">{ratingSummary.avg.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    · {ratingSummary.count} review{ratingSummary.count === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">No reviews yet</span>
              )}
            </div>

            {/* 5. Price */}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Price
              </p>
              <p className="text-2xl font-bold text-primary">{priceLabel}</p>
              {rushOrderCost > 0 && (
                <p className="text-sm text-accent mt-1">
                  +₦{rushOrderCost.toLocaleString()} rush order fee
                </p>
              )}
            </div>

            {/* 6. Delivery */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">
                Est. delivery:{" "}
                <span className="text-foreground font-medium">
                  {deliveryDisplay ?? "Contact artisan for delivery time"}
                </span>
              </span>
            </div>

            {/* 7. Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* 8. Tags */}
            {product.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {product.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 9. Materials */}
            {product.materials && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Materials:</span>{" "}
                {product.materials}
              </p>
            )}

            {/* Detailed delivery / rush-order module */}
            <DeliveryEstimate
              estimatedDeliveryDays={product.estimatedDeliveryDays}
              artisanId={provider.id}
              basePrice={product.priceRange.min}
              onRushOrderChange={handleRushOrderChange}
            />

            {/* 10. Action buttons (desktop only — mobile uses sticky bar below) */}
            <div className="hidden lg:flex flex-col gap-2">{ActionButtons}</div>
          </div>
        </div>

        {/* Tabs */}
        <section className="mt-12">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="about">About the Artisan</TabsTrigger>
              <TabsTrigger value="more">More from this Artisan</TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="pt-6">
              <ProductReviews
                productId={product.id}
                productOwnerProfileId={product.providerId}
              />
            </TabsContent>

            <TabsContent value="about" className="pt-6">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={provider.heroImage} alt={provider.brandName} />
                    <AvatarFallback>
                      {provider.brandName?.slice(0, 2).toUpperCase() ?? "AR"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-display font-semibold text-lg">
                      {provider.brandName}
                    </h3>
                    {(provider.city || provider.state) && (
                      <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {[provider.city, provider.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                {provider.about && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {provider.about}
                  </p>
                )}
                <div className="flex gap-6 text-sm pt-2">
                  <div>
                    <p className="font-semibold text-lg">
                      {provider.rating ? provider.rating.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {provider.reviewCount ?? 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                </div>
                <Link
                  to={`/marketplace/provider/${provider.id}`}
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  Visit storefront →
                </Link>
              </div>
            </TabsContent>

            <TabsContent value="more" className="pt-6">
              {otherProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherProducts.map((p) => (
                    <ProductCard key={p.id} product={p} providerId={provider.id} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No other products from this artisan yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* Complete Your Look — cross-artisan style suggestions */}
        <CompleteYourLook currentProduct={product} />
      </main>

      {/* Mobile sticky action bar — bg + border avoid floating-over-content */}
      <div className="lg:hidden sticky bottom-0 left-0 right-0 z-30 bg-background border-t p-4 flex flex-col gap-2 shadow-lg">
        {ActionButtons}
      </div>

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
          productImage={product.images?.[0]}
        />
      ) : product.category === "tailoring" || product.category === "shoemaking" ? (
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
          productImage={product.images?.[0]}
        />
      ) : (
        <DynamicCustomizationModal
          open={showCustomizationForm}
          onOpenChange={setShowCustomizationForm}
          providerId={provider.id}
          productId={product.id}
          productName={product.name}
          providerName={provider.brandName}
          basePrice={product.priceRange.min + rushOrderCost}
          category={product.category}
          productImage={product.images?.[0]}
        />
      )}

      <MessagingModal
        open={showMessaging}
        onOpenChange={setShowMessaging}
        providerId={provider.id}
        providerName={provider.brandName}
      />
    </div>
  );
};

export default ProductDetail;

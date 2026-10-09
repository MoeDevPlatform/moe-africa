import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import CompleteYourLook from "@/components/marketplace/CompleteYourLook";
import ProductImageGallery from "@/components/marketplace/ProductImageGallery";
import DeliveryEstimate from "@/components/marketplace/DeliveryEstimate";
import ProductReviews from "@/components/marketplace/ProductReviews";
import MessagingModal from "@/components/marketplace/MessagingModal";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductVariationSelector, {
  type VariationSelection,
} from "@/components/marketplace/ProductVariationSelector";
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
  MessageCircle,
  MapPin,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { getProviderById as mockGetProviderById } from "@/data/mockData";
import { productsService, providersService, productReviewsService } from "@/lib/apiServices";
import type { Product, Provider } from "@/data/mockData";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOMeta from "@/components/common/SEOMeta";
import RecentlyViewed from "@/components/marketplace/RecentlyViewed";
import { pushRecentlyViewed } from "@/lib/recentlyViewed";
import { trackBehaviour } from "@/lib/trackBehaviour";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMessaging, setShowMessaging] = useState(false);
  const [rushOrderCost, setRushOrderCost] = useState(0);
  const [variations, setVariations] = useState<VariationSelection>({});
  const [variationsReady, setVariationsReady] = useState(false);
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const onVariationChange = useCallback(
    (selection: VariationSelection, allRequiredSelected: boolean) => {
      setVariations(selection);
      setVariationsReady(allRequiredSelected);
    },
    [],
  );

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
        pushRecentlyViewed(p.id);
        trackBehaviour("product_view", { entityType: "product", entityId: p.id });
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
    const selfArtisanIdRaw = typeof window !== "undefined" ? localStorage.getItem("moe_self_artisan_id") : null;
    const selfArtisanId = selfArtisanIdRaw ? Number(selfArtisanIdRaw) : undefined;
    return (
      user?.role === "artisan" &&
      !!provider &&
      (
        (user?.artisanProfile?.id != null && user.artisanProfile.id === provider.id) ||
        (provider.userId != null && provider.userId === user?.id) ||
        (selfArtisanId != null && selfArtisanId === provider.id)
      )
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

  const handleAddToCart = () => {
    if (!product || !provider || !variationsReady) return;
    const base = (product.priceRange?.min ?? 0) + rushOrderCost;
    addToCart({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      providerId: product.providerId,
      providerName: provider.brandName,
      basePrice: base,
      finalPrice: base,
      category: (product.category as "tailoring" | "shoemaking" | "canvas") || "tailoring",
      selectedSize: variations.size,
      selectedVariants: variations,
      measurements: {},
      notes: "",
      quantity: 1,
      imageUrl: product.images?.[0],
      customisation: variations,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} is ready for checkout.`,
    });
  };

  const ActionButtons = (
    <>
      <Button
        size="lg"
        className="w-full bg-primary hover:bg-primary-dark"
        data-testid="add-to-cart-btn"
        disabled={!variationsReady}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {variationsReady ? "Add to Cart" : "Select options to add to cart"}
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

  const seoTitle = `${product.metaTitle || product.name} | MOE Africa`;
  const seoDescription =
    product.metaDescription ||
    (product.description ? product.description.slice(0, 155) : undefined);
  const seoKeywords = (product.keywords ?? []).map((k) => k.term).join(", ");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SEOMeta title={seoTitle} description={seoDescription} keywords={seoKeywords} />
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

            {/* Demand / view / stock indicators (below price, above actions) */}
            <div className="flex flex-wrap gap-2">
              {product.isHighDemand ? (
                <Badge className="bg-orange-500/15 text-orange-700 hover:bg-orange-500/20 border-none">
                  🔥 High demand
                </Badge>
              ) : typeof product.viewsToday === "number" &&
                product.viewsToday >= 3 ? (
                <Badge className="bg-muted text-muted-foreground hover:bg-muted border-none">
                  👁 {product.viewsToday} people viewed this today
                </Badge>
              ) : null}
              {typeof product.stockCount === "number" &&
                product.stockCount > 0 &&
                product.stockCount <= 5 && (
                  <Badge className="bg-amber-500/15 text-amber-800 hover:bg-amber-500/20 border-none">
                    ⚠ Only {product.stockCount} left
                  </Badge>
                )}
            </div>

            {/* 6. Delivery */}
            <div
              className="flex items-center gap-2 text-sm"
              data-testid="delivery-timeline"
            >
              <Clock className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground">
                {deliveryDisplay ? (
                  <>
                    Estimated delivery:{" "}
                    <span className="text-foreground font-medium">
                      {deliveryDisplay}
                    </span>{" "}
                    by{" "}
                    <span className="text-foreground font-medium">
                      {provider.brandName}
                    </span>
                  </>
                ) : (
                  <>Delivery time: Contact artisan for details</>
                )}
              </span>
            </div>

            {/* 7. Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Inline variations */}
            <ProductVariationSelector
              category={product.category}
              onSelectionChange={onVariationChange}
            />

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

            {/* Buyer protection */}
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground flex gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <p>
                <span className="font-medium text-foreground">Buyer Protection</span> — Your
                payment is secure. If your order doesn&apos;t arrive or isn&apos;t as
                described, we&apos;ll help you get a refund.
              </p>
            </div>

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

        <RecentlyViewed excludeProductId={product.id} />

        {/* Complete Your Look — cross-artisan style suggestions */}
        <CompleteYourLook currentProduct={product} />
      </main>

      {/* Mobile sticky action bar — bg + border avoid floating-over-content */}
      <div className="lg:hidden sticky bottom-0 left-0 right-0 z-30 bg-background border-t p-4 flex flex-col gap-2 shadow-lg">
        {ActionButtons}
      </div>

      <MarketplaceFooter />

      {/* Customisation modals kept in codebase but no longer opened from PDP */}

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

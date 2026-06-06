import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { useWishlist, type WishlistItem } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { productsService } from "@/lib/apiServices";
import type { Product } from "@/data/mockData";
import { useCart } from "@/contexts/CartContext";
import CustomizationFormModal from "@/components/marketplace/CustomizationFormModal";

const formatPrice = (price: number | null | undefined, currency: string | undefined) => {
  if (price == null) return "Price on request";
  const symbol = currency === "NGN" ? "₦" : "$";
  return `${symbol}${price.toLocaleString()}`;
};

const Wishlist = () => {
  const { items, removeItem } = useWishlist();
  const { addItem: addCartItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  // Hydrate fresh product data by id — wishlist storage may be stale or
  // missing fields ("Untitled product" / "My business" placeholders). On
  // mount we fetch each /products/:id and remove any that 404.
  const [fresh, setFresh] = useState<Record<number, Product | null>>({});
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const idsToFetch = items
      .map((i) => Number(i.productId))
      .filter((id) => Number.isFinite(id) && !(id in fresh));
    if (idsToFetch.length === 0) return;
    setLoadingIds((s) => {
      const next = new Set(s);
      idsToFetch.forEach((id) => next.add(id));
      return next;
    });
    (async () => {
      const results = await Promise.all(
        idsToFetch.map((id) =>
          productsService.getById(id).then((p) => [id, p ?? null] as const).catch(() => [id, null] as const),
        ),
      );
      if (cancelled) return;
      setFresh((prev) => {
        const next = { ...prev };
        results.forEach(([id, p]) => (next[id] = p));
        return next;
      });
      setLoadingIds((s) => {
        const next = new Set(s);
        idsToFetch.forEach((id) => next.delete(id));
        return next;
      });
      // Auto-remove items whose product no longer exists.
      results.forEach(([id, p]) => {
        if (!p) removeItem(id);
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [items, fresh, removeItem]);

  const handleRemove = (productId: number, productName: string) => {
    removeItem(productId);
    toast({
      title: "Removed from wishlist",
      description: `${productName ?? "Item"} has been removed from your wishlist.`,
    });
  };

  // Item 7 — wishlist → cart.
  // Only force the customisation modal when the backend marks the product
  // as `customisationRequired: true`. Otherwise, add the item directly so
  // we don't trip a 400 CUSTOMISATION_REQUIRED on the cart endpoint.
  const handleMoveToCart = async (item: WishlistItem) => {
    if (!item?.productId) return;
    const product = fresh[item.productId] ?? (await productsService.getById(item.productId));
    if (!product) {
      toast({
        title: "Product unavailable",
        description: "This product is no longer available.",
        variant: "destructive",
      });
      return;
    }

    if (product.customisationRequired) {
      setSelectedItem(item);
      setShowCustomizationModal(true);
      return;
    }

    // Direct add — no customisation needed.
    const price = item.price ?? product.priceRange?.min ?? 0;
    addCartItem({
      id: Date.now().toString(),
      productId: item.productId,
      productName: item.productName,
      providerId: item.providerId,
      providerName: item.providerName,
      basePrice: price,
      finalPrice: price,
      category: (product.category as "tailoring" | "shoemaking" | "canvas") ?? "tailoring",
      selectedVariants: {},
      measurements: {},
      notes: "",
      quantity: 1,
    });
    toast({
      title: "Added to cart 🎉",
      description: `${item.productName} is in your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <h1 className="text-4xl font-display font-bold">My Wishlist</h1>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save your favorite items to buy them later</p>
            <Link to="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </Card>
        ) : (
          <>
            <p className="text-muted-foreground mb-6">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const hydrated = fresh[item.productId];
                const isLoading = loadingIds.has(item.productId) && !hydrated;
                // Prefer fresh server data; fall back to whatever the
                // wishlist row already had. Never invent placeholder names.
                const productName = hydrated?.name ?? item?.productName ?? "";
                const providerName = item?.providerName ?? "";
                const imageUrl =
                  hydrated?.images?.[0] || item?.imageUrl || FALLBACK_IMAGE;
                const price =
                  hydrated?.priceRange?.min ?? item?.price ?? null;
                const styleTags = Array.isArray(hydrated?.tags)
                  ? (hydrated.tags as string[])
                  : Array.isArray(item?.styleTags)
                  ? item.styleTags
                  : [];

                if (isLoading) {
                  return (
                    <Card
                      key={item.productId}
                      className="overflow-hidden h-[420px] flex items-center justify-center"
                    >
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </Card>
                  );
                }

                return (
                  <Card
                    key={item.productId}
                    className="overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="relative h-64 bg-muted">
                      <img loading="lazy" decoding="async"
                        src={imageUrl}
                        alt={productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${productName} from wishlist`}
                        className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={() => handleRemove(item.productId, productName)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-lg mb-1 line-clamp-1">
                        {productName}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">by {providerName}</p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {styleTags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(price, item?.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 gap-2"
                          onClick={() => handleMoveToCart(item)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/marketplace/product/${item.productId}`)}
                          aria-label={`View ${productName}`}
                        >
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>

      <MarketplaceFooter />

      {/* Customization Modal */}
      {selectedItem && (
        <CustomizationFormModal
          open={showCustomizationModal}
          onOpenChange={(open) => {
            setShowCustomizationModal(open);
            if (!open) setSelectedItem(null);
          }}
          providerId={selectedItem.providerId}
          productId={selectedItem.productId}
          productName={selectedItem.productName ?? "Product"}
          providerName={selectedItem.providerName ?? "Artisan"}
          basePrice={selectedItem.price ?? 0}
          estimatedDeliveryDays={7}
          category={selectedItem.category as never}
        />
      )}
    </div>
  );
};

export default Wishlist;

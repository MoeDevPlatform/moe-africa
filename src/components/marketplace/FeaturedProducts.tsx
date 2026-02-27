import { useNavigate } from "react-router-dom";
import { Heart, TrendingUp, Star, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useProducts, DBProduct, ProductFilters } from "@/hooks/useProducts";
import type { FilterState } from "@/components/marketplace/FilterDrawer";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  providerId: string;
  providerName: string;
  category: string;
  tags: string[];
}

const toFeaturedProduct = (p: DBProduct): FeaturedProduct => ({
  id: p.id,
  name: p.name,
  price: p.price_min ?? 0,
  imageUrl: p.media_urls?.[0] ?? "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
  providerId: p.service_provider_id ?? "",
  providerName: (p.service_providers as any)?.name ?? "",
  category: (p.service_categories as any)?.name ?? "",
  tags: p.tags ?? [],
});

const ProductCarouselCard = ({ product }: { product: FeaturedProduct }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id as any);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeItem(product.id as any);
      toast({ title: "Removed from wishlist" });
    } else {
      addItem({
        productId: product.id as any,
        productName: product.name,
        providerId: product.providerId as any,
        providerName: product.providerName,
        priceRange: { min: product.price, max: product.price },
        currency: "NGN",
        category: product.category,
        imageUrl: product.imageUrl,
        styleTags: product.tags,
        addedAt: new Date(),
      });
      toast({ title: "Added to wishlist" });
    }
  };

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/marketplace/product/${product.id}`)}>
      <div className="relative rounded-xl overflow-hidden mb-3 bg-muted aspect-square">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleWishlistClick}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>
      <h3 className="font-semibold mb-1 text-sm md:text-base line-clamp-1">{product.name}</h3>
      {product.providerName && <p className="text-xs text-muted-foreground mb-1">{product.providerName}</p>}
      <span className="font-bold text-primary">₦{product.price.toLocaleString()}</span>
    </div>
  );
};

interface ProductSectionProps {
  title: string;
  icon: React.ReactNode;
  products: FeaturedProduct[];
}

const ProductSection = ({ title, icon, products }: ProductSectionProps) => {
  if (products.length === 0) return null;
  return (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        {icon}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
      </div>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              <ProductCarouselCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-4" />
        <CarouselNext className="hidden sm:flex -right-4" />
      </Carousel>
    </div>
  );
};

interface FeaturedProductsProps {
  filters?: FilterState;
}

const FeaturedProducts = ({ filters }: FeaturedProductsProps) => {
  // Build API filters from UI filters
  const apiFilters: ProductFilters = {
    activeOnly: true,
    minPrice: filters?.priceRange?.[0],
    maxPrice: filters?.priceRange?.[1],
    tags: filters?.styleTags,
    materials: filters?.materials?.[0],
    maxDeliveryDays: filters?.deliveryEstimate === "fastest" ? 3
      : filters?.deliveryEstimate === "3-5" ? 5
      : filters?.deliveryEstimate === "1-week" ? 7
      : filters?.deliveryEstimate === "2-weeks" ? 14
      : undefined,
  };

  const { data: bestSellerData = [] } = useProducts({ ...apiFilters, bestSeller: true });
  const { data: seasonalData = [] } = useProducts({ ...apiFilters, seasonalPick: true });
  const { data: featuredData = [] } = useProducts({ ...apiFilters, featured: true });
  const { data: trendingData = [] } = useProducts({ ...apiFilters, trending: true });

  const bestSellers = bestSellerData.slice(0, 8).map(toFeaturedProduct);
  const seasonalPicks = seasonalData.slice(0, 8).map(toFeaturedProduct);
  const editorPicks = featuredData.slice(0, 8).map(toFeaturedProduct);
  const trending = trendingData.slice(0, 8).map(toFeaturedProduct);

  return (
    <section className="mb-12 md:mb-16">
      <ProductSection title="Best Sellers" icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />} products={bestSellers} />
      <ProductSection title="Seasonal Picks" icon={<Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />} products={seasonalPicks} />
      <ProductSection title="Editor's Recommendations" icon={<Award className="h-5 w-5 md:h-6 md:w-6 text-secondary" />} products={editorPicks} />
      <ProductSection title="Trending Right Now" icon={<Star className="h-5 w-5 md:h-6 md:w-6 text-primary" />} products={trending} />
    </section>
  );
};

export default FeaturedProducts;

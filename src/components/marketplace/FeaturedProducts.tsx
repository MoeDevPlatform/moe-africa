import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, TrendingUp, Star, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import EmptySection from "@/components/marketplace/EmptySection";
import RecentlyViewed from "@/components/marketplace/RecentlyViewed";
import { Skeleton } from "@/components/ui/skeleton";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { productsService, sectionsService } from "@/lib/apiServices";
import type { Product } from "@/data/mockData";

interface FeaturedProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  providerId: number;
  providerName: string;
  category: string;
  tags: string[];
}

const ProductCarouselCard = ({ product }: { product: FeaturedProduct }) => {
  const navigate = useNavigate();
  const { addItem, removeItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inWishlist) {
      removeItem(product.id);
      toast({ title: "Removed from wishlist" });
    } else {
      addItem({
        productId: product.id,
        productName: product.name,
        providerId: product.providerId,
        providerName: product.providerName,
        price: product.price ?? null,
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
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-3 right-3 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleWishlistClick}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? "fill-primary text-primary" : ""}`} />
        </Button>
      </div>
      <h3 className="font-semibold mb-1 text-sm md:text-base line-clamp-1">{product.name}</h3>
      <p className="text-xs text-muted-foreground mb-1">{product.providerName}</p>
      <span className="font-bold text-primary">₦{product.price.toLocaleString()}</span>
    </div>
  );
};

interface ProductSectionProps {
  title: string;
  icon: React.ReactNode;
  products: FeaturedProduct[];
  loading?: boolean;
}

const ProductSection = ({ title, icon, products, loading }: ProductSectionProps) => {
  if (loading) {
    return (
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          {icon}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-40 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }
  if (products.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        {icon}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
      </div>
      <Carousel opts={{ align: "start", loop: true, dragFree: true }} className="w-full overflow-x-auto snap-x snap-mandatory">
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

function mapSectionItem(raw: Record<string, unknown>): FeaturedProduct | null {
  const id = Number(raw.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const images = Array.isArray(raw.images) ? (raw.images as string[]) : [];
  const priceRange = raw.priceRange as { min?: number } | undefined;
  const price =
    typeof priceRange?.min === "number"
      ? priceRange.min
      : typeof raw.price === "number"
        ? raw.price
        : 0;
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as string[])
    : typeof raw.tags === "string"
      ? raw.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "Product",
    price,
    imageUrl: images[0] || FALLBACK_IMAGE,
    providerId: Number(raw.providerId) || 0,
    providerName: typeof raw.providerName === "string" ? raw.providerName : "Artisan",
    category: typeof raw.category === "string" ? raw.category : "",
    tags,
  };
}

const FeaturedProducts = () => {
  const [bestSellers, setBestSellers] = useState<FeaturedProduct[]>([]);
  const [seasonalPicks, setSeasonalPicks] = useState<FeaturedProduct[]>([]);
  const [editorPicks, setEditorPicks] = useState<FeaturedProduct[]>([]);
  const [trending, setTrending] = useState<FeaturedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const loadSection = async (key: string) => {
      try {
        const res = await sectionsService.get(key);
        return (res.items ?? [])
          .map((item) => mapSectionItem(item))
          .filter((p): p is FeaturedProduct => Boolean(p));
      } catch {
        return [] as FeaturedProduct[];
      }
    };

    const loadSeasonal = async () => {
      try {
        const matched = await sectionsService.seasonalMatched();
        if ((matched.keywords ?? []).length > 0 && (matched.items ?? []).length > 0) {
          return (matched.items ?? [])
            .map((item) => mapSectionItem(item))
            .filter((p): p is FeaturedProduct => Boolean(p));
        }
      } catch {
        /* fall through to curated section */
      }
      return loadSection("seasonal_picks");
    };

    Promise.all([
      loadSection("featured_picks"),
      loadSeasonal(),
      loadSection("featured_styles"),
      productsService.list().then((res) => res.data).catch(() => [] as Product[]),
    ]).then(([featured, seasonal, styles, allProducts]) => {
      if (cancelled) return;
      setBestSellers(featured);
      setSeasonalPicks(seasonal);
      setEditorPicks(styles);
      // Trending stays on existing client-side filter logic.
      setTrending(
        allProducts
          .filter((p) =>
            p.tags.some((t) => ["Modern", "Afrocentric", "Custom"].includes(t)),
          )
          .slice(0, 8)
          .map((p) => ({
            id: p.id,
            name: p.name,
            price: p.priceRange.min,
            imageUrl: p.images[0] || FALLBACK_IMAGE,
            providerId: p.providerId,
            providerName: "Artisan",
            category: p.category,
            tags: p.tags,
          })),
      );
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasAny =
    bestSellers.length > 0 ||
    seasonalPicks.length > 0 ||
    editorPicks.length > 0 ||
    trending.length > 0;

  if (!isLoading && !hasAny) {
    return (
      <section className="mb-12 md:mb-16">
        <EmptySection
          title="No products listed yet"
          description="Products from artisans will appear here once they're added to the platform."
        />
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <ProductSection
        title="Best Sellers"
        icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
        products={bestSellers}
        loading={isLoading}
      />
      <ProductSection
        title="Seasonal Picks"
        icon={<Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />}
        products={seasonalPicks}
        loading={isLoading}
      />
      <RecentlyViewed />
      <ProductSection
        title="Editor's Recommendations"
        icon={<Award className="h-5 w-5 md:h-6 md:w-6 text-secondary" />}
        products={editorPicks}
        loading={isLoading}
      />
      <ProductSection
        title="Trending Right Now"
        icon={<Star className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
        products={trending}
        loading={isLoading}
      />
    </section>
  );
};

export default FeaturedProducts;

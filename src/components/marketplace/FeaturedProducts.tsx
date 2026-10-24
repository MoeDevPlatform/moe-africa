import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, TrendingUp, Star, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi,
} from "@/components/ui/carousel";
import { SectionViewAll } from "@/components/marketplace/SectionViewAll";
import { useFullyVisibleSlides } from "@/hooks/usePreviewCapacity";
import EmptySection from "@/components/marketplace/EmptySection";
import RecentlyViewed from "@/components/marketplace/RecentlyViewed";
import Skeleton from "@/components/common/Skeleton";
import AnimatedSection from "@/components/common/AnimatedSection";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { productsService, sectionsService } from "@/lib/apiServices";

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
    <div className="product-card group cursor-pointer" data-product-id={product.id} onClick={() => navigate(`/marketplace/product/${product.id}`)}>
      <div className="product-card__image relative rounded-xl overflow-hidden mb-3 bg-muted aspect-square">
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
          aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
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
  viewAllHref?: string;
  testId?: string;
}

const ProductSection = ({ title, icon, products, loading, viewAllHref, testId }: ProductSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const preview = useFullyVisibleSlides(api);
  const showViewAll = Boolean(viewAllHref) && preview.ready && products.length > preview.visible;

  if (loading) {
    return (
      <div className="mb-8 md:mb-12">
        <div className="flex items-center gap-2 mb-4 md:mb-6">
          {icon}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-40 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }
  if (products.length === 0) return null;

  return (
    <div className="mb-8 md:mb-12" data-testid={testId} data-preview-ready={preview.ready ? "true" : "false"}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 md:mb-6">
        <div className="flex min-w-0 items-center gap-2">
          {icon}
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">{title}</h2>
        </div>
        {showViewAll && viewAllHref && (
          <SectionViewAll to={viewAllHref} testId={`${testId}-view-all`} label={`View all ${title}`} />
        )}
      </div>
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: true, dragFree: true }}
        className="w-full scrollbar-hide"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
              <ProductCarouselCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex left-2 z-30" />
        <CarouselNext className="hidden sm:flex right-2 z-30" />
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
    providerName:
      typeof raw.artisanName === "string" && raw.artisanName
        ? raw.artisanName
        : typeof raw.providerName === "string" && raw.providerName
          ? raw.providerName
          : "Artisan",
    category: typeof raw.category === "string" ? raw.category : "",
    tags,
  };
}

const FeaturedProducts = () => {
  const [bestSellers, setBestSellers] = useState<FeaturedProduct[]>([]);
  const [featuredPicks, setFeaturedPicks] = useState<FeaturedProduct[]>([]);
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

    const loadBestSellers = async () => {
      try {
        const res = await productsService.list({ collection: "best-sellers", pageSize: 8 });
        return (res.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.priceRange?.min ?? 0,
          imageUrl: p.images?.[0] || FALLBACK_IMAGE,
          providerId: p.providerId,
          providerName: p.artisanName || "Artisan",
          category: p.category,
          tags: p.tags ?? [],
        }));
      } catch {
        return [] as FeaturedProduct[];
      }
    };

    const loadTrending = async () => {
      try {
        const res = await productsService.list({ isTrending: true, sort: "trending", pageSize: 8 });
        return (res.data ?? []).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.priceRange?.min ?? 0,
          imageUrl: p.images?.[0] || FALLBACK_IMAGE,
          providerId: p.providerId,
          providerName: p.artisanName || "Artisan",
          category: p.category,
          tags: p.tags ?? [],
        }));
      } catch {
        return [] as FeaturedProduct[];
      }
    };

    Promise.all([
      loadBestSellers(),
      loadSection("featured_picks"),
      loadSeasonal(),
      loadSection("featured_styles"),
      loadTrending(),
    ]).then(([best, featured, seasonal, styles, trendingProducts]) => {
      if (cancelled) return;
      setBestSellers(best);
      setFeaturedPicks(featured);
      setSeasonalPicks(seasonal);
      setEditorPicks(styles);
      setTrending(trendingProducts);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasAny =
    bestSellers.length > 0 ||
    featuredPicks.length > 0 ||
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
      <AnimatedSection>
      <ProductSection
        title="Best Sellers"
        icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
        products={bestSellers}
        loading={isLoading}
        viewAllHref="/marketplace/products?collection=best-sellers"
        testId="home-best-sellers"
      />
      </AnimatedSection>
      <AnimatedSection delay={50}>
      <ProductSection
        title="Featured Picks"
        icon={<Star className="h-5 w-5 md:h-6 md:w-6 text-accent" />}
        products={featuredPicks}
        loading={isLoading}
        viewAllHref="/marketplace/products?collection=featured_picks"
        testId="home-featured-picks"
      />
      </AnimatedSection>
      <AnimatedSection delay={100}>
      <ProductSection
        title="Seasonal Picks"
        icon={<Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />}
        products={seasonalPicks}
        loading={isLoading}
        viewAllHref="/marketplace/products?collection=seasonal_picks"
        testId="home-seasonal-picks"
      />
      </AnimatedSection>
      <AnimatedSection delay={400}><RecentlyViewed /></AnimatedSection>
      <AnimatedSection delay={300}>
      <ProductSection
        title="Editor's Recommendations"
        icon={<Award className="h-5 w-5 md:h-6 md:w-6 text-secondary" />}
        products={editorPicks}
        loading={isLoading}
        viewAllHref="/marketplace/products?collection=featured_styles"
        testId="home-editors-picks"
      />
      </AnimatedSection>
      <AnimatedSection delay={500}>
      <ProductSection
        title="Trending Right Now"
        icon={<Star className="h-5 w-5 md:h-6 md:w-6 text-primary" />}
        products={trending}
        loading={isLoading}
        viewAllHref="/marketplace/products?sort=trending"
        testId="home-trending"
      />
      </AnimatedSection>
    </section>
  );
};

export default FeaturedProducts;

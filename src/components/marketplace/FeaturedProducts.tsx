import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, TrendingUp, Star, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,
} from "@/components/ui/carousel";
import EmptySection from "@/components/marketplace/EmptySection";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { productsService, providersService } from "@/lib/apiServices";
import type { Product, Provider } from "@/data/mockData";

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
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
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

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [providerMap, setProviderMap] = useState<Record<number, Provider>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      productsService.list().then((res) => setProducts(res.data)),
      providersService.list().then((res) => {
        const map: Record<number, Provider> = {};
        res.data.forEach((p) => { map[p.id] = p; });
        setProviderMap(map);
      }),
    ]).finally(() => setIsLoading(false));
  }, []);

  const transformProduct = (p: Product): FeaturedProduct => ({
    id: p.id,
    name: p.name,
    price: p.priceRange.min,
    imageUrl: p.images[0] || "/placeholder.svg",
    providerId: p.providerId,
    providerName: providerMap[p.providerId]?.brandName || "Artisan",
    category: p.category,
    tags: p.tags,
  });

  // Best Sellers — providers with high ratings
  const bestSellers = products
    .filter((p) => {
      const prov = providerMap[p.providerId];
      return prov && prov.rating >= 4.7;
    })
    .slice(0, 8)
    .map(transformProduct);

  // Seasonal Picks
  const seasonalPicks = products
    .filter((p) => p.tags.some((t) => ["Traditional", "Wedding", "Aso-Ebi", "Elegant"].includes(t)))
    .slice(0, 8)
    .map(transformProduct);

  // Editor's Recommendations
  const editorPicks = products
    .filter((p) => p.tags.some((t) => ["Luxury", "Premium", "Executive"].includes(t)))
    .slice(0, 8)
    .map(transformProduct);

  // Trending Right Now
  const trending = products
    .filter((p) => p.tags.some((t) => ["Modern", "Afrocentric", "Custom"].includes(t)))
    .slice(0, 8)
    .map(transformProduct);

  if (isLoading) return null;

  const hasAny = bestSellers.length > 0 || seasonalPicks.length > 0 || editorPicks.length > 0 || trending.length > 0;

  if (!hasAny) {
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
      <ProductSection title="Best Sellers" icon={<TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />} products={bestSellers} />
      <ProductSection title="Seasonal Picks" icon={<Calendar className="h-5 w-5 md:h-6 md:w-6 text-accent" />} products={seasonalPicks} />
      <ProductSection title="Editor's Recommendations" icon={<Award className="h-5 w-5 md:h-6 md:w-6 text-secondary" />} products={editorPicks} />
      <ProductSection title="Trending Right Now" icon={<Star className="h-5 w-5 md:h-6 md:w-6 text-primary" />} products={trending} />
    </section>
  );
};

export default FeaturedProducts;

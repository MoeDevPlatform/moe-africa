import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { productsService } from "@/lib/apiServices";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import type { Product } from "@/data/mockData";
import { History } from "lucide-react";

type Props = {
  /** Exclude this product id from the visible list (product detail page). */
  excludeProductId?: number;
};

const RecentlyViewed = ({ excludeProductId }: Props) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const ids = getRecentlyViewedIds().filter((id) => id !== excludeProductId);
    if (ids.length < 2) {
      setProducts([]);
      return;
    }
    productsService
      .getByIds(ids)
      .then((list) => setProducts(list.filter(Boolean)))
      .catch(() => setProducts([]));
  }, [excludeProductId]);

  if (products.length < 2) return null;

  return (
    <section className="mb-8 md:mb-12" data-testid="recently-viewed-section">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <History className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">
          You recently viewed
        </h2>
      </div>
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {products.map((product) => (
            <CarouselItem
              key={product.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
            >
              <div
                className="group cursor-pointer"
                onClick={() => navigate(`/marketplace/product/${product.id}`)}
              >
                <div className="relative rounded-xl overflow-hidden mb-3 bg-muted aspect-square">
                  <img
                    src={product.images[0] || FALLBACK_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <h3 className="font-semibold mb-1 text-sm md:text-base line-clamp-1">
                  {product.name}
                </h3>
                <span className="font-bold text-primary">
                  ₦{(product.priceRange?.min ?? 0).toLocaleString()}
                </span>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-4" />
        <CarouselNext className="hidden sm:flex -right-4" />
      </Carousel>
    </section>
  );
};

export default RecentlyViewed;

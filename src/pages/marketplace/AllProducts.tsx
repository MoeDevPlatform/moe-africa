import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { productsService } from "@/lib/apiServices";
import { getCategory } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import type { Product } from "@/data/mockData";
import { SkeletonGrid } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

function productDedupKey(p: Product): string {
  return `id:${p.id}`;
}

function buildFilters(
  searchParams: URLSearchParams,
  categories: ReturnType<typeof useCategories>["categories"],
): {
  filters: Record<string, unknown>;
  title: string;
  description: string;
} {
  const featured = searchParams.get("featured");
  const sort = searchParams.get("sort");
  const season = searchParams.get("season");
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const searchQuery = (searchParams.get("q") || searchParams.get("search") || "").trim();

  const filters: Record<string, unknown> = {};
  let title = "All Products";
  let description = "Explore our complete collection of handcrafted African products";

  if (searchQuery) {
    filters.q = searchQuery;
    title = `Results for “${searchQuery}”`;
    description = "Products matching your search";
  }

  if (category) {
    filters.category = category;
    const cat = getCategory(category, categories);
    if (cat) {
      title = `${cat.label} Products`;
      description = `Browse all ${cat.label.toLowerCase()} items from our artisans`;
    }
  }
  if (type) {
    filters.type = type;
    title = type;
    description = `Shop ${type}${category ? ` in ${getCategory(category, categories)?.label ?? ""}` : ""}`;
  }

  if (featured === "true") {
    filters.featured = true;
    title = "Featured Picks";
    description = "Hand-picked selections from our best artisans";
  }

  if (sort === "newest") {
    filters.sort = "newest";
    title = "New Arrivals";
    description = "Fresh additions to our marketplace";
  } else if (sort === "bestSeller") {
    filters.sort = "bestSeller";
    title = "Best Sellers";
    description = "Our most popular items loved by customers";
  } else if (sort === "trending") {
    filters.sort = "trending";
    title = "Trending Now";
    description = "The hottest styles making waves right now";
  }

  if (season === "harmattan") {
    filters.styleTags = "lightweight,ankara,casual";
    title = "Harmattan Picks";
    description = "Lightweight pieces curated for the dry season";
  } else if (season === "rainy") {
    filters.styleTags = "layered,leatherwork,home-decor";
    title = "Rainy Season Picks";
    description = "Cozy layers and home pieces for the rains";
  }

  if (searchQuery && (category || featured || sort || season || type)) {
    title = `Results for “${searchQuery}”`;
    description = "Products matching your search and filters";
  }

  return { filters, title, description };
}

const AllProducts = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchParams] = useSearchParams();
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("All Products");
  const [description, setDescription] = useState(
    "Explore our complete collection of handcrafted African products",
  );

  const requestIdRef = useRef(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const filtersKey = searchParams.toString();

  const loadPage = useCallback(
    async (pageToLoad: number, replace: boolean) => {
      const requestId = ++requestIdRef.current;
      const { filters, title: newTitle, description: newDescription } = buildFilters(
        searchParams,
        categories,
      );

      if (replace) {
        setIsLoading(true);
        setError(null);
        setDisplayProducts([]);
        setTotalItems(0);
        setHasMore(true);
        seenIdsRef.current = new Set();
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await productsService.list({
          ...filters,
          page: pageToLoad,
          pageSize: PAGE_SIZE,
        });
        if (requestId !== requestIdRef.current) return;

        const incoming = res.data ?? [];
        const unique: Product[] = [];
        for (const p of incoming) {
          const key = productDedupKey(p);
          if (seenIdsRef.current.has(key)) continue;
          seenIdsRef.current.add(key);
          unique.push(p);
        }

        setDisplayProducts((prev) => (replace ? unique : [...prev, ...unique]));
        const total = res.pagination?.totalItems ?? 0;
        setTotalItems(total);
        const totalPages = res.pagination?.totalPages ?? 1;
        setHasMore(pageToLoad < totalPages && incoming.length > 0);
        setPage(pageToLoad);
        setTitle(newTitle);
        setDescription(newDescription);
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        const msg = err instanceof Error ? err.message : "Failed to load products";
        setError(msg);
        if (replace) {
          setDisplayProducts([]);
          setTotalItems(0);
          setHasMore(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [searchParams, categories],
  );

  useEffect(() => {
    void loadPage(1, true);
  }, [filtersKey, loadPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading || isLoadingMore || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPage(page + 1, false);
        }
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, error, page, loadPage]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p
            className="text-sm text-muted-foreground mt-2"
            data-testid="products-total-count"
          >
            {isLoading ? "Loading…" : `${totalItems} products found`}
          </p>
        </div>

        {error && displayProducts.length === 0 ? (
          <div className="text-center py-16 space-y-4" data-testid="products-error">
            <p className="text-muted-foreground">{error}</p>
            <Button
              type="button"
              variant="outline"
              data-testid="products-retry"
              onClick={() => void loadPage(1, true)}
            >
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <SkeletonGrid count={6} />
        ) : displayProducts.length > 0 ? (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              data-testid="products-grid"
            >
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div
              ref={sentinelRef}
              className="h-10 flex items-center justify-center mt-8"
              aria-hidden={!hasMore}
            >
              {isLoadingMore ? (
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  data-testid="products-loading-more"
                />
              ) : null}
            </div>

            {!hasMore && !isLoadingMore ? (
              <p
                className="text-center text-sm text-muted-foreground pb-8"
                data-testid="products-end"
              >
                You’ve reached the end of the catalogue
              </p>
            ) : null}

            {error ? (
              <div className="text-center pb-8 space-y-2" data-testid="products-load-more-error">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="products-retry"
                  onClick={() => void loadPage(page + 1, false)}
                >
                  Retry
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found</p>
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default AllProducts;

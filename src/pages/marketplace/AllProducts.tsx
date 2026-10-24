import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProductCard from "@/components/marketplace/ProductCard";
import { productsService, sectionsService } from "@/lib/apiServices";
import { getRecentlyViewedIds } from "@/lib/recentlyViewed";
import { getCategory } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import type { Product } from "@/data/mockData";
import { SkeletonGrid } from "@/components/common/Skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

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
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const maxDeliveryDays = searchParams.get("maxDeliveryDays");
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
    title = "Featured products";
    description = "Products marked featured in the catalogue";
  }

  if (minPrice && Number.isFinite(Number(minPrice))) filters.minPrice = Number(minPrice);
  if (maxPrice && Number.isFinite(Number(maxPrice))) filters.maxPrice = Number(maxPrice);
  if (maxDeliveryDays && Number.isFinite(Number(maxDeliveryDays))) {
    filters.maxDeliveryDays = Number(maxDeliveryDays);
  }

  if (sort === "newest") {
    filters.sort = "newest";
    title = "New Arrivals";
    description = "Approved products, newest creation date first";
  } else if (sort === "bestSeller") {
    filters.collection = "best-sellers";
    title = "Best Sellers";
    description =
      "Products with genuine orders, plus any product marked as a best seller. Highest order count first. Cancelled and rejected orders are not counted.";
  } else if (sort === "trending") {
    filters.sort = "trending";
    filters.isTrending = true;
    title = "Trending Now";
    description = "Products marked as trending in the catalogue";
  } else if (sort === "price_asc" || sort === "price_desc" || sort === "name_desc" || sort === "name_asc") {
    filters.sort = sort;
  } else if (!searchParams.get("collection")) {
    filters.sort = "name_asc";
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

  const collection = searchParams.get("collection");
  if (collection === "best-sellers" || sort === "bestSeller") {
    filters.collection = "best-sellers";
    delete filters.isBestSeller;
    if (!sort || sort === "bestSeller" || sort === "orders" || sort === "collection") {
      delete filters.sort;
    }
    title = "Best Sellers";
    description =
      "Products with genuine orders, plus any product marked as a best seller. Highest order count first. Cancelled and rejected orders are not counted.";
  } else if (collection === "featured_picks") {
    title = "Featured Picks";
    description =
      "Curated picks. When fewer than four are curated, the system adds the newest approved products. Those fills are labelled in admin.";
  } else if (collection === "featured_styles") {
    title = "Editor's Recommendations";
    description = "Products an admin added to Editor’s Recommendations, in display order.";
  } else if (collection === "seasonal_picks") {
    title = "Seasonal Picks";
    description = "Curated seasonal products, plus keyword matches when seasonal keywords are set.";
  } else if (collection === "recently-viewed") {
    title = "You recently viewed";
    description = "Products opened in this browser. No other products are added.";
  }

  if (searchQuery && (category || featured || sort || season || type || collection)) {
    title = `Results for “${searchQuery}”`;
    description = "Products matching your search and filters";
  }

  return { filters, title, description };
}

const SECTION_COLLECTIONS = new Set(["featured_picks", "featured_styles", "seasonal_picks", "recently-viewed"]);

async function loadSectionProducts(collection: string): Promise<Product[]> {
  if (collection === "recently-viewed") {
    const ids = getRecentlyViewedIds();
    if (!ids.length) return [];
    const rows = await productsService.getByIds(ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id)).filter((row): row is Product => Boolean(row));
  }

  let rawItems: Array<Record<string, unknown>> = [];
  if (collection === "seasonal_picks") {
    try {
      const matched = await sectionsService.seasonalMatched();
      if ((matched.keywords ?? []).length > 0 && (matched.items ?? []).length > 0) {
        rawItems = matched.items;
      }
    } catch {
      rawItems = [];
    }
    if (!rawItems.length) {
      const res = await sectionsService.get("seasonal_picks");
      rawItems = res.items ?? [];
    }
  } else {
    const res = await sectionsService.get(collection);
    rawItems = res.items ?? [];
  }
  const ids = rawItems.map((item) => Number(item.id)).filter((id) => Number.isFinite(id) && id > 0);
  if (!ids.length) return [];
  const rows = await productsService.getByIds(ids);
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is Product => Boolean(row));
}

function applyClientFilters(products: Product[], params: URLSearchParams): Product[] {
  let rows = [...products];
  const category = params.get("category");
  if (category && category !== "all") rows = rows.filter((row) => row.category === category);
  const minRaw = params.get("minPrice");
  const maxRaw = params.get("maxPrice");
  const min = Number(minRaw);
  const max = Number(maxRaw);
  if (minRaw && Number.isFinite(min)) rows = rows.filter((row) => (row.priceRange?.min ?? 0) >= min);
  if (maxRaw && Number.isFinite(max)) rows = rows.filter((row) => (row.priceRange?.min ?? 0) <= max);
  const delivery = Number(params.get("maxDeliveryDays"));
  if (Number.isFinite(delivery) && delivery > 0) {
    rows = rows.filter((row) => row.estimatedDeliveryDays <= delivery);
  }
  const q = (params.get("q") || params.get("search") || "").trim().toLowerCase();
  if (q) rows = rows.filter((row) => row.name.toLowerCase().includes(q) || row.tags.some((tag) => tag.toLowerCase().includes(q)));
  const sort = params.get("sort");
  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (sort === "name_asc") rows.sort(byName);
  else if (sort === "name_desc") rows.sort((a, b) => byName(b, a));
  else if (sort === "price_asc") rows.sort((a, b) => (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0));
  else if (sort === "price_desc") rows.sort((a, b) => (b.priceRange?.min ?? 0) - (a.priceRange?.min ?? 0));
  return rows;
}

const AllProducts = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
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
        const collection = searchParams.get("collection");
        const sectionMode = Boolean(collection && SECTION_COLLECTIONS.has(collection));
        const res = sectionMode
          ? await (async () => {
              const all = applyClientFilters(await loadSectionProducts(collection as string), searchParams);
              const start = (pageToLoad - 1) * PAGE_SIZE;
              const data = all.slice(start, start + PAGE_SIZE);
              const totalItems = all.length;
              const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
              return { data, pagination: { page: pageToLoad, pageSize: PAGE_SIZE, totalPages, totalItems } };
            })()
          : await productsService.list({
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

        <div className="mb-8 space-y-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            <p
              className="text-sm text-muted-foreground mt-2"
              data-testid="products-total-count"
            >
              {isLoading ? "Loading…" : `${totalItems} products found`}
            </p>
          </div>
          <ProductCatalogueControls
            searchParams={searchParams}
            onChange={setSearchParams}
          />
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

function setParam(params: URLSearchParams, key: string, value: string) {
  if (!value || value === "all") params.delete(key);
  else params.set(key, value);
}

function ProductCatalogueControls({
  searchParams,
  onChange,
}: {
  searchParams: URLSearchParams;
  onChange: (next: URLSearchParams) => void;
}) {
  const collection = searchParams.get("collection");
  const bestSellers = collection === "best-sellers" || searchParams.get("sort") === "bestSeller";
  const rawSort = searchParams.get("sort");
  const sort = bestSellers && (!rawSort || rawSort === "bestSeller" || rawSort === "orders")
    ? "orders"
    : collection && !rawSort
      ? "collection"
      : rawSort || "name_asc";
  const category = searchParams.get("category") || "all";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const delivery = searchParams.get("maxDeliveryDays") || "all";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    setParam(next, key, value);
    onChange(next);
  };

  const clear = () => {
    const next = new URLSearchParams(searchParams);
    ["sort", "category", "minPrice", "maxPrice", "maxDeliveryDays", "q", "search"].forEach((key) =>
      next.delete(key),
    );
    onChange(next);
  };

  const hasControls =
    (Boolean(searchParams.get("sort")) &&
      searchParams.get("sort") !== "name_asc" &&
      searchParams.get("sort") !== "orders" &&
      searchParams.get("sort") !== "collection") ||
    category !== "all" ||
    !!minPrice ||
    !!maxPrice ||
    delivery !== "all" ||
    !!searchParams.get("q") ||
    !!searchParams.get("search");

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end" data-testid="product-filters">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="product-sort">Sort</label>
        <Select
          value={sort}
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams);
            if (bestSellers) {
              next.set("collection", "best-sellers");
              if (value === "orders") next.delete("sort");
              else next.set("sort", value);
              onChange(next);
              return;
            }
            if (collection && value === "collection") {
              next.delete("sort");
              onChange(next);
              return;
            }
            update("sort", value);
          }}
        >
          <SelectTrigger id="product-sort" className="w-full lg:w-48" data-testid="product-sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {bestSellers && <SelectItem value="orders">Order count</SelectItem>}
            {collection && !bestSellers && (
              <SelectItem value="collection">Collection order</SelectItem>
            )}
            <SelectItem value="name_asc">Name A–Z</SelectItem>
            <SelectItem value="name_desc">Name Z–A</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="product-category">Category</label>
        <Select value={category} onValueChange={(value) => update("category", value)}>
          <SelectTrigger id="product-category" className="w-full lg:w-48" data-testid="product-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PRODUCT_CATEGORIES.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="product-min-price">Min price</label>
        <Input
          id="product-min-price"
          data-testid="product-min-price"
          inputMode="numeric"
          placeholder="₦ min"
          className="w-full lg:w-32"
          value={minPrice}
          onChange={(e) => update("minPrice", e.target.value.replace(/[^\d]/g, ""))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="product-max-price">Max price</label>
        <Input
          id="product-max-price"
          data-testid="product-max-price"
          inputMode="numeric"
          placeholder="₦ max"
          className="w-full lg:w-32"
          value={maxPrice}
          onChange={(e) => update("maxPrice", e.target.value.replace(/[^\d]/g, ""))}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="product-delivery">Delivery</label>
        <Select value={delivery} onValueChange={(value) => update("maxDeliveryDays", value)}>
          <SelectTrigger id="product-delivery" className="w-full lg:w-44" data-testid="product-delivery">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any delivery</SelectItem>
            <SelectItem value="3">Within 3 days</SelectItem>
            <SelectItem value="7">Within 7 days</SelectItem>
            <SelectItem value="14">Within 14 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {hasControls ? (
        <Button type="button" variant="ghost" data-testid="product-filters-clear" onClick={clear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

export default AllProducts;

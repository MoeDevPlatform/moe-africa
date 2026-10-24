import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ArtisanResults from "@/components/marketplace/ArtisanResults";
import { useArtisanSearch, type ArtisanDiscoveryView } from "@/hooks/useArtisanSearch";
import { providersService, sectionsService } from "@/lib/apiServices";
import { getRecentArtisanIds } from "@/lib/recentArtisans";
import type { Provider } from "@/data/mockData";
import { getCategory } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import FilterDrawer, { DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ARTISAN_BATCH = 20;

const VIEWS: { id: ArtisanDiscoveryView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "top-rated", label: "Top Rated" },
  { id: "custom-orders", label: "Custom Orders" },
  { id: "best-sellers", label: "Best Sellers" },
];

function sectionArtisanToProvider(raw: Record<string, unknown>): Provider {
  const id = Number(raw.id);
  const brand =
    (typeof raw.brandName === "string" && raw.brandName) ||
    (typeof raw.businessName === "string" && raw.businessName) ||
    (typeof raw.name === "string" && raw.name) ||
    "Artisan";
  return {
    id: Number.isFinite(id) ? id : 0,
    brandName: brand,
    firstName: "",
    lastName: "",
    about: typeof raw.description === "string" ? raw.description : "",
    city: typeof raw.city === "string" ? raw.city : "",
    state: typeof raw.state === "string" ? raw.state : "",
    phone: "",
    email: "",
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 0,
    verified: raw.verified === true,
    featured: raw.featured === true,
    estimatedDeliveryDays: 7,
    heroImage: typeof raw.heroImage === "string" ? raw.heroImage : "",
    customOrdersEnabled: false,
    category: typeof raw.category === "string" ? raw.category : "",
    styleTags: Array.isArray(raw.styleTags) ? raw.styleTags.filter((tag): tag is string => typeof tag === "string") : [],
  };
}

function viewFromParams(params: URLSearchParams): ArtisanDiscoveryView {
  const raw = params.get("view");
  if (raw === "featured" || raw === "top-rated" || raw === "custom-orders" || raw === "best-sellers") {
    return raw;
  }
  if (params.get("featured") === "true") return "featured";
  return "all";
}

const AllArtisans = () => {
  const navigate = useNavigate();
  const { categories } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_ARTISAN_FILTERS);

  const category = searchParams.get("category");
  const searchQuery = (searchParams.get("q") || searchParams.get("search") || "").trim();
  const view = viewFromParams(searchParams);
  const collection = searchParams.get("collection");
  const [collectionArtisans, setCollectionArtisans] = useState<Provider[] | null>(null);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);

  const search = useArtisanSearch(
    {
      category,
      featured: view === "featured",
      q: searchQuery || undefined,
      view,
    },
    filters,
  );

  const shelfSort = searchParams.get("sort");
  const categoriesQuery = searchParams.get("categories") || "";
  const styleTagQuery = searchParams.get("styleTags") || "";
  const minRatingQuery = searchParams.get("minRating");
  const availableOnly = searchParams.get("availableOnly") === "true";
  const country = searchParams.get("country");
  const state = searchParams.get("state");

  useEffect(() => {
    const shelf = collection === "services" || collection === "recommended" || collection === "picked";
    if (collection !== "featured_artisans" && collection !== "recent" && !shelf) {
      setCollectionArtisans(null);
      setCollectionError(null);
      return;
    }
    let cancelled = false;
    setCollectionLoading(true);
    setCollectionError(null);
    const load = async () => {
      if (collection === "recent") {
        const ids = getRecentArtisanIds();
        if (!ids.length) return [];
        const list = await providersService.searchAll({});
        const byId = new Map(list.map((row) => [Number(row.id), row]));
        return ids.map((id) => byId.get(id)).filter((row): row is Provider => Boolean(row));
      }
      if (collection === "services" || collection === "recommended" || collection === "picked") {
        const query: Record<string, unknown> = {};
        if (country) query.country = country;
        if (state) query.state = state;
        let list = await providersService.searchAll(query);
        if (category) list = list.filter((row) => (row.category || "") === category);
        const wantedCategories = categoriesQuery.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
        if (!category && wantedCategories.length) {
          list = list.filter((row) =>
            wantedCategories.some((value) => (row.category || "").toLowerCase().includes(value)),
          );
        }
        const tags = styleTagQuery.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
        if (tags.length) {
          list = list.filter((row) => {
            const own = (row.styleTags || []).map((tag) => tag.toLowerCase());
            return tags.some((tag) => own.includes(tag));
          });
        }
        if (availableOnly) {
          list = list.filter((row) => Number((row as Provider & { productCount?: number }).productCount ?? 0) > 0);
        }
        const minRating = Number(minRatingQuery);
        if (Number.isFinite(minRating) && minRating > 0) {
          list = list.filter((row) => Number(row.rating ?? 0) >= minRating);
        }
        if (collection === "recommended") {
          const ratingOf = (row: Provider) => Number(row.rating ?? 0);
          const createdOf = (row: Provider) => {
            const raw = (row as Provider & { createdAt?: string }).createdAt;
            const parsed = typeof raw === "string" ? Date.parse(raw) : NaN;
            return Number.isFinite(parsed) ? parsed : row.id;
          };
          list = [...list].sort((a, b) => {
            if (shelfSort === "rating") return ratingOf(b) - ratingOf(a);
            if (shelfSort === "recent") return createdOf(b) - createdOf(a);
            return Number(!!b.featured) - Number(!!a.featured) || ratingOf(b) - ratingOf(a);
          });
        }
        return list;
      }
      const res = await sectionsService.get("featured_artisans");
      return (res.items ?? []).map((raw) => sectionArtisanToProvider(raw)).filter((row) => row.id > 0);
    };
    load()
      .then((rows) => {
        if (!cancelled) setCollectionArtisans(rows);
      })
      .catch((error) => {
        if (!cancelled) {
          setCollectionArtisans([]);
          setCollectionError(error instanceof Error ? error.message : "Could not load artisans");
        }
      })
      .finally(() => {
        if (!cancelled) setCollectionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [collection, category, categoriesQuery, country, state, styleTagQuery, minRatingQuery, availableOnly, shelfSort]);

  const copy = useMemo(() => {
    if (collection === "picked") {
      return {
        title: "Picked For You",
        description: "Artisans matching the categories saved in your preferences.",
      };
    }
    if (collection === "services") {
      return {
        title: "Services For You",
        description: "Artisans from the homepage Services For You section, with the same category and filters.",
      };
    }
    if (collection === "recommended") {
      return {
        title: category ? "Filtered Artisans" : "Recommended Artisans",
        description: category
          ? "Artisans in the selected category, in the homepage recommendation order."
          : "Artisans from the homepage Recommended Artisans section, in the same order.",
      };
    }
    if (collection === "featured_artisans") {
      return {
        title: "Featured Artisans",
        description: "The homepage Featured Artisans collection, including system-selected artisans when fewer than four are curated",
      };
    }
    if (collection === "recent") {
      return {
        title: "Recently Viewed Artisans",
        description: "Artisan profiles opened in this browser. No other artisans are added.",
      };
    }
    if (searchQuery) {
      return {
        title: `Artisans for “${searchQuery}”`,
        description: "Artisans matching your search, in A–Z order",
      };
    }
    if (view === "featured") {
      return {
        title: "Featured Artisans",
        description: "Artisans marked featured in the catalogue, in A–Z order",
      };
    }
    if (view === "top-rated") {
      return {
        title: "Top Rated Artisans",
        description: "Artisans with published reviews, highest real average first",
      };
    }
    if (view === "custom-orders") {
      return {
        title: "Custom Order Artisans",
        description: "Artisans currently eligible for custom orders, in A–Z order",
      };
    }
    if (view === "best-sellers") {
      return {
        title: "Best-Selling Artisans",
        description: "Artisans with at least one product marked as a best seller",
      };
    }
    if (category) {
      const cat = getCategory(category, categories);
      if (cat) {
        return {
          title: `Artisans in ${cat.label}`,
          description: `Browse artisans specialising in ${cat.label.toLowerCase()}`,
        };
      }
    }
    return {
      title: "All Artisans",
      description: "Discover talented artisans from across Africa, A–Z",
    };
  }, [searchQuery, view, category, categories, collection]);

  const isFiltered =
    JSON.stringify(filters) !== JSON.stringify(DEFAULT_ARTISAN_FILTERS) ||
    !!searchQuery ||
    view !== "all" ||
    !!category;

  const selectView = (next: ArtisanDiscoveryView) => {
    const params = new URLSearchParams(searchParams);
    if (next === "all") {
      params.delete("view");
      params.delete("featured");
    } else {
      params.set("view", next);
      params.delete("featured");
    }
    setSearchParams(params);
  };

  const clearAll = () => {
    setFilters(DEFAULT_ARTISAN_FILTERS);
    const params = new URLSearchParams(searchParams);
    params.delete("view");
    params.delete("featured");
    params.delete("collection");
    params.delete("q");
    params.delete("search");
    setSearchParams(params);
  };

  const fullList = collection ? (collectionArtisans ?? []) : search.all;
  const listKey = fullList.map((row) => row.id).join(",");
  const [visibleCount, setVisibleCount] = useState(ARTISAN_BATCH);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listLoading = collection ? collectionLoading : search.loading;
  const listError = collection ? collectionError : search.error;

  useEffect(() => {
    setVisibleCount(ARTISAN_BATCH);
  }, [listKey]);

  const visibleArtisans = fullList.slice(0, visibleCount);
  const hasMore = visibleArtisans.length < fullList.length;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || listLoading || listError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((count) => count + ARTISAN_BATCH);
        }
      },
      { root: null, rootMargin: "240px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, listLoading, listError, visibleCount]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{copy.title}</h1>
              <p className="text-muted-foreground">{copy.description}</p>
              <p className="text-sm text-muted-foreground mt-2" data-testid="artisans-total-count">
                {collection
                  ? collectionLoading
                    ? "Searching…"
                    : `${collectionArtisans?.length ?? 0} artisans found`
                  : search.loading
                    ? "Searching…"
                    : `${search.total} artisans found`}
              </p>
            </div>
            <FilterDrawer artisansOnly filters={filters} onFiltersChange={setFilters} />
          </div>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Artisan discovery">
            {VIEWS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                role="tab"
                aria-selected={view === item.id}
                data-testid={`artisan-view-${item.id}`}
                variant={view === item.id ? "default" : "outline"}
                className={cn(view === item.id && "pointer-events-none")}
                onClick={() => selectView(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div data-testid="artisans-grid">
          <ArtisanResults
            results={visibleArtisans}
            loading={listLoading}
            error={listError}
            page={1}
            totalPages={1}
            setPage={() => undefined}
            filtered={isFiltered || Boolean(collection)}
            onClear={clearAll}
          />
          {!listLoading && !listError && visibleArtisans.length > 0 ? (
            <>
              <div
                ref={sentinelRef}
                className="h-10 flex items-center justify-center mt-8"
                data-testid="artisans-load-more"
                aria-hidden={!hasMore}
              />
              {!hasMore ? (
                <p className="text-center text-sm text-muted-foreground pb-8" data-testid="artisans-end">
                  You’ve reached the end of the catalogue
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default AllArtisans;

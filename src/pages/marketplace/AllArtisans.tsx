import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ArtisanResults from "@/components/marketplace/ArtisanResults";
import { useArtisanSearch, type ArtisanDiscoveryView } from "@/hooks/useArtisanSearch";
import { getCategory } from "@/lib/categories";
import { useCategories } from "@/contexts/CategoriesContext";
import FilterDrawer, { DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIEWS: { id: ArtisanDiscoveryView; label: string }[] = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "top-rated", label: "Top Rated" },
  { id: "custom-orders", label: "Custom Orders" },
  { id: "best-sellers", label: "Best Sellers" },
];

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

  const search = useArtisanSearch(
    {
      category,
      featured: view === "featured",
      q: searchQuery || undefined,
      view,
    },
    filters,
  );

  const copy = useMemo(() => {
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
  }, [searchQuery, view, category, categories]);

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
    params.delete("q");
    params.delete("search");
    setSearchParams(params);
  };

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
                {search.loading ? "Searching…" : `${search.total} artisans found`}
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
          <ArtisanResults {...search} filtered={isFiltered} onClear={clearAll} />
        </div>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default AllArtisans;

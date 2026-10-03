import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ArtisanResults from "@/components/marketplace/ArtisanResults";
import { useArtisanSearch } from "@/hooks/useArtisanSearch";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shirt, Footprints, Gem, Sofa, Palette, Package, Sparkles, Briefcase, Home } from "lucide-react";
import { getProvidersByCategory as mockGetProvidersByCategory } from "@/data/mockData";
import { providersService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";
import { toCategoryLabel, toCategoryValue } from "@/lib/categories";
import FilterDrawer, { DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";

const CategoryProviders = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_ARTISAN_FILTERS);
  const categorySlug = toCategoryValue(category || "");
  const search = useArtisanSearch({ category: categorySlug }, filters);
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_ARTISAN_FILTERS);

  useEffect(() => {
    const loadProviders = async () => {
      if (!categorySlug) return;
      try {
        const data = await providersService.getByCategory(categorySlug);
        setProviders(data);
      } catch {
        setProviders(mockGetProvidersByCategory(categorySlug));
      }
    };
    loadProviders();
  }, [categorySlug]);

  const categoryIcons: Record<string, any> = {
    tailoring: Shirt,
    shoemaking: Footprints,
    beauty: Sparkles,
    leatherwork: Briefcase,
    arts_and_crafts: Palette,
    jewellery: Gem,
    home_and_decor: Home,
    paintings_and_canvas: Palette,
    // legacy
    crafts: Palette,
    accessories: Gem,
    furniture: Sofa,
    art: Palette,
    canvas: Palette,
  };

  const Icon = categoryIcons[categorySlug] || Package;
  const categoryName = toCategoryLabel(categorySlug) || "Services";

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <MarketplaceNavbar />

      <main className="flex-1 container mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2"
          onClick={() => navigate("/marketplace")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-4xl font-display font-bold">{categoryName}</h1>
              <p className="text-muted-foreground mt-1">
                {search.loading ? "Searching…" : `${search.total} ${search.total === 1 ? "artisan" : "artisans"} available`}
              </p>
            </div>
          </div>
          {providers.length > 0 && (
            <FilterDrawer artisansOnly filters={filters} onFiltersChange={setFilters} />
          )}
        </div>

        {providers.length === 0 ? (
          <div className="text-center py-12">
            <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display font-semibold mb-2">No artisans found</h2>
            <p className="text-muted-foreground mb-6">
              We're currently adding more {categoryName.toLowerCase()} artisans to our platform.
            </p>
            <Button onClick={() => navigate("/marketplace")}>
              Browse Other Categories
            </Button>
          </div>
        ) : (
          <>
            {!isFiltered && !search.loading && (
              <FeaturedArtisans providers={search.results.filter((p) => p.featured)} title={`Featured ${categoryName} Artisans`} />
            )}
            <ArtisanResults {...search} filtered={isFiltered} onClear={() => setFilters(DEFAULT_ARTISAN_FILTERS)} />
          </>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProviders;

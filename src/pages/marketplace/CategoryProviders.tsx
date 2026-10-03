import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shirt, Footprints, Gem, Sofa, Palette, Package, Sparkles, Briefcase, Home } from "lucide-react";
import { getProvidersByCategory as mockGetProvidersByCategory } from "@/data/mockData";
import { providersService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";
import { toCategoryLabel, toCategoryValue } from "@/lib/categories";
import FilterDrawer, { applyArtisanFilters, DEFAULT_ARTISAN_FILTERS, type FilterState } from "@/components/marketplace/FilterDrawer";

const CategoryProviders = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_ARTISAN_FILTERS);
  const visible = applyArtisanFilters(providers, filters);
  const categorySlug = toCategoryValue(category || "");

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
                {visible.length} {visible.length === 1 ? "artisan" : "artisans"} available
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
        ) : visible.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No artisans match these filters.</p>
            <Button variant="outline" onClick={() => setFilters(DEFAULT_ARTISAN_FILTERS)}>Clear filters</Button>
          </div>
        ) : (
          <>
            {/* Featured Artisans in this category */}
            <FeaturedArtisans 
              providers={visible} 
              title={`Featured ${categoryName} Artisans`} 
            />

            {/* All Providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.filter(p => !p.featured).map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProviders;

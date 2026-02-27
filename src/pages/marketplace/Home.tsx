import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import HeroBanner from "@/components/marketplace/HeroBanner";
import FeaturedProducts from "@/components/marketplace/FeaturedProducts";
import FilterDrawer, { FilterState } from "@/components/marketplace/FilterDrawer";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Footprints, Gem, Sofa, Palette, Package, Tag, Clock, Award, Loader2 } from "lucide-react";
import { useProviders } from "@/hooks/useProviders";
import { useCategories } from "@/hooks/useCategories";
import { usePreferences } from "@/contexts/PreferencesContext";
import ProviderCard from "@/components/marketplace/ProviderCard";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";

const fallbackCategoryIcons: Record<string, any> = {
  tailoring: Shirt,
  shoemaking: Footprints,
  accessories: Gem,
  furniture: Sofa,
  art: Palette,
  crafts: Palette,
  jewelry: Gem,
  leatherwork: Package,
  beauty: Gem,
};

const MarketplaceHome = () => {
  const navigate = useNavigate();
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 500000],
    materials: [],
    styleTags: [],
    deliveryEstimate: null,
  });
  const [sortBy, setSortBy] = useState("featured");
  const { preferences, hasPreferences } = usePreferences();

  const { data: categories = [], isLoading: loadingCats } = useCategories(true); // enabled only
  const { data: allProviders = [], isLoading: loadingProviders } = useProviders({ activeOnly: true });

  // Filter providers based on selected category + filters
  const filteredProviders = useMemo(() => {
    let provs = selectedCategorySlug
      ? allProviders.filter((p) => (p.service_categories as any)?.slug === selectedCategorySlug)
      : allProviders;

    if (filters.styleTags.length > 0) {
      provs = provs.filter((p) => {
        const providerTags = (p.style_tags || []).map((t: string) => t.toLowerCase());
        return filters.styleTags.some((t) => providerTags.includes(t));
      });
    }

    if (filters.priceRange[1] < 500000) {
      provs = provs.filter((p) => {
        if (!p.estimated_delivery_days) return true;
        return true; // price is per-product; filter on provider level is approximate
      });
    }

    // Preference-based sorting
    if (hasPreferences && preferences.categories.length > 0) {
      provs = [...provs].sort((a, b) => {
        const aMatch = preferences.categories.some((c) =>
          (a.service_categories as any)?.name?.toLowerCase().includes(c.toLowerCase())
        );
        const bMatch = preferences.categories.some((c) =>
          (b.service_categories as any)?.name?.toLowerCase().includes(c.toLowerCase())
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    if (sortBy === "rating") {
      provs = [...provs].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return provs;
  }, [allProviders, selectedCategorySlug, filters, preferences, hasPreferences, sortBy]);

  const featuredProviders = filteredProviders.filter((p) => p.featured);
  const recommendedProviders = filteredProviders.filter((p) => !p.featured).slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Hero Banner */}
        <section className="mb-8 md:mb-12">
          <HeroBanner />
        </section>

        {/* Categories Section */}
        <section className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold mb-4 md:mb-6">Browse by Service</h2>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading categories...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
              {categories.map((category) => {
                const slug = category.slug || category.name.toLowerCase();
                const Icon = fallbackCategoryIcons[slug] || Package;
                const icon = category.icon;
                const isSelected = selectedCategorySlug === slug;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategorySlug(isSelected ? null : slug);
                      if (!isSelected) navigate(`/marketplace/category/${slug}`);
                    }}
                    className={`p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group ${isSelected ? "border-primary shadow-md" : ""}`}
                    aria-label={`Browse ${category.name} category`}
                  >
                    {icon ? (
                      <span className="text-2xl md:text-3xl mb-1.5 md:mb-2 lg:mb-3 block text-center">{icon}</span>
                    ) : (
                      <Icon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 mx-auto mb-1.5 md:mb-2 lg:mb-3 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                    )}
                    <p className="font-medium text-[10px] md:text-xs lg:text-sm mb-0.5 md:mb-1">{category.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Filters & Style Tags */}
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
            <FilterDrawer filters={filters} onFiltersChange={setFilters} />
            <div className="flex gap-2 flex-wrap flex-1">
              {["Modern", "Afrocentric", "Traditional"].map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.styleTags.includes(tag.toLowerCase()) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => {
                    const lowTag = tag.toLowerCase();
                    setFilters((prev) => ({
                      ...prev,
                      styleTags: prev.styleTags.includes(lowTag)
                        ? prev.styleTags.filter((t) => t !== lowTag)
                        : [...prev.styleTags, lowTag],
                    }));
                  }}
                  role="checkbox"
                  aria-checked={filters.styleTags.includes(tag.toLowerCase())}
                  tabIndex={0}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Artisans */}
        {!loadingProviders && featuredProviders.length > 0 && (
          <FeaturedArtisans providers={featuredProviders as any} />
        )}

        {/* Featured Products (live from Supabase) */}
        <FeaturedProducts filters={filters} />

        {/* Recommended Providers */}
        <section className="mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">
              {selectedCategorySlug ? "Filtered Artisans" : "Recommended Artisans"}
            </h2>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40 h-9 text-sm" aria-label="Sort artisans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card">
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingProviders ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading artisans...</span>
            </div>
          ) : recommendedProviders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No artisans found for the selected filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {recommendedProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider as any} />
              ))}
            </div>
          )}
        </section>

        {/* Services For You */}
        {filteredProviders.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Award className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Services For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {filteredProviders.slice(0, 3).map((provider) => (
                <ProviderCard key={provider.id} provider={provider as any} />
              ))}
            </div>
          </section>
        )}
      </main>
      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceHome;

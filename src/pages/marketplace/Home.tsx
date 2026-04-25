import { FALLBACK_IMAGE } from "@/lib/imageFallback";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import HeroBanner from "@/components/marketplace/HeroBanner";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";
import FeaturedProducts from "@/components/marketplace/FeaturedProducts";
import FilterDrawer, { FilterState } from "@/components/marketplace/FilterDrawer";
import EmptySection from "@/components/marketplace/EmptySection";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Footprints, Gem, Sofa, Palette, Package, Tag, Clock } from "lucide-react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { productsService, providersService } from "@/lib/apiServices";
import type { Product, Provider } from "@/data/mockData";

const MarketplaceHome = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 500000],
    materials: [],
    styleTags: [],
    deliveryEstimate: null,
  });
  const { preferences, hasPreferences } = usePreferences();

  // API-driven data — empty until loaded
  const [allProviders, setAllProviders] = useState<Provider[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      productsService.list().then((res) => setAllProducts(res.data)),
      providersService.list().then((res) => setAllProviders(res.data)),
    ]).finally(() => setIsLoading(false));
  }, []);

  // Dynamic category counts from actual provider data
  const categories = useMemo(() => {
    const defs = [
      { id: "tailoring", name: "Tailoring", icon: Shirt },
      { id: "shoemaking", name: "Shoemaking", icon: Footprints },
      { id: "accessories", name: "Accessories", icon: Gem },
      { id: "canvas", name: "Canvas & Painting", icon: Palette },
      { id: "furniture", name: "Home & Decor", icon: Sofa },
      { id: "art", name: "Art & Crafts", icon: Package },
    ];
    return defs.map((d) => ({
      ...d,
      count: allProviders.filter(
        (p) => (p.category || "").toLowerCase() === d.id.toLowerCase()
      ).length,
    }));
  }, [allProviders]);

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      if ((product.priceRange?.min ?? 0) < filters.priceRange[0] || (product.priceRange?.max ?? Infinity) > filters.priceRange[1]) return false;
      if (filters.materials.length > 0) {
        const pm = (product.materials ?? "").toLowerCase();
        if (!filters.materials.some((m) => pm.includes(m))) return false;
      }
      if (filters.styleTags.length > 0) {
        const pt = (product.tags ?? []).map((t) => t.toLowerCase());
        if (!filters.styleTags.some((t) => pt.includes(t))) return false;
      }
      if (filters.deliveryEstimate) {
        const maxDays = filters.deliveryEstimate === "fastest" ? 3 : filters.deliveryEstimate === "3-5" ? 5 : filters.deliveryEstimate === "1-week" ? 7 : 14;
        if (product.estimatedDeliveryDays > maxDays) return false;
      }
      return true;
    });
  }, [allProducts, filters]);

  // Filter providers
  const filteredProviders = useMemo(() => {
    let providers = selectedCategory
      ? allProviders.filter((p) => (p.category || "") === selectedCategory)
      : allProviders;

    if (filters.styleTags.length > 0) {
      providers = providers.filter((p) => {
        const pt = (p.styleTags || []).map((t) => t.toLowerCase());
        return filters.styleTags.some((t) => pt.includes(t));
      });
    }

    if (hasPreferences && preferences.categories.length > 0) {
      providers = [...providers].sort((a, b) => {
        const aM = preferences.categories.some((c) => (a.category || "").toLowerCase().includes(c.toLowerCase()));
        const bM = preferences.categories.some((c) => (b.category || "").toLowerCase().includes(c.toLowerCase()));
        if (aM && !bM) return -1;
        if (!aM && bM) return 1;
        return 0;
      });
    }

    return providers;
  }, [selectedCategory, allProviders, filters, preferences, hasPreferences]);

  // Deal products from actual data
  const dealProducts = useMemo(() => {
    return filteredProducts
      .filter((p) => (p.priceRange?.min ?? 0) < (p.priceRange?.max ?? 0))
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.priceRange?.min ?? 0,
        originalPrice: p.priceRange?.max ?? 0,
        imageUrl: p.images?.[0] || FALLBACK_IMAGE,
        providerId: p.providerId,
        discount: (p.priceRange?.max ?? 0) > 0 ? Math.round((((p.priceRange?.max ?? 0) - (p.priceRange?.min ?? 0)) / (p.priceRange?.max ?? 1)) * 100) : 0,
        tags: p.tags ?? [],
      }));
  }, [filteredProducts]);

  // Style products from actual data
  const styleProducts = useMemo(() => {
    return filteredProducts
      .filter((p) => (p.tags ?? []).some((t) => ["Traditional", "Afrocentric", "Modern", "Elegant"].includes(t)))
      .slice(0, 4)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.priceRange?.min ?? 0,
        imageUrl: p.images?.[0] || FALLBACK_IMAGE,
        providerId: p.providerId,
        tag: (p.tags ?? []).find((t) => ["Traditional", "Afrocentric", "Modern", "Elegant"].includes(t)) || (p.tags ?? [])[0] || "",
      }));
  }, [filteredProducts]);

  useEffect(() => {
    const viewed = localStorage.getItem("recentlyViewed");
    if (viewed) setRecentlyViewed(JSON.parse(viewed));
  }, []);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3 lg:gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => navigate(`/marketplace/category/${category.id}`)}
                  className="p-3 md:p-4 lg:p-6 rounded-lg md:rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                  aria-label={`Browse ${category.name} category with ${category.count} artisans`}
                >
                  <Icon className="h-5 w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 mx-auto mb-1.5 md:mb-2 lg:mb-3 text-primary group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <p className="font-medium text-[10px] md:text-xs lg:text-sm mb-0.5 md:mb-1">{category.name}</p>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground">
                    {category.count} {category.count === 1 ? "artisan" : "artisans"}
                  </p>
                </button>
              );
            })}
          </div>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const lowTag = tag.toLowerCase();
                      setFilters((prev) => ({
                        ...prev,
                        styleTags: prev.styleTags.includes(lowTag)
                          ? prev.styleTags.filter((t) => t !== lowTag)
                          : [...prev.styleTags, lowTag],
                      }));
                    }
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Artisans */}
        {filteredProviders.some((p) => p.featured) ? (
          <FeaturedArtisans providers={filteredProviders} />
        ) : !isLoading ? (
          <section className="mb-12 md:mb-16">
            <EmptySection title="No featured artisans yet" description="Featured artisans will appear here as they are added to the platform." />
          </section>
        ) : null}

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Recommended Providers */}
        <section className="mb-12 md:mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">
              {selectedCategory ? "Filtered Artisans" : "Recommended Artisans"}
            </h2>
            <Select defaultValue="featured">
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

          {recommendedProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {recommendedProviders.map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          ) : !isLoading ? (
            <EmptySection title="No artisans to recommend yet" description="Artisans will show up here once they join the platform." />
          ) : null}
        </section>

        {/* Services For You */}
        {filteredProviders.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Shirt className="h-5 w-5 md:h-6 md:w-6 text-primary" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Services For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {filteredProviders.slice(0, 3).map((provider) => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        {/* Deals For You */}
        {dealProducts.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Tag className="h-5 w-5 md:h-6 md:w-6 text-accent" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Deals For You</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {dealProducts.map((product) => (
                <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/marketplace/product/${product.id}`)}>
                  <div className="relative rounded-xl overflow-hidden mb-3 bg-muted">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                    <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                      {product.discount}% OFF
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">₦{product.price.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground line-through">₦{product.originalPrice.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Styles For You */}
        {styleProducts.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Palette className="h-5 w-5 md:h-6 md:w-6 text-secondary" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Styles For You</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
              {styleProducts.map((product) => (
                <div key={product.id} className="group cursor-pointer" onClick={() => navigate(`/marketplace/product/${product.id}`)}>
                  <div className="relative rounded-xl overflow-hidden mb-3 bg-muted">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                    <Badge className="absolute bottom-3 left-3" variant="secondary">
                      {product.tag}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm md:text-base">{product.name}</h3>
                  <span className="font-bold text-primary">₦{product.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && filteredProviders.filter((p) => recentlyViewed.includes(p.id)).length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {filteredProviders
                .filter((p) => recentlyViewed.includes(p.id))
                .slice(0, 3)
                .map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
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

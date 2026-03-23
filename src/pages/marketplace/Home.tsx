import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import HeroBanner from "@/components/marketplace/HeroBanner";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";
import FeaturedProducts from "@/components/marketplace/FeaturedProducts";
import FilterDrawer, { FilterState } from "@/components/marketplace/FilterDrawer";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Footprints, Gem, Sofa, Palette, Package, Tag, Clock } from "lucide-react";
import { providers as allProviders, products as allProducts, getProvidersByCategory, getProviderById } from "@/data/mockData";
import { usePreferences } from "@/contexts/PreferencesContext";

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

  const categories = [
    { id: "tailoring", name: "Tailoring", icon: Shirt, count: 156 },
    { id: "shoemaking", name: "Shoemaking", icon: Footprints, count: 89 },
    { id: "accessories", name: "Accessories", icon: Gem, count: 234 },
    { id: "furniture", name: "Furniture", icon: Sofa, count: 67 },
    { id: "art", name: "Art & Crafts", icon: Palette, count: 145 },
    { id: "other", name: "Other", icon: Package, count: 78 },
  ];

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      // Price filter
      if (product.priceRange.min < filters.priceRange[0] || product.priceRange.max > filters.priceRange[1]) {
        return false;
      }
      
      // Materials filter
      if (filters.materials.length > 0) {
        const productMaterials = product.materials.toLowerCase();
        const hasMatchingMaterial = filters.materials.some(m => productMaterials.includes(m));
        if (!hasMatchingMaterial) return false;
      }
      
      // Style tags filter
      if (filters.styleTags.length > 0) {
        const productTags = product.tags.map(t => t.toLowerCase());
        const hasMatchingTag = filters.styleTags.some(t => productTags.includes(t));
        if (!hasMatchingTag) return false;
      }
      
      // Delivery estimate filter
      if (filters.deliveryEstimate) {
        const maxDays = filters.deliveryEstimate === "fastest" ? 3 
          : filters.deliveryEstimate === "3-5" ? 5 
          : filters.deliveryEstimate === "1-week" ? 7 
          : 14;
        if (product.estimatedDeliveryDays > maxDays) return false;
      }
      
      // User preferences (if available)
      if (hasPreferences && preferences.categories.length > 0) {
        const categoryMatch = preferences.categories.some(c => 
          product.category.toLowerCase().includes(c.toLowerCase())
        );
        // Boost preferred categories but don't exclude others
      }
      
      return true;
    });
  }, [filters, preferences, hasPreferences]);

  // Filter providers based on filters and preferences
  const filteredProviders = useMemo(() => {
    let providers = selectedCategory 
      ? getProvidersByCategory(selectedCategory)
      : allProviders;
    
    // Apply style tag filters to providers
    if (filters.styleTags.length > 0) {
      providers = providers.filter(p => {
        const providerTags = p.styleTags.map(t => t.toLowerCase());
        return filters.styleTags.some(t => providerTags.includes(t));
      });
    }
    
    // Apply preference-based sorting
    if (hasPreferences && preferences.categories.length > 0) {
      providers = [...providers].sort((a, b) => {
        const aMatch = preferences.categories.some(c => 
          a.category.toLowerCase().includes(c.toLowerCase())
        );
        const bMatch = preferences.categories.some(c => 
          b.category.toLowerCase().includes(c.toLowerCase())
        );
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }
    
    return providers;
  }, [selectedCategory, filters, preferences, hasPreferences]);

  // Deal products filtered — use real product IDs from mockData
  const dealProducts = useMemo(() => {
    const baseDeals = [
      { id: 103, name: "Women's Ankara Dress", price: 18000, originalPrice: 25000, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", providerId: 1, discount: 28, tags: ["Modern", "Afrocentric"] },
      { id: 401, name: "Leather Oxford Shoes", price: 22000, originalPrice: 28000, imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400", providerId: 4, discount: 21, tags: ["Classic", "Premium"] },
      { id: 301, name: "Handmade Craft Item", price: 8000, originalPrice: 12000, imageUrl: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400", providerId: 3, discount: 33, tags: ["Traditional", "Handmade"] },
    ];
    
    return baseDeals.filter(deal => {
      if (filters.priceRange[0] > deal.price || filters.priceRange[1] < deal.price) return false;
      if (filters.styleTags.length > 0) {
        const hasMatch = filters.styleTags.some(t => 
          deal.tags.map(tag => tag.toLowerCase()).includes(t)
        );
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [filters]);

  // Style products filtered — use real product IDs from mockData
  const styleProducts = useMemo(() => {
    const baseStyles = [
      { id: 102, name: "Traditional Agbada Set", price: 45000, imageUrl: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=400", providerId: 1, tag: "Traditional" },
      { id: 101, name: "Custom Ankara Jacket", price: 25000, imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400", providerId: 1, tag: "Afrocentric" },
    ];
    
    return baseStyles.filter(style => {
      if (filters.priceRange[0] > style.price || filters.priceRange[1] < style.price) return false;
      if (filters.styleTags.length > 0) {
        if (!filters.styleTags.includes(style.tag.toLowerCase())) return false;
      }
      return true;
    });
  }, [filters]);

  useEffect(() => {
    const viewed = localStorage.getItem("recentlyViewed");
    if (viewed) setRecentlyViewed(JSON.parse(viewed));
  }, []);

  const recommendedProviders = filteredProviders.filter(p => !p.featured).slice(0, 6);

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
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-muted-foreground">{category.count} artisans</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Filters & Style Tags */}
        <section className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
            <FilterDrawer filters={filters} onFiltersChange={setFilters} />

            {/* Active Style Tags - Quick Access */}
            <div className="flex gap-2 flex-wrap flex-1">
              {["Modern", "Afrocentric", "Traditional"].map((tag) => (
                <Badge 
                  key={tag}
                  variant={filters.styleTags.includes(tag.toLowerCase()) ? "default" : "outline"} 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => {
                    const lowTag = tag.toLowerCase();
                    setFilters(prev => ({
                      ...prev,
                      styleTags: prev.styleTags.includes(lowTag) 
                        ? prev.styleTags.filter(t => t !== lowTag)
                        : [...prev.styleTags, lowTag]
                    }));
                  }}
                  role="checkbox"
                  aria-checked={filters.styleTags.includes(tag.toLowerCase())}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const lowTag = tag.toLowerCase();
                      setFilters(prev => ({
                        ...prev,
                        styleTags: prev.styleTags.includes(lowTag) 
                          ? prev.styleTags.filter(t => t !== lowTag)
                          : [...prev.styleTags, lowTag]
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

        {/* Featured Artisans Section */}
        <FeaturedArtisans providers={filteredProviders} />

        {/* Featured Products Section */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
            {recommendedProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>

        {/* Services For You */}
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
                    <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
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
                    <img src={product.imageUrl} alt={product.name} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300" />
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
        {recentlyViewed.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Clock className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-xl md:text-2xl lg:text-3xl font-display font-bold">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {filteredProviders.filter(p => recentlyViewed.includes(p.id)).slice(0, 3).map((provider) => (
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

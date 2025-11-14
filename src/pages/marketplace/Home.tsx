import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import RecommendedArtisans from "@/components/marketplace/sections/RecommendedArtisans";
import RecentlyViewed from "@/components/marketplace/sections/RecentlyViewed";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Shirt, Footprints, Gem, Sofa, Palette, Package } from "lucide-react";

const MarketplaceHome = () => {
  const navigate = useNavigate();
  const [priceRange, setPriceRange] = useState([0, 500000]);
  const [categories, setCategories] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch service categories
      const { data: categoryData } = await supabase
        .from("service_categories")
        .select("*")
        .order("name");

      if (categoryData) {
        const iconMap: Record<string, any> = {
          tailoring: Shirt,
          shoemaking: Footprints,
          accessories: Gem,
          furniture: Sofa,
          art: Palette,
        };

        setCategories(
          categoryData.map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: iconMap[cat.name.toLowerCase()] || Package,
            count: 0,
          }))
        );
      }

      // Fetch featured providers
      const { data: providerData } = await supabase
        .from("service_providers")
        .select("*")
        .eq("enabled", true)
        .order("rating", { ascending: false })
        .limit(6);

      if (providerData) {
        setProviders(
          providerData.map(p => ({
            id: Number(p.id),
            brandName: p.brand_name,
            about: p.bio || "",
            city: p.address_city || "",
            state: p.address_state || "",
            rating: p.rating || 0,
            reviewCount: p.review_count || 0,
            verified: p.verified || false,
            logoUrl: p.logo_url || "",
            featuredProducts: 0,
          }))
        );
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Categories Section */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Browse by Service</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/marketplace/category/${category.id}`)}
                    className="p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                  >
                    <Icon className="h-8 w-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <p className="font-medium text-sm mb-1">{category.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Artisans */}
        <RecommendedArtisans />

        {/* Recently Viewed */}
        <RecentlyViewed />

        {/* Filters */}
        <section className="mb-8">
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Filter Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">Price Range</label>
                <div className="space-y-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={500000}
                    step={10000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>₦{priceRange[0].toLocaleString()}</span>
                    <span>₦{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lagos">Lagos</SelectItem>
                    <SelectItem value="abuja">Abuja</SelectItem>
                    <SelectItem value="rivers">Rivers</SelectItem>
                    <SelectItem value="all">All Locations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                    <SelectItem value="4.0">4.0+ Stars</SelectItem>
                    <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    <SelectItem value="all">Any Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        {/* Style Tags */}
        <section className="mb-8">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Modern
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Afrocentric
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Traditional
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Minimalist
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
              Vintage
            </Badge>
          </div>
        </section>

        {/* Recommended Providers - GET /service-providers */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold">Recommended Artisans</h2>
            <Select defaultValue="featured">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </section>
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default MarketplaceHome;

import { useState } from "react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Footprints, Gem, Sofa, Palette, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const MarketplaceHome = () => {
  const [priceRange, setPriceRange] = useState([0, 500000]);

  // Fetch service categories - GET /service-categories
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch service providers - GET /service-providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['service-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('enabled', true)
        .order('rating', { ascending: false });
      if (error) throw error;
      return data.map((provider: any) => ({
        id: provider.id,
        brandName: provider.brand_name,
        about: provider.bio || '',
        city: provider.address_city,
        state: provider.address_state,
        rating: provider.rating || 0,
        reviewCount: provider.review_count || 0,
        verified: provider.verified || false,
        logoUrl: provider.logo_url || '',
        featuredProducts: 0,
      }));
    },
  });

  const categoryIcons: any = {
    Tailoring: Shirt,
    Shoemaking: Footprints,
    Accessories: Gem,
    Furniture: Sofa,
    Art: Palette,
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Categories Section - GET /service-categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">Browse by Service</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {serviceCategories.map((category: any) => {
              const Icon = categoryIcons[category.name] || Package;
              return (
                <button
                  key={category.id}
                  className="p-4 sm:p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                >
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 sm:mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-xs sm:text-sm mb-1 truncate">{category.name}</p>
                  <p className="text-xs text-muted-foreground">View artisans</p>
                </button>
              );
            })}
          </div>
        </section>

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

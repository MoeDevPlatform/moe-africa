import { useState } from "react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Footprints, Gem, Sofa, Palette, Package } from "lucide-react";

const MarketplaceHome = () => {
  const [priceRange, setPriceRange] = useState([0, 500000]);

  const categories = [
    { id: "tailoring", name: "Tailoring", icon: Shirt, count: 156 },
    { id: "shoemaking", name: "Shoemaking", icon: Footprints, count: 89 },
    { id: "accessories", name: "Accessories", icon: Gem, count: 234 },
    { id: "furniture", name: "Furniture", icon: Sofa, count: 67 },
    { id: "art", name: "Art & Crafts", icon: Palette, count: 145 },
    { id: "other", name: "Other", icon: Package, count: 78 },
  ];

  // Mock data - GET /service-providers
  const providers = [
    {
      id: 1,
      brandName: "Ade Tailors",
      firstName: "Ade",
      lastName: "Olu",
      about: "Custom Ankara suits and dresses with premium fabrics.",
      city: "Lagos",
      state: "Lagos",
      rating: 4.8,
      reviewCount: 124,
      verified: true,
      logoUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400",
      featuredProducts: 3,
    },
    {
      id: 2,
      brandName: "Royal Shoes",
      firstName: "Chidi",
      lastName: "Okafor",
      about: "Handcrafted leather shoes for the modern African.",
      city: "Abuja",
      state: "FCT",
      rating: 4.9,
      reviewCount: 98,
      verified: true,
      logoUrl: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400",
      featuredProducts: 5,
    },
    {
      id: 3,
      brandName: "Kente Kreations",
      firstName: "Ama",
      lastName: "Mensah",
      about: "Traditional Ghanaian kente cloth and accessories.",
      city: "Port Harcourt",
      state: "Rivers",
      rating: 4.7,
      reviewCount: 76,
      verified: false,
      logoUrl: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=400",
      featuredProducts: 8,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        {/* Categories Section - GET /service-categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold mb-6">Browse by Service</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className="p-6 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all duration-300 group"
                >
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                  <p className="font-medium text-sm mb-1">{category.name}</p>
                  <p className="text-xs text-muted-foreground">{category.count} artisans</p>
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

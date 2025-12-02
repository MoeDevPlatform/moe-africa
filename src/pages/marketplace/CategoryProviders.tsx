import { useParams, useNavigate } from "react-router-dom";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import FeaturedArtisans from "@/components/marketplace/FeaturedArtisans";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shirt, Footprints, Gem, Sofa, Palette, Package } from "lucide-react";
import { getProvidersByCategory } from "@/data/mockData";

const CategoryProviders = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  
  const providers = category ? getProvidersByCategory(category) : [];

  const categoryIcons: Record<string, any> = {
    tailoring: Shirt,
    shoemaking: Footprints,
    beauty: Gem,
    leatherwork: Package,
    crafts: Palette,
    accessories: Gem,
    furniture: Sofa,
    art: Palette,
  };

  const categoryNames: Record<string, string> = {
    tailoring: "Tailoring",
    shoemaking: "Shoemaking",
    beauty: "Beauty & Wellness",
    leatherwork: "Leatherwork",
    crafts: "Arts & Crafts",
    accessories: "Accessories",
    furniture: "Furniture",
    art: "Art & Crafts",
  };

  const Icon = categoryIcons[category || ""] || Package;
  const categoryName = categoryNames[category || ""] || "Services";

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

        <div className="flex items-center gap-3 mb-8">
          <Icon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-display font-bold">{categoryName}</h1>
            <p className="text-muted-foreground mt-1">
              {providers.length} {providers.length === 1 ? "artisan" : "artisans"} available
            </p>
          </div>
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
            {/* Featured Artisans in this category */}
            <FeaturedArtisans 
              providers={providers} 
              title={`Featured ${categoryName} Artisans`} 
            />

            {/* All Providers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.filter(p => !p.featured).map((provider) => (
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

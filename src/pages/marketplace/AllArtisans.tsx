import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { providers as mockProviders } from "@/data/mockData";
import { providersService } from "@/lib/apiServices";
import type { Provider } from "@/data/mockData";

const AllArtisans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [displayProviders, setDisplayProviders] = useState<Provider[]>([]);
  const [title, setTitle] = useState("All Artisans");
  const [description, setDescription] = useState("Discover talented artisans from across Africa");
  
  const featured = searchParams.get("featured");

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const filters: Record<string, unknown> = {};
        let newTitle = "All Artisans";
        let newDescription = "Discover talented artisans from across Africa";

        if (featured === "true") {
          filters.featured = true;
          newTitle = "Featured Artisans";
          newDescription = "Our most acclaimed artisans with exceptional craftsmanship";
        }

        const res = await providersService.list(filters);
        setDisplayProviders(res.data);
        setTitle(newTitle);
        setDescription(newDescription);
      } catch {
        let fallback = [...mockProviders];
        if (featured === "true") {
          fallback = mockProviders.filter(p => p.featured);
        }
        setDisplayProviders(fallback);
      }
    };

    loadProviders();
  }, [featured]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground mt-2">{displayProviders.length} artisans found</p>
        </div>

        {/* Providers Grid */}
        {displayProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {displayProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No artisans found</p>
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default AllArtisans;

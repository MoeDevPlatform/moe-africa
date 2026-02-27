import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { useProviders } from "@/hooks/useProviders";

const AllArtisans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const featured = searchParams.get("featured");

  const { data: rawProviders = [], isLoading } = useProviders({
    activeOnly: true,
    featuredOnly: featured === "true",
  });

  const title = featured === "true" ? "Featured Artisans" : "All Artisans";
  const description = featured === "true"
    ? "Our most acclaimed artisans with exceptional craftsmanship"
    : "Discover talented artisans from across Africa";

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceNavbar />
      <main className="container mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground mt-2">{isLoading ? "Loading..." : `${rawProviders.length} artisans found`}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rawProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {rawProviders.map((provider) => (
              <ProviderCard key={provider.id} provider={provider as any} />
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

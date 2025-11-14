import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MarketplaceNavbar from "@/components/marketplace/Navbar";
import MarketplaceFooter from "@/components/marketplace/Footer";
import ProviderCard from "@/components/marketplace/ProviderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Provider {
  id: string;
  brand_name: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  address_city: string | null;
  address_state: string | null;
  rating: number | null;
  review_count: number | null;
  verified: boolean | null;
  logo_url: string | null;
}

const CategoryProviders = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch category details
      const { data: category } = await supabase
        .from("service_categories")
        .select("name")
        .eq("id", categoryId)
        .single();

      if (category) {
        setCategoryName(category.name);
      }

      // Fetch providers for this category
      const { data: providerData } = await supabase
        .from("service_providers")
        .select("*")
        .eq("service_category_id", categoryId)
        .eq("enabled", true)
        .order("rating", { ascending: false });

      if (providerData) {
        setProviders(providerData);
      }

      setLoading(false);
    };

    if (categoryId) {
      fetchData();
    }
  }, [categoryId]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <MarketplaceNavbar />

      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/marketplace")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            {categoryName || "Service Providers"}
          </h1>
          <p className="text-muted-foreground">
            {loading ? "Loading..." : `${providers.length} artisan${providers.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No service providers found in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={{
                  id: Number(provider.id),
                  brandName: provider.brand_name,
                  about: provider.bio || "",
                  city: provider.address_city || "",
                  state: provider.address_state || "",
                  rating: provider.rating || 0,
                  reviewCount: provider.review_count || 0,
                  verified: provider.verified || false,
                  logoUrl: provider.logo_url || "",
                  featuredProducts: 0,
                }}
              />
            ))}
          </div>
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
};

export default CategoryProviders;

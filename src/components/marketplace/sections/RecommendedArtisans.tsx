import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProviderCard from "../ProviderCard";
import { Skeleton } from "@/components/ui/skeleton";

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

const RecommendedArtisans = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      const { data } = await supabase
        .from("service_providers")
        .select("*")
        .eq("enabled", true)
        .order("rating", { ascending: false })
        .limit(8);

      if (data) {
        setProviders(data);
      }
      setLoading(false);
    };

    fetchProviders();
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6">Recommended Artisans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (providers.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-display font-bold mb-6">Recommended Artisans</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {providers.slice(0, 4).map((provider) => (
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
    </section>
  );
};

export default RecommendedArtisans;

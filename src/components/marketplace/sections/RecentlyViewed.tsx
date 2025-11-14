import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "../ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  preview_image_url: string | null;
  service_provider_id: string;
}

const RecentlyViewed = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: views } = await supabase
        .from("recent_views")
        .select("product_id, products(*)")
        .eq("customer_id", user.id)
        .not("product_id", "is", null)
        .order("viewed_at", { ascending: false })
        .limit(8);

      if (views) {
        const productData = views
          .map(v => v.products as unknown as Product)
          .filter(Boolean);
        setProducts(productData);
      }
      setLoading(false);
    };

    fetchRecentlyViewed();
  }, []);

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6">Recently Viewed</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-display font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 4).map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: Number(product.id),
              name: product.name,
              description: product.description || "",
              price: product.price,
              currency: product.currency || "NGN",
              previewImageUrl: product.preview_image_url || "",
            }}
            providerId={Number(product.service_provider_id)}
          />
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DBProduct {
  id: string;
  name: string;
  description: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  service_provider_id: string | null;
  category_id: string | null;
  media_urls: string[];
  status: string;
  estimated_delivery_days: number | null;
  materials: string | null;
  tags: string[];
  featured: boolean;
  best_seller: boolean;
  seasonal_pick: boolean;
  trending: boolean;
  created_at: string;
  // joined
  service_providers?: { id: string; name: string; verified: boolean; featured: boolean; rating: number | null } | null;
  service_categories?: { name: string; slug: string | null } | null;
}

export interface ProductFilters {
  categorySlug?: string;
  categoryId?: string;
  providerId?: string;
  featured?: boolean;
  bestSeller?: boolean;
  seasonalPick?: boolean;
  trending?: boolean;
  tags?: string[];
  materials?: string;
  minPrice?: number;
  maxPrice?: number;
  maxDeliveryDays?: number;
  activeOnly?: boolean;
}

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, service_providers(id, name, verified, featured, rating), service_categories(name, slug)")
        .order("created_at", { ascending: false });

      if (filters?.activeOnly !== false) {
        query = query.eq("status", "active");
      }
      if (filters?.featured) query = query.eq("featured", true);
      if (filters?.bestSeller) query = query.eq("best_seller", true);
      if (filters?.seasonalPick) query = query.eq("seasonal_pick", true);
      if (filters?.trending) query = query.eq("trending", true);
      if (filters?.providerId) query = query.eq("service_provider_id", filters.providerId);
      if (filters?.categoryId) query = query.eq("category_id", filters.categoryId);
      if (filters?.minPrice) query = query.gte("price_min", filters.minPrice);
      if (filters?.maxPrice) query = query.lte("price_min", filters.maxPrice);
      if (filters?.maxDeliveryDays) query = query.lte("estimated_delivery_days", filters.maxDeliveryDays);

      if (filters?.categorySlug) {
        query = supabase
          .from("products")
          .select("*, service_providers(id, name, verified, featured, rating), service_categories!inner(name, slug)")
          .eq("service_categories.slug", filters.categorySlug)
          .eq("status", "active")
          .order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      let results = data as DBProduct[];

      // Client-side tag/material filter
      if (filters?.tags && filters.tags.length > 0) {
        results = results.filter((p) =>
          filters.tags!.some((t) =>
            p.tags.map((pt) => pt.toLowerCase()).includes(t.toLowerCase())
          )
        );
      }
      if (filters?.materials) {
        results = results.filter((p) =>
          p.materials?.toLowerCase().includes(filters.materials!.toLowerCase())
        );
      }

      return results;
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, service_providers(id, name, verified, featured, rating, bio, city, state, logo_url, hero_image_url, style_tags, estimated_delivery_days, custom_orders_enabled), service_categories(name, slug)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DBProduct;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DBProduct>) => {
      const { data, error } = await supabase
        .from("products")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<DBProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

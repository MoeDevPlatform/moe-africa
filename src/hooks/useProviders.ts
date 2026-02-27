import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceProvider {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  service_category_id: string | null;
  rating: number | null;
  status: string;
  logo_url: string | null;
  hero_image_url: string | null;
  city: string | null;
  state: string | null;
  featured: boolean;
  verified: boolean;
  custom_orders_enabled: boolean;
  style_tags: string[];
  estimated_delivery_days: number | null;
  created_at: string;
  // joined
  service_categories?: { name: string; slug: string | null } | null;
}

export function useProviders(options?: {
  categoryId?: string;
  categorySlug?: string;
  featuredOnly?: boolean;
  activeOnly?: boolean;
}) {
  return useQuery({
    queryKey: ["providers", options],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select("*, service_categories(name, slug)")
        .order("featured", { ascending: false })
        .order("rating", { ascending: false });

      if (options?.activeOnly !== false) {
        query = query.eq("status", "active");
      }
      if (options?.featuredOnly) {
        query = query.eq("featured", true);
      }
      if (options?.categoryId) {
        query = query.eq("service_category_id", options.categoryId);
      }
      if (options?.categorySlug) {
        // join filter via category slug
        query = supabase
          .from("service_providers")
          .select("*, service_categories!inner(name, slug)")
          .eq("service_categories.slug", options.categorySlug)
          .eq("status", "active")
          .order("featured", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceProvider[];
    },
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ["provider", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*, service_categories(name, slug)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as ServiceProvider;
    },
  });
}

export function useAllProviders(activeOnly = false) {
  return useQuery({
    queryKey: ["providers-all", activeOnly],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select("*, service_categories(name, slug)")
        .order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("status", "active");
      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceProvider[];
    },
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ServiceProvider>) => {
      const { data, error } = await supabase
        .from("service_providers")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ServiceProvider> & { id: string }) => {
      const { data, error } = await supabase
        .from("service_providers")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["providers"] });
      qc.invalidateQueries({ queryKey: ["provider"] });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_providers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });
}

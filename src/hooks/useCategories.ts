import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  icon: string | null;
  enabled: boolean;
  created_at: string;
}

export function useCategories(enabledOnly = false) {
  return useQuery({
    queryKey: ["categories", enabledOnly],
    queryFn: async () => {
      let query = supabase
        .from("service_categories")
        .select("*")
        .order("name");
      if (enabledOnly) {
        query = query.eq("enabled", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceCategory[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<ServiceCategory>) => {
      const { data, error } = await supabase
        .from("service_categories")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<ServiceCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("service_categories")
        .update(values)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

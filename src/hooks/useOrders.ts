import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DBOrder {
  id: string;
  customer_id: string | null;
  product_id: string | null;
  customization_data: any | null;
  price_final: number | null;
  status: string;
  payment_reference: string | null;
  customer_name: string | null;
  customer_email: string | null;
  created_at: string;
  // joined
  products?: { name: string; service_providers?: { name: string } | null } | null;
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name, service_providers(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DBOrder[];
    },
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name, description, media_urls, service_providers(name, city, state))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DBOrder;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<DBOrder>) => {
      const { data, error } = await supabase
        .from("orders")
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

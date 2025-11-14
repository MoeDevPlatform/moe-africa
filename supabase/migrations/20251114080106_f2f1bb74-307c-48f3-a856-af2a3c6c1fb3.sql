-- Add custom_order_enabled to service_providers
ALTER TABLE public.service_providers 
ADD COLUMN IF NOT EXISTS custom_order_enabled boolean DEFAULT true;

-- Create custom_orders table
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_provider_id uuid NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  description text NOT NULL,
  measurement_data jsonb,
  design_images text[],
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'completed', 'cancelled')),
  quote_amount numeric,
  quote_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create recent_views table
CREATE TABLE IF NOT EXISTS public.recent_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  service_provider_id uuid REFERENCES public.service_providers(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT check_view_target CHECK (
    (product_id IS NOT NULL AND service_provider_id IS NULL) OR
    (product_id IS NULL AND service_provider_id IS NOT NULL)
  )
);

-- Enable RLS on custom_orders
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_orders
CREATE POLICY "Customers can view their own custom orders"
  ON public.custom_orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create custom orders"
  ON public.custom_orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all custom orders"
  ON public.custom_orders FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update custom orders"
  ON public.custom_orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on recent_views
ALTER TABLE public.recent_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for recent_views
CREATE POLICY "Users can view their own recent views"
  ON public.recent_views FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own recent views"
  ON public.recent_views FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can view all recent views"
  ON public.recent_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for custom_orders updated_at
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_orders_customer ON public.custom_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_provider ON public.custom_orders(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_status ON public.custom_orders(status);
CREATE INDEX IF NOT EXISTS idx_recent_views_customer ON public.recent_views(customer_id);
CREATE INDEX IF NOT EXISTS idx_recent_views_product ON public.recent_views(product_id);
CREATE INDEX IF NOT EXISTS idx_recent_views_provider ON public.recent_views(service_provider_id);
-- Create app_role enum for role-based access control
create type public.app_role as enum ('admin', 'customer');

-- Create user_roles table (separate from profiles for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamp with time zone default now(),
  unique (user_id, role)
);

-- Enable RLS on user_roles
alter table public.user_roles enable row level security;

-- Create security definer function to check roles (prevents recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Create profiles table for user information
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Service Categories
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  created_at timestamp with time zone default now()
);

alter table public.service_categories enable row level security;

-- Product Categories
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  parent_id uuid references public.product_categories(id),
  created_at timestamp with time zone default now()
);

alter table public.product_categories enable row level security;

-- Service Providers
create table public.service_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  brand_name text not null,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  bio text,
  service_category_id uuid references public.service_categories(id),
  rating numeric default 0,
  review_count integer default 0,
  verified boolean default false,
  enabled boolean default true,
  logo_url text,
  address_state text,
  address_city text,
  address_line1 text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.service_providers enable row level security;

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  currency text default 'NGN',
  price_min numeric,
  price_max numeric,
  variant_options jsonb,
  service_provider_id uuid references public.service_providers(id) on delete cascade not null,
  category_id uuid references public.product_categories(id),
  preview_image_url text,
  media_urls text[],
  status text default 'active',
  estimated_delivery_days integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

-- Media
create table public.media (
  id uuid primary key default gen_random_uuid(),
  file_url text not null,
  file_name text,
  file_type text,
  file_size integer,
  uploaded_by uuid references auth.users(id),
  linked_entity_type text,
  linked_entity_id uuid,
  created_at timestamp with time zone default now()
);

alter table public.media enable row level security;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null not null,
  product_id uuid references public.products(id) on delete set null,
  service_provider_id uuid references public.service_providers(id) on delete set null,
  customization_data jsonb,
  price_final numeric not null,
  status text default 'pending',
  shipping_address jsonb,
  payment_method text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert roles"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update roles"
  on public.user_roles for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for service_categories
create policy "Anyone can view service categories"
  on public.service_categories for select
  to authenticated, anon
  using (true);

create policy "Admins can insert service categories"
  on public.service_categories for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update service categories"
  on public.service_categories for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete service categories"
  on public.service_categories for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for product_categories
create policy "Anyone can view product categories"
  on public.product_categories for select
  to authenticated, anon
  using (true);

create policy "Admins can insert product categories"
  on public.product_categories for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update product categories"
  on public.product_categories for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete product categories"
  on public.product_categories for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for service_providers
create policy "Anyone can view active service providers"
  on public.service_providers for select
  to authenticated, anon
  using (enabled = true or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert service providers"
  on public.service_providers for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update service providers"
  on public.service_providers for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete service providers"
  on public.service_providers for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
create policy "Anyone can view active products"
  on public.products for select
  to authenticated, anon
  using (status = 'active' or public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert products"
  on public.products for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update products"
  on public.products for update
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete products"
  on public.products for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for media
create policy "Admins can view all media"
  on public.media for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated users can view their own media"
  on public.media for select
  using (auth.uid() = uploaded_by);

create policy "Authenticated users can upload media"
  on public.media for insert
  with check (auth.uid() = uploaded_by);

create policy "Admins can delete media"
  on public.media for delete
  using (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders
create policy "Customers can view their own orders"
  on public.orders for select
  using (auth.uid() = customer_id);

create policy "Admins can view all orders"
  on public.orders for select
  using (public.has_role(auth.uid(), 'admin'));

create policy "Authenticated customers can create orders"
  on public.orders for insert
  with check (auth.uid() = customer_id);

create policy "Customers can update their own orders"
  on public.orders for update
  using (auth.uid() = customer_id);

create policy "Admins can update all orders"
  on public.orders for update
  using (public.has_role(auth.uid(), 'admin'));

-- Create trigger function for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.service_providers
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.products
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.orders
  for each row execute function public.handle_updated_at();

-- Create function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign customer role by default
  insert into public.user_roles (user_id, role)
  values (new.id, 'customer');
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
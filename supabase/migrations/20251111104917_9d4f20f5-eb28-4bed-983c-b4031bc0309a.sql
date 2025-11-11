-- Fix security warnings by setting search_path on trigger functions

-- Update handle_updated_at function with proper search_path
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Update handle_new_user function with proper search_path (already has it, but regenerating for completeness)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;
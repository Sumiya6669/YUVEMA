create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'user', 'b2b_client');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_type') then
    create type public.order_type as enum ('b2c', 'b2b');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum (
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
  end if;

  if not exists (select 1 from pg_type where typname = 'application_status') then
    create type public.application_status as enum ('pending', 'approved', 'rejected');
  end if;
end;
$$ language plpgsql;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role public.user_role not null default 'user',
  company_name text,
  company_bin text,
  city text,
  phone text,
  wholesale_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  name_ru text,
  brand text not null,
  category text not null,
  subcategory text,
  description text,
  short_description text,
  composition text,
  effects text,
  skin_types text[] not null default '{}',
  skin_problems text[] not null default '{}',
  price numeric(12, 2) not null,
  wholesale_price numeric(12, 2),
  volume text,
  image_url text,
  gallery text[] not null default '{}',
  in_stock boolean not null default true,
  featured boolean not null default false,
  new_arrival boolean not null default false,
  bestseller boolean not null default false,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  usage_instructions text,
  country_of_origin text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text,
  category text,
  tags text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text,
  rating integer not null check (rating between 1 and 5),
  text text,
  verified boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  order_number text unique not null,
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  type public.order_type not null default 'b2c',
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  shipping_cost numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  shipping_address text,
  shipping_city text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.b2b_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company text not null,
  bin text not null,
  name text not null,
  email text not null,
  phone text not null,
  city text not null,
  message text,
  status public.application_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at before update on public.blog_posts for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at before update on public.reviews for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_b2b_applications_updated_at on public.b2b_applications;
create trigger set_b2b_applications_updated_at before update on public.b2b_applications for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_current_timestamp_updated_at();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.blog_posts enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.b2b_applications enable row level security;
alter table public.contact_messages enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
with check (auth.uid() = id or public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
on public.products
for select
using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "blog_public_read" on public.blog_posts;
create policy "blog_public_read"
on public.blog_posts
for select
using (published or public.is_admin());

drop policy if exists "blog_admin_write" on public.blog_posts;
create policy "blog_admin_write"
on public.blog_posts
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read"
on public.reviews
for select
using (true);

drop policy if exists "reviews_create_authenticated" on public.reviews;
create policy "reviews_create_authenticated"
on public.reviews
for insert
with check (auth.uid() is not null and auth.uid() = user_id);

drop policy if exists "reviews_update_owner_or_admin" on public.reviews;
create policy "reviews_update_owner_or_admin"
on public.reviews
for update
using (auth.uid() = user_id or public.is_admin())
with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "reviews_delete_owner_or_admin" on public.reviews;
create policy "reviews_delete_owner_or_admin"
on public.reviews
for delete
using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public"
on public.orders
for insert
with check (true);

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin"
on public.orders
for select
using (
  public.is_admin()
  or auth.uid() = user_id
  or customer_email = coalesce(auth.jwt() ->> 'email', '')
);

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
on public.orders
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete"
on public.orders
for delete
using (public.is_admin());

drop policy if exists "b2b_applications_insert_public" on public.b2b_applications;
create policy "b2b_applications_insert_public"
on public.b2b_applications
for insert
with check (true);

drop policy if exists "b2b_applications_select_own_or_admin" on public.b2b_applications;
create policy "b2b_applications_select_own_or_admin"
on public.b2b_applications
for select
using (
  public.is_admin()
  or auth.uid() = user_id
  or email = coalesce(auth.jwt() ->> 'email', '')
);

drop policy if exists "b2b_applications_admin_update" on public.b2b_applications;
create policy "b2b_applications_admin_update"
on public.b2b_applications
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "contact_messages_insert_public" on public.contact_messages;
create policy "contact_messages_insert_public"
on public.contact_messages
for insert
with check (true);

drop policy if exists "contact_messages_admin_read" on public.contact_messages;
create policy "contact_messages_admin_read"
on public.contact_messages
for select
using (public.is_admin());

-- Brand profiles table
create table if not exists public.brand_profiles (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  brand_name text not null default '',
  introduction text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Audiences table
create table if not exists public.audiences (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  role_and_industry text not null default '',
  challenge text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists audiences_session_id_idx on public.audiences(session_id);

-- Products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_session_id_idx on public.products(session_id);

-- Auto-update updated_at on brand_profiles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger brand_profiles_updated_at
  before update on public.brand_profiles
  for each row execute function public.set_updated_at();

-- RLS: open for anon (no auth in this hackathon project)
alter table public.brand_profiles enable row level security;
alter table public.audiences enable row level security;
alter table public.products enable row level security;

create policy "allow all brand_profiles" on public.brand_profiles for all using (true) with check (true);
create policy "allow all audiences" on public.audiences for all using (true) with check (true);
create policy "allow all products" on public.products for all using (true) with check (true);

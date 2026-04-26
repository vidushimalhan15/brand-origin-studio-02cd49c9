-- Campaigns table
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  name text not null default '',
  content_pillars text[] default '{}',
  start_date date,
  end_date date,
  location text,
  selected_audience_ids text[] default '{}',
  selected_product_ids text[] default '{}',
  selected_platforms text[] default '{}',
  ai_events jsonb default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table campaigns enable row level security;
create policy "allow all" on campaigns for all using (true) with check (true);

create trigger set_updated_at_campaigns
  before update on campaigns
  for each row execute procedure update_updated_at();
